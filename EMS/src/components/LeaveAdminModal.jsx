import React, { useState, useEffect } from "react";

const inputCls = "w-full bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-xl px-4 py-2.5 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder";
const numCls = inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";

const SecHeader = ({ num, label, color = "text-accent" }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border-subtle">
    <span className={`text-[10px] font-black uppercase tracking-widest ${color} bg-surface border border-border-subtle px-2 py-0.5 rounded-md`}>{num}</span>
    <h3 className="text-[12px] font-black text-text-main uppercase tracking-widest">{label}</h3>
  </div>
);

const F = ({ label, children, span2 }) => (
  <div className={`flex flex-col gap-1.5 ${span2 ? "col-span-2" : ""}`}>
    <label className="text-[11px] font-black text-text-muted uppercase tracking-wider ml-1">{label}</label>
    {children}
  </div>
);

const Radio = ({ name, value, checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer group py-0.5">
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="accent-accent cursor-pointer w-4 h-4 shrink-0" />
    <span className="text-[13px] font-medium text-text-main group-hover:text-accent transition-colors select-none">{label}</span>
  </label>
);

const LeaveAdminModal = ({ isOpen, record, onConfirm, onClose }) => {
  const blank = {
    // 7.A
    as_of_date: "", vl_total_earned: "", vl_less_application: "", vl_balance: "",
    sl_total_earned: "", sl_less_application: "", sl_balance: "",
    hr_officer_name: "", hr_officer_position: "",
    // 7.B
    recommendation: "For Approval", rec_disapproval_reason: "",
    recommending_officer_name: "", recommending_officer_position: "",
    // 7.C
    final_decision: "Approved", approving_officer_name: "", approving_officer_position: "",
    // 7.D / 7.E
    days_with_pay: "", days_without_pay: "", days_others: "", disapproval_reason: "",
  };
  const [form, setForm] = useState(blank);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { if (isOpen) setForm(blank); }, [isOpen]);

  const set = (n, v) => setForm(p => ({ ...p, [n]: v }));
  const handle = e => set(e.target.name, e.target.value);

  const handleConfirm = async () => {
    setIsLoading(true);
    const newStatus = form.final_decision === "Approved" ? "Approved" : "Rejected";
    await onConfirm(record.id, newStatus, form);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen || !record) return null;

  const emp = record.employees;
  const empName = emp ? `${emp.last_name}, ${emp.first_name}${emp.middle_name ? " " + emp.middle_name : ""}` : "Unknown";

  const isDisapproved = form.final_decision === "Disapproved";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-border-subtle animate-[slideUp_0.3s_ease-out]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle bg-surface-alt flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-text-main m-0">Details of Action</h2>
            <p className="text-[11px] font-bold text-text-placeholder uppercase tracking-widest mt-0.5">CSC Form No. 6 — Section 7</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer">
            <i className="fas fa-times text-[14px]"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-5">

          {/* Applicant Summary */}
          <div className="bg-surface-alt/50 border border-border-subtle rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[12px] font-black text-accent shrink-0">
              {emp?.last_name?.[0]}{emp?.first_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-main text-[14px] font-black m-0 truncate">{empName}</p>
              <p className="text-text-muted text-[11px] font-medium m-0">{record.type_of_leave} — {record.inclusive_dates}</p>
            </div>
            <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              {record.working_days} day{record.working_days !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── 7.A: HR Certification ── */}
          <div className="bg-surface-alt/30 border border-border-subtle p-5 rounded-2xl">
            <SecHeader num="7.A" label="Certification of Leave Credits" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <F label="As of Date" span2>
                <input type="date" name="as_of_date" value={form.as_of_date} onChange={handle} className={inputCls} />
              </F>
            </div>
            {/* Leave Credits Table */}
            <div className="overflow-x-auto rounded-xl border border-border-subtle">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-surface-alt border-b border-border-subtle">
                    <th className="px-4 py-2.5 text-left font-black text-text-muted uppercase tracking-wider text-[10px]">Leave Type</th>
                    <th className="px-4 py-2.5 text-center font-black text-text-muted uppercase tracking-wider text-[10px]">Total Earned</th>
                    <th className="px-4 py-2.5 text-center font-black text-text-muted uppercase tracking-wider text-[10px]">Less This App.</th>
                    <th className="px-4 py-2.5 text-center font-black text-text-muted uppercase tracking-wider text-[10px]">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-subtle">
                    <td className="px-4 py-2.5 font-bold text-text-main">Vacation Leave</td>
                    <td className="px-4 py-2"><input type="number" step="0.001" value={form.vl_total_earned} onChange={e => set("vl_total_earned", e.target.value)} placeholder="0.000" className={numCls + " text-center"} /></td>
                    <td className="px-4 py-2"><input type="number" step="0.001" value={form.vl_less_application} onChange={e => set("vl_less_application", e.target.value)} placeholder="0.000" className={numCls + " text-center"} /></td>
                    <td className="px-4 py-2"><input type="number" step="0.001" value={form.vl_balance} onChange={e => set("vl_balance", e.target.value)} placeholder="0.000" className={numCls + " text-center"} /></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-text-main">Sick Leave</td>
                    <td className="px-4 py-2"><input type="number" step="0.001" value={form.sl_total_earned} onChange={e => set("sl_total_earned", e.target.value)} placeholder="0.000" className={numCls + " text-center"} /></td>
                    <td className="px-4 py-2"><input type="number" step="0.001" value={form.sl_less_application} onChange={e => set("sl_less_application", e.target.value)} placeholder="0.000" className={numCls + " text-center"} /></td>
                    <td className="px-4 py-2"><input type="number" step="0.001" value={form.sl_balance} onChange={e => set("sl_balance", e.target.value)} placeholder="0.000" className={numCls + " text-center"} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <F label="HR Officer Name">
                <input name="hr_officer_name" value={form.hr_officer_name} onChange={handle} placeholder="Full name…" className={inputCls} />
              </F>
              <F label="HR Officer Position">
                <input name="hr_officer_position" value={form.hr_officer_position} onChange={handle} placeholder="Position/designation…" className={inputCls} />
              </F>
            </div>
          </div>

          {/* ── 7.B: Recommendation ── */}
          <div className="bg-surface-alt/30 border border-border-subtle p-5 rounded-2xl">
            <SecHeader num="7.B" label="Recommendation" color="text-blue-400" />
            <div className="flex flex-col gap-2 mb-3">
              <Radio name="recommendation" value="For Approval" checked={form.recommendation === "For Approval"} onChange={e => set("recommendation", e.target.value)} label="For Approval" />
              <Radio name="recommendation" value="For Disapproval" checked={form.recommendation === "For Disapproval"} onChange={e => set("recommendation", e.target.value)} label="For Disapproval" />
            </div>
            {form.recommendation === "For Disapproval" && (
              <F label="Reason for Disapproval">
                <input name="rec_disapproval_reason" value={form.rec_disapproval_reason} onChange={handle} placeholder="State reason…" className={inputCls} />
              </F>
            )}
            <div className="grid grid-cols-2 gap-4 mt-3">
              <F label="Recommending Officer Name">
                <input name="recommending_officer_name" value={form.recommending_officer_name} onChange={handle} placeholder="Full name…" className={inputCls} />
              </F>
              <F label="Recommending Officer Position">
                <input name="recommending_officer_position" value={form.recommending_officer_position} onChange={handle} placeholder="Position…" className={inputCls} />
              </F>
            </div>
          </div>

          {/* ── 7.C: Final Decision ── */}
          <div className="bg-surface-alt/30 border border-border-subtle p-5 rounded-2xl">
            <SecHeader num="7.C" label="Final Decision" color={isDisapproved ? "text-red-400" : "text-emerald-400"} />
            <div className="flex flex-col gap-2 mb-3">
              <Radio name="final_decision" value="Approved" checked={form.final_decision === "Approved"} onChange={e => set("final_decision", e.target.value)} label="Approved" />
              <Radio name="final_decision" value="Disapproved" checked={form.final_decision === "Disapproved"} onChange={e => set("final_decision", e.target.value)} label="Disapproved" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Approving Officer Name">
                <input name="approving_officer_name" value={form.approving_officer_name} onChange={handle} placeholder="Full name…" className={inputCls} />
              </F>
              <F label="Approving Officer Position">
                <input name="approving_officer_position" value={form.approving_officer_position} onChange={handle} placeholder="Position…" className={inputCls} />
              </F>
            </div>
          </div>

          {/* ── 7.D: Approved Details ── */}
          {!isDisapproved && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl">
              <SecHeader num="7.D" label="Approved For" color="text-emerald-400" />
              <div className="grid grid-cols-3 gap-4">
                <F label="Days With Pay">
                  <input type="number" step="0.001" value={form.days_with_pay} onChange={e => set("days_with_pay", e.target.value)} placeholder="0.000" className={numCls} />
                </F>
                <F label="Days Without Pay">
                  <input type="number" step="0.001" value={form.days_without_pay} onChange={e => set("days_without_pay", e.target.value)} placeholder="0.000" className={numCls} />
                </F>
                <F label="Others (Specify)">
                  <input type="text" value={form.days_others} onChange={e => set("days_others", e.target.value)} placeholder="e.g. Half-day…" className={inputCls} />
                </F>
              </div>
            </div>
          )}

          {/* ── 7.E: Disapproval ── */}
          {isDisapproved && (
            <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl">
              <SecHeader num="7.E" label="Disapproved Due To" color="text-red-400" />
              <textarea value={form.disapproval_reason} onChange={e => set("disapproval_reason", e.target.value)}
                rows={3} placeholder="State reason for disapproval…"
                className={`${inputCls} resize-none`} />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex justify-between items-center shrink-0">
          <p className="text-text-placeholder text-[11px] font-medium">All Section 7 fields are optional</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isLoading}
              className="px-5 py-2.5 rounded-xl font-bold text-[13px] border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleConfirm} disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl font-bold text-[13px] border transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 hover:scale-105 ${isDisapproved ? "bg-red-500 border-red-600 text-white hover:bg-red-600" : "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600"}`}>
              {isLoading
                ? <><i className="fas fa-spinner fa-spin"></i> Processing…</>
                : isDisapproved
                  ? <><i className="fas fa-times-circle"></i> Disapprove</>
                  : <><i className="fas fa-check-circle"></i> Approve</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveAdminModal;
