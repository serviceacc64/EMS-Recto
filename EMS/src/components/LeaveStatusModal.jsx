import React, { useState, useEffect } from "react";

const ACTION_CONFIG = {
  approve: {
    icon: "fa-check-circle",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Process Approval",
    subtitle: "Complete Section 7: Details of Action on Application",
    confirmLabel: "Approve & Save",
    confirmClass: "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600",
  },
  reject: {
    icon: "fa-times-circle",
    iconColor: "text-red-400",
    iconBg: "bg-red-500/10 border-red-500/20",
    title: "Disapprove Application",
    subtitle: "Provide reasons for disapproval (Section 7.E)",
    confirmLabel: "Disapprove",
    confirmClass: "bg-red-500 border-red-600 text-white hover:bg-red-600",
  },
};

const inputCls = "w-full bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-xl px-3 py-2 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder";
const labelCls = "text-[10px] font-black text-text-muted uppercase tracking-wider ml-1 mb-1 block";

const LeaveStatusModal = ({ isOpen, action, record, onConfirm, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  // Section 7.A - Credits
  const [credits, setCredits] = useState({
    as_of_date: today,
    vl_total_earned: "",
    vl_less_application: "",
    vl_balance: "",
    sl_total_earned: "",
    sl_less_application: "",
    sl_balance: "",
    hr_officer_name: "WENNIE O. GAELA",
    hr_officer_position: "Administrative Officer IV/HRMO II",
  });

  // Section 7.B - Recommendation
  const [recommendation, setRecommendation] = useState({
    status: "For approval",
    reason: "",
    officer_name: "JESSIE V. VASQUEZ",
    officer_position: "School Head / PSDS",
  });

  // Section 7.D/E - Final Action
  const [finalAction, setFinalAction] = useState({
    days_with_pay: "",
    days_without_pay: "",
    days_others: "",
    disapproval_reason: "",
    approving_officer_name: "ROMMEL C. BAUTISTA, CESO V",
    approving_officer_position: "Schools Division Superintendent",
  });

  // Local/D.O. Leave Logic
  const [empBalances, setEmpBalances] = useState({ local: 0, do: 0 });
  const [deductionSplit, setDeductionSplit] = useState({ local: 0, do: 0 });

  useEffect(() => {
    if (isOpen && record) {
      // Auto-fill "Less this application" from working days
      setCredits(prev => ({
        ...prev,
        vl_less_application: record.type_of_leave.includes("Vacation") ? record.working_days : "",
        sl_less_application: record.type_of_leave.includes("Sick") ? record.working_days : "",
      }));
      
      // Fetch Employee Balances for Local/D.O. Logic
      const fetchBalances = async () => {
        const { data, error } = await import("../lib/supabaseClient").then(m => 
          m.supabase.from("employees").select("local_leave_balance, do_leave_balance").eq("id", record.employee_id).single()
        );
        if (data && !error) {
          setEmpBalances({
            local: Number(data.local_leave_balance) || 0,
            do: Number(data.do_leave_balance) || 0
          });
        }
      };
      fetchBalances();
    }
  }, [isOpen, record]);

  // Calculate Local/D.O. Deduction Split & Update Pay Status
  useEffect(() => {
    if (record?.working_days) {
      const requested = Number(record.working_days) || 0;
      const localDeduct = Math.min(requested, empBalances.local);
      const doDeduct = Math.max(0, requested - localDeduct);
      setDeductionSplit({ local: localDeduct, do: doDeduct });

      // According to rules: Local = Paid, D.O. = Unpaid (Salary Deduction)
      setFinalAction(prev => ({
        ...prev,
        days_with_pay: localDeduct,
        days_without_pay: doDeduct,
      }));
    }
  }, [record, empBalances]);

  // Update Section 7.A (Credits) based on Local/D.O. Logic
  useEffect(() => {
    setCredits(prev => ({
      ...prev,
      vl_total_earned: Number(empBalances.local),
      sl_total_earned: Number(empBalances.do),
      vl_less_application: Number(deductionSplit.local),
      sl_less_application: Number(deductionSplit.do),
    }));
  }, [empBalances, deductionSplit]);

  // Auto-calculate 7.A balances
  useEffect(() => {
    const vl_bal = (Number(credits.vl_total_earned) || 0) - (Number(credits.vl_less_application) || 0);
    const sl_bal = (Number(credits.sl_total_earned) || 0) - (Number(credits.sl_less_application) || 0);
    setCredits(prev => ({
      ...prev,
      vl_balance: Number(vl_bal),
      sl_balance: Number(sl_bal),
    }));
  }, [credits.vl_total_earned, credits.vl_less_application, credits.sl_total_earned, credits.sl_less_application]);

  if (!isOpen || !record || !action) return null;

  const cfg = ACTION_CONFIG[action];
  const isApprove = action === "approve";

  const handleConfirm = async () => {
    setIsLoading(true);
    
    const updates = {
      status: isApprove ? "Approved" : "Rejected",
      // 7.A
      as_of_date: credits.as_of_date,
      vl_total_earned: credits.vl_total_earned || 0,
      vl_less_application: credits.vl_less_application || 0,
      vl_balance: credits.vl_balance || 0,
      sl_total_earned: credits.sl_total_earned || 0,
      sl_less_application: credits.sl_less_application || 0,
      sl_balance: credits.sl_balance || 0,
      hr_officer_name: credits.hr_officer_name,
      hr_officer_position: credits.hr_officer_position,
      // 7.B
      recommendation: recommendation.status,
      rec_disapproval_reason: recommendation.reason,
      recommending_officer_name: recommendation.officer_name,
      recommending_officer_position: recommendation.officer_position,
      // 7.D/E
      days_with_pay: isApprove ? (finalAction.days_with_pay || 0) : 0,
      days_without_pay: isApprove ? (finalAction.days_without_pay || 0) : 0,
      days_others: isApprove ? finalAction.days_others : "",
      disapproval_reason: !isApprove ? finalAction.disapproval_reason : "",
      approving_officer_name: finalAction.approving_officer_name,
      approving_officer_position: finalAction.approving_officer_position,
    };

    await onConfirm(record.id, updates);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[95vh] border border-border-subtle animate-[slideUp_0.3s_ease-out] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle bg-surface-alt flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${cfg.iconBg}`}>
              <i className={`fas ${cfg.icon} text-lg ${cfg.iconColor}`}></i>
            </div>
            <div>
              <h2 className="text-[17px] font-black text-text-main m-0">{cfg.title}</h2>
              <p className="text-xs font-medium text-text-muted mt-0.5">{cfg.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer">
            <i className="fas fa-times text-[14px]"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Form Details & Section 7.A */}
            <div className="flex flex-col gap-6">
              {/* Record Summary with Leave Deduction Logic */}
              <div className="bg-surface-alt/50 border border-border-subtle rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-subtle/50">
                  <p className="text-[10px] font-black text-accent uppercase tracking-widest">Application Summary</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-muted">Total Days:</span>
                    <span className="text-[12px] font-black text-accent">{record.working_days}</span>
                  </div>
                </div>

                {/* Deduction Breakdown Box */}
                <div className="bg-surface border border-border-subtle rounded-xl p-3 mb-4 shadow-inner">
                   <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">Auto-Deduction Calculation</p>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-surface-alt rounded-lg border border-border-subtle/30">
                        <p className="text-[10px] font-bold text-text-muted mb-1">Local Leave</p>
                        <div className="flex justify-between items-end">
                           <p className="text-[13px] font-black text-text-main">{Number(deductionSplit.local)} <span className="text-[10px] font-medium opacity-50">days</span></p>
                           <p className="text-[9px] font-medium text-text-placeholder">Bal: {Number(empBalances.local)}</p>
                        </div>
                      </div>
                      <div className="p-2 bg-surface-alt rounded-lg border border-border-subtle/30">
                        <p className="text-[10px] font-bold text-text-muted mb-1">D.O. Leave</p>
                        <div className="flex justify-between items-end">
                           <p className="text-[13px] font-black text-text-main">{Number(deductionSplit.do)} <span className="text-[10px] font-medium opacity-50">days</span></p>
                           <p className="text-[9px] font-medium text-text-placeholder">Bal: {Number(empBalances.do)}</p>
                        </div>
                      </div>
                   </div>
                   {deductionSplit.do > 0 && deductionSplit.local < record.working_days && (
                     <p className="text-[10px] font-medium text-amber-500 mt-2 italic">
                       <i className="fas fa-info-circle mr-1"></i> Local leave insufficient. Remaining days taken from D.O. leave.
                     </p>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-y-3">
                  <div>
                    <p className={labelCls}>Employee</p>
                    <p className="text-sm font-bold text-text-main">{record.employees?.last_name}, {record.employees?.first_name}</p>
                  </div>
                  <div>
                    <p className={labelCls}>Leave Type</p>
                    <p className="text-sm font-bold text-text-main">{record.type_of_leave}</p>
                  </div>
                  <div>
                    <p className={labelCls}>Inclusive Dates</p>
                    <p className="text-sm font-bold text-text-main">{record.inclusive_dates}</p>
                  </div>
                </div>
              </div>

              {/* 7.A Certification of Leave Credits */}
              <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[12px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                    <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[10px]">7.A</span>
                    Certification of Leave Credits
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-muted">As of</span>
                    <input type="date" value={credits.as_of_date} onChange={e => setCredits(p => ({...p, as_of_date: e.target.value}))} className="bg-transparent border-none text-[12px] font-bold text-accent outline-none cursor-pointer" />
                  </div>
                </div>

                <div className="overflow-hidden border border-border-subtle rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-alt/50 text-[10px] font-black text-text-muted uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2 border-b border-border-subtle">Category</th>
                        <th className="px-3 py-2 border-b border-border-subtle">Vacation (VL)</th>
                        <th className="px-3 py-2 border-b border-border-subtle">Sick (SL)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] font-medium text-text-main">
                      <tr>
                        <td className="px-3 py-2 border-b border-border-subtle bg-surface-alt/30 text-[11px] font-bold text-text-muted">Total Earned</td>
                        <td className="px-2 py-1 border-b border-border-subtle">
                          <input type="number" step="0.001" value={credits.vl_total_earned} onChange={e => setCredits(p => ({...p, vl_total_earned: e.target.value}))} className="w-full bg-transparent border-none font-bold text-accent outline-none" placeholder="0.000" />
                        </td>
                        <td className="px-2 py-1 border-b border-border-subtle">
                          <input type="number" step="0.001" value={credits.sl_total_earned} onChange={e => setCredits(p => ({...p, sl_total_earned: e.target.value}))} className="w-full bg-transparent border-none font-bold text-accent outline-none" placeholder="0.000" />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 border-b border-border-subtle bg-surface-alt/30 text-[11px] font-bold text-text-muted">Less this App</td>
                        <td className="px-2 py-1 border-b border-border-subtle">
                          <input type="number" step="0.001" value={credits.vl_less_application} onChange={e => setCredits(p => ({...p, vl_less_application: e.target.value}))} className="w-full bg-transparent border-none font-bold outline-none" placeholder="0.000" />
                        </td>
                        <td className="px-2 py-1 border-b border-border-subtle">
                          <input type="number" step="0.001" value={credits.sl_less_application} onChange={e => setCredits(p => ({...p, sl_less_application: e.target.value}))} className="w-full bg-transparent border-none font-bold outline-none" placeholder="0.000" />
                        </td>
                      </tr>
                      <tr className="bg-accent/5">
                        <td className="px-3 py-2 text-[11px] font-black text-accent uppercase">Balance</td>
                        <td className="px-3 py-2 font-black text-accent">{credits.vl_balance}</td>
                        <td className="px-3 py-2 font-black text-accent">{credits.sl_balance}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelCls}>HR Officer Name</label>
                    <input type="text" value={credits.hr_officer_name} onChange={e => setCredits(p => ({...p, hr_officer_name: e.target.value}))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Position</label>
                    <input type="text" value={credits.hr_officer_position} onChange={e => setCredits(p => ({...p, hr_officer_position: e.target.value}))} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Recommendations & Final Action */}
            <div className="flex flex-col gap-6">
              
              {/* 7.B Recommendation */}
              <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                <h3 className="text-[12px] font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[10px]">7.B</span>
                  Recommendation
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="rec" checked={recommendation.status === "For approval"} onChange={() => setRecommendation(p => ({...p, status: "For approval"}))} className="accent-accent" />
                      <span className="text-[13px] font-bold text-text-main">For approval</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="rec" checked={recommendation.status === "For disapproval"} onChange={() => setRecommendation(p => ({...p, status: "For disapproval"}))} className="accent-accent" />
                      <span className="text-[13px] font-bold text-text-main">For disapproval</span>
                    </label>
                  </div>
                  {recommendation.status === "For disapproval" && (
                    <textarea value={recommendation.reason} onChange={e => setRecommendation(p => ({...p, reason: e.target.value}))} placeholder="Due to..." className={`${inputCls} h-20 resize-none`} />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Officer Name</label>
                      <input type="text" value={recommendation.officer_name} onChange={e => setRecommendation(p => ({...p, officer_name: e.target.value}))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Position</label>
                      <input type="text" value={recommendation.officer_position} onChange={e => setRecommendation(p => ({...p, officer_position: e.target.value}))} className={inputCls} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 7.D/E Final Action */}
              <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                <h3 className="text-[12px] font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[10px]">7.D / 7.E</span>
                  Final Action
                </h3>
                
                {isApprove ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Days with Pay</label>
                        <input type="number" step="0.5" value={finalAction.days_with_pay} onChange={e => setFinalAction(p => ({...p, days_with_pay: e.target.value}))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Days without Pay</label>
                        <input type="number" step="0.5" value={finalAction.days_without_pay} onChange={e => setFinalAction(p => ({...p, days_without_pay: e.target.value}))} className={inputCls} />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Others (Specify)</label>
                        <input type="text" value={finalAction.days_others} onChange={e => setFinalAction(p => ({...p, days_others: e.target.value}))} className={inputCls} placeholder="e.g. Approved with partial pay..." />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className={labelCls}>Disapproved Due to</label>
                    <textarea value={finalAction.disapproval_reason} onChange={e => setFinalAction(p => ({...p, disapproval_reason: e.target.value}))} placeholder="State reasons for disapproval..." className={`${inputCls} h-24 resize-none`} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border-subtle">
                  <div>
                    <label className={labelCls}>Approving Officer</label>
                    <input type="text" value={finalAction.approving_officer_name} onChange={e => setFinalAction(p => ({...p, approving_officer_name: e.target.value}))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Position</label>
                    <input type="text" value={finalAction.approving_officer_position} onChange={e => setFinalAction(p => ({...p, approving_officer_position: e.target.value}))} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isLoading} className="px-6 py-2.5 rounded-xl font-bold text-[14px] border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isLoading} className={`px-8 py-2.5 rounded-xl font-bold text-[14px] border transition-all cursor-pointer flex items-center gap-2 hover:scale-105 shadow-md ${cfg.confirmClass}`}>
            {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className={`fas ${cfg.icon}`}></i> {cfg.confirmLabel}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveStatusModal;
