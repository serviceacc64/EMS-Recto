import React, { useState } from "react";
import PublicLeaveFormModal from "./PublicLeaveFormModal";

const PublicResultModal = ({ isOpen, onClose, data }) => {
  const [isFilingOpen, setIsFilingOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  if (!isOpen || !data) return null;

  const { personnel, leaves } = data;

  const handleFilingSuccess = () => {
    setIsFilingOpen(false);
    setSubmissionSuccess(true);
    // Automatically reset success message after 5 seconds
    setTimeout(() => setSubmissionSuccess(false), 5000);
  };

  return (
    <>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
          onClick={onClose}
        ></div>
        <div className="relative z-[1000] w-full max-w-[500px] max-h-[90vh] flex flex-col bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300">
          <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border-subtle flex items-center justify-center overflow-hidden shrink-0">
                  {personnel.photo_url ? (
                    <img src={personnel.photo_url} alt="Personnel" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-user text-text-placeholder text-xl"></i>
                  )}
                </div>
                <div>
                  <h2 className="text-text-main text-[18px] font-black leading-tight">
                    {personnel.first_name} {personnel.last_name}
                  </h2>
                  <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider">
                    {personnel.employee_no}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-text-placeholder hover:text-text-main transition-colors"
              >
                <i className="fas fa-times text-md"></i>
              </button>
            </div>

            {submissionSuccess && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[18px] flex items-center gap-3 animate-[fadeIn_0.3s_ease]">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <i className="fas fa-check text-sm"></i>
                </div>
                <div>
                  <p className="text-emerald-500 text-[13px] font-bold m-0">Application Submitted!</p>
                  <p className="text-emerald-500/70 text-[11px] font-medium m-0">HR will review your request shortly.</p>
                </div>
              </div>
            )}

            {/* Professional Details - More compact grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-surface-alt/50 border border-border-subtle p-4 rounded-[18px]">
              <div>
                <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-0.5">Position</p>
                <p className="text-text-main text-[13px] font-bold truncate">{personnel.position}</p>
              </div>
              <div>
                <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-0.5">Department</p>
                <p className="text-text-main text-[13px] font-bold truncate">{personnel.department}</p>
              </div>
              <div>
                <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-0.5">Category</p>
                <p className="text-text-main text-[13px] font-bold truncate">{personnel.personnel_category}</p>
              </div>
              <div>
                <p className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-0.5">School Level</p>
                <p className="text-text-main text-[13px] font-bold truncate">{personnel.school_level}</p>
              </div>
            </div>
            
            {/* Leave Credits Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-text-main text-[14px] font-black flex items-center gap-2 m-0">
                  <i className="fas fa-wallet text-accent"></i> Current Leave Credits
                </h3>
                <button 
                  onClick={() => setIsFilingOpen(true)}
                  className="px-3 py-1.5 bg-accent text-accent-text text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-accent-hover hover:scale-105 transition-all shadow-sm flex items-center gap-2"
                >
                  <i className="fas fa-plus"></i> File for Leave
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-[20px] group hover:border-emerald-500/40 transition-all">
                  <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest mb-1">Local Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-text-main text-2xl font-black">{personnel.local_leave_balance || 0}</span>
                    <span className="text-text-placeholder text-[10px] font-bold">Days</span>
                  </div>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-[20px] group hover:border-blue-500/40 transition-all">
                  <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest mb-1">D.O. Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-text-main text-2xl font-black">{personnel.do_leave_balance || 0}</span>
                    <span className="text-text-placeholder text-[10px] font-bold">Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Status */}
            <div>
              <h3 className="text-text-main text-[14px] font-black mb-3 flex items-center gap-2">
                <i className="fas fa-calendar-check text-accent"></i> Recent Leave Status
              </h3>
              
              {leaves.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-border-subtle rounded-[18px]">
                  <p className="text-text-placeholder text-[12px] font-medium">No leave applications found.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {leaves.map((leave, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-surface border border-border-subtle rounded-[14px] hover:border-accent/30 transition-all group shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] ${
                          leave.status === 'Approved' ? 'bg-green-500/10 text-green-500' : 
                          leave.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-red-500/10 text-red-500'
                        }`}>
                          <i className={`fas ${
                            leave.status === 'Approved' ? 'fa-check' : 
                            leave.status === 'Pending' ? 'fa-clock' : 
                            'fa-times'
                          }`}></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-text-main text-[12px] font-bold truncate">{leave.leave_type}</p>
                          <p className="text-text-placeholder text-[9px] font-medium">
                            {new Date(leave.start_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        leave.status === 'Approved' ? 'bg-green-500 text-white' : 
                        leave.status === 'Pending' ? 'bg-amber-500 text-white' : 
                        'bg-red-500 text-white'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle text-center">
              <p className="text-text-placeholder text-[10px] font-medium leading-tight">
                Information shown is for inquiry purposes only.<br/>Contact HR for full record access.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Filing Modal */}
      <PublicLeaveFormModal 
        isOpen={isFilingOpen}
        onClose={() => setIsFilingOpen(false)}
        employee={personnel}
        onSuccess={handleFilingSuccess}
      />
    </>
  );
};

export default PublicResultModal;

