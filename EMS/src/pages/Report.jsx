import React from 'react';

const Report = () => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8 p-6 md:p-8 bg-surface border border-border-subtle rounded-[20px] shadow-sm transition-colors duration-300">
        <div>
          <span className="inline-flex mb-2 text-accent text-[12px] font-extrabold uppercase tracking-widest">Analytics</span>
          <h1 className="text-text-main text-[28px] md:text-[32px] font-extrabold leading-tight tracking-tight m-0">Reports & Analytics</h1>
        </div>
        <span className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-text-main text-[13px] font-bold border border-border-subtle rounded-full bg-surface-alt shadow-sm">
          <i className="fas fa-chart-line text-accent text-[13px]"></i> Data insights
        </span>
      </div>
      <div className="bg-surface border border-border-subtle rounded-[20px] p-6 md:p-8 shadow-sm min-h-[400px] flex items-center justify-center transition-colors duration-300">
         <div className="text-center">
           <i className="fas fa-chart-pie text-[48px] text-text-placeholder opacity-30 mb-4 drop-shadow-sm"></i>
           <p className="text-text-muted text-[18px] font-medium m-0">Analytics module coming soon...</p>
         </div>
      </div>
    </div>
  );
};

export default Report;
