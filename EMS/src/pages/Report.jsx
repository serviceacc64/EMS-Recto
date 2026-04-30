import React from 'react';

const Report = () => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8 p-6 md:p-8 bg-white border border-[#e2e8f0] rounded-[20px] shadow-sm">
        <div>
          <span className="inline-flex mb-2 text-blue-600 text-[12px] font-extrabold uppercase tracking-widest">Analytics</span>
          <h1 className="text-[#0f172a] text-[28px] md:text-[32px] font-extrabold leading-tight tracking-tight m-0">Reports & Analytics</h1>
        </div>
        <span className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-[#0f172a] text-[13px] font-bold border border-[#e2e8f0] rounded-full bg-[#f8fafc] shadow-sm">
          <i className="fas fa-chart-line text-emerald-500 text-[13px]"></i> Data insights
        </span>
      </div>
      <div className="bg-white border border-[#e2e8f0] rounded-[20px] p-6 md:p-8 shadow-sm min-h-[400px] flex items-center justify-center">
         <div className="text-center">
           <i className="fas fa-chart-pie text-[48px] text-[#cbd5e1] mb-4"></i>
           <p className="text-[#64748b] text-[18px] font-medium m-0">Analytics module coming soon...</p>
         </div>
      </div>
    </div>
  );
};

export default Report;
