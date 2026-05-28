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

const inputCls =
  "w-full bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-xl px-3 py-2 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-placeholder";
const labelCls =
  "text-[10px] font-black text-text-muted uppercase tracking-wider ml-1 mb-1 block";
const selectCls =
  "w-full bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-xl px-3 py-2 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer";

// ─── Deduction Planner ────────────────────────────────────────────────────────
// Given: requested days, primary source, balances, remainder handler
// Returns: { localDeduct, doDeduct, lwopDays }
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
        // LWOP
        lwopDays = remainder;
      }
    }
  } else {
    // primary = D.O.
    doDeduct = primaryDeduct;
    if (remainder > 0) {
      if (remainderHandler === "local") {
        localDeduct = Math.min(remainder, localBal);
        lwopDays = remainder - localDeduct;
      } else {
        // LWOP
        lwopDays = remainder;
      }
    }
  }

  return { localDeduct, doDeduct, lwopDays };
}

// ─── Component ────────────────────────────────────────────────────────────────
const LeaveStatusModal = ({ isOpen, action, record, onConfirm, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  // ── Section 7.A - Credits ──────────────────────────────────────────────────
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

  // ── Section 7.B - Recommendation ──────────────────────────────────────────
  const [recommendation, setRecommendation] = useState({
    status: "For approval",
    reason: "",
    officer_name: "JESSIE V. VASQUEZ",
    officer_position: "School Head / PSDS",
  });

  // ── Section 7.D/E - Final Action ──────────────────────────────────────────
  const [finalAction, setFinalAction] = useState({
    days_with_pay: "",
    days_without_pay: "",
    days_others: "",
    disapproval_reason: "",
    approving_officer_name: "ROMMEL C. BAUTISTA, CESO V",
    approving_officer_position: "Schools Division Superintendent",
  });

  // ── Leave Source Selection State ───────────────────────────────────────────
  const [empBalances, setEmpBalances] = useState({ local: 0, do: 0 });

  // Step 1: which leave type to draw from first
  const [primarySource, setPrimarySource] = useState("local"); // "local" | "do"

  // Does the primary balance cover everything?
  const [hasShortfall, setHasShortfall] = useState(false);

  // Step 2: what to do with the remainder
  // "local" | "do" | "lwop"
  const [remainderHandler, setRemainderHandler] = useState("lwop");

  // Computed deduction split (derived, updated whenever inputs change)
  const [deduction, setDeduction] = useState({ localDeduct: 0, doDeduct: 0, lwopDays: 0 });

  // ── Fetch Employee Balances on Open ───────────────────────────────────────
  useEffect(() => {
    if (isOpen && record) {
      // Reset step-1 choices
      setPrimarySource("local");
      setRemainderHandler("lwop");

      const fetchBalances = async () => {
        const { data, error } = await import("../lib/supabaseClient").then((m) =>
          m.supabase
            .from("employees")
            .select("local_leave_balance, do_leave_balance")
            .eq("id", record.employee_id)
            .single()
        );
        if (data && !error) {
          setEmpBalances({
            local: Number(data.local_leave_balance) || 0,
            do: Number(data.do_leave_balance) || 0,
          });
        }
      };
      fetchBalances();
    }
  }, [isOpen, record]);

  // ── Recompute Deduction Whenever Source/Handler/Balances Change ───────────
  useEffect(() => {
    if (!record?.working_days) return;

    const requested = Number(record.working_days) || 0;
    const primaryBal =
      primarySource === "local" ? empBalances.local : empBalances.do;

    setHasShortfall(requested > primaryBal);

    // When primary covers all, clamp remainder handler to avoid stale state
    const effectiveHandler = requested <= primaryBal ? "lwop" : remainderHandler;

    const result = computeDeduction({
      requested,
      primarySource,
      localBal: empBalances.local,
      doBal: empBalances.do,
      remainderHandler: effectiveHandler,
    });

    setDeduction(result);

    // Mirror to Section 7.A
    setCredits((prev) => ({
      ...prev,
      vl_total_earned: empBalances.local,
      sl_total_earned: empBalances.do,
      vl_less_application: result.localDeduct,
      sl_less_application: result.doDeduct,
    }));

    // Mirror to Section 7.D (days with/without pay)
    // Local + D.O. = with pay (for CSC form).  LWOP = without pay.
    setFinalAction((prev) => ({
      ...prev,
      days_with_pay: result.localDeduct + result.doDeduct,
      days_without_pay: result.lwopDays,
    }));
  }, [record, empBalances, primarySource, remainderHandler]);

  // ── Auto-calculate 7.A balances ───────────────────────────────────────────
  useEffect(() => {
    const vl_bal =
      (Number(credits.vl_total_earned) || 0) -
      (Number(credits.vl_less_application) || 0);
    const sl_bal =
      (Number(credits.sl_total_earned) || 0) -
      (Number(credits.sl_less_application) || 0);
    setCredits((prev) => ({
      ...prev,
      vl_balance: Number(vl_bal),
      sl_balance: Number(sl_bal),
    }));
  }, [
    credits.vl_total_earned,
    credits.vl_less_application,
    credits.sl_total_earned,
    credits.sl_less_application,
  ]);

  if (!isOpen || !record || !action) return null;

  const cfg = ACTION_CONFIG[action];
  const isApprove = action === "approve";
  const requested = Number(record.working_days) || 0;

  // ── Handle Confirm ────────────────────────────────────────────────────────
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
      days_with_pay: isApprove ? finalAction.days_with_pay || 0 : 0,
      days_without_pay: isApprove ? finalAction.days_without_pay || 0 : 0,
      days_others: isApprove ? finalAction.days_others : "",
      disapproval_reason: !isApprove ? finalAction.disapproval_reason : "",
      approving_officer_name: finalAction.approving_officer_name,
      approving_officer_position: finalAction.approving_officer_position,
      // Explicit deduction metadata (used by LeaveTracker.handleStatusUpdate for DB)
      _localDeduct: deduction.localDeduct,
      _doDeduct: deduction.doDeduct,
      _lwopDays: deduction.lwopDays,
    };

    await onConfirm(record.id, updates);
    setIsLoading(false);
    onClose();
  };

  // ── Remainder options: always the opposite paid source + LWOP ─────────────
  const remainderOptions =
    primarySource === "local"
      ? [
          { value: "do", label: "D.O. Leave (Paid)" },
          { value: "lwop", label: "Non-Pay Leave (LWOP)" },
        ]
      : [
          { value: "local", label: "Local Leave (Paid)" },
          { value: "lwop", label: "Non-Pay Leave (LWOP)" },
        ];

  // ── Primary balance shortfall details ────────────────────────────────────
  const primaryBal =
    primarySource === "local" ? empBalances.local : empBalances.do;
  const primaryLabel = primarySource === "local" ? "Local Leave" : "D.O. Leave";
  const shortfallDays = Math.max(0, requested - primaryBal);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[95vh] border border-border-subtle animate-[slideUp_0.3s_ease-out] flex flex-col overflow-hidden">

        {/* ── Header ── */}
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
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <i className="fas fa-times text-[14px]"></i>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left Column ── */}
            <div className="flex flex-col gap-6">

              {/* Application Summary */}
              <div className="bg-surface-alt/50 border border-border-subtle rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-subtle/50">
                  <p className="text-[10px] font-black text-accent uppercase tracking-widest">Application Summary</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-muted">Total Days Requested:</span>
                    <span className="text-[13px] font-black text-accent">{record.working_days}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 mb-4">
                  <div>
                    <p className={labelCls}>Employee</p>
                    <p className="text-sm font-bold text-text-main">
                      {record.employees?.last_name}, {record.employees?.first_name}
                    </p>
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

                {/* ── Available Balance Cards ── */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Local Leave</p>
                      <p className="text-[10px] text-text-placeholder font-medium mt-0.5">Available</p>
                    </div>
                    <span className="text-[20px] font-black text-emerald-500">{empBalances.local}</span>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">D.O. Leave</p>
                      <p className="text-[10px] text-text-placeholder font-medium mt-0.5">Available</p>
                    </div>
                    <span className="text-[20px] font-black text-blue-500">{empBalances.do}</span>
                  </div>
                </div>

                {/* ── Step 1: Primary Source Selection ── */}
                {isApprove && (
                  <div className="flex flex-col gap-3">
                    <div className="border border-border-subtle rounded-xl p-3 bg-surface">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">
                        <i className="fas fa-hand-pointer mr-1 text-accent"></i>
                        Step 1 — Primary Leave Source
                      </p>
                      <p className="text-[11px] text-text-placeholder mb-2">
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

                    {/* ── Step 2: Remainder Handler (only shown when shortfall exists) ── */}
                    {hasShortfall && (
                      <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3">
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">
                          <i className="fas fa-exclamation-triangle mr-1"></i>
                          Step 2 — Insufficient Balance
                        </p>
                        <p className="text-[11px] text-text-muted mb-2">
                          <span className="font-bold text-text-main">{primaryLabel}</span> only covers{" "}
                          <span className="font-black text-emerald-400">{primaryBal}</span> of{" "}
                          <span className="font-black text-accent">{requested}</span> days.{" "}
                          How should the remaining{" "}
                          <span className="font-black text-amber-400">{shortfallDays}</span> day
                          {shortfallDays !== 1 ? "s" : ""} be handled?
                        </p>
                        <select
                          value={remainderHandler}
                          onChange={(e) => setRemainderHandler(e.target.value)}
                          className={`${selectCls} border-amber-500/40 focus:border-amber-500`}
                        >
                          {remainderOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* ── Deduction Result Summary ── */}
                    <div className="border border-border-subtle rounded-xl p-3 bg-surface-alt/30">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">
                        <i className="fas fa-calculator mr-1"></i>
                        Deduction Breakdown
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-surface rounded-lg p-2 text-center border border-border-subtle/50">
                          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-wider mb-1">Local</p>
                          <p className="text-[16px] font-black text-text-main">{deduction.localDeduct}</p>
                          <p className="text-[8px] text-text-placeholder">days</p>
                        </div>
                        <div className="bg-surface rounded-lg p-2 text-center border border-border-subtle/50">
                          <p className="text-[8px] font-black text-blue-500 uppercase tracking-wider mb-1">D.O.</p>
                          <p className="text-[16px] font-black text-text-main">{deduction.doDeduct}</p>
                          <p className="text-[8px] text-text-placeholder">days</p>
                        </div>
                        <div className={`rounded-lg p-2 text-center border ${deduction.lwopDays > 0 ? "bg-red-500/5 border-red-500/20" : "bg-surface border-border-subtle/50"}`}>
                          <p className={`text-[8px] font-black uppercase tracking-wider mb-1 ${deduction.lwopDays > 0 ? "text-red-400" : "text-text-muted"}`}>LWOP</p>
                          <p className={`text-[16px] font-black ${deduction.lwopDays > 0 ? "text-red-400" : "text-text-muted"}`}>{deduction.lwopDays}</p>
                          <p className="text-[8px] text-text-placeholder">days</p>
                        </div>
                      </div>
                      {deduction.lwopDays > 0 && (
                        <p className="text-[10px] font-medium text-red-400 mt-2 italic">
                          <i className="fas fa-info-circle mr-1"></i>
                          {deduction.lwopDays} day{deduction.lwopDays !== 1 ? "s" : ""} will be Non-Pay Leave (LWOP) — no balance deducted.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── 7.A Certification of Leave Credits ── */}
              <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[12px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                    <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[10px]">7.A</span>
                    Certification of Leave Credits
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-muted">As of</span>
                    <input
                      type="date"
                      value={credits.as_of_date}
                      onChange={(e) => setCredits((p) => ({ ...p, as_of_date: e.target.value }))}
                      className="bg-transparent border-none text-[12px] font-bold text-accent outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="overflow-hidden border border-border-subtle rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-alt/50 text-[10px] font-black text-text-muted uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2 border-b border-border-subtle">Category</th>
                        <th className="px-3 py-2 border-b border-border-subtle">Local Leave</th>
                        <th className="px-3 py-2 border-b border-border-subtle">D.O. Leave</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] font-medium text-text-main">
                      <tr>
                        <td className="px-3 py-2 border-b border-border-subtle bg-surface-alt/30 text-[11px] font-bold text-text-muted">Leave Balance</td>
                        <td className="px-2 py-1 border-b border-border-subtle">
                          <input type="number" step="0.001" value={credits.vl_total_earned}
                            onChange={(e) => setCredits((p) => ({ ...p, vl_total_earned: e.target.value }))}
                            className="w-full bg-transparent border-none font-bold text-accent outline-none" placeholder="0.000" />
                        </td>
                        <td className="px-2 py-1 border-b border-border-subtle">
                          <input type="number" step="0.001" value={credits.sl_total_earned}
                            onChange={(e) => setCredits((p) => ({ ...p, sl_total_earned: e.target.value }))}
                            className="w-full bg-transparent border-none font-bold text-accent outline-none" placeholder="0.000" />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 border-b border-border-subtle bg-surface-alt/30 text-[11px] font-bold text-text-muted">Deducted (This App.)</td>
                        <td className="px-2 py-1 border-b border-border-subtle">
                          <input type="number" step="0.001" value={credits.vl_less_application}
                            onChange={(e) => setCredits((p) => ({ ...p, vl_less_application: e.target.value }))}
                            className="w-full bg-transparent border-none font-bold outline-none" placeholder="0.000" />
                        </td>
                        <td className="px-2 py-1 border-b border-border-subtle">
                          <input type="number" step="0.001" value={credits.sl_less_application}
                            onChange={(e) => setCredits((p) => ({ ...p, sl_less_application: e.target.value }))}
                            className="w-full bg-transparent border-none font-bold outline-none" placeholder="0.000" />
                        </td>
                      </tr>
                      <tr className="bg-accent/5">
                        <td className="px-3 py-2 text-[11px] font-black text-accent uppercase">New Balance</td>
                        <td className="px-3 py-2 font-black text-accent">{credits.vl_balance}</td>
                        <td className="px-3 py-2 font-black text-accent">{credits.sl_balance}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelCls}>HR Officer Name</label>
                    <input type="text" value={credits.hr_officer_name}
                      onChange={(e) => setCredits((p) => ({ ...p, hr_officer_name: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Position</label>
                    <input type="text" value={credits.hr_officer_position}
                      onChange={(e) => setCredits((p) => ({ ...p, hr_officer_position: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="flex flex-col gap-6">

              {/* ── 7.B Recommendation ── */}
              <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                <h3 className="text-[12px] font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[10px]">7.B</span>
                  Recommendation
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="rec" checked={recommendation.status === "For approval"}
                        onChange={() => setRecommendation((p) => ({ ...p, status: "For approval" }))}
                        className="accent-accent" />
                      <span className="text-[13px] font-bold text-text-main">For approval</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="rec" checked={recommendation.status === "For disapproval"}
                        onChange={() => setRecommendation((p) => ({ ...p, status: "For disapproval" }))}
                        className="accent-accent" />
                      <span className="text-[13px] font-bold text-text-main">For disapproval</span>
                    </label>
                  </div>
                  {recommendation.status === "For disapproval" && (
                    <textarea value={recommendation.reason}
                      onChange={(e) => setRecommendation((p) => ({ ...p, reason: e.target.value }))}
                      placeholder="Due to..." className={`${inputCls} h-20 resize-none`} />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Officer Name</label>
                      <input type="text" value={recommendation.officer_name}
                        onChange={(e) => setRecommendation((p) => ({ ...p, officer_name: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Position</label>
                      <input type="text" value={recommendation.officer_position}
                        onChange={(e) => setRecommendation((p) => ({ ...p, officer_position: e.target.value }))}
                        className={inputCls} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 7.D/E Final Action ── */}
              <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                <h3 className="text-[12px] font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[10px]">7.D / 7.E</span>
                  Final Action
                </h3>

                {isApprove ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Days With Pay</label>
                        <input type="number" step="0.5" value={finalAction.days_with_pay}
                          onChange={(e) => setFinalAction((p) => ({ ...p, days_with_pay: e.target.value }))}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Days Without Pay (LWOP)</label>
                        <input type="number" step="0.5" value={finalAction.days_without_pay}
                          onChange={(e) => setFinalAction((p) => ({ ...p, days_without_pay: e.target.value }))}
                          className={inputCls} />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Others</label>
                        <input type="text" value={finalAction.days_others}
                          onChange={(e) => setFinalAction((p) => ({ ...p, days_others: e.target.value }))}
                          className={inputCls} placeholder="Others.." />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className={labelCls}>Disapproved Due to</label>
                    <textarea value={finalAction.disapproval_reason}
                      onChange={(e) => setFinalAction((p) => ({ ...p, disapproval_reason: e.target.value }))}
                      placeholder="State reasons for disapproval..."
                      className={`${inputCls} h-24 resize-none`} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border-subtle">
                  <div>
                    <label className={labelCls}>Approving Officer</label>
                    <input type="text" value={finalAction.approving_officer_name}
                      onChange={(e) => setFinalAction((p) => ({ ...p, approving_officer_name: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Position</label>
                    <input type="text" value={finalAction.approving_officer_position}
                      onChange={(e) => setFinalAction((p) => ({ ...p, approving_officer_position: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isLoading}
            className="px-6 py-2.5 rounded-xl font-bold text-[14px] border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isLoading}
            className={`px-8 py-2.5 rounded-xl font-bold text-[14px] border transition-all cursor-pointer flex items-center gap-2 hover:scale-105 shadow-md ${cfg.confirmClass}`}>
            {isLoading
              ? <><i className="fas fa-spinner fa-spin"></i> Saving...</>
              : <><i className={`fas ${cfg.icon}`}></i> {cfg.confirmLabel}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveStatusModal;
