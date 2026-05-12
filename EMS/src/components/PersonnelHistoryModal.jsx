import React from "react";

const PersonnelHistoryModal = ({ isOpen, onClose, history, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      ></div>
      <div className="relative z-[1003] w-full max-w-[460px] max-h-[80vh] bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface sticky top-0 z-10">
          <h2 className="text-text-main text-[20px] font-extrabold tracking-tight flex items-center gap-2">
            <i className="fas fa-history text-accent"></i> Item History
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-alt rounded-full transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-muted text-[14px] font-medium">Fetching timeline...</p>
            </div>
          ) : history.length === 0 || history[0]?.notFound ? (
            <div className="text-center py-12 text-text-muted bg-surface-alt/50 rounded-[20px] border border-dashed border-border-subtle">
              <i className="fas fa-ghost text-4xl mb-4 opacity-20"></i>
              <p className="text-[15px] font-semibold">No history found</p>
              <p className="text-[13px] opacity-70">This item hasn't been logged in the ledger yet.</p>
            </div>
          ) : (
            <div className="relative flex flex-col gap-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-subtle before:opacity-50">
              {history.map((entry, idx) => {
                const isCurrent = !entry.vacated_at;
                const startDate = new Date(entry.assigned_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' });
                const endDate = entry.vacated_at
                  ? new Date(entry.vacated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
                  : "Present";

                return (
                  <div key={idx} className="relative pl-12 group">
                    <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-surface z-10 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${isCurrent ? 'bg-accent text-white' : 'bg-surface-alt text-text-muted border-border-subtle'}`}>
                      <i className={`fas ${isCurrent ? 'fa-user-check' : 'fa-user-clock'} text-[14px]`}></i>
                    </div>

                    <div className={`p-4 rounded-[18px] border transition-all duration-300 ${isCurrent ? 'bg-accent/5 border-accent/20 shadow-sm' : 'bg-surface border-border-subtle hover:border-accent/30'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={entry.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.lastName + " " + entry.firstName)}&background=random&color=fff&bold=true`}
                          className="w-10 h-10 rounded-full object-cover border border-surface shadow-sm"
                          alt=""
                        />
                        <div>
                          <h4 className="text-text-main font-bold text-[14px] leading-tight">
                            {entry.deleted ? "Unknown Employee" : `${entry.lastName}, ${entry.firstName}`}
                          </h4>
                          <p className="text-text-muted text-[12px] font-medium">
                            {entry.deleted ? `ID: ${entry.employee_no}` : entry.position}
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="ml-auto bg-accent text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-text-muted text-[11px] font-bold bg-surface-alt/50 px-3 py-1.5 rounded-lg w-fit">
                        <i className="far fa-calendar-alt opacity-50"></i>
                        <span>{startDate} — {endDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonnelHistoryModal;
