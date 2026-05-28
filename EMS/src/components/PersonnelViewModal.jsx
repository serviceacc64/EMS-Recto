import React, { useState, useEffect } from "react";
import { getSalary } from "../lib/salaryData";
import { supabase } from "../lib/supabaseClient";

const PersonnelViewModal = ({
  isOpen,
  onClose,
  employee,
  onViewHistory,
}) => {
  const [creditHistory, setCreditHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && employee?.id) {
      fetchCreditHistory();
    }
  }, [isOpen, employee?.id]);

  const fetchCreditHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("leave_credit_entries")
        .select("*")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCreditHistory(data || []);
    } catch (err) {
      console.error("Error fetching credit history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !employee) return null;


  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      ></div>
      <div className="relative z-[1000] w-full max-w-[700px] max-h-[90vh] overflow-y-auto bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300">
        <div className="p-6 md:p-8">
          {/* Header Profile */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8 pb-6 border-b border-border-subtle">
            <img
              src={
                employee.photoUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.lastName + " " + employee.firstName)}&background=random&color=fff&bold=true`
              }
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-4 border-surface shadow-md"
            />
            <div className="flex-1 pr-10">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-text-main text-[24px] font-extrabold tracking-tight">
                  {[
                    employee.lastName,
                    employee.firstName,
                    employee.middleName,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </h2>
                <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-surface-alt text-accent border border-accent/30">
                  {employee.employeeNo}
                </span>
              </div>
              <p className="text-text-muted text-[15px] font-medium">
                {employee.position} • {employee.gender}
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-surface-alt text-text-muted hover:text-text-main hover:bg-surface-hover rounded-full transition-colors border border-border-subtle"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Detail Sections */}
          <div className="flex flex-col gap-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-text-main text-[14px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <i className="fas fa-user-circle text-accent opacity-80"></i>{" "}
                Personal Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-alt/50 p-5 rounded-[16px] border border-border-subtle">
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Birthdate
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {new Date(employee.birthdate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Age
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {(() => {
                      const birth = new Date(employee.birthdate);
                      const now = new Date();
                      let age = now.getFullYear() - birth.getFullYear();
                      const m = now.getMonth() - birth.getMonth();
                      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                        age--;
                      }
                      return age;
                    })()} Years Old
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Civil Status
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.civilStatus}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Contact Number
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.contactNo || "-"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Edu Email
                  </span>
                  <span className="text-text-main font-semibold text-[13px] break-all">
                    {employee.eduEmail || "-"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Personal Email
                  </span>
                  <span className="text-text-main font-semibold text-[13px] break-all">
                    {employee.personalEmail || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Leave Balances */}
            <div>
              <h3 className="text-text-main text-[14px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <i className="fas fa-calendar-check text-emerald-500 opacity-80"></i>{" "}
                Leave Balances
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-[16px] flex flex-col items-center text-center">
                  <span className="text-text-placeholder block text-[10px] uppercase tracking-widest font-black mb-1">
                    Local Leave
                  </span>
                  <span className="text-emerald-500 font-black text-[24px] leading-none">
                    {Number(employee.localLeaveBalance || 0)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500/60 mt-1 uppercase tracking-tighter">Days Available</span>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-[16px] flex flex-col items-center text-center">
                  <span className="text-text-placeholder block text-[10px] uppercase tracking-widest font-black mb-1">
                    D.O. Leave
                  </span>
                  <span className="text-blue-500 font-black text-[24px] leading-none">
                    {Number(employee.doLeaveBalance || 0)}
                  </span>
                  <span className="text-[10px] font-bold text-blue-500/60 mt-1 uppercase tracking-tighter">Days Available</span>
                </div>
              </div>
            </div>

            {/* Leave Credit History Ledger */}
            <div>
              <h3 className="text-text-main text-[14px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <i className="fas fa-history text-accent opacity-80"></i>{" "}
                Leave Credit History
              </h3>
              <div className="bg-surface-alt/50 border border-border-subtle rounded-[16px] p-4 flex flex-col gap-3">
                {loadingHistory ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[12px] text-text-muted font-medium">Loading credit ledger...</span>
                  </div>
                ) : creditHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <i className="fas fa-folder-open text-text-placeholder text-2xl mb-2 opacity-30"></i>
                    <p className="text-[13px] font-semibold text-text-muted">No credit entries found</p>
                    <p className="text-[11px] text-text-placeholder">Initial balances were assigned during account onboarding.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {creditHistory.map((entry) => {
                      const isLocal = entry.leave_type === "local";
                      const dateAdded = new Date(entry.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const startDateStr = new Date(entry.start_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const endDateStr = new Date(entry.end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                      return (
                        <div
                          key={entry.id}
                          className="flex items-start sm:items-center justify-between p-3 bg-surface border border-border-subtle rounded-xl shadow-sm hover:border-accent/20 transition-all gap-2"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            {/* Type Indicator */}
                            <div
                              className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 sm:mt-0 ${
                                isLocal ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                              title={isLocal ? "Local Leave Credit" : "D.O. Leave Credit"}
                            />
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                    isLocal
                                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                      : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                  }`}>
                                    {isLocal ? "Local Leave" : "D.O. Leave"}
                                  </span>
                                  <span className="text-[12px] font-bold text-text-main tracking-tight">
                                    via {entry.source_type === "service_credit"
                                      ? "Service Credits"
                                      : entry.source_type === "event"
                                      ? "Event"
                                      : "Other"}
                                  </span>
                                  {entry.source_desc && (
                                    <span className="text-[11px] text-text-muted bg-surface-alt border border-border-subtle px-1.5 py-0.5 rounded font-medium">
                                      {entry.source_desc}
                                    </span>
                                  )}
                                </div>
                              <div className="text-[11px] text-text-placeholder font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                                <i className="far fa-calendar-alt opacity-70"></i>
                                <span>
                                  {startDateStr} — {endDateStr}
                                </span>
                                <span className="opacity-40">•</span>
                                <span>Added on {dateAdded}</span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[15px] font-black shrink-0 ${
                              isLocal ? "text-emerald-500" : "text-blue-500"
                            }`}
                          >
                            +{Number(entry.amount_days)} d
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-text-main text-[14px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <i className="fas fa-briefcase text-icon-cyan opacity-80"></i>{" "}
                Employment Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-alt/50 p-5 rounded-[16px] border border-border-subtle">
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Employee ID
                  </span>
                  <span className="text-accent font-bold text-[13px]">
                    {employee.employeeNo}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Category
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.personnelCategory}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    School Level
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.schoolLevel}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Department
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.department}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Position
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.position}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Salary Grade
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.salaryGrade}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Step
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.step}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Monthly Base Salary
                  </span>
                  <span className="text-green-500 font-bold text-[15px]">
                    {getSalary(employee.salaryGrade, employee.step)}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Appointment Date
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {new Date(employee.originalAppointmentDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Last Promotion
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.lastPromotionDate
                      ? new Date(employee.lastPromotionDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Government IDs */}
            <div>
              <h3 className="text-text-main text-[14px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <i className="fas fa-id-card text-icon-pink opacity-80"></i>{" "}
                Government & Bank IDs
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-surface-alt/50 p-5 rounded-[16px] border border-border-subtle">
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    BP Number
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.bpNo || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    PhilHealth
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.philhealthNo || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Pag-IBIG
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.pagibigNo || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    TIN
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.tin || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Item No.
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-text-main font-semibold text-[13px] break-all">
                      {employee.itemNo || "-"}
                    </span>
                    {employee.itemNo && (
                      <button
                        onClick={() => onViewHistory(employee.itemNo)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-black transition-all duration-200 border border-accent/20"
                        title="View Assignment History"
                      >
                        <i className="fas fa-history"></i> History
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    Bank Account
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.bankAccountNo || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    PRC License No.
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.prcNumber || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-text-placeholder block text-[11px] uppercase tracking-wider mb-1">
                    PRC Expiration
                  </span>
                  <span className="text-text-main font-semibold text-[13px]">
                    {employee.prcExpiration ? new Date(employee.prcExpiration).toLocaleDateString() : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="pt-6 border-t border-border-subtle mt-4">
              <p className="text-[10px] text-text-placeholder font-medium flex items-center gap-2">
                <i className="fas fa-info-circle opacity-50"></i>
                Record created on {new Date(employee.createdAt).toLocaleString()} • System Reference ID: {employee.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelViewModal;
