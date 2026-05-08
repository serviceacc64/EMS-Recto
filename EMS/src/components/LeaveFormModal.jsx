import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSalary } from "../lib/salaryData";

const LEAVE_TYPES = [
  "Vacation Leave","Mandatory/Forced Leave","Sick Leave","Maternity Leave",
  "Paternity Leave","Special Privilege Leave","Solo Parent Leave","Study Leave",
  "10-Day VAWC Leave","Rehabilitation Privilege","Special Leave Benefits for Women",
  "Special Emergency (Calamity) Leave","Adoption Leave","Others",
];

const inputCls = "w-full bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-xl px-4 py-2.5 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder";
const readonlyCls = "w-full bg-surface-alt border border-border-subtle text-text-muted text-[13px] font-medium rounded-xl px-4 py-2.5 cursor-default select-none";

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
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const blank = {
    employee_id: "", date_of_filing: today, date_signed: today,
    type_of_leave: "", other_leave_purpose: "",
    vacation_location: "", vacation_abroad_dest: "",
    sick_leave_type: "", sick_leave_illness: "",
    women_leave_illness: "", study_leave_type: "",
    start_date: "", end_date: "", working_days: "", inclusive_dates: "",
    commutation: "Not Requested",
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (isOpen) { fetchEmployees(); setForm(blank); setSelectedEmp(null); }
  }, [isOpen]);

  useEffect(() => {
    const r = computeLeaveDates(form.start_date, form.end_date);
    setForm(p => ({ ...p, ...r }));
  }, [form.start_date, form.end_date]);

  useEffect(() => {
    setForm(p => ({ ...p, other_leave_purpose: "", vacation_location: "", vacation_abroad_dest: "", sick_leave_type: "", sick_leave_illness: "", women_leave_illness: "", study_leave_type: "" }));
  }, [form.type_of_leave]);

  const fetchEmployees = async () => {
    const { data } = await supabase.from("employees")
      .select("id, first_name, last_name, middle_name, employee_no, department, position, salary_grade, step")
      .order("last_name", { ascending: true });
    setEmployees(data || []);
  };

  const set = (n, v) => setForm(p => ({ ...p, [n]: v }));
  const handle = e => { const { name, value } = e.target; set(name, value); };

  const handleEmpChange = e => {
    const id = e.target.value;
    set("employee_id", id);
    setSelectedEmp(employees.find(em => em.id === id) || null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.employee_id) { alert("Please select an employee."); return; }
    if (!form.type_of_leave) { alert("Please select a leave type."); return; }
    if (!form.start_date || !form.end_date) { alert("Please select leave dates."); return; }
    if (!form.working_days || form.working_days < 1) { alert("No working days in the selected range. Please adjust dates."); return; }
    setIsLoading(true);
    try {
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
        commutation_requested: form.commutation === "Requested",
        status: "Pending",
      }]);
      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to submit: " + err.message);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-[24px] shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-border-subtle animate-[slideUp_0.3s_ease-out]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle bg-surface-alt flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-text-main m-0">File Leave Application</h2>
            <p className="text-[11px] font-bold text-text-placeholder uppercase tracking-widest mt-0.5">CSC Form No. 6 — Application for Leave</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer">
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
                  <select name="employee_id" value={form.employee_id} onChange={handleEmpChange}
                    className={inputCls} required>
                    <option value="" disabled>— Select an employee —</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.last_name}, {emp.first_name} {emp.middle_name || ""} ({emp.employee_no})
                      </option>
                    ))}
                  </select>
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

            {/* ── Section 6.D: Commutation ── */}
            <div className="bg-surface-alt/30 border border-border-subtle p-5 rounded-2xl">
              <SecHeader num="6.D" label="Commutation" />
              <div className="flex flex-col gap-2">
                <Radio name="commutation" value="Not Requested" checked={form.commutation === "Not Requested"} onChange={e => set("commutation", e.target.value)} label="Not Requested" />
                <Radio name="commutation" value="Requested" checked={form.commutation === "Requested"} onChange={e => set("commutation", e.target.value)} label="Requested" />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-[14px] border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer">
            Cancel
          </button>
          <button type="submit" form="leave-form" disabled={isLoading}
            className="px-6 py-2.5 rounded-xl font-bold text-[14px] border border-accent bg-accent text-accent-text hover:bg-accent-hover hover:scale-105 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2">
            {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Submitting…</> : <><i className="fas fa-paper-plane"></i> Submit Application</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveFormModal;
