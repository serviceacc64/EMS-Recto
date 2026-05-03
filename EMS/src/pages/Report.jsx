import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

const Report = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters State
  const [filters, setFilters] = useState({
    position: "All",
    step: "All",
    gender: "All"
  });

  const [selectedPositionDetails, setSelectedPositionDetails] = useState(null);
  const [showAllIntegrity, setShowAllIntegrity] = useState(false);

  // Get unique positions from employees
  const uniquePositions = useMemo(() => {
    const positions = employees.map(emp => emp.position).filter(Boolean);
    const unique = [...new Set(positions)].sort();
    return ["All", ...unique];
  }, [employees]);

  const uniqueSteps = useMemo(() => {
    const steps = employees.map(emp => emp.step).filter(Boolean);
    const unique = [...new Set(steps)].sort((a, b) => parseInt(a) - parseInt(b));
    return ["All", ...unique];
  }, [employees]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching analytics data:", error);
    } else {
      setEmployees(data || []);
    }
    setIsLoading(false);
  };

  // 1. Filtering Logic
  const filteredData = useMemo(() => {
    return employees.filter(emp => {
      // Position Filter
      if (filters.position !== "All" && emp.position !== filters.position) return false;

      // Step Filter
      if (filters.step !== "All" && emp.step !== filters.step) return false;

      // Gender Filter
      if (filters.gender !== "All" && emp.gender !== filters.gender) return false;

      return true;
    });
  }, [employees, filters]);

  // 2. Metrics Calculation Engine
  const metrics = useMemo(() => {
    if (filteredData.length === 0) return null;

    // A. Tenure Calculation
    const tenureBuckets = { "0-5 yrs": 0, "6-10 yrs": 0, "11-15 yrs": 0, "16-20 yrs": 0, "21+ yrs": 0 };
    const now = new Date();
    
    // B. Integrity Audit
    const integrityFields = [
      "photo_url", "philhealth_no", "tin", "pagibig_no", 
      "contact_no", "bp_no", "bank_account_no", "item_no",
      "original_appointment_date", "birthdate", "civil_status"
    ];
    const integrityScores = {};
    integrityFields.forEach(f => {
      const key = f.replace("_url", "").replace("_no", "").replace("_date", "");
      integrityScores[key] = 0;
    });

    // C. Position Distribution
    const posCounts = {};

    filteredData.forEach(emp => {
      // Tenure
      const apptDate = new Date(emp.original_appointment_date);
      const years = (now - apptDate) / (1000 * 60 * 60 * 24 * 365.25);
      if (years <= 5) tenureBuckets["0-5 yrs"]++;
      else if (years <= 10) tenureBuckets["6-10 yrs"]++;
      else if (years <= 15) tenureBuckets["11-15 yrs"]++;
      else if (years <= 20) tenureBuckets["16-20 yrs"]++;
      else tenureBuckets["21+ yrs"]++;

      // Integrity
      integrityFields.forEach(field => {
        if (emp[field]) {
          const key = field.replace("_url", "").replace("_no", "").replace("_date", "");
          integrityScores[key]++;
        }
      });

      // Positions
      const pos = emp.position || "Unassigned";
      posCounts[pos] = (posCounts[pos] || 0) + 1;
    });

    const totalPossible = filteredData.length * integrityFields.length;
    const actualTotal = Object.values(integrityScores).reduce((a, b) => a + b, 0);
    integrityScores.overall = Math.round((actualTotal / totalPossible) * 100);

    return {
      tenure: Object.entries(tenureBuckets).map(([name, count]) => ({ name, count })),
      integrity: integrityScores,
      positions: Object.entries(posCounts).sort((a,b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count })),
      total: filteredData.length
    };
  }, [filteredData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.4s_ease-out]">
      {/* 1. Local Filter Bar */}
      <div className="bg-surface border border-border-subtle p-4 rounded-[24px] shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <i className="fas fa-filter text-accent text-sm"></i>
          <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Analytics Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-placeholder uppercase">Position:</span>
          <select 
            value={filters.position}
            onChange={(e) => setFilters({ ...filters, position: e.target.value })}
            className="bg-surface-alt border border-border-subtle text-text-main text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-accent w-48"
          >
            {uniquePositions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Step Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-placeholder uppercase">Salary Step:</span>
          <select 
            value={filters.step}
            onChange={(e) => setFilters({ ...filters, step: e.target.value })}
            className="bg-surface-alt border border-border-subtle text-text-main text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-accent"
          >
            {uniqueSteps.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Gender Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-placeholder uppercase">Gender:</span>
          <select 
            value={filters.gender}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            className="bg-surface-alt border border-border-subtle text-text-main text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-accent"
          >
            <option>All</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2 text-text-muted">
          <span className="text-xs font-bold">{filteredData.length} records shown</span>
          <button 
            onClick={() => setFilters({ position: "All", step: "All", gender: "All" })}
            className="text-[10px] uppercase font-black text-accent hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 2. Analytics Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* A. Tenure Chart */}
        <div className="lg:col-span-2 bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-text-main font-bold text-xl m-0 tracking-tight">Workforce Tenure</h3>
              <p className="text-text-muted text-sm font-medium m-0">Institutional memory distribution</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <i className="fas fa-history"></i>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-4 min-h-[240px] px-2">
            {metrics?.tenure.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex flex-col items-center">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-accent text-accent-text text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none">
                    {t.count} staff
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[50px] bg-gradient-to-t from-accent to-accent/60 rounded-t-xl transition-all duration-1000 ease-out shadow-lg shadow-accent/5 group-hover:scale-x-110 group-hover:to-accent/80"
                    style={{ height: `${(t.count / (Math.max(...metrics.tenure.map(x => x.count)) || 1)) * 200}px` }}
                  ></div>
                </div>
                <span className="mt-4 text-[10px] font-bold text-text-placeholder uppercase tracking-wider">{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* B. Data Integrity Audit */}
        <div className="lg:col-span-1 bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm flex flex-col items-center">
          <div className="w-full text-left mb-8">
            <h3 className="text-text-main font-bold text-xl m-0 tracking-tight">Profile Integrity</h3>
            <p className="text-text-muted text-sm font-medium m-0">Data completeness audit</p>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
             {/* Background Circle */}
             <svg className="w-full h-full -rotate-90">
               <circle cx="96" cy="96" r="88" stroke="var(--bg-surface-alt)" strokeWidth="12" fill="none" />
               <circle 
                cx="96" cy="96" r="88" 
                stroke="var(--accent-primary)" 
                strokeWidth="12" 
                fill="none" 
                strokeDasharray="552.9" 
                strokeDashoffset={552.9 - (552.9 * (metrics?.integrity.overall || 0)) / 100}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
               />
             </svg>
             <div className="absolute flex flex-col items-center">
               <span className="text-4xl font-black text-text-main">{metrics?.integrity.overall}%</span>
               <span className="text-[10px] font-bold text-text-placeholder uppercase tracking-widest">Health Score</span>
             </div>
          </div>

          <div className="w-full space-y-4">
            {[
              { label: "Photo", val: metrics?.integrity.photo },
              { label: "TIN", val: metrics?.integrity.tin },
              { label: "PhilHealth", val: metrics?.integrity.philhealth },
              { label: "Pag-IBIG", val: metrics?.integrity.pagibig },
              // Extended fields
              { label: "Contact No", val: metrics?.integrity.contact },
              { label: "BP Number", val: metrics?.integrity.bp },
              { label: "Bank Account", val: metrics?.integrity.bank_account },
              { label: "Item Number", val: metrics?.integrity.item },
              { label: "Appointment Date", val: metrics?.integrity.original_appointment },
              { label: "Birthdate", val: metrics?.integrity.birthdate },
              { label: "Civil Status", val: metrics?.integrity.civil_status }
            ].map((item, idx) => {
              if (!showAllIntegrity && idx >= 4) return null;
              return (
                <div key={idx} className="flex flex-col gap-1.5 animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-text-main">{item.label}</span>
                    <span className="text-accent">{Math.round((item.val / (metrics?.total || 1)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden border border-border-subtle">
                    <div 
                      className="h-full bg-accent transition-all duration-1000"
                      style={{ width: `${(item.val / (metrics?.total || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => setShowAllIntegrity(!showAllIntegrity)}
            className="mt-8 w-full py-3 bg-surface-alt border border-border-subtle rounded-xl text-[11px] font-bold text-text-muted hover:text-accent hover:border-accent/30 transition-all flex items-center justify-center gap-2 group"
          >
            <span>{showAllIntegrity ? "Show Less" : "View Full Audit Details"}</span>
            <i className={`fas fa-chevron-${showAllIntegrity ? 'up' : 'down'} text-[10px] group-hover:translate-y-0.5 transition-transform`}></i>
          </button>
        </div>

        {/* C. Position Hierarchy Breakdown */}
        <div className="lg:col-span-3 bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm">
           <div className="flex justify-between items-start mb-8">
             <div>
               <h3 className="text-text-main font-bold text-xl m-0 tracking-tight">Position Distribution</h3>
               <p className="text-text-muted text-sm font-medium m-0">Top organizational roles</p>
             </div>
             <div className="px-4 py-2 bg-surface-alt border border-border-subtle rounded-xl text-xs font-bold text-text-main">
               Total Personnel: {metrics?.total}
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {metrics?.positions.map((pos, i) => (
               <div key={i} className="flex items-center gap-4 bg-surface-alt/50 border border-border-subtle p-5 rounded-[24px] hover:border-accent/30 transition-all group">
                 <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center text-accent text-lg font-black shadow-sm group-hover:scale-110 transition-transform">
                   {pos.count}
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <p className="text-text-main font-bold text-sm truncate m-0 uppercase tracking-tight">{pos.name}</p>
                   <p className="text-text-placeholder text-[10px] font-bold m-0 uppercase tracking-wider">
                     {Math.round((pos.count / metrics.total) * 100)}% of filtered staff
                   </p>
                 </div>
                 <button 
                   onClick={() => setSelectedPositionDetails({
                     name: pos.name,
                     employees: filteredData.filter(e => e.position === pos.name)
                   })}
                   className="w-10 h-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-text-muted hover:bg-accent hover:text-accent-text transition-all shadow-sm"
                   title="View Employees"
                 >
                   <i className="fas fa-users-viewfinder text-sm"></i>
                 </button>
               </div>
             ))}
           </div>
        </div>

      </div>

      {/* 3. Position Detail Modal */}
      {selectedPositionDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" 
            onClick={() => setSelectedPositionDetails(null)}
          ></div>
          <div className="bg-surface border border-border-subtle w-full max-w-lg rounded-[32px] shadow-2xl z-[101] overflow-hidden animate-[slideIn_0.3s_ease-out]">
            <div className="p-6 border-b border-border-subtle bg-surface-alt flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <i className="fas fa-briefcase"></i>
                </div>
                <div>
                  <h3 className="text-text-main font-bold m-0 text-sm uppercase tracking-tight">
                    {selectedPositionDetails.name}
                  </h3>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest m-0">
                    {selectedPositionDetails.employees.length} Personnel Assigned
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPositionDetails(null)}
                className="w-10 h-10 rounded-full hover:bg-surface-alt transition-colors flex items-center justify-center text-text-muted"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-4 flex flex-col gap-3">
              {selectedPositionDetails.employees.map((emp, i) => (
                <div key={i} className="bg-surface-alt/50 border border-border-subtle p-4 rounded-2xl flex items-center justify-between group hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-xs font-bold text-accent shadow-sm">
                      {emp.last_name?.[0]}{emp.first_name?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-text-main text-[14px] font-bold m-0">
                          {emp.last_name}, {emp.first_name}
                        </p>
                        {(() => {
                          const missing = [];
                          if (!emp.photo_url) missing.push("Photo");
                          if (!emp.philhealth_no) missing.push("PhilHealth");
                          if (!emp.tin) missing.push("TIN");
                          if (!emp.pagibig_no) missing.push("Pag-IBIG");
                          
                          if (missing.length > 0) {
                            return (
                              <i 
                                className="fas fa-exclamation-circle text-red-500 text-[10px] animate-pulse cursor-help"
                                title={`Missing: ${missing.join(", ")}`}
                              ></i>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p className="text-text-muted text-[11px] font-medium m-0 uppercase tracking-tight">
                        SG {emp.salary_grade} • Step {emp.step}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={`/employee?id=${emp.employee_no}&action=view`} 
                    className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-accent border border-border-subtle hover:bg-accent hover:text-accent-text transition-all shadow-sm"
                    title="View Profile"
                  >
                    <i className="fas fa-arrow-right text-xs"></i>
                  </a>
                </div>
              ))}
            </div>

            <div className="p-6 bg-surface-alt border-t border-border-subtle flex justify-end">
              <button 
                onClick={() => setSelectedPositionDetails(null)}
                className="bg-accent text-accent-text px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
