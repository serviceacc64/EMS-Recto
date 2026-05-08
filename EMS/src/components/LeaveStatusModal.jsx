import React, { useState, useEffect } from "react";

const ACTION_CONFIG = {
  approve: {
    icon: "fa-check-circle",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Approve Leave Application?",
    subtitle: "This will mark the application as Approved.",
    confirmLabel: "Approve",
    confirmClass:
      "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600",
    remarksPlaceholder: "Optional: Add a note for the employee…",
  },
  reject: {
    icon: "fa-times-circle",
    iconColor: "text-red-400",
    iconBg: "bg-red-500/10 border-red-500/20",
    title: "Reject Leave Application?",
    subtitle: "This will mark the application as Rejected.",
    confirmLabel: "Reject",
    confirmClass: "bg-red-500 border-red-600 text-white hover:bg-red-600",
    remarksPlaceholder: "Optional: State the reason for rejection…",
  },
};

const LeaveStatusModal = ({ isOpen, action, record, onConfirm, onClose }) => {
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setRemarks("");
  }, [isOpen]);

  if (!isOpen || !record || !action) return null;

  const cfg = ACTION_CONFIG[action];

  const employeeName = record.employees
    ? `${record.employees.last_name}, ${record.employees.first_name}${
        record.employees.middle_name ? " " + record.employees.middle_name : ""
      }`
    : "Unknown Employee";

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm(record.id, action === "approve" ? "Approved" : "Rejected", remarks);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-[24px] shadow-2xl w-full max-w-md border border-border-subtle animate-[slideUp_0.3s_ease-out] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-subtle bg-surface-alt flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${cfg.iconBg}`}>
            <i className={`fas ${cfg.icon} text-xl ${cfg.iconColor}`}></i>
          </div>
          <div className="flex-1">
            <h2 className="text-[17px] font-black text-text-main m-0">{cfg.title}</h2>
            <p className="text-xs font-medium text-text-muted mt-0.5">{cfg.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-text-muted hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer shrink-0"
          >
            <i className="fas fa-times text-[13px]"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">

          {/* Record Summary Card */}
          <div className="bg-surface-alt/50 border border-border-subtle rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[11px] font-black text-accent shrink-0">
                {record.employees?.last_name?.[0]}{record.employees?.first_name?.[0]}
              </div>
              <div>
                <p className="text-text-main text-sm font-black m-0 leading-tight">{employeeName}</p>
                <p className="text-text-placeholder text-[11px] font-medium m-0">{record.employees?.position}</p>
              </div>
            </div>
            <div className="border-t border-border-subtle/50 pt-2.5 grid grid-cols-2 gap-2">
              <div>
                <p className="text-text-placeholder text-[10px] font-black uppercase tracking-wider mb-0.5">Leave Type</p>
                <p className="text-text-main text-xs font-bold m-0">{record.type_of_leave}</p>
              </div>
              <div>
                <p className="text-text-placeholder text-[10px] font-black uppercase tracking-wider mb-0.5">Working Days</p>
                <p className="text-text-main text-xs font-bold m-0">{record.working_days} day{record.working_days !== 1 ? "s" : ""}</p>
              </div>
              <div className="col-span-2">
                <p className="text-text-placeholder text-[10px] font-black uppercase tracking-wider mb-0.5">Inclusive Dates</p>
                <p className="text-text-main text-xs font-bold m-0">{record.inclusive_dates}</p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-1">
              Remarks <span className="normal-case font-medium opacity-60">(optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={cfg.remarksPlaceholder}
              rows={3}
              className="w-full bg-surface border border-border-subtle text-text-main text-[13px] font-medium rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all resize-none placeholder:text-text-placeholder"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl font-bold text-[13px] border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-bold text-[13px] border transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 hover:scale-105 ${cfg.confirmClass}`}
          >
            {isLoading ? (
              <><i className="fas fa-spinner fa-spin"></i> Processing…</>
            ) : (
              <><i className={`fas ${cfg.icon}`}></i> {cfg.confirmLabel}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveStatusModal;
