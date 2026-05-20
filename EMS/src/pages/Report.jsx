import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSalary, getRawSalary, useSalaryTable } from "../lib/salaryData";

const Report = () => {
  useSalaryTable();
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    position: "All",
    step: "All",
    gender: "All",
    salaryGrade: "All",
    civilStatus: "All",
    tenure: "All",
    department: "All",
    personnelCategory: "All",
    schoolLevel: "All",
  });

  const [selectedPositionDetails, setSelectedPositionDetails] = useState(null);
  const [selectedIntegrityField, setSelectedIntegrityField] = useState(null);
  const [selectedEmployeeForQuickView, setSelectedEmployeeForQuickView] =
    useState(null);
  const [showAllIntegrity, setShowAllIntegrity] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);

  // Get unique positions from employees
  const uniquePositions = useMemo(() => {
    const positions = employees.map((emp) => emp.position).filter(Boolean);
    const unique = [...new Set(positions)].sort();
    return ["All", ...unique];
  }, [employees]);

  const uniqueSteps = useMemo(() => {
    const steps = employees.map((emp) => emp.step).filter(Boolean);
    const unique = [...new Set(steps)].sort(
      (a, b) => parseInt(a) - parseInt(b),
    );
    return ["All", ...unique];
  }, [employees]);

  const uniqueDepartments = useMemo(() => {
    const depts = employees.map((emp) => emp.department).filter(Boolean);
    const unique = [...new Set(depts)].sort();
    return ["All", ...unique];
  }, [employees]);

  const uniqueLevels = useMemo(() => {
    const lvls = employees.map((emp) => emp.school_level).filter(Boolean);
    const unique = [...new Set(lvls)].sort();
    return ["All", ...unique];
  }, [employees]);

  const uniqueCategories = useMemo(() => {
    const cats = employees.map((emp) => emp.personnel_category).filter(Boolean);
    const unique = [...new Set(cats)].sort();
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
      
      // Fetch Leave Data
      const { data: leaveData } = await supabase
        .from("leave_applications")
        .select("*, employees(department, position, school_level)");
      setLeaves(leaveData || []);
    }
    setIsLoading(false);
  };

  // 1. Filtering Logic
  const filteredData = useMemo(() => {
    return employees.filter((emp) => {
      // Position Filter
      if (
        filters.position !== "All" &&
        (emp.position || "Unspecified") !== filters.position
      ) {
        return false;
      }

      // Step Filter
      if (filters.step !== "All" && String(emp.step || "") !== filters.step) {
        return false;
      }

      // Gender Filter
      if (
        filters.gender !== "All" &&
        (emp.gender || "Unspecified") !== filters.gender
      ) {
        return false;
      }

      // Salary Grade Filter
      if (
        filters.salaryGrade !== "All" &&
        `SG ${String(emp.salary_grade || "").replace(/[^0-9]/g, "").trim()}` !==
          filters.salaryGrade
      )
        return false;

      // Civil Status Filter
      if (
        filters.civilStatus !== "All" &&
        (emp.civil_status || "Unspecified") !== filters.civilStatus
      )
        return false;

      // Tenure Filter
      if (filters.tenure !== "All") {
        const apptDate = new Date(emp.original_appointment_date);
        const years = (new Date() - apptDate) / (1000 * 60 * 60 * 24 * 365.25);
        let bucket = "21+ yrs";
        if (years <= 5) bucket = "0-5 yrs";
        else if (years <= 10) bucket = "6-10 yrs";
        else if (years <= 15) bucket = "11-15 yrs";
        else if (years <= 20) bucket = "16-20 yrs";

        if (bucket !== filters.tenure) return false;
      }

      // Department Filter
      if (
        filters.department !== "All" &&
        (emp.department || "Unspecified") !== filters.department
      ) {
        return false;
      }

      // Personnel Category Filter
      if (
        filters.personnelCategory !== "All" &&
        (emp.personnel_category || "Unspecified") !== filters.personnelCategory
      ) {
        return false;
      }

      // School Level Filter
      if (
        filters.schoolLevel !== "All" &&
        (emp.school_level || "Unspecified") !== filters.schoolLevel
      ) {
        return false;
      }

      return true;
    });
  }, [employees, filters]);

  // 2. Metrics Calculation Engine
  const metrics = useMemo(() => {
    if (filteredData.length === 0) return null;

    // A. Tenure Calculation
    const tenureBuckets = {
      "0-5 yrs": 0,
      "6-10 yrs": 0,
      "11-15 yrs": 0,
      "16-20 yrs": 0,
      "21+ yrs": 0,
    };
    const now = new Date();

    // B. Integrity Audit
    const integrityFields = [
      "photo_url",
      "philhealth_no",
      "tin",
      "pagibig_no",
      "contact_no",
      "bp_no",
      "bank_account_no",
      "item_no",
      "original_appointment_date",
      "birthdate",
      "civil_status",
      "prc_number",
      "prc_expiration",
    ];
    const integrityScores = {};
    integrityFields.forEach((f) => {
      integrityScores[f] = 0;
    });

    // C. Position Distribution
    const posCounts = {};

    // D. Civil Status Distribution
    const civilStatusCounts = {};

    // E. Salary Grade Distribution
    const sgCounts = {};

    filteredData.forEach((emp) => {
      // Tenure
      const apptDate = new Date(emp.original_appointment_date);
      const years = (now - apptDate) / (1000 * 60 * 60 * 24 * 365.25);
      if (years <= 5) tenureBuckets["0-5 yrs"]++;
      else if (years <= 10) tenureBuckets["6-10 yrs"]++;
      else if (years <= 15) tenureBuckets["11-15 yrs"]++;
      else if (years <= 20) tenureBuckets["16-20 yrs"]++;
      else tenureBuckets["21+ yrs"]++;

      // Integrity
      integrityFields.forEach((field) => {
        if (emp[field]) {
          integrityScores[field]++;
        }
      });

      // Civil Status
      const status = emp.civil_status || "Unspecified";
      civilStatusCounts[status] = (civilStatusCounts[status] || 0) + 1;

      // Salary Grade
      const rawSg = String(emp.salary_grade || "").replace(/[^0-9]/g, "").trim();
      const sg = rawSg ? `SG ${rawSg}` : "N/A";
      sgCounts[sg] = (sgCounts[sg] || 0) + 1;

      // Positions
      const pos = emp.position || "Unassigned";
      posCounts[pos] = (posCounts[pos] || 0) + 1;
    });

    const totalPossible = filteredData.length * integrityFields.length;
    const actualTotal = Object.values(integrityScores).reduce(
      (a, b) => a + b,
      0,
    );
    integrityScores.overall = Math.round((actualTotal / totalPossible) * 100);

    return {
      tenure: Object.entries(tenureBuckets).map(([name, count]) => ({
        name,
        count,
      })),
      integrity: integrityScores,
      positions: Object.entries(posCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name, count })),
      civilStatus: Object.entries(civilStatusCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
      salaryGrades: Object.entries(sgCounts)
        .sort((a, b) => {
          const numA = parseInt(a[0].replace("SG ", "")) || 0;
          const numB = parseInt(b[0].replace("SG ", "")) || 0;
          return numA - numB;
        })
        .map(([name, count]) => ({ name, count })),
      total: filteredData.length,

      // --- New Advanced Metrics ---
      
      // F. Salary Forecasting
      salary: (() => {
        let totalMonthly = 0;
        const brackets = { "Below 30k": 0, "30k-40k": 0, "40k-50k": 0, "Over 50k": 0 };
        
        filteredData.forEach(emp => {
          const rawValue = getRawSalary(emp.salary_grade, emp.step);
          const salaryNum = Number(rawValue) || 0;
          totalMonthly += salaryNum;
          
          if (salaryNum > 0 && salaryNum < 30000) {
            brackets["Below 30k"]++;
          } else if (salaryNum >= 30000 && salaryNum < 40000) {
            brackets["30k-40k"]++;
          } else if (salaryNum >= 40000 && salaryNum < 50000) {
            brackets["40k-50k"]++;
          } else if (salaryNum >= 50000) {
            brackets["Over 50k"]++;
          } else {
            // This catches 0 or NaN
            brackets["Below 30k"]++; 
          }
        });
        
        return {
          totalMonthly,
          brackets: Object.entries(brackets).map(([name, count]) => ({ name, count }))
        };
      })(),

      // G. Leave Utilization
      leave: (() => {
        const filteredEmpIds = new Set(filteredData.map(e => e.id));
        const filteredLeaves = leaves.filter(l => filteredEmpIds.has(l.employee_id));
        
        const typeCounts = {};
        const monthlyTrends = Array(12).fill(0);
        
        filteredLeaves.forEach(l => {
          typeCounts[l.type_of_leave] = (typeCounts[l.type_of_leave] || 0) + 1;
          const month = new Date(l.date_of_filing).getMonth();
          monthlyTrends[month]++;
        });
        
        return {
          total: filteredLeaves.length,
          types: Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count })),
          trends: monthlyTrends.map((count, i) => ({ 
            month: new Date(0, i).toLocaleString('default', { month: 'short' }), 
            count 
          }))
        };
      })(),

      // H. Career Velocity
      career: (() => {
        let totalVelocity = 0;
        let countWithPromotion = 0;
        let stagnantCount = 0;
        const now = new Date();

        filteredData.forEach(emp => {
          if (emp.original_appointment_date && emp.last_promotion_date) {
            const start = new Date(emp.original_appointment_date);
            const last = new Date(emp.last_promotion_date);
            const years = (last - start) / (1000 * 60 * 60 * 24 * 365.25);
            if (years > 0) {
              totalVelocity += years;
              countWithPromotion++;
            }
          }
          
          // Stagnancy check (no promotion in 5 years)
          const baseDate = emp.last_promotion_date || emp.original_appointment_date;
          if (baseDate) {
            const yearsSince = (now - new Date(baseDate)) / (1000 * 60 * 60 * 24 * 365.25);
            if (yearsSince >= 5) stagnantCount++;
          }
        });

        return {
          avgYearsToPromote: countWithPromotion > 0 ? (totalVelocity / countWithPromotion).toFixed(1) : "N/A",
          stagnantCount,
          stagnantPercent: filteredData.length > 0 ? Math.round((stagnantCount / filteredData.length) * 100) : 0
        };
      })()
    };
  }, [filteredData, leaves]);

  // 3. Export to Styled Excel Logic (SpreadsheetML)
  const downloadExcel = () => {
    if (!filteredData.length) return;

    // 1. Define Headers
    const headers = [
      "No.",
      "EMPLOYEE NO",
      "LAST NAME",
      "FIRST NAME",
      "MIDDLE NAME",
      "BP NO",
      "PHILHEALTH NO",
      "PAGIBIG NO",
      "BANK ACCOUNT NO",
      "ITEM NUMBER",
      "TIN",
      "PRC NUMBER",
      "PRC EXPIRATION",
      "GENDER",
      "BIRTHDATE",
      "DATE OF ORIGINAL APPOINTMENT",
      "DATE OF LAST PROMOTION",
      "POSITION",
      "SALARY GRADE",
      "STEP",
      "BASE SALARY",
      "CIVIL STATUS",
      "CONTACT NUMBER",
      "DEPARTMENT",
      "PERSONNEL CATEGORY",
      "SCHOOL LEVEL",
    ];

    // 2. Format Dates Helper
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    // 3. Build XML String
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:Horizontal="Left" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000" ss:Bold="1"/>
   <Interior ss:Color="#F4F4F4" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Workforce Report">
  <Table ss:DefaultRowHeight="25">
    <Column ss:Width="30"/> 
    <Column ss:Width="100" ss:Span="20"/>
    
    <Row ss:Height="35" ss:StyleID="Header">
      ${headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("")}
    </Row>`;

    // 4. Add Rows
    filteredData.forEach((emp, index) => {
      xml += `
    <Row ss:Height="30">
      <Cell><Data ss:Type="Number">${index + 1}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.employee_no || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.last_name || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.first_name || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.middle_name || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.bp_no || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.philhealth_no || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.pagibig_no || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.bank_account_no || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.item_no || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.tin || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.prc_number || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${formatDate(emp.prc_expiration)}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.gender || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${formatDate(emp.birthdate)}</Data></Cell>
      <Cell><Data ss:Type="String">${formatDate(emp.original_appointment_date)}</Data></Cell>
      <Cell><Data ss:Type="String">${formatDate(emp.last_promotion_date)}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.position || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.salary_grade || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.step || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${getSalary(emp.salary_grade, emp.step)}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.civil_status || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.contact_no || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.department || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.personnel_category || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.school_level || ""}</Data></Cell>
    </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    // 5. Download
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Workforce_Report_${new Date().toISOString().split("T")[0]}.xls`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SkeletonAnalytics = () => (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Filters Skeleton */}
      <div className="bg-surface border border-border-subtle p-6 rounded-[32px] h-[160px]"></div>
      
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-surface border border-border-subtle p-6 rounded-[28px] h-[140px]"></div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface border border-border-subtle p-8 rounded-[32px] h-[400px]"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-border-subtle p-6 rounded-[28px] h-[300px]"></div>
            <div className="bg-surface border border-border-subtle p-6 rounded-[28px] h-[300px]"></div>
          </div>
        </div>
        <div className="bg-surface border border-border-subtle p-8 rounded-[32px] h-full min-h-[600px]"></div>
      </div>
    </div>
  );

  if (isLoading) return <SkeletonAnalytics />;

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      {/* 1. Premium Filter Bar */}
      <div className="bg-surface/80 backdrop-blur-xl border border-border-subtle p-8 rounded-[32px] shadow-sm glass-panel overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-accent/10 transition-colors duration-700"></div>
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/10">
              <i className="fas fa-chart-pie text-sm"></i>
            </div>
            <div>
              <h2 className="text-text-main font-black text-lg tracking-tight m-0 uppercase">Analytics Engine</h2>
              <p className="text-text-placeholder text-[10px] font-black uppercase tracking-widest mt-0.5 opacity-60">Intelligence Hub</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-6 px-6 py-3 bg-surface-alt/50 border border-border-subtle rounded-2xl">
              <div className="text-center">
                <div className="text-text-main font-black text-lg leading-none">{filteredData.length}</div>
                <div className="text-[9px] text-text-placeholder font-black uppercase tracking-widest mt-1">Sample Size</div>
              </div>
              <div className="w-px h-8 bg-border-subtle"></div>
              <div className="text-center">
                <div className="text-accent font-black text-lg leading-none">{metrics?.integrity.overall}%</div>
                <div className="text-[9px] text-text-placeholder font-black uppercase tracking-widest mt-1">Data Health</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilters({
                  position: "All", step: "All", gender: "All", salaryGrade: "All",
                  civilStatus: "All", tenure: "All", department: "All",
                  personnelCategory: "All", schoolLevel: "All",
                })}
                className="w-12 h-12 rounded-2xl border border-border-subtle bg-surface-alt flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-all group/reset"
                title="Reset Filters"
              >
                <i className="fas fa-undo-alt text-sm group-hover:-rotate-45 transition-transform"></i>
              </button>
              
              <button
                onClick={() => setShowExportPreview(true)}
                disabled={!filteredData.length}
                className="flex items-center gap-3 px-6 py-3.5 bg-accent text-accent-text rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 border border-accent/20"
              >
                <i className="fas fa-file-export"></i>
                <span>Generate Insight Report</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 relative z-10">
          {[
            { label: "Position", key: "position", options: uniquePositions },
            { label: "Salary Step", key: "step", options: uniqueSteps },
            { label: "Gender", key: "gender", options: ["All", "Male", "Female"] },
            { label: "Category", key: "personnelCategory", options: uniqueCategories },
            { label: "School Level", key: "schoolLevel", options: uniqueLevels },
          ].map((f) => (
            <div key={f.key} className="space-y-2">
              <label className="text-[9px] font-black text-text-placeholder uppercase tracking-[0.2em] pl-1 opacity-70">
                {f.label}
              </label>
              <div className="relative group/select">
                <select
                  value={filters[f.key]}
                  onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
                  className="w-full bg-surface-alt/50 border border-border-subtle text-text-main text-[11px] font-black uppercase tracking-wider rounded-xl pl-4 pr-10 py-3.5 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all appearance-none cursor-pointer hover:border-accent/20"
                >
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-placeholder pointer-events-none group-focus-within/select:text-accent transition-colors">
                  <i className="fas fa-chevron-down text-[10px]"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Visualizations Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Position Distribution - Bento Refined */}
            <div className="bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <i className="fas fa-user-tag"></i>
                  </div>
                  <h3 className="text-text-main font-black text-sm uppercase tracking-widest m-0">Position Distribution</h3>
                </div>
                <div className="text-[10px] font-black text-text-placeholder uppercase tracking-widest opacity-60">Top 6 Positions</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.positions.map((pos, i) => (
                  <div
                    key={pos.name}
                    onClick={() => setSelectedPositionDetails(pos)}
                    className="group/item flex items-center justify-between p-5 bg-surface-alt/40 border border-border-subtle rounded-2xl hover:bg-surface-alt hover:border-accent/30 hover:scale-[1.02] transition-all cursor-pointer stagger-item"
                    style={{"--delay": `${i * 0.1}s`}}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-text-muted font-black border border-border-subtle group-hover/item:border-accent/20 group-hover/item:text-accent transition-colors">
                        {i + 1}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-text-main font-black text-[13px] truncate uppercase tracking-tight group-hover/item:text-accent transition-colors">
                          {pos.name}
                        </div>
                        <div className="text-[10px] text-text-placeholder font-bold uppercase tracking-widest mt-0.5 opacity-60">
                          Personnel Class
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-text-main font-black text-lg leading-none">{pos.count}</div>
                      <div className="text-[9px] text-accent font-black uppercase tracking-widest mt-1">
                        {Math.round((pos.count / metrics.total) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Salary Brackets */}
               <div className="bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <i className="fas fa-wallet"></i>
                  </div>
                  <h3 className="text-text-main font-black text-sm uppercase tracking-widest m-0">Salary Density</h3>
                </div>
                
                <div className="space-y-5">
                  {metrics.salary.brackets.map((b, i) => (
                    <div key={b.name} className="space-y-2 stagger-item" style={{"--delay": `${i * 0.1}s`}}>
                      <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black text-text-main uppercase tracking-widest">{b.name}</span>
                        <span className="text-[12px] font-black text-accent">{b.count} Personnel</span>
                      </div>
                      <div className="h-2 w-full bg-surface-alt rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent/40 to-accent rounded-full transition-all duration-1000"
                          style={{ width: `${(b.count / metrics.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tenure Distribution */}
              <div className="bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <i className="fas fa-history"></i>
                  </div>
                  <h3 className="text-text-main font-black text-sm uppercase tracking-widest m-0">Retention & Tenure</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {metrics.tenure.map((t, i) => (
                    <div key={t.name} className="p-4 bg-surface-alt/40 border border-border-subtle rounded-2xl flex flex-col items-center justify-center text-center group/tenure hover:border-purple-500/30 transition-all stagger-item" style={{"--delay": `${i * 0.1}s`}}>
                       <div className="text-[9px] font-black text-text-placeholder uppercase tracking-widest mb-2 opacity-60">{t.name}</div>
                       <div className="text-xl font-black text-text-main group-hover/tenure:text-purple-400 transition-colors">{t.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Integrity Audit & Health - PREMIUM Bento Sidebar */}
          <div className="space-y-8">
            <div className="bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <h3 className="text-text-main font-black text-sm uppercase tracking-widest m-0">Integrity Audit</h3>
                </div>
                <button 
                  onClick={() => setShowAllIntegrity(!showAllIntegrity)}
                  className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
                >
                  {showAllIntegrity ? "Collapse" : "View All"}
                </button>
              </div>

              {/* Overall Health Meter */}
              <div className="mb-10 text-center relative z-10">
                 <div className="inline-flex items-center justify-center p-6 rounded-full bg-surface-alt/50 border-4 border-surface shadow-inner mb-4">
                    <div className="text-4xl font-black text-text-main tracking-tighter">
                      {metrics.integrity.overall}<span className="text-xl text-accent">%</span>
                    </div>
                 </div>
                 <p className="text-[11px] font-black text-text-placeholder uppercase tracking-[0.2em] opacity-60">Profile Completeness Index</p>
                 <div className="mt-6 h-1.5 w-full bg-surface-alt rounded-full overflow-hidden border border-border-subtle/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${metrics.integrity.overall > 80 ? 'bg-emerald-500' : metrics.integrity.overall > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${metrics.integrity.overall}%` }}
                    ></div>
                 </div>
              </div>

              <div className="space-y-4 relative z-10">
                {Object.entries(metrics.integrity)
                  .filter(([key]) => key !== "overall")
                  .slice(0, showAllIntegrity ? 12 : 6)
                  .map(([field, count], i) => {
                    const percent = Math.round((count / metrics.total) * 100);
                    return (
                      <div
                        key={field}
                        onClick={() => setSelectedIntegrityField({ field, count })}
                        className="flex items-center justify-between p-4 bg-surface-alt/40 border border-border-subtle rounded-2xl hover:bg-surface-alt hover:border-accent/30 transition-all cursor-pointer group/audit stagger-item"
                        style={{"--delay": `${i * 0.05}s`}}
                      >
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${percent > 90 ? 'bg-emerald-500' : percent > 70 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                           <span className="text-[10px] font-black text-text-main uppercase tracking-widest truncate max-w-[120px]">
                             {field.replace("_url", "").replace("_no", "").replace("_date", "").replace(/_/g, " ")}
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[11px] font-black text-text-placeholder">{count}/{metrics.total}</span>
                           <i className="fas fa-chevron-right text-[8px] text-text-placeholder group-hover/audit:translate-x-1 transition-transform"></i>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Quick Analytics Summary */}
            <div className="bg-surface-alt border border-border-subtle p-8 rounded-[32px] space-y-6">
              <h4 className="text-[11px] font-black text-text-placeholder uppercase tracking-[0.2em] opacity-60">Workforce Snapshot</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-text-muted">Avg Promotion Cycle</span>
                  <span className="text-sm font-black text-text-main">{metrics.career.avgYearsToPromote} yrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-text-muted">Stagnation Alert</span>
                  <span className="text-sm font-black text-red-400">{metrics.career.stagnantPercent}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-text-muted">Total Payroll Cap</span>
                  <span className="text-sm font-black text-emerald-400">₱{metrics.salary.totalMonthly.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Overlays */}
      {/* 4. Drill-down Modal (Position/Integrity) */}
      {(selectedPositionDetails || selectedIntegrityField) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
            onClick={() => {
              setSelectedPositionDetails(null);
              setSelectedIntegrityField(null);
            }}
          ></div>
          <div className="bg-surface border border-border-subtle w-full max-w-xl rounded-[32px] shadow-2xl z-[201] overflow-hidden flex flex-col animate-[slideIn_0.4s_ease-out]">
            <div className="p-6 border-b border-border-subtle bg-surface-alt flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent text-accent-text flex items-center justify-center text-xl shadow-lg shadow-accent/20">
                  <i
                    className={`fas ${selectedIntegrityField ? "fa-clipboard-check" : "fa-briefcase"}`}
                  ></i>
                </div>
                <div>
                  <h3 className="text-text-main font-bold m-0 text-sm uppercase tracking-tight">
                    {selectedIntegrityField
                      ? `Incomplete: ${selectedIntegrityField.field.replace("_url", "").replace("_no", "").replace("_date", "").replace(/_/g, " ")}`
                      : selectedPositionDetails.name}
                  </h3>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest m-0">
                    {selectedIntegrityField
                      ? `${metrics.total - selectedIntegrityField.count} Personnel Missing Data`
                      : `${selectedPositionDetails.count} Personnel Assigned`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPositionDetails(null);
                  setSelectedIntegrityField(null);
                }}
                className="w-10 h-10 rounded-full hover:bg-surface-alt transition-colors flex items-center justify-center text-text-muted"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-4 flex flex-col gap-3">
              {(selectedIntegrityField
                ? filteredData.filter(
                    (emp) => !emp[selectedIntegrityField.field],
                  )
                : filteredData.filter(
                    (emp) => (emp.position || "Unassigned") === selectedPositionDetails.name,
                  )
              ).map((emp, i) => (
                <div
                  key={i}
                  className="bg-surface-alt/50 border border-border-subtle p-4 rounded-2xl flex items-center justify-between group hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-xs font-bold text-accent shadow-sm overflow-hidden">
                      {emp.photo_url ? (
                        <img
                          src={emp.photo_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {emp.last_name?.[0]}
                          {emp.first_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-text-main text-[14px] font-bold m-0">
                          {emp.last_name}, {emp.first_name}
                        </p>
                        {selectedIntegrityField && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded font-bold uppercase">
                            Missing
                          </span>
                        )}
                      </div>
                      <p className="text-text-muted text-[11px] font-medium m-0 uppercase tracking-tight">
                        {emp.position} • SG {emp.salary_grade}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEmployeeForQuickView(emp)}
                    className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-accent border border-border-subtle hover:bg-accent hover:text-accent-text transition-all shadow-sm"
                    title="Quick View Details"
                  >
                    <i className="fas fa-arrow-right text-xs"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="p-6 bg-surface-alt border-t border-border-subtle flex justify-end">
              <button
                onClick={() => {
                  setSelectedPositionDetails(null);
                  setSelectedIntegrityField(null);
                }}
                className="bg-accent text-accent-text px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.5 Quick View Profile Modal */}
      {selectedEmployeeForQuickView && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
            onClick={() => setSelectedEmployeeForQuickView(null)}
          ></div>
          <div className="bg-surface border border-border-subtle w-full max-w-2xl rounded-[32px] shadow-2xl z-[301] overflow-hidden flex flex-col animate-[slideIn_0.4s_ease-out]">
            {/* Modal Header/Branding */}
            <div className="relative h-24 bg-gradient-to-r from-accent to-accent-hover">
              <button
                onClick={() => setSelectedEmployeeForQuickView(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all z-10"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="absolute -bottom-12 left-8 p-1 bg-surface border-4 border-surface rounded-[28px] shadow-xl">
                <div className="w-24 h-24 rounded-[24px] bg-surface-alt overflow-hidden flex items-center justify-center text-2xl font-black text-accent border border-border-subtle">
                  {selectedEmployeeForQuickView.photo_url ? (
                    <img
                      src={selectedEmployeeForQuickView.photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {selectedEmployeeForQuickView.last_name?.[0]}
                      {selectedEmployeeForQuickView.first_name?.[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-16 px-8 pb-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-text-main m-0 leading-tight">
                    {selectedEmployeeForQuickView.last_name},{" "}
                    {selectedEmployeeForQuickView.first_name}{" "}
                    {selectedEmployeeForQuickView.middle_name}
                  </h2>
                  <p className="text-accent font-bold uppercase tracking-widest text-xs mt-1">
                    {selectedEmployeeForQuickView.position} •{" "}
                    {selectedEmployeeForQuickView.employee_no}
                  </p>
                </div>
                <div className="px-4 py-2 bg-surface-alt border border-border-subtle rounded-xl text-center">
                  <p className="text-[10px] font-bold text-text-placeholder uppercase m-0">
                    Salary Grade
                  </p>
                  <p className="text-text-main font-black m-0 leading-tight">
                    SG {selectedEmployeeForQuickView.salary_grade}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-alt/50 border border-border-subtle rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <i className="fas fa-id-card text-accent text-xs"></i>
                    <span className="text-[10px] font-black text-text-placeholder uppercase tracking-widest">
                      Job Details
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[11px] font-bold text-text-muted">
                        Year Level:
                      </span>
                      <span className="text-[11px] font-black text-text-main">
                        {selectedEmployeeForQuickView.school_level || "---"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] font-bold text-text-muted">
                        Department:
                      </span>
                      <span className="text-[11px] font-black text-text-main">
                        {selectedEmployeeForQuickView.department || "---"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] font-bold text-text-muted">
                        Category:
                      </span>
                      <span className="text-[11px] font-black text-text-main">
                        {selectedEmployeeForQuickView.personnel_category ||
                          "---"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-surface-alt/50 border border-border-subtle rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <i className="fas fa-user-tag text-accent text-xs"></i>
                    <span className="text-[10px] font-black text-text-placeholder uppercase tracking-widest">
                      Personal Info
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[11px] font-bold text-text-muted">
                        Gender:
                      </span>
                      <span className="text-[11px] font-black text-text-main">
                        {selectedEmployeeForQuickView.gender}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] font-bold text-text-muted">
                        Civil Status:
                      </span>
                      <span className="text-[11px] font-black text-text-main">
                        {selectedEmployeeForQuickView.civil_status || "---"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] font-bold text-text-muted">
                        Contact:
                      </span>
                      <span className="text-[11px] font-black text-text-main">
                        {selectedEmployeeForQuickView.contact_no || "---"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setSelectedEmployeeForQuickView(null)}
                  className="flex-1 py-3 bg-surface-alt border border-border-subtle text-text-main font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-surface transition-all active:scale-95"
                >
                  Close Profile
                </button>
                <a
                  href={`/employee?id=${selectedEmployeeForQuickView.employee_no}&action=view`}
                  className="flex-1 py-3 bg-accent text-accent-text font-black text-[11px] uppercase tracking-widest rounded-xl text-center shadow-lg shadow-accent/20 hover:scale-105 transition-all active:scale-95"
                >
                  Go to Management
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 5. Export Preview Modal */}
      {showExportPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
            onClick={() => setShowExportPreview(false)}
          ></div>
          <div className="bg-surface border border-border-subtle w-full max-w-7xl max-h-[90vh] rounded-[40px] shadow-2xl z-[201] overflow-hidden flex flex-col animate-[slideIn_0.4s_ease-out]">
            {/* Header */}
            <div className="p-8 border-b border-border-subtle bg-surface-alt flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center text-2xl shadow-inner">
                  <i className="fas fa-file-export"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-text-main tracking-tight m-0">
                    Export Preview
                  </h2>
                  <p className="text-text-muted text-sm font-medium m-0 mt-1">
                    Reviewing{" "}
                    <span className="text-accent font-bold">
                      {filteredData.length}
                    </span>{" "}
                    records for professional report generation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportPreview(false)}
                className="w-12 h-12 rounded-full hover:bg-surface-alt transition-colors flex items-center justify-center text-text-muted hover:text-red-500"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto p-2 bg-base/50">
              <div className="min-w-[2000px] p-6">
                <table className="w-full border-separate border-spacing-0 text-left">
                  <thead>
                    <tr>
                      {[
                        "No.",
                        "EMPLOYEE NO",
                        "LAST NAME",
                        "FIRST NAME",
                        "MIDDLE NAME",
                        "BP NO",
                        "PHILHEALTH NO",
                        "PAGIBIG NO",
                        "BANK ACCOUNT NO",
                        "ITEM NUMBER",
                        "TIN",
                        "GENDER",
                        "BIRTHDATE",
                        "APPOINTMENT",
                        "PROMOTION",
                        "POSITION",
                        "SG",
                        "STEP",
                        "BASE SALARY",
                        "CIVIL STATUS",
                        "CONTACT",
                        "DEPARTMENT",
                        "CATEGORY",
                        "LEVEL",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="bg-surface border-y border-r first:border-l border-border-subtle p-4 text-[10px] font-black text-text-muted uppercase tracking-widest sticky top-0 z-10"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((emp, idx) => (
                      <tr
                        key={idx}
                        className="group hover:bg-accent/5 transition-colors"
                      >
                        <td className="border-b border-r border-l border-border-subtle p-4 text-xs font-bold text-accent bg-surface-alt/30 group-hover:bg-accent/10">
                          {idx + 1}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-main">
                          {emp.employee_no}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-bold text-text-main">
                          {emp.last_name}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-main">
                          {emp.first_name}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-muted italic">
                          {emp.middle_name || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-[10px] font-mono text-text-muted">
                          {emp.bp_no || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-[10px] font-mono text-text-muted">
                          {emp.philhealth_no || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-[10px] font-mono text-text-muted">
                          {emp.pagibig_no || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-[10px] font-mono text-text-muted">
                          {emp.bank_account_no || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-[10px] font-mono text-text-muted">
                          {emp.item_no || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-[10px] font-mono text-text-muted">
                          {emp.tin || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-bold text-text-main">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] ${emp.gender === "Female" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"}`}
                          >
                            {emp.gender}
                          </span>
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-muted">
                          {emp.birthdate
                            ? new Date(emp.birthdate).toLocaleDateString()
                            : "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-muted">
                          {emp.original_appointment_date
                            ? new Date(
                                emp.original_appointment_date,
                              ).toLocaleDateString()
                            : "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-muted italic">
                          {emp.last_promotion_date
                            ? new Date(
                                emp.last_promotion_date,
                              ).toLocaleDateString()
                            : "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-bold text-accent">
                          {emp.position}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-black text-text-main">
                          {emp.salary_grade}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-main">
                          {emp.step}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-bold text-green-500">
                          {getSalary(emp.salary_grade, emp.step)}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-main">
                          {emp.civil_status}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-[10px] font-mono text-text-muted">
                          {emp.contact_no || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-main">
                          {emp.department || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-main">
                          {emp.personnel_category || "---"}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-main">
                          {emp.school_level || "---"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-surface-alt border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-text-muted text-sm font-medium">
                <i className="fas fa-info-circle text-accent"></i>
                <span>
                  Data will be exported as a styled <b>.xls</b> file with custom
                  row spacing.
                </span>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => setShowExportPreview(false)}
                  className="flex-1 md:flex-none px-8 py-4 rounded-2xl text-sm font-black text-text-muted border border-border-subtle hover:bg-surface transition-all active:scale-95"
                >
                  Back to Filters
                </button>
                <button
                  onClick={() => {
                    downloadExcel();
                    setShowExportPreview(false);
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-accent text-accent-text px-10 py-4 rounded-2xl text-sm font-black shadow-xl shadow-accent/20 hover:scale-105 hover:shadow-accent/40 active:scale-95 transition-all animate-pulse hover:animate-none"
                >
                  <i className="fas fa-file-excel"></i>
                  <span>Confirm & Download Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
