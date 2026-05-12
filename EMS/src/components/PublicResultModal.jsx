import React from "react";

const PublicResultModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const { personnel, leaves } = data;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      ></div>
      <div className="relative z-[1000] w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300 custom-scrollbar">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border-subtle flex items-center justify-center overflow-hidden">
                {personnel.photo_url ? (
                  <img src={personnel.photo_url} alt="Personnel" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-text-placeholder text-2xl"></i>
                )}
              </div>
              <div>
                <h2 className="text-text-main text-[22px] font-black leading-tight">
                  {personnel.first_name} {personnel.last_name}
                </h2>
                <p className="text-text-muted text-[13px] font-bold uppercase tracking-wider">
                  {personnel.employee_no}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-placeholder hover:text-text-main transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* Professional Details */}
          <div className="grid grid-cols-2 gap-4 mb-8 bg-surface-alt/50 border border-border-subtle p-5 rounded-[20px]">
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Position</p>
              <p className="text-text-main text-[14px] font-bold">{personnel.position}</p>
            </div>
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Department</p>
              <p className="text-text-main text-[14px] font-bold">{personnel.department}</p>
            </div>
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Category</p>
              <p className="text-text-main text-[14px] font-bold">{personnel.personnel_category}</p>
            </div>
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">School Level</p>
              <p className="text-text-main text-[14px] font-bold">{personnel.school_level}</p>
            </div>
          </div>

          {/* Leave Status */}
          <div>
            <h3 className="text-text-main text-[15px] font-black mb-4 flex items-center gap-2">
              <i className="fas fa-calendar-check text-accent"></i> Recent Leave Applications
            </h3>
            
            {leaves.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border-subtle rounded-[20px]">
                <p className="text-text-placeholder text-[13px] font-medium">No leave applications found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {leaves.map((leave, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-surface border border-border-subtle rounded-[16px] hover:border-accent/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] ${
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
                      <div>
                        <p className="text-text-main text-[13px] font-bold">{leave.leave_type}</p>
                        <p className="text-text-placeholder text-[10px] font-medium">
                          {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
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

          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <p className="text-text-placeholder text-[11px] font-medium">
              Information shown is for inquiry purposes only. Contact HR for full record access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicResultModal;
