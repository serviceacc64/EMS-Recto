import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSalary } from "../lib/salaryData";
import SearchableSelect from "./SearchableSelect";
import { useNotifications } from "../context/NotificationContext";

const LEAVE_TYPES = [
  "Vacation Leave","Mandatory/Forced Leave","Sick Leave","Maternity Leave",
  "Paternity Leave","Special Privilege Leave","Solo Parent Leave","Study Leave",
  "10-Day VAWC Leave","Rehabilitation Privilege","Special Leave Benefits for Women",
  "Special Emergency (Calamity) Leave","Wellness Leave","Adoption Leave","Others",
];

const inputCls = "w-full bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-xl px-4 py-2.5 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder";
const readonlyCls = "w-full bg-surface-alt border border-border-subtle text-text-muted text-[13px] font-medium rounded-xl px-4 py-2.5 cursor-default select-none";
const selectCls = "w-full bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-xl px-3 py-2 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer";

const computeLeaveDates = (s, e) => {
  if (!s || !e) return { working_days: "", inclusive_dates: "" };
  const start = new Date(s + "T00:00:00"), end = new Date(e + "T00:00:00");
  if (end < start) return { working_days: "", inclusive_dates: "" };
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) { if (cur.getDay() !== 0 && cur.getDay() !== 6) count++; cur.setDate(cur.getDate() + 1); }
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [sm,em,sy,ey,sd,ed] = [M[start.getMonth()],M[end.getMonth()],start.getFullYear(),end.getFullYear(),start.getDate(),end.getDate()];
  let inc = s === e ? `${sm} ${sd}, ${sy}` : sm === em && sy === ey ? `${sm} ${sd}-${ed}, ${sy}` : sy === ey ? `${sm} ${sd} - ${em} ${ed}, ${sy}` : `${sm} ${sd}, ${sy} - ${em} ${ed}, ${ey}`;
  return { working_days: count, inclusive_dates: inc };
};

// Deduction Planner Logic
function computeDeduction({ requested, primarySource, localBal, doBal, remainderHandler }) {
  let localDeduct = 0;
  let doDeduct = 0;
  let lwopDays = 0;

  const primaryBal = primarySource === "local" ? localBal : doBal;
  const primaryDeduct = Math.min(requested, primaryBal);
  const remainder = requested - primaryDeduct;

  if (primarySource === "local") {
    localDeduct = primaryDeduct;
    if (remainder > 0) {
      if (remainderHandler === "do") {
        doDeduct = Math.min(remainder, doBal);
        lwopDays = remainder - doDeduct;
      } else {
        lwopDays = remainder;
      }
    }
  } else {
    doDeduct = primaryDeduct;
    if (remainder > 0) {
      if (remainderHandler === "local") {
        localDeduct = Math.min(remainder, localBal);
        lwopDays = remainder - localDeduct;
      } else {
        lwopDays = remainder;
      }
    }
  }

  return { localDeduct, doDeduct, lwopDays };
}

const SecHeader = ({ num, label }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border-subtle">
    <span className="text-[10px] font-black text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md uppercase tracking-widest">{num}</span>
    <h3 className="text-[12px] font-black text-text-main uppercase tracking-widest">{label}</h3>
  </div>
);

const F = ({ label, required, children, span2 }) => (
  <div className={`flex flex-col gap-1.5 ${span2 ? "md:col-span-2" : ""}`}>
    <label className="text-[11px] font-black text-text-muted uppercase tracking-wider ml-1">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const Radio = ({ name, value, checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer group py-0.5">
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="accent-accent cursor-pointer w-4 h-4 shrink-0" />
    <span className="text-[13px] font-medium text-text-main group-hover:text-accent transition-colors select-none">{label}</span>
  </label>
);

const LeaveFormModal = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useNotifications();
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  
  // Real-time Deduction Planner states
  const [primarySource, setPrimarySource] = useState("local");
  const [hasShortfall, setHasShortfall] = useState(false);
  const [remainderHandler, setRemainderHandler] = useState("lwop");
  const [deduction, setDeduction] = useState({ localDeduct: 0, doDeduct: 0, lwopDays: 0 });

  const today = new Date().toISOString().split("T")[0];

  const blank = {
    employee_id: "", date_of_filing: today, date_signed: today,
    type_of_leave: "", other_leave_purpose: "",
    vacation_location: "", vacation_abroad_dest: "",
    sick_leave_type: "", sick_leave_illness: "",
    women_leave_illness: "", study_leave_type: "",
    start_date: "", end_date: "", working_days: "", inclusive_dates: "",
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      setForm(blank);
      setSelectedEmp(null);
      setIsDirty(false);
      setShowConfirmClose(false);
      setPrimarySource("local");
      setRemainderHandler("lwop");
    }
  }, [isOpen]);

  useEffect(() => {
    const r = computeLeaveDates(form.start_date, form.end_date);
    setForm(p => ({ ...p, ...r }));
  }, [form.start_date, form.end_date]);

  useEffect(() => {
    setForm(p => ({ ...p, other_leave_purpose: "", vacation_location: "", vacation_abroad_dest: "", sick_leave_type: "", sick_leave_illness: "", women_leave_illness: "", study_leave_type: "" }));
  }, [form.type_of_leave]);

  // Real-time balance spillover and deduction recalculations
  useEffect(() => {
    if (!form.working_days || !selectedEmp) {
      setDeduction({ localDeduct: 0, doDeduct: 0, lwopDays: 0 });
      setHasShortfall(false);
      return;
    }

    const requested = Number(form.working_days) || 0;
    const localBal = Number(selectedEmp.local_leave_balance) || 0;
    const doBal = Number(selectedEmp.do_leave_balance) || 0;

    const primaryBal = primarySource === "local" ? localBal : doBal;
    setHasShortfall(requested > primaryBal);

    // When primary covers all, clamp remainder handler to avoid stale state
    const effectiveHandler = requested <= primaryBal ? "lwop" : remainderHandler;

    const result = computeDeduction({
      requested,
      primarySource,
      localBal,
      doBal,
      remainderHandler: effectiveHandler,
    });

    setDeduction(result);
  }, [form.working_days, selectedEmp, primarySource, remainderHandler]);

  const fetchEmployees = async () => {
    const { data } = await supabase.from("employees")
      .select("id, first_name, last_name, middle_name, employee_no, department, position, salary_grade, step, local_leave_balance, do_leave_balance")
      .order("last_name", { ascending: true });
    setEmployees(data || []);
  };

  const set = (n, v) => {
    setIsDirty(true);
    setForm(p => ({ ...p, [n]: v }));
  };

  const handle = e => {
    const { name, value } = e.target;
    set(name, value);
  };

  const handleEmpChange = e => {
    const id = e.target.value;
    set("employee_id", id);
    setSelectedEmp(employees.find(em => em.id === id) || null);
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.employee_id) { showToast("Please select an employee.", "warning"); return; }
    if (!form.type_of_leave) { showToast("Please select a leave type.", "warning"); return; }
    if (!form.start_date || !form.end_date) { showToast("Please select leave dates.", "warning"); return; }
    if (!form.working_days || form.working_days < 1) { showToast("No working days in the selected range. Please adjust dates.", "warning"); return; }
    setIsLoading(true);
    try {
      const localBal = Number(selectedEmp.local_leave_balance) || 0;
      const doBal = Number(selectedEmp.do_leave_balance) || 0;

      const { error } = await supabase.from("leave_applications").insert([{
        employee_id: form.employee_id,
        date_of_filing: form.date_of_filing,
        date_signed: form.date_signed || null,
        type_of_leave: form.type_of_leave,
        other_leave_purpose: form.other_leave_purpose || null,
        vacation_location: form.vacation_location || null,
        vacation_abroad_dest: form.vacation_abroad_dest || null,
        sick_leave_type: form.sick_leave_type || null,
        sick_leave_illness: form.sick_leave_illness || null,
        women_leave_illness: form.women_leave_illness || null,
        study_leave_type: form.study_leave_type || null,
        start_date: form.start_date,
        end_date: form.end_date,
        working_days: Number(form.working_days),
        inclusive_dates: form.inclusive_dates,
        commutation_requested: false,
        status: "Pending",
        // Pre-plan credits split
        vl_total_earned: localBal,
        vl_less_application: deduction.localDeduct,
        vl_balance: localBal - deduction.localDeduct,
        sl_total_earned: doBal,
        sl_less_application: deduction.doDeduct,
        sl_balance: doBal - deduction.doDeduct,
      }]);
      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast("Failed to submit: " + err.message, "error");
    } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  const lt = form.type_of_leave;
  const showVacation = lt === "Vacation Leave" || lt === "Special Privilege Leave";
  const showSick = lt === "Sick Leave";
  const showWomen = lt === "Special Leave Benefits for Women";
  const showStudy = lt === "Study Leave";
  const showOthers = lt === "Others";
  const showDetails = showVacation || showSick || showWomen || showStudy || showOthers;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Absolute backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={handleCloseAttempt}
      ></div>
      <div className="relative z-10 bg-surface rounded-[24px] shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-border-subtle animate-[slideUp_0.3s_ease-out]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle bg-surface-alt flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-text-main m-0">File Leave Application</h2>
            <p className="text-[11px] font-bold text-text-placeholder uppercase tracking-widest mt-0.5">CSC Form No. 6 — Application for Leave</p>
          </div>
          <button onClick={handleCloseAttempt} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer">
            <i className="fas fa-times text-[14px]"></i>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="leave-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* ── Section 1: Employee Info ── */}
            <div className="bg-surface-alt/30 border border-border-subtle p-5 rounded-2xl">
              <SecHeader num="1" label="Employee Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Select Employee" required span2>
                  <SearchableSelect
                    options={employees}
                    value={form.employee_id}
                    onChange={handleEmpChange}
                    placeholder="— Search and select an employee —"
                  />
                </F>

                {selectedEmp && (
                  <>
                    <F label="Office / Department">
                      <div className={readonlyCls}>{selectedEmp.department || "—"}</div>
                    </F>
                    <F label="Position">
                      <div className={readonlyCls}>{selectedEmp.position || "—"}</div>
                    </F>
                    <F label="Salary Grade / Step">
                      <div className={readonlyCls}>
                        {selectedEmp.salary_grade ? `SG-${selectedEmp.salary_grade}, Step ${selectedEmp.step}` : "—"}
                        {selectedEmp.salary_grade && (
                          <span className="ml-2 text-accent font-bold">
                            ({getSalary(selectedEmp.salary_grade, selectedEmp.step) || "—"})
                          </span>
                        )}
                      </div>
                    </F>

                    <div className="md:col-span-2 mt-1 bg-surface border border-border-subtle p-4 rounded-xl grid grid-cols-2 gap-4">
                      {/* Local Leave Card */}
                      <div className="bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/20 p-3.5 rounded-lg flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Local Leave</span>
                          <span className="text-[11px] text-text-placeholder font-bold">Available Credits</span>
                        </div>
                        <span className="text-[22px] font-black text-emerald-500">{Number(selectedEmp.local_leave_balance || 0)}</span>
                      </div>

                      {/* D.O. Leave Card */}
                      <div className="bg-blue-500/5 border border-blue-500/10 dark:border-blue-500/20 p-3.5 rounded-lg flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">D.O. Leave</span>
                          <span className="text-[11px] text-text-placeholder font-bold">Available Credits</span>
                        </div>
                        <span className="text-[22px] font-black text-blue-500">{Number(selectedEmp.do_leave_balance || 0)}</span>
                      </div>
                    </div>
                  </>
                )}

                <F label="Date of Filing" required>
                  <input type="date" name="date_of_filing" value={form.date_of_filing} onChange={handle} className={inputCls} required />
                </F>
                <F label="Date Signed">
                  <input type="date" name="date_signed" value={form.date_signed} onChange={handle} className={inputCls} />
                </F>
              </div>
            </div>

            {/* ── Section 6.A: Leave Type ── */}
            <div className="bg-surface-alt/30 border border-border-subtle p-5 rounded-2xl">
              <SecHeader num="6.A" label="Type of Leave to be Availed of" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5">
                {LEAVE_TYPES.map(t => (
                  <Radio key={t} name="type_of_leave" value={t} checked={form.type_of_leave === t}
                    onChange={e => set("type_of_leave", e.target.value)} label={t} />
                ))}
              </div>
              {showOthers && (
                <div className="mt-3">
                  <input type="text" value={form.other_leave_purpose} onChange={e => set("other_leave_purpose", e.target.value)}
                    placeholder="Specify other leave purpose…" className={inputCls} />
                </div>
              )}
            </div>

            {/* ── Section 6.B: Details of Leave (conditional) ── */}
            {showDetails && (
              <div className="bg-surface-alt/30 border border-border-subtle p-5 rounded-2xl">
                <SecHeader num="6.B" label="Details of Leave" />

                {showVacation && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">
                      In case of Vacation / Special Privilege Leave:
                    </p>
                    <Radio name="vacation_location" value="Within the Philippines" checked={form.vacation_location === "Within the Philippines"} onChange={e => set("vacation_location", e.target.value)} label="Within the Philippines" />
                    <Radio name="vacation_location" value="Abroad" checked={form.vacation_location === "Abroad"} onChange={e => set("vacation_location", e.target.value)} label="Abroad" />
                    {form.vacation_location === "Abroad" && (
                      <input type="text" value={form.vacation_abroad_dest} onChange={e => set("vacation_abroad_dest", e.target.value)}
                        placeholder="Specify destination abroad…" className={`${inputCls} mt-1`} />
                    )}
                  </div>
                )}

                {showSick && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">
                      In case of Sick Leave:
                    </p>
                    <Radio name="sick_leave_type" value="In Hospital" checked={form.sick_leave_type === "In Hospital"} onChange={e => set("sick_leave_type", e.target.value)} label="In Hospital" />
                    {form.sick_leave_type === "In Hospital" && (
                      <input type="text" value={form.sick_leave_illness} onChange={e => set("sick_leave_illness", e.target.value)}
                        placeholder="Specify illness / reason…" className={`${inputCls} ml-6`} />
                    )}
                    <Radio name="sick_leave_type" value="Out Patient" checked={form.sick_leave_type === "Out Patient"} onChange={e => set("sick_leave_type", e.target.value)} label="Out Patient" />
                    {form.sick_leave_type === "Out Patient" && (
                      <input type="text" value={form.sick_leave_illness} onChange={e => set("sick_leave_illness", e.target.value)}
                        placeholder="Specify illness / reason…" className={`${inputCls} ml-6`} />
                    )}
                  </div>
                )}

                {showWomen && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">
                      In case of Special Leave Benefits for Women:
                    </p>
                    <input type="text" value={form.women_leave_illness} onChange={e => set("women_leave_illness", e.target.value)}
                      placeholder="Specify illness / condition…" className={inputCls} />
                  </div>
                )}

                {showStudy && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">
                      In case of Study Leave:
                    </p>
                    <Radio name="study_leave_type" value="Completion of Master's Degree" checked={form.study_leave_type === "Completion of Master's Degree"} onChange={e => set("study_leave_type", e.target.value)} label="Completion of Master's Degree" />
                    <Radio name="study_leave_type" value="BAR/Board Examination Review" checked={form.study_leave_type === "BAR/Board Examination Review"} onChange={e => set("study_leave_type", e.target.value)} label="BAR/Board Examination Review" />
                    <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mt-2 mb-1">Other Purpose:</p>
                    <Radio name="study_leave_type" value="Monetization of Leave Credits" checked={form.study_leave_type === "Monetization of Leave Credits"} onChange={e => set("study_leave_type", e.target.value)} label="Monetization of Leave Credits" />
                    <Radio name="study_leave_type" value="Terminal Leave" checked={form.study_leave_type === "Terminal Leave"} onChange={e => set("study_leave_type", e.target.value)} label="Terminal Leave" />
                  </div>
                )}
              </div>
            )}

            {/* ── Section 6.C: Leave Schedule ── */}
            <div className="bg-surface-alt/30 border border-border-subtle p-5 rounded-2xl">
              <SecHeader num="6.C" label="Leave Schedule" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Start Date" required>
                  <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className={inputCls} required />
                </F>
                <F label="End Date" required>
                  <input type="date" value={form.end_date} min={form.start_date} onChange={e => set("end_date", e.target.value)} className={inputCls} required />
                </F>
                <F label="Number of Working Days Applied For">
                  <div className={`${readonlyCls} flex items-center gap-2`}>
                    {form.working_days
                      ? <><span className="text-accent font-black text-lg">{form.working_days}</span><span className="text-text-placeholder text-xs">working day{form.working_days !== 1 ? "s" : ""} (Mon–Fri)</span></>
                      : <span className="text-text-placeholder italic text-sm">Select start and end date</span>}
                  </div>
                </F>
                <F label="Inclusive Dates">
                  <div className={readonlyCls}>{form.inclusive_dates || <span className="text-text-placeholder italic">Auto-computed</span>}</div>
                </F>
              </div>
            </div>

            {/* ── Deduction Planner (Step 1, Step 2, and Breakdown) ── */}
            {selectedEmp && form.working_days && (
              <div className="bg-surface-alt/30 border border-border-subtle p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
                  <span className="text-[10px] font-black text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md uppercase tracking-widest">Planner</span>
                  <h3 className="text-[12px] font-black text-text-main uppercase tracking-widest">Deduction & Shortfall Planner</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div className="border border-border-subtle rounded-xl p-4 bg-surface">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold">👉</span> Step 1 — Primary Leave Source
                    </p>
                    <p className="text-[11px] text-text-placeholder mb-3">
                      Which leave balance should be deducted from first?
                    </p>
                    <select
                      value={primarySource}
                      onChange={(e) => setPrimarySource(e.target.value)}
                      className={selectCls}
                    >
                      <option value="local">Local Leave (Paid)</option>
                      <option value="do">D.O. Leave (Paid)</option>
                    </select>
                  </div>

                  {/* Step 2 */}
                  {hasShortfall ? (
                    <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4">
                      <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <i className="fas fa-exclamation-triangle text-amber-500"></i> Step 2 — Insufficient Balance
                      </p>
                      <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
                        <span className="font-bold text-text-main">{primarySource === "local" ? "Local Leave" : "D.O. Leave"}</span> only covers{" "}
                        <span className="font-black text-emerald-500">{primarySource === "local" ? Number(selectedEmp.local_leave_balance || 0) : Number(selectedEmp.do_leave_balance || 0)}</span> of{" "}
                        <span className="font-black text-accent">{form.working_days}</span> days. How should the remaining{" "}
                        <span className="font-black text-amber-600 dark:text-amber-400">{Math.max(0, Number(form.working_days) - (primarySource === "local" ? Number(selectedEmp.local_leave_balance || 0) : Number(selectedEmp.do_leave_balance || 0)))}</span> days be handled?
                      </p>
                      <select
                        value={remainderHandler}
                        onChange={(e) => setRemainderHandler(e.target.value)}
                        className={`${selectCls} border-amber-500/30 focus:border-amber-500`}
                      >
                        <option value={primarySource === "local" ? "do" : "local"}>
                          {primarySource === "local" ? "D.O. Leave (Paid)" : "Local Leave (Paid)"}
                        </option>
                        <option value="lwop">Non-Pay Leave (LWOP)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-sm mb-2">
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 m-0">Sufficient Balance Available</p>
                      <p className="text-[10px] text-text-placeholder mt-1">Your primary source covers this entire duration.</p>
                    </div>
                  )}
                </div>

                {/* Deduction Breakdown */}
                <div className="border border-border-subtle rounded-xl p-4 bg-surface/50">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <i className="fas fa-calculator text-accent"></i> Deduction Breakdown
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface rounded-xl p-3 text-center border border-border-subtle/50 flex flex-col items-center">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Local</span>
                      <span className="text-[20px] font-black text-text-main leading-none">{deduction.localDeduct}</span>
                      <span className="text-[9px] text-text-placeholder font-bold mt-1">days</span>
                    </div>
                    <div className="bg-surface rounded-xl p-3 text-center border border-border-subtle/50 flex flex-col items-center">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1.5">D.O.</span>
                      <span className="text-[20px] font-black text-text-main leading-none">{deduction.doDeduct}</span>
                      <span className="text-[9px] text-text-placeholder font-bold mt-1">days</span>
                    </div>
                    <div className={`rounded-xl p-3 text-center border flex flex-col items-center ${deduction.lwopDays > 0 ? "bg-red-500/5 border-red-500/20" : "bg-surface border-border-subtle/50"}`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${deduction.lwopDays > 0 ? "text-red-400" : "text-text-muted"}`}>LWOP</span>
                      <span className={`text-[20px] font-black leading-none ${deduction.lwopDays > 0 ? "text-red-400" : "text-text-muted"}`}>{deduction.lwopDays}</span>
                      <span className="text-[9px] text-text-placeholder font-bold mt-1">days</span>
                    </div>
                  </div>
                  {deduction.lwopDays > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-red-500 font-medium italic">
                      <i className="fas fa-info-circle"></i>
                      <span>{deduction.lwopDays} day{deduction.lwopDays !== 1 ? "s" : ""} will be marked as Leave Without Pay (LWOP).</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex justify-end gap-3 shrink-0">
          <button type="button" onClick={handleCloseAttempt}
            className="px-6 py-2.5 rounded-xl font-bold text-[14px] border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer">
            Cancel
          </button>
          <button type="submit" form="leave-form" disabled={isLoading}
            className="px-6 py-2.5 rounded-xl font-bold text-[14px] border border-accent bg-accent text-accent-text hover:bg-accent-hover hover:scale-105 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2">
            {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Submitting…</> : <><i className="fas fa-paper-plane"></i> Submit Application</>}
          </button>
        </div>
      </div>

      {/* Confirmation Modal Overlay */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md animate-[fadeIn_0.2s_ease]"
            onClick={() => setShowConfirmClose(false)}
          ></div>
          <div className="relative z-[1002] w-full max-w-[420px] bg-surface border border-border-subtle rounded-[24px] shadow-2xl p-6 text-center animate-[slideIn_0.2s_ease]">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-500 text-xl">
              <i className="fas fa-exclamation-triangle animate-bounce"></i>
            </div>
            <h3 className="text-text-main text-[20px] font-extrabold tracking-tight mb-2">
              Unsaved Changes
            </h3>
            <p className="text-text-muted text-[14px] leading-relaxed mb-6">
              You have unsaved details in this leave form. Discarding will permanently lose all changes.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 bg-surface-alt border border-border-subtle hover:bg-surface-hover text-text-muted hover:text-text-main rounded-xl text-[13px] font-bold transition-all"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmClose(false);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[13px] font-bold shadow-sm transition-all"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveFormModal;
