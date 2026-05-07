import React from "react";

const LeaveTracker = () => {
  return (
    <div className="flex flex-col gap-6 p-1 md:p-0 animate-[fadeIn_0.4s_ease-out]">

      {/* Empty State Placeholder */}
      <div className="flex flex-col items-center justify-center bg-surface border border-border-subtle rounded-[32px] p-16 shadow-sm text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-sm mb-2">
          <i className="fas fa-calendar-plus text-accent text-[28px]"></i>
        </div>
        <h2 className="text-text-main text-xl font-black m-0">
          No Leave Records Yet
        </h2>
        <p className="text-text-muted text-sm font-medium m-0 max-w-[360px]">
          Leave applications filed by personnel will appear here. Use the "File Leave Application" button to get started.
        </p>
      </div>
    </div>
  );
};

export default LeaveTracker;
