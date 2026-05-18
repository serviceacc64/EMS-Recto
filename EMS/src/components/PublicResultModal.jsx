import React, { useState } from "react";
import { getSalary } from "../lib/salaryData";

const PublicResultModal = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState("employment");

  if (!isOpen || !data) return null;

  const { personnel } = data;

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not Specified";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      ></div>
      <div className="relative z-[1000] w-full max-w-[520px] max-h-[90vh] flex flex-col bg-surface border border-border-subtle rounded-[28px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300 overflow-hidden">

        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-border-subtle shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-border-subtle flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {personnel.photo_url ? (
                  <img src={personnel.photo_url} alt="Personnel" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-text-placeholder text-2xl"></i>
                )}
              </div>
              <div>
                <h2 className="text-text-main text-[20px] font-black leading-tight">
                  {personnel.first_name} {personnel.last_name}
                </h2>
                <p className="text-text-muted text-[12px] font-bold uppercase tracking-wider mt-0.5">
                  ID No: {personnel.employee_no}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-text-placeholder hover:text-text-main transition-colors rounded-lg hover:bg-surface-alt"
            >
              <i className="fas fa-times text-md"></i>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-6 pt-3 pb-1 gap-2 shrink-0 bg-surface-alt/20">
          <button
            onClick={() => setActiveTab("employment")}
            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-[14px] transition-all flex items-center justify-center gap-2 border ${activeTab === "employment"
              ? "bg-accent text-accent-text border-accent shadow-md shadow-accent/10"
              : "bg-surface border-border-subtle text-text-muted hover:text-text-main"
              }`}
          >
            <i className="fas fa-briefcase"></i>
            <span>Employment</span>
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-[14px] transition-all flex items-center justify-center gap-2 border ${activeTab === "personal"
              ? "bg-accent text-accent-text border-accent shadow-md shadow-accent/10"
              : "bg-surface border-border-subtle text-text-muted hover:text-text-main"
              }`}
          >
            <i className="fas fa-id-card"></i>
            <span>Personal & Contact</span>
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === "employment" ? (
            /* Employment Tab Content */
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-id-badge text-accent/80"></i> Position
                  </p>
                  <p className="text-text-main text-[14px] font-black leading-snug">{personnel.position || "Not Specified"}</p>
                </div>
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-building text-accent/80"></i> Department
                  </p>
                  <p className="text-text-main text-[14px] font-black leading-snug">{personnel.department || "Not Specified"}</p>
                </div>
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-user-tag text-accent/80"></i> Category
                  </p>
                  <p className="text-text-main text-[14px] font-black leading-snug">{personnel.personnel_category || "Not Specified"}</p>
                </div>
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-graduation-cap text-accent/80"></i> School Level
                  </p>
                  <p className="text-text-main text-[14px] font-black leading-snug">{personnel.school_level || "Not Specified"}</p>
                </div>
              </div>

              <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <i className="fas fa-hashtag text-accent/80"></i>Item Number
                </p>
                <p className="text-text-main text-[14px] font-black tracking-wider">{personnel.item_no || "Not Specified"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-layer-group text-accent/80"></i> Salary Grade & Step
                  </p>
                  <p className="text-text-main text-[14px] font-black">
                    {personnel.salary_grade && personnel.step ? `${personnel.salary_grade} / Step ${personnel.step}` : "Not Specified"}
                  </p>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-[18px]">
                  <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-money-bill-wave"></i> Monthly Salary
                  </p>
                  <p className="text-emerald-500 text-[14px] font-black leading-snug">
                    {getSalary(personnel.salary_grade, personnel.step)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-calendar-alt text-accent/80"></i> Original Appointment
                  </p>
                  <p className="text-text-main text-[13px] font-black">{formatDate(personnel.original_appointment_date)}</p>
                </div>
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-calendar-check text-accent/80"></i> Last Promotion
                  </p>
                  <p className="text-text-main text-[13px] font-black">{formatDate(personnel.last_promotion_date)}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Personal & Contact Tab Content */
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-venus-mars text-accent/80"></i> Gender
                  </p>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider inline-block mt-0.5 ${personnel.gender === "Male" ? "text-icon-cyan bg-icon-cyan/10" :
                    personnel.gender === "Female" ? "text-icon-pink bg-icon-pink/10" :
                      "text-text-muted bg-surface-alt"
                    }`}>
                    {personnel.gender || "Not Specified"}
                  </span>
                </div>
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px] col-span-2">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-birthday-cake text-accent/80"></i> Birthdate
                  </p>
                  <p className="text-text-main text-[14px] font-black leading-snug">{formatDate(personnel.birthdate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-heart text-accent/80"></i> Civil Status
                  </p>
                  <p className="text-text-main text-[14px] font-black leading-snug">{personnel.civil_status || "Not Specified"}</p>
                </div>
                <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                  <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-phone text-accent/80"></i> Contact No.
                  </p>
                  <p className="text-text-main text-[14px] font-black tracking-tight leading-snug">{personnel.contact_no || "Not Specified"}</p>
                </div>
              </div>

              <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <i className="fas fa-envelope-open text-accent/80"></i> DepEd Email (Educational)
                </p>
                <p className="text-text-main text-[13px] font-black truncate tracking-wide mt-0.5">{personnel.edu_email || "Not Specified"}</p>
              </div>

              <div className="bg-surface-alt/40 border border-border-subtle p-4 rounded-[18px]">
                <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <i className="fas fa-envelope text-accent/80"></i> Personal Email Address
                </p>
                <p className="text-text-main text-[13px] font-black truncate tracking-wide mt-0.5">{personnel.personal_email || "Not Specified"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Notice */}
        <div className="p-4 bg-surface-alt/25 border-t border-border-subtle text-center shrink-0">
          <p className="text-text-placeholder text-[10px] font-bold leading-normal m-0">
            Information shown is for official inquiry purposes only.<br />
            Contact Human Resources for record corrections or official requests.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicResultModal;

