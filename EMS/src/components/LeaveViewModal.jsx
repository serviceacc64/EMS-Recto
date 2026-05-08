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

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-[10px] font-black text-text-placeholder uppercase tracking-widest m-0">
      {label}
    </p>
    <p className={`text-[14px] font-bold text-text-main m-0 ${mono ? "font-mono text-[13px]" : ""}`}>
      {value || <span className="text-text-placeholder font-medium italic">—</span>}
    </p>
  </div>
);

const LeaveViewModal = ({ isOpen, record, onClose }) => {
  if (!isOpen || !record) return null;

  const sc = STATUS_CONFIG[record.status] || STATUS_CONFIG.Pending;

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-[24px] shadow-2xl w-full max-w-lg max-h-[90vh] border border-border-subtle animate-[slideUp_0.3s_ease-out] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border-subtle bg-surface-alt flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-text-main m-0">Leave Application</h2>
            <p className="text-[11px] font-bold text-text-placeholder uppercase tracking-widest mt-0.5">
              CSC Form No. 6 — Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-text-muted hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
          >
            <i className="fas fa-times text-[14px]"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-5">

          {/* Status Banner */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${sc.pillClass}`}>
            <i className={`fas ${sc.icon} text-lg`}></i>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest m-0 opacity-70">Current Status</p>
              <p className="text-[15px] font-black m-0">{record.status}</p>
            </div>
            <div className={`ml-auto w-2.5 h-2.5 rounded-full ${sc.dotClass} animate-pulse`}></div>
          </div>

          {/* Employee Section */}
          <div className="bg-surface-alt/40 border border-border-subtle rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[14px] font-black text-accent shrink-0">
              {emp?.last_name?.[0]}{emp?.first_name?.[0]}
            </div>
            <div>
              <p className="text-text-main text-[15px] font-black m-0">{fullName}</p>
              <p className="text-text-muted text-[12px] font-medium m-0">{emp?.position || "—"}</p>
              <p className="text-text-placeholder text-[11px] font-mono font-bold m-0 mt-0.5">
                {emp?.employee_no || "—"}
              </p>
            </div>
          </div>

          {/* Application Info Grid */}
          <div className="bg-surface-alt/30 border border-border-subtle rounded-2xl p-4">
            <p className="text-[10px] font-black text-text-placeholder uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fas fa-list-alt text-accent"></i> Application Details
            </p>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Date Filed" value={formatDate(record.date_of_filing)} />
              <InfoRow label="Working Days" value={`${record.working_days} day${record.working_days !== 1 ? "s" : ""}`} />
              <div className="col-span-2">
                <InfoRow label="Type of Leave" value={record.type_of_leave} />
              </div>
              {record.leave_details && (
                <div className="col-span-2">
                  <InfoRow label="Specific Details" value={record.leave_details} />
                </div>
              )}
              <div className="col-span-2">
                <InfoRow label="Inclusive Dates" value={record.inclusive_dates} />
              </div>
              <div className="col-span-2">
                <InfoRow
                  label="Commutation Requested"
                  value={record.commutation_requested ? "Yes — Commutation requested" : "No"}
                />
              </div>
            </div>
          </div>

          {/* Remarks (only if exists) */}
          {record.remarks && (
            <div className="bg-surface-alt/30 border border-border-subtle rounded-2xl p-4">
              <p className="text-[10px] font-black text-text-placeholder uppercase tracking-widest mb-2 flex items-center gap-2">
                <i className="fas fa-comment-alt text-accent"></i> Admin Remarks
              </p>
              <p className="text-text-main text-[14px] font-medium m-0 leading-relaxed">
                {record.remarks}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <InfoRow label="Filed On" value={formatDateTime(record.created_at)} />
            <InfoRow label="Last Updated" value={formatDateTime(record.updated_at)} />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-[14px] border border-border-subtle bg-surface text-text-muted hover:bg-surface-hover transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default LeaveViewModal;
