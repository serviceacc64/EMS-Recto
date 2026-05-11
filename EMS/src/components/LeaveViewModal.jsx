import React from "react";

const STATUS_CONFIG = {
  Pending: {
    pillClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-400",
    icon: "fa-clock",
  },
  Approved: {
    pillClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-400",
    icon: "fa-check-circle",
  },
  Rejected: {
    pillClass: "bg-red-500/10 text-red-400 border-red-500/30",
    dotClass: "bg-red-400",
    icon: "fa-times-circle",
  },
};

const InfoRow = ({ label, value, mono = false, highlight = false }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-[10px] font-black text-text-placeholder uppercase tracking-widest m-0">
      {label}
    </p>
    <p className={`text-[14px] font-bold m-0 ${mono ? "font-mono text-[13px]" : ""} ${highlight ? "text-accent" : "text-text-main"}`}>
      {value || <span className="text-text-placeholder font-medium italic">—</span>}
    </p>
  </div>
);

const SectionHeading = ({ num, label, color = "accent" }) => (
  <p className="text-[10px] font-black text-text-placeholder uppercase tracking-widest mb-3 flex items-center gap-2">
    <span className={`bg-${color}/10 text-${color} px-1.5 py-0.5 rounded text-[9px]`}>{num}</span>
    {label}
  </p>
);

const LeaveViewModal = ({ isOpen, record, onClose }) => {
  if (!isOpen || !record) return null;

  const sc = STATUS_CONFIG[record.status] || STATUS_CONFIG.Pending;
  const isPending = record.status === "Pending";

  const emp = record.employees;
  const fullName = emp
    ? `${emp.last_name}, ${emp.first_name}${emp.middle_name ? " " + emp.middle_name : ""}`
    : "Unknown Employee";

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[95vh] border border-border-subtle animate-[slideUp_0.3s_ease-out] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle bg-surface-alt flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-text-main m-0">Leave Application</h2>
            <p className="text-[11px] font-bold text-text-placeholder uppercase tracking-widest mt-0.5">
              CSC Form No. 6 — Official Record
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <i className="fas fa-times text-[14px]"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6">

          {/* Top Banner: Status & Employee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${sc.pillClass} md:col-span-1`}>
              <i className={`fas ${sc.icon} text-lg`}></i>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest m-0 opacity-70">Status</p>
                <p className="text-[15px] font-black m-0">{record.status}</p>
              </div>
            </div>
            
            <div className="bg-surface-alt/40 border border-border-subtle rounded-2xl px-4 py-3 flex items-center gap-4 md:col-span-2">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[12px] font-black text-accent shrink-0">
                {emp?.last_name?.[0]}{emp?.first_name?.[0]}
              </div>
              <div>
                <p className="text-text-main text-[14px] font-black m-0 leading-tight">{fullName}</p>
                <p className="text-text-muted text-[11px] font-medium m-0">{emp?.position || "—"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Application Details (Section 6) */}
            <div className="flex flex-col gap-6">
              <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                <SectionHeading num="6" label="Details of Application" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <InfoRow label="Date Filed" value={formatDate(record.date_of_filing)} />
                  <InfoRow label="Working Days" value={record.working_days} highlight />
                  <div className="col-span-2">
                    <InfoRow label="Type of Leave" value={record.type_of_leave} />
                  </div>
                  {record.other_leave_purpose && (
                    <div className="col-span-2">
                      <InfoRow label="Other Purpose" value={record.other_leave_purpose} />
                    </div>
                  )}
                  <div className="col-span-2">
                    <InfoRow label="Inclusive Dates" value={record.inclusive_dates} />
                  </div>
                  <div className="col-span-2">
                    <InfoRow label="Commutation" value={record.commutation_requested ? "Requested" : "Not Requested"} />
                  </div>
                </div>
              </div>

              {/* Conditional Details (Vacation/Sick/etc) */}
              {(record.vacation_location || record.sick_leave_type || record.women_leave_illness) && (
                <div className="bg-surface-alt/10 border border-border-subtle border-dashed rounded-2xl p-5">
                  <SectionHeading num="6.B" label="Specific Details" color="text-muted" />
                  <div className="flex flex-col gap-3">
                    {record.vacation_location && <InfoRow label="Vacation Location" value={`${record.vacation_location} ${record.vacation_abroad_dest ? "(" + record.vacation_abroad_dest + ")" : ""}`} />}
                    {record.sick_leave_type && <InfoRow label="Sick Leave Details" value={`${record.sick_leave_type} ${record.sick_leave_illness ? "(" + record.sick_leave_illness + ")" : ""}`} />}
                    {record.women_leave_illness && <InfoRow label="Women's Leave Details" value={record.women_leave_illness} />}
                    {record.study_leave_type && <InfoRow label="Study Leave" value={record.study_leave_type} />}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Action Details (Section 7) */}
            <div className="flex flex-col gap-6">
              {!isPending ? (
                <>
                  {/* 7.A Certification */}
                  <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <SectionHeading num="7.A" label="Leave Credit Certification" />
                      <p className="text-[10px] font-bold text-text-muted">As of {formatDate(record.as_of_date)}</p>
                    </div>
                    <div className="overflow-hidden border border-border-subtle rounded-xl mb-4">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead className="bg-surface-alt/50 font-black text-text-muted uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2 border-b border-border-subtle">Category</th>
                            <th className="px-3 py-2 border-b border-border-subtle text-center">VL</th>
                            <th className="px-3 py-2 border-b border-border-subtle text-center">SL</th>
                          </tr>
                        </thead>
                        <tbody className="text-text-main font-bold">
                          <tr className="border-b border-border-subtle/50">
                            <td className="px-3 py-2 bg-surface-alt/30 text-[10px] uppercase text-text-muted">Total Earned</td>
                            <td className="px-3 py-2 text-center text-accent">{Number(record.vl_total_earned)}</td>
                            <td className="px-3 py-2 text-center text-accent">{Number(record.sl_total_earned)}</td>
                          </tr>
                          <tr className="border-b border-border-subtle/50">
                            <td className="px-3 py-2 bg-surface-alt/30 text-[10px] uppercase text-text-muted">Less this App</td>
                            <td className="px-3 py-2 text-center">{Number(record.vl_less_application)}</td>
                            <td className="px-3 py-2 text-center">{Number(record.sl_less_application)}</td>
                          </tr>
                          <tr className="bg-accent/5">
                            <td className="px-3 py-2 text-[10px] font-black uppercase text-accent">Balance</td>
                            <td className="px-3 py-2 text-center text-accent">{Number(record.vl_balance)}</td>
                            <td className="px-3 py-2 text-center text-accent">{Number(record.sl_balance)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="pt-2 border-t border-border-subtle/50 text-right">
                      <p className="text-[12px] font-black text-text-main m-0">{record.hr_officer_name}</p>
                      <p className="text-[10px] font-bold text-text-muted uppercase m-0">{record.hr_officer_position}</p>
                    </div>
                  </div>

                  {/* 7.B Recommendation */}
                  <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                    <SectionHeading num="7.B" label="Recommendation" color="amber-500" />
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase ${record.recommendation?.includes("disapproval") ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                        {record.recommendation}
                      </span>
                    </div>
                    {record.rec_disapproval_reason && (
                      <p className="text-sm font-medium text-text-main mb-4 italic opacity-80">"{record.rec_disapproval_reason}"</p>
                    )}
                    <div className="pt-2 border-t border-border-subtle/50 text-right">
                      <p className="text-[12px] font-black text-text-main m-0">{record.recommending_officer_name}</p>
                      <p className="text-[10px] font-bold text-text-muted uppercase m-0">{record.recommending_officer_position}</p>
                    </div>
                  </div>

                  {/* 7.D/E Final Action */}
                  <div className="bg-surface-alt/20 border border-border-subtle rounded-2xl p-5">
                    <SectionHeading num="7.D/E" label="Final Action Details" color="emerald-500" />
                    {record.status === "Approved" ? (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <InfoRow label="Days with Pay" value={record.days_with_pay} />
                        <InfoRow label="Days without Pay" value={record.days_without_pay} />
                        {record.days_others && (
                          <div className="col-span-2">
                            <InfoRow label="Other Approval Notes" value={record.days_others} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4">
                        <InfoRow label="Disapproval Reason" value={record.disapproval_reason} />
                      </div>
                    )}
                    <div className="pt-2 border-t border-border-subtle/50 text-right">
                      <p className="text-[12px] font-black text-text-main m-0">{record.approving_officer_name}</p>
                      <p className="text-[10px] font-bold text-text-muted uppercase m-0">{record.approving_officer_position}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-surface-alt/10 border border-border-subtle border-dashed rounded-[32px] p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <i className="fas fa-hourglass-half text-amber-500 text-2xl animate-pulse"></i>
                  </div>
                  <h3 className="text-[16px] font-black text-text-main m-0">Awaiting Action</h3>
                  <p className="text-xs font-medium text-text-muted mt-2 max-w-[200px]">
                    This application is currently pending HR certification and management recommendation.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-[14px] border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer shadow-sm"
          >
            Close Application View
          </button>
        </div>

      </div>
    </div>
  );
};

export default LeaveViewModal;
