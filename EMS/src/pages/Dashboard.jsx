import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, male: 0, female: 0 });

  useEffect(() => {
    const stored = localStorage.getItem('emsEmployees');
    if (stored) {
      try {
        const employees = JSON.parse(stored);
        if (Array.isArray(employees)) {
          const total = employees.length;
          const male = employees.filter(e => e.gender === 'Male').length;
          const female = employees.filter(e => e.gender === 'Female').length;
          setStats({ total, male, female });
        }
      } catch (e) {
        console.error('Failed to parse employees', e);
      }
    }
  }, []);

  return (
    <div className="flex flex-col p-2 md:p-0">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8 p-6 md:p-8 bg-surface border border-border-subtle rounded-[20px] shadow-sm transition-colors duration-300">
        <div>
          <span className="inline-flex mb-2 text-accent text-[12px] font-extrabold uppercase tracking-widest">Overview</span>
          <h1 className="text-text-main text-[28px] md:text-[32px] font-extrabold leading-tight tracking-tight m-0">Welcome to Dashboard</h1>
        </div>
        <span className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-text-main text-[13px] font-bold border border-border-subtle rounded-full bg-surface-alt shadow-sm">
          <i className="fas fa-circle text-accent text-[10px] animate-pulse"></i> System active
        </span>
      </div>

      <div className="grid gap-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="bg-surface border border-border-subtle rounded-[20px] p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-accent/50 group">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-text-muted text-[16px] font-bold tracking-tight m-0">Total Employees</h3>
              <span className="w-[52px] h-[52px] border border-border-subtle rounded-[16px] inline-flex items-center justify-center text-[20px] bg-surface-alt text-accent transition-transform duration-300 group-hover:scale-110">
                <i className="fas fa-users"></i>
              </span>
            </div>
            <p className="mt-6 text-[36px] md:text-[48px] font-extrabold leading-none text-text-main tracking-tight m-0">{stats.total}</p>
            <p className="mt-2 text-text-placeholder text-[14px] leading-relaxed font-medium m-0">Registered employee records</p>
          </article>

          <article className="bg-surface border border-border-subtle rounded-[20px] p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-icon-cyan/50 group">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-text-muted text-[16px] font-bold tracking-tight m-0">Male Employees</h3>
              <span className="w-[52px] h-[52px] border border-border-subtle rounded-[16px] inline-flex items-center justify-center text-[20px] bg-surface-alt text-icon-cyan transition-transform duration-300 group-hover:scale-110">
                <i className="fas fa-mars"></i>
              </span>
            </div>
            <p className="mt-6 text-[36px] md:text-[48px] font-extrabold leading-none text-text-main tracking-tight m-0">{stats.male}</p>
            <p className="mt-2 text-text-placeholder text-[14px] leading-relaxed font-medium m-0">Male employee profile count</p>
          </article>

          <article className="bg-surface border border-border-subtle rounded-[20px] p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-icon-pink/50 group">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-text-muted text-[16px] font-bold tracking-tight m-0">Female Employees</h3>
              <span className="w-[52px] h-[52px] border border-border-subtle rounded-[16px] inline-flex items-center justify-center text-[20px] bg-surface-alt text-icon-pink transition-transform duration-300 group-hover:scale-110">
                <i className="fas fa-venus"></i>
              </span>
            </div>
            <p className="mt-6 text-[36px] md:text-[48px] font-extrabold leading-none text-text-main tracking-tight m-0">{stats.female}</p>
            <p className="mt-2 text-text-placeholder text-[14px] leading-relaxed font-medium m-0">Female employee profile count</p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6">
          <article className="bg-surface border border-border-subtle rounded-[20px] p-6 md:p-8 shadow-sm transition-all duration-300 min-h-[320px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-text-main text-[20px] font-bold tracking-tight m-0">Recent Activity</h2>
                <p className="mt-1 text-text-muted text-[14px] font-medium m-0">Latest updates and administrative changes.</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-6 mt-8">
              <div className="flex items-start gap-4 pb-6 border-b border-border-subtle">
                <div className="w-10 h-10 rounded-full shrink-0 bg-surface-alt text-accent flex items-center justify-center text-sm border border-border-subtle">
                  <i className="fas fa-user-plus"></i>
                </div>
                <div className="flex-1">
                  <p className="text-text-main text-[15px] font-medium mb-1 m-0">Maria Santos was added to the employee list</p>
                  <span className="text-text-placeholder text-[13px] font-medium">10 minutes ago</span>
                </div>
              </div>

              <div className="flex items-start gap-4 pb-6 border-b border-border-subtle">
                <div className="w-10 h-10 rounded-full shrink-0 bg-surface-alt text-accent flex items-center justify-center text-sm border border-border-subtle">
                  <i className="fas fa-file-export"></i>
                </div>
                <div className="flex-1">
                  <p className="text-text-main text-[15px] font-medium mb-1 m-0">Attendance report was generated</p>
                  <span className="text-text-placeholder text-[13px] font-medium">35 minutes ago</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full shrink-0 bg-surface-alt text-accent flex items-center justify-center text-sm border border-border-subtle">
                  <i className="fas fa-umbrella-beach"></i>
                </div>
                <div className="flex-1">
                  <p className="text-text-main text-[15px] font-medium mb-1 m-0">7 employees are currently on leave</p>
                  <span className="text-text-placeholder text-[13px] font-medium">1 hour ago</span>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
