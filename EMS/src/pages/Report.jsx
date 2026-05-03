import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

const Report = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    position: "All",
    step: "All",
    gender: "All",
    salaryGrade: "All",
    civilStatus: "All",
    tenure: "All",
  });

  const [selectedPositionDetails, setSelectedPositionDetails] = useState(null);
  const [selectedIntegrityField, setSelectedIntegrityField] = useState(null);
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
        `SG ${String(emp.salary_grade || "").replace(/SG\s+/i, "")}` !==
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
    ];
    const integrityScores = {};
    integrityFields.forEach((f) => {
      const key = f.replace("_url", "").replace("_no", "").replace("_date", "");
      integrityScores[key] = 0;
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
          const key = field
            .replace("_url", "")
            .replace("_no", "")
            .replace("_date", "");
          integrityScores[key]++;
        }
      });

      // Civil Status
      const status = emp.civil_status || "Unspecified";
      civilStatusCounts[status] = (civilStatusCounts[status] || 0) + 1;

      // Salary Grade
      const rawSg = String(emp.salary_grade || "").replace(/SG\s+/i, "");
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
    };
  }, [filteredData]);

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
      "GENDER",
      "BIRTHDATE",
      "DATE OF ORIGINAL APPOINTMENT",
      "DATE OF LAST PROMOTION",
      "POSITION",
      "SALARY GRADE",
      "STEP",
      "CIVIL STATUS",
      "CONTACT NUMBER",
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
    <Column ss:Width="100" ss:Span="19"/>
    
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
      <Cell><Data ss:Type="String">${emp.gender || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${formatDate(emp.birthdate)}</Data></Cell>
      <Cell><Data ss:Type="String">${formatDate(emp.original_appointment_date)}</Data></Cell>
      <Cell><Data ss:Type="String">${formatDate(emp.last_promotion_date)}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.position || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.salary_grade || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.step || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.civil_status || ""}</Data></Cell>
      <Cell><Data ss:Type="String">${emp.contact_no || ""}</Data></Cell>
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
          <span className="text-text-muted text-xs font-bold uppercase tracking-wider">
            Analytics Filters:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-placeholder uppercase">
            Position:
          </span>
          <select
            value={filters.position}
            onChange={(e) =>
              setFilters({ ...filters, position: e.target.value })
            }
            className="bg-surface-alt border border-border-subtle text-text-main text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-accent w-48"
          >
            {uniquePositions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Step Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-placeholder uppercase">
            Salary Step:
          </span>
          <select
            value={filters.step}
            onChange={(e) => setFilters({ ...filters, step: e.target.value })}
            className="bg-surface-alt border border-border-subtle text-text-main text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-accent"
          >
            {uniqueSteps.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-placeholder uppercase">
            Gender:
          </span>
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

        <div className="ml-auto flex items-center gap-3 text-text-muted">
          {(filters.position !== "All" ||
            filters.salaryGrade !== "All" ||
            filters.civilStatus !== "All" ||
            filters.tenure !== "All" ||
            filters.step !== "All" ||
            filters.gender !== "All") && (
            <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full animate-[fadeIn_0.3s_ease-out]">
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">
                Filters Active
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
            </div>
          )}
          <span className="text-xs font-bold text-text-main">
            {filteredData.length} records shown
          </span>
          <button
            onClick={() =>
              setFilters({
                position: "All",
                step: "All",
                gender: "All",
                salaryGrade: "All",
                civilStatus: "All",
                tenure: "All",
              })
            }
            className="text-[10px] uppercase font-black text-accent hover:underline px-2 py-1"
          >
            Reset All
          </button>

          <div className="w-px h-4 bg-border-subtle mx-1"></div>

          <button
            onClick={() => setShowExportPreview(true)}
            disabled={!filteredData.length}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-subtle hover:border-accent/40 rounded-xl transition-all group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Preview and Export to Excel"
          >
            <i className="fas fa-file-excel text-accent text-xs group-hover:rotate-12 transition-transform"></i>
            <span className="text-[10px] font-black text-text-main uppercase tracking-widest">
              Export
            </span>
          </button>
        </div>
      </div>

      {/* 2. Analytics Bento Grid */}
      {!metrics ? (
        <div className="flex-1 min-h-[600px] bg-surface/50 border-2 border-dashed border-border-subtle rounded-[40px] flex flex-col items-center justify-center p-12 text-center animate-[fadeIn_0.5s_ease-out]">
          <div className="w-24 h-24 bg-surface-alt rounded-full flex items-center justify-center mb-6 shadow-xl border border-border-subtle group hover:border-accent/30 transition-all duration-500">
            <i className="fas fa-search-minus text-3xl text-text-placeholder group-hover:scale-110 group-hover:text-accent transition-all duration-500"></i>
          </div>
          <h2 className="text-2xl font-black text-text-main mb-2 tracking-tight">
            No Workforce Data Found
          </h2>
          <p className="text-text-muted max-w-sm mb-8 font-medium leading-relaxed">
            We couldn't find any personnel matching your current filter
            criteria. Try adjusting your position, step, or gender settings.
          </p>
          <button
            onClick={() =>
              setFilters({ position: "All", step: "All", gender: "All" })
            }
            className="flex items-center gap-3 bg-accent text-accent-text px-8 py-3 rounded-2xl font-black shadow-lg shadow-accent/20 hover:scale-105 hover:shadow-accent/40 active:scale-95 transition-all"
          >
            <i className="fas fa-rotate-left"></i>
            <span>Clear All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* A. Position Hierarchy Breakdown */}
          <div className="lg:col-span-2 bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-text-main font-bold text-xl m-0 tracking-tight">
                  Position Distribution
                </h3>
                <p className="text-text-muted text-sm font-medium m-0">
                  Top organizational roles
                </p>
              </div>
              <div className="px-4 py-2 bg-surface-alt border border-border-subtle rounded-xl text-xs font-bold text-text-main">
                Personnel: {metrics?.total}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics?.positions.map((pos, i) => {
                const colors = [
                  {
                    bg: "bg-indigo-500/10",
                    text: "text-indigo-400",
                    border: "hover:border-indigo-500/50",
                    glow: "shadow-indigo-500/20",
                  },
                  {
                    bg: "bg-rose-500/10",
                    text: "text-rose-400",
                    border: "hover:border-rose-500/50",
                    glow: "shadow-rose-500/20",
                  },
                  {
                    bg: "bg-amber-500/10",
                    text: "text-amber-400",
                    border: "hover:border-amber-500/50",
                    glow: "shadow-amber-500/20",
                  },
                  {
                    bg: "bg-emerald-500/10",
                    text: "text-emerald-400",
                    border: "hover:border-emerald-500/50",
                    glow: "shadow-emerald-500/20",
                  },
                  {
                    bg: "bg-sky-500/10",
                    text: "text-sky-400",
                    border: "hover:border-sky-500/50",
                    glow: "shadow-sky-500/20",
                  },
                  {
                    bg: "bg-violet-500/10",
                    text: "text-violet-400",
                    border: "hover:border-violet-500/50",
                    glow: "shadow-violet-500/20",
                  },
                ];
                const theme = colors[i % colors.length];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 bg-surface-alt/50 border border-border-subtle p-4 rounded-[24px] transition-all group cursor-pointer ${theme.border}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl ${theme.bg} flex items-center justify-center ${theme.text} text-sm font-black shadow-sm group-hover:scale-110 transition-transform shrink-0`}
                    >
                      {pos.count}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-text-main font-bold text-[13px] truncate m-0 uppercase tracking-tight">
                        {pos.name}
                      </p>
                      <p className="text-text-placeholder text-[9px] font-bold m-0 uppercase tracking-wider">
                        {Math.round((pos.count / metrics.total) * 100)}%
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPositionDetails({
                          name: pos.name,
                          employees: filteredData.filter(
                            (e) => e.position === pos.name,
                          ),
                        });
                      }}
                      className={`w-8 h-8 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-text-muted hover:bg-accent hover:text-accent-text transition-all shadow-sm`}
                    >
                      <i className="fas fa-users-viewfinder text-xs"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Data Integrity Audit */}
          <div className="lg:col-span-1 bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
            <div className="w-full text-left mb-8">
              <h3 className="text-text-main font-bold text-xl m-0 tracking-tight">
                Profile Integrity
              </h3>
              <p className="text-text-muted text-sm font-medium m-0">
                Data audit
              </p>
            </div>

            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  stroke="var(--bg-surface-alt)"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  stroke={
                    metrics?.integrity.overall > 90
                      ? "var(--accent-primary)"
                      : metrics?.integrity.overall > 70
                        ? "#fbbf24"
                        : "#ef4444"
                  }
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="452.4"
                  strokeDashoffset={
                    452.4 - (452.4 * (metrics?.integrity.overall || 0)) / 100
                  }
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span
                  className={`text-3xl font-black ${metrics?.integrity.overall > 90 ? "text-accent" : metrics?.integrity.overall > 70 ? "text-amber-400" : "text-rose-500"}`}
                >
                  {metrics?.integrity.overall}%
                </span>
                <span className="text-[9px] font-bold text-text-placeholder uppercase tracking-widest">
                  Health
                </span>
              </div>
            </div>

            <div className="w-full space-y-3">
              {[
                {
                  label: "Photo",
                  val: metrics?.integrity.photo,
                  field: "photo_url",
                },
                { label: "TIN", val: metrics?.integrity.tin, field: "tin" },
                {
                  label: "PhilHealth",
                  val: metrics?.integrity.philhealth,
                  field: "philhealth_no",
                },
                {
                  label: "Pag-IBIG",
                  val: metrics?.integrity.pagibig,
                  field: "pagibig_no",
                },
                {
                  label: "Contact No",
                  val: metrics?.integrity.contact,
                  field: "contact_no",
                },
                {
                  label: "BP Number",
                  val: metrics?.integrity.bp,
                  field: "bp_no",
                },
                {
                  label: "Bank Account",
                  val: metrics?.integrity.bank_account,
                  field: "bank_account_no",
                },
                {
                  label: "Item Number",
                  val: metrics?.integrity.item,
                  field: "item_no",
                },
                {
                  label: "Appointment Date",
                  val: metrics?.integrity.original_appointment,
                  field: "original_appointment_date",
                },
                {
                  label: "Birthdate",
                  val: metrics?.integrity.birthdate,
                  field: "birthdate",
                },
                {
                  label: "Civil Status",
                  val: metrics?.integrity.civil_status,
                  field: "civil_status",
                },
              ].map((item, idx) => {
                if (!showAllIntegrity && idx >= 4) return null;
                const percent = Math.round(
                  (item.val / (metrics?.total || 1)) * 100,
                );
                const colorClass =
                  percent > 90
                    ? "bg-accent"
                    : percent > 70
                      ? "bg-amber-400"
                      : "bg-rose-500";
                const textClass =
                  percent > 90
                    ? "text-accent"
                    : percent > 70
                      ? "text-amber-400"
                      : "text-rose-500";

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 cursor-pointer group/item"
                    onClick={() => setSelectedIntegrityField(item)}
                  >
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-text-main group-hover/item:text-accent transition-colors">
                        {item.label}
                      </span>
                      <span className={textClass}>{percent}%</span>
                    </div>
                    <div className="h-1 bg-surface-alt rounded-full overflow-hidden border border-border-subtle group-hover/item:border-accent/30 transition-all">
                      <div
                        className={`h-full transition-all duration-1000 ${colorClass}`}
                        style={{
                          width: `${percent}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowAllIntegrity(!showAllIntegrity)}
              className="mt-6 w-full py-2 bg-surface-alt border border-border-subtle rounded-xl text-[10px] font-bold text-text-muted hover:text-accent hover:border-accent/30 transition-all"
            >
              {showAllIntegrity ? "Less" : "Audit Details"}
            </button>
          </div>

          {/* C. Salary Grade Distribution (Full Width) */}
          <div className="lg:col-span-3 bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-accent/5 to-transparent"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-text-main font-bold text-xl m-0 tracking-tight">
                  Salary Grades
                </h3>
                <p className="text-text-muted text-sm font-medium m-0">
                  Grade distribution
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <i className="fas fa-money-bill-trend-up"></i>
              </div>
            </div>

            <div className="flex items-end gap-3 h-[180px] px-2 relative z-10">
              {metrics?.salaryGrades.map((sg, i) => (
                <div
                  key={i}
                  className={`flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer transition-all ${filters.salaryGrade === sg.name ? "scale-105" : "hover:scale-105 opacity-80 hover:opacity-100"}`}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      salaryGrade:
                        filters.salaryGrade === sg.name ? "All" : sg.name,
                    })
                  }
                >
                  <div
                    className={`absolute -top-8 opacity-0 group-hover:opacity-100 transition-all text-accent-text text-[10px] font-bold px-2 py-1 rounded ${filters.salaryGrade === sg.name ? "bg-accent opacity-100 shadow-lg" : "bg-text-placeholder"}`}
                  >
                    {sg.count}
                  </div>
                  <div
                    className={`w-full border border-border-subtle rounded-t-lg transition-all ${filters.salaryGrade === sg.name ? "bg-accent/20 border-accent" : "bg-surface-alt group-hover:bg-accent/10 group-hover:border-accent/30"}`}
                    style={{
                      height: `${(sg.count / Math.max(...metrics.salaryGrades.map((x) => x.count))) * 100}%`,
                    }}
                  >
                    <div
                      className={`w-full h-full rounded-t-lg transition-all ${filters.salaryGrade === sg.name ? "bg-gradient-to-t from-accent to-accent/60 shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.3)]" : "bg-accent/40 group-hover:bg-accent"}`}
                      style={{ height: "100%" }}
                    ></div>
                  </div>
                  <span
                    className={`mt-4 text-[10px] font-bold uppercase tracking-tighter text-center w-full transition-colors ${filters.salaryGrade === sg.name ? "text-accent" : "text-text-placeholder"}`}
                  >
                    {sg.name.replace("SG ", "")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* D. Civil Status Breakdown */}
          <div className="lg:col-span-1 bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-violet-500/5 blur-[40px] rounded-full -ml-12 -mt-12"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-text-main font-bold text-xl m-0 tracking-tight">
                  Civil Status
                </h3>
                <p className="text-text-muted text-sm font-medium m-0">
                  Marital status
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <i className="fas fa-heart"></i>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 justify-center relative z-10">
              {metrics?.civilStatus.map((status, i) => {
                const statusColors = [
                  {
                    text: "text-violet-400",
                    bar: "bg-violet-500",
                    bg: "bg-violet-500/10",
                    border: "border-violet-500/20",
                  },
                  {
                    text: "text-rose-400",
                    bar: "bg-rose-500",
                    bg: "bg-rose-500/10",
                    border: "border-rose-500/20",
                  },
                  {
                    text: "text-sky-400",
                    bar: "bg-sky-500",
                    bg: "bg-sky-500/10",
                    border: "border-sky-500/20",
                  },
                  {
                    text: "text-emerald-400",
                    bar: "bg-emerald-500",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                  },
                ];
                const theme = statusColors[i % statusColors.length];
                const isActive = filters.civilStatus === status.name;

                return (
                  <div
                    key={i}
                    className={`flex flex-col gap-1 cursor-pointer transition-all ${isActive ? "scale-[1.02]" : "hover:translate-x-1 opacity-80 hover:opacity-100"}`}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        civilStatus: isActive ? "All" : status.name,
                      })
                    }
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span
                        className={`uppercase tracking-tight transition-colors ${isActive ? theme.text : "text-text-main"}`}
                      >
                        {status.name}
                      </span>
                      <span className="text-text-muted">{status.count}</span>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden border transition-all ${isActive ? `${theme.bg} ${theme.border}` : "bg-surface-alt border-border-subtle"}`}
                    >
                      <div
                        className={`h-full transition-all duration-1000 ${isActive ? `${theme.bar} shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.3)]` : theme.bar}`}
                        style={{
                          width: `${(status.count / metrics.total) * 100}%`,
                          opacity: isActive ? 1 : 0.6,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* E. Workforce Tenure Chart */}
          <div className="lg:col-span-2 bg-surface border border-border-subtle p-8 rounded-[32px] shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full -mr-24 -mt-24"></div>
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <h3 className="text-text-main font-bold text-xl m-0 tracking-tight">
                  Workforce Tenure
                </h3>
                <p className="text-text-muted text-sm font-medium m-0">
                  Institutional memory
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <i className="fas fa-history"></i>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between gap-4 min-h-[160px] px-2 relative z-10">
              {metrics?.tenure.map((t, i) => {
                const isActive = filters.tenure === t.name;
                const tenureColors = [
                  "bg-sky-400",
                  "bg-teal-400",
                  "bg-emerald-400",
                  "bg-green-500",
                  "bg-lime-500",
                ];
                const barColor = tenureColors[i % tenureColors.length];

                return (
                  <div
                    key={i}
                    className={`flex-1 flex flex-col items-center group cursor-pointer transition-all ${isActive ? "scale-105" : "hover:scale-105 opacity-60 hover:opacity-100"}`}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        tenure: isActive ? "All" : t.name,
                      })
                    }
                  >
                    <div className="relative w-full flex flex-col items-center">
                      <div
                        className={`absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 text-accent-text text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none ${isActive ? "bg-accent opacity-100" : "bg-text-placeholder"}`}
                      >
                        {t.count}
                      </div>
                      <div
                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-1000 ease-out shadow-lg ${isActive ? `${barColor} shadow-emerald-500/40 opacity-100` : `${barColor} opacity-40 group-hover:opacity-100 shadow-emerald-500/5`}`}
                        style={{
                          height: `${(t.count / (Math.max(...metrics.tenure.map((x) => x.count)) || 1)) * 160}px`,
                        }}
                      ></div>
                    </div>
                    <span
                      className={`mt-4 text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? "text-emerald-400" : "text-text-placeholder"}`}
                    >
                      {t.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Detail Modal (Unified for Positions & Integrity) */}
      {(selectedPositionDetails || selectedIntegrityField) && metrics && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
            onClick={() => {
              setSelectedPositionDetails(null);
              setSelectedIntegrityField(null);
            }}
          ></div>
          <div className="bg-surface border border-border-subtle w-full max-w-lg rounded-[32px] shadow-2xl z-[101] overflow-hidden animate-[slideIn_0.3s_ease-out]">
            <div className="p-6 border-b border-border-subtle bg-surface-alt flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedIntegrityField ? "bg-red-500/10 text-red-500" : "bg-accent/10 text-accent"}`}
                >
                  <i
                    className={`fas ${selectedIntegrityField ? "fa-exclamation-triangle" : "fa-briefcase"}`}
                  ></i>
                </div>
                <div>
                  <h3 className="text-text-main font-bold m-0 text-sm uppercase tracking-tight">
                    {selectedIntegrityField
                      ? `Incomplete: ${selectedIntegrityField.label}`
                      : selectedPositionDetails.name}
                  </h3>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest m-0">
                    {selectedIntegrityField
                      ? `${metrics.total - selectedIntegrityField.val} Personnel Missing Data`
                      : `${selectedPositionDetails.employees.length} Personnel Assigned`}
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
                : selectedPositionDetails.employees
              ).map((emp, i) => (
                <div
                  key={i}
                  className="bg-surface-alt/50 border border-border-subtle p-4 rounded-2xl flex items-center justify-between group hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-xs font-bold text-accent shadow-sm">
                      {emp.last_name?.[0]}
                      {emp.first_name?.[0]}
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
                        "CIVIL STATUS",
                        "CONTACT",
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
                        <td className="border-b border-r border-border-subtle p-4 text-xs font-medium text-text-main">
                          {emp.civil_status}
                        </td>
                        <td className="border-b border-r border-border-subtle p-4 text-[10px] font-mono text-text-muted">
                          {emp.contact_no || "---"}
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
