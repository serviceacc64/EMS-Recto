import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [allEmployees, setAllEmployees] = useState([]);
  const [filters, setFilters] = useState({
    department: "All Departments",
    category: "All Categories",
    schoolLevel: "All Levels"
  });
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    juniorHigh: 0,
    seniorHigh: 0,
    teaching: 0,
    nonTeaching: 0,
    completeProfiles: 0,
    salaryGrades: [],
    positions: [],
    departments: [],
    onLeaveToday: 0,
    pendingLeaves: 0,
    milestones: {
      birthdays: [],
      anniversaries: [],
    },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [leaveApplications, setLeaveApplications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const { data: employees, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching dashboard data:", error);
      setIsLoading(false);
      return;
    }

    if (employees) {
      setAllEmployees(employees);

      // Fetch Leave Data
      const { data: leaves } = await supabase
        .from("leave_applications")
        .select("*, employees(first_name, last_name, photo_url)")
        .order("created_at", { ascending: false });

      const currentLeaves = leaves || [];
      setLeaveApplications(currentLeaves);
      calculateStats(employees, filters, currentLeaves);
      setRecentActivity(employees.slice(0, 5));
    }
    setIsLoading(false);
  };

  const calculateStats = (employees, currentFilters, leaves = []) => {
    let filtered = [...employees];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate Leave Stats (Before filtering personnel, or based on all?)
    // Usually dashboard stats for "On Leave Today" should be global or follow filters?
    // Let's make them follow filters for consistency if possible, or global for high-level view.
    // High-level cards are usually global.
    const onLeaveToday = leaves.filter(l => {
      if (l.status !== "Approved") return false;
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      return today >= start && today <= end;
    }).length;

    const pendingLeaves = leaves.filter(l => l.status === "Pending").length;

    if (currentFilters.department !== "All Departments") {
      filtered = filtered.filter(e => e.department === currentFilters.department);
    }
    if (currentFilters.category !== "All Categories") {
      filtered = filtered.filter(e => e.personnel_category === currentFilters.category);
    }
    if (currentFilters.schoolLevel !== "All Levels") {
      filtered = filtered.filter(e => e.school_level === currentFilters.schoolLevel);
    }

    const total = filtered.length;
    const male = filtered.filter((e) => e.gender === "Male").length;
    const female = filtered.filter((e) => e.gender === "Female").length;

    // School Level Breakdown
    const juniorHigh = filtered.filter((e) => e.school_level === "Junior High").length;
    const seniorHigh = filtered.filter((e) => e.school_level === "Senior High").length;

    // Category Breakdown
    const teaching = filtered.filter((e) => e.personnel_category === "Teaching").length;
    const nonTeaching = filtered.filter((e) => e.personnel_category === "Non-Teaching").length;

    // Profile Completion Breakdown
    const completionFields = ['photo_url', 'philhealth_no', 'tin', 'pagibig_no', 'contact_no'];
    const completeProfiles = filtered.filter(e => {
      return completionFields.every(field => e[field]);
    }).length;

    // Positions Breakdown (Top 5)
    const positionCounts = {};
    filtered.forEach((e) => {
      const pos = e.position?.split(" ")[0] || "Unassigned";
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });
    const positions = Object.entries(positionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Salary Grade Distribution
    const sgCounts = {};
    filtered.forEach((e) => {
      const sg = e.salary_grade ? `SG ${e.salary_grade}` : "N/A";
      sgCounts[sg] = (sgCounts[sg] || 0) + 1;
    });
    const salaryGrades = Object.entries(sgCounts)
      .sort((a, b) => {
        const numA = parseInt(a[0].replace("SG ", "")) || 0;
        const numB = parseInt(b[0].replace("SG ", "")) || 0;
        return numA - numB;
      })
      .map(([name, count]) => ({ name, count }));

    // Department Distribution (New)
    const deptCounts = {};
    filtered.forEach((e) => {
      const dept = e.department || "Other";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const departments = Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Milestones (New)
    const currentMonth = today.getMonth();
    const birthdays = employees
      .filter(e => e.birthdate && new Date(e.birthdate).getMonth() === currentMonth)
      .slice(0, 5);

    const anniversaries = employees
      .filter(e => e.original_appointment_date && new Date(e.original_appointment_date).getMonth() === currentMonth)
      .map(e => {
        const years = today.getFullYear() - new Date(e.original_appointment_date).getFullYear();
        return { ...e, years };
      })
      .filter(e => e.years > 0)
      .sort((a, b) => b.years - a.years)
      .slice(0, 5);

    setStats({
      total,
      male,
      female,
      juniorHigh,
      seniorHigh,
      teaching,
      nonTeaching,
      completeProfiles,
      salaryGrades,
      positions,
      departments,
      onLeaveToday,
      pendingLeaves,
      milestones: {
        birthdays,
        anniversaries,
      }
    });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    calculateStats(allEmployees, newFilters);
  };

  const uniqueDepartments = [
    "All Departments",
    ...new Set(allEmployees.map((e) => e.department).filter(Boolean)),
  ].sort();

  const uniqueCategories = [
    "All Categories",
    "Teaching",
    "Non-Teaching"
  ];

  const uniqueLevels = [
    "All Levels",
    "Junior High",
    "Senior High"
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-1 md:p-0 animate-[fadeIn_0.4s_ease-out]">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "TOTAL PERSONNEL",
            value: stats.total,
            icon: "fas fa-users",
            color: "text-accent",
            bg: "bg-accent/10",
            sub: "Total Staff",
          },
          {
            label: "MALE PERSONNEL",
            value: stats.male,
            icon: "fas fa-mars",
            color: "text-icon-cyan",
            bg: "bg-icon-cyan/10",
            sub: `${stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 0}% of Total`,
          },
          {
            label: "FEMALE PERSONNEL",
            value: stats.female,
            icon: "fas fa-venus",
            color: "text-icon-pink",
            bg: "bg-icon-pink/10",
            sub: `${stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 0}% of Total`,
          },
          {
            label: "TEACHING STAFF",
            value: stats.teaching,
            icon: "fas fa-chalkboard",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            sub: "Faculty Members",
          },
          {
            label: "NON-TEACHING",
            value: stats.nonTeaching,
            icon: "fas fa-briefcase",
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            sub: "Support Staff",
          },
          {
            label: "COMPLETE PROFILES",
            value: stats.completeProfiles,
            icon: "fas fa-check-circle",
            color: "text-green-400",
            bg: "bg-green-500/10",
            sub: "100% Data Ready",
          },
          {
            label: "JUNIOR HIGH",
            value: stats.juniorHigh,
            icon: "fas fa-user-graduate",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            sub: "JHS Personnel",
          },
          {
            label: "SENIOR HIGH",
            value: stats.seniorHigh,
            icon: "fas fa-graduation-cap",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            sub: "SHS Personnel",
          },
          {
            label: "ON LEAVE TODAY",
            value: stats.onLeaveToday,
            icon: "fas fa-user-clock",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            sub: "Active Leaves",
          },
          {
            label: "PENDING LEAVES",
            value: stats.pendingLeaves,
            icon: "fas fa-clipboard-list",
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            sub: "Needs Review",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-surface border border-border-subtle p-5 rounded-[24px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 ${item.bg} ${item.color} border border-border-subtle transition-transform group-hover:scale-110`}
            >
              <i className={item.icon}></i>
            </div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">
              {item.label}
            </p>
            <h3 className="text-text-main text-2xl font-black mb-2">
              {item.value}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-alt border border-border-subtle text-text-placeholder">
                {item.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Salary Grade Distribution (Donut Chart) */}
        <div className="lg:col-span-1 bg-surface border border-border-subtle p-6 rounded-[32px] shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-text-main font-bold text-lg m-0">
                Salary Grades
              </h3>
              <p className="text-text-muted text-sm font-medium m-0">
                Hierarchy distribution
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            {/* CSS Donut Chart */}
            <div
              className="relative w-44 h-44 rounded-full flex items-center justify-center transition-transform hover:scale-105 duration-500 shadow-lg shadow-accent/5"
              style={{
                background: `conic-gradient(
                      var(--accent-primary) 0% ${(stats.salaryGrades[0]?.count / stats.total) * 100}%,
                      var(--icon-cyan) ${(stats.salaryGrades[0]?.count / stats.total) * 100}% ${((stats.salaryGrades[0]?.count + (stats.salaryGrades[1]?.count || 0)) / stats.total) * 100}%,
                      var(--icon-pink) ${((stats.salaryGrades[0]?.count + (stats.salaryGrades[1]?.count || 0)) / stats.total) * 100}% ${((stats.salaryGrades[0]?.count + (stats.salaryGrades[1]?.count || 0) + (stats.salaryGrades[2]?.count || 0)) / stats.total) * 100}%,
                      var(--border-subtle) ${((stats.salaryGrades[0]?.count + (stats.salaryGrades[1]?.count || 0) + (stats.salaryGrades[2]?.count || 0)) / stats.total) * 100}% 100%
                    )`,
              }}
            >
              {/* Inner Circle (The "Hole") */}
              <div className="w-[75%] h-[75%] bg-surface rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-text-main text-3xl font-black">
                  {stats.total}
                </span>
                <span className="text-text-placeholder text-[10px] font-bold uppercase tracking-widest">
                  Personnel
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 w-full grid grid-cols-2 gap-3">
              {stats.salaryGrades.slice(0, 4).map((sg, i) => {
                const colors = [
                  "var(--accent-primary)",
                  "var(--icon-cyan)",
                  "var(--icon-pink)",
                  "var(--border-subtle)",
                ];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: colors[i] }}
                    ></div>
                    <span className="text-text-main text-[11px] font-bold truncate">
                      {sg.name}
                    </span>
                    <span className="text-text-placeholder text-[10px] font-medium ml-auto">
                      {sg.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Position Breakdown (Bar Chart visualization) */}
        <div className="lg:col-span-2 bg-surface border border-border-subtle p-6 rounded-[32px] shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-text-main font-bold text-lg m-0">
                Position Distribution
              </h3>
              <p className="text-text-muted text-sm font-medium m-0">
                Top roles in the organization
              </p>
              <Link
                to="/report"
                className="mt-2 inline-flex items-center gap-2 text-accent text-xs font-bold hover:underline transition-all"
              >
                <i className="fas fa-chart-line"></i> View full analytics
              </Link>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="bg-surface-alt border border-border-subtle text-text-main text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-accent shadow-sm"
              >
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={filters.schoolLevel}
                onChange={(e) => handleFilterChange("schoolLevel", e.target.value)}
                className="bg-surface-alt border border-border-subtle text-text-main text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-accent shadow-sm"
              >
                {uniqueLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
              <select
                value={filters.department}
                onChange={(e) =>
                  handleFilterChange("department", e.target.value)
                }
                className="bg-surface-alt border border-border-subtle text-text-main text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-accent shadow-sm"
              >
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-5 flex-1">
            {stats.positions.map((pos, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-text-main">{pos.name}</span>
                  <span className="text-text-muted">{pos.count} Members</span>
                </div>
                <div className="h-3 bg-surface-alt border border-border-subtle rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-1000 ease-out rounded-full`}
                    style={{ width: `${(pos.count / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4 text-xs font-bold text-text-placeholder uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-accent rounded-sm"></div> Active
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-surface-alt border border-border-subtle rounded-sm"></div>{" "}
              Vacant
            </div>
          </div>
        </div>
      </div>

      {/* New Row: Department Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Departmental Resource Distribution */}
        <div className="lg:col-span-2 bg-surface border border-border-subtle p-6 rounded-[32px] shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-text-main font-bold text-lg m-0">Departmental Distribution</h3>
              <p className="text-text-muted text-sm font-medium m-0">Staffing density by subject/department</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
            {stats.departments.map((dept, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                  <span className="text-text-main truncate pr-2">{dept.name}</span>
                  <span className="text-accent">{dept.count}</span>
                </div>
                <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden border border-border-subtle/50">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(dept.count / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface border border-border-subtle p-6 rounded-[32px] shadow-sm flex flex-col">
          <h3 className="text-text-main font-bold text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "File Leave", icon: "fa-paper-plane", to: "/leave-tracker", color: "bg-accent/10 text-accent" },
              { label: "Add Personnel", icon: "fa-user-plus", to: "/employee", color: "bg-icon-cyan/10 text-icon-cyan" },
              { label: "Junior High", icon: "fa-school", to: "/junior-high", color: "bg-blue-500/10 text-blue-400" },
              { label: "Senior High", icon: "fa-graduation-cap", to: "/senior-high", color: "bg-purple-500/10 text-purple-400" },
              { label: "Monthly Report", icon: "fa-file-medical-alt", to: "/report", color: "bg-icon-pink/10 text-icon-pink" },
            ].map((action, i) => (
              <Link
                key={i}
                to={action.to}
                className="flex items-center gap-4 p-3 rounded-2xl border border-border-subtle hover:border-accent hover:bg-surface-alt transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color} border border-transparent group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${action.icon}`}></i>
                </div>
                <span className="text-[14px] font-bold text-text-main">{action.label}</span>
                <i className="fas fa-chevron-right ml-auto text-[10px] text-text-placeholder group-hover:translate-x-1 transition-transform"></i>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Updates & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Milestones */}
        <div className="bg-surface border border-border-subtle rounded-[32px] overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border-subtle bg-surface shrink-0">
            <h3 className="text-text-main font-bold text-lg m-0">Upcoming Milestones</h3>
            <p className="text-text-muted text-[11px] font-medium m-0">Personnel celebrations this month</p>
          </div>
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="flex flex-col gap-6">
              {/* Anniversaries */}
              <div>
                <h4 className="text-[10px] font-black text-text-placeholder uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fas fa-medal text-accent"></i> Service Anniversaries
                </h4>
                <div className="flex flex-col gap-3">
                  {stats.milestones.anniversaries.length > 0 ? stats.milestones.anniversaries.map((emp, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-surface-alt/50 transition-all border border-transparent hover:border-border-subtle">
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-accent text-[14px] font-black leading-none">{emp.years}</span>
                        <span className="text-accent text-[8px] font-black uppercase">Years</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-text-main text-[13px] font-bold truncate m-0">{emp.last_name}, {emp.first_name}</p>
                        <p className="text-text-muted text-[10px] font-medium m-0">Joined {new Date(emp.original_appointment_date).getFullYear()}</p>
                      </div>
                    </div>
                  )) : <p className="text-text-placeholder text-xs italic ml-2">No anniversaries this month</p>}
                </div>
              </div>

              {/* Birthdays */}
              <div>
                <h4 className="text-[10px] font-black text-text-placeholder uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fas fa-birthday-cake text-icon-pink"></i> Upcoming Birthdays
                </h4>
                <div className="flex flex-col gap-3">
                  {stats.milestones.birthdays.length > 0 ? stats.milestones.birthdays.map((emp, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-surface-alt/50 transition-all border border-transparent hover:border-border-subtle">
                      <div className="w-10 h-10 rounded-full bg-icon-pink/10 border border-icon-pink/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-icon-pink text-[14px] font-black leading-none">{new Date(emp.birthdate).getDate()}</span>
                        <span className="text-icon-pink text-[8px] font-black uppercase">{new Date(emp.birthdate).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-text-main text-[13px] font-bold truncate m-0">{emp.last_name}, {emp.first_name}</p>
                        <p className="text-text-muted text-[10px] font-medium m-0">Happy Birthday!</p>
                      </div>
                    </div>
                  )) : <p className="text-text-placeholder text-xs italic ml-2">No birthdays this month</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Personnel Updates */}
        <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-[32px] overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface shrink-0">
            <h3 className="text-text-main font-bold text-lg m-0">Recent Personnel Updates</h3>
            <Link to="/employee" className="text-accent text-sm font-bold hover:underline transition-all">View all</Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-alt">
                  <th className="px-6 py-4 text-text-muted text-[10px] font-black uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-text-muted text-[10px] font-black uppercase tracking-widest text-right">Profile Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {recentActivity.map((emp, i) => {
                  const completionFields = ['photo_url', 'philhealth_no', 'tin', 'pagibig_no', 'contact_no'];
                  const filledFields = completionFields.filter(field => emp[field]).length;
                  const percentage = Math.round((filledFields / completionFields.length) * 100);
                  return (
                    <tr key={i} className="hover:bg-surface-alt/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-alt border border-border-subtle flex items-center justify-center text-[10px] font-black text-accent uppercase">
                            {emp.last_name?.[0]}{emp.first_name?.[0]}
                          </div>
                          <div>
                            <p className="text-text-main text-[13px] font-bold m-0 group-hover:text-accent transition-colors">
                              {emp.last_name}, {emp.first_name}
                            </p>
                            <p className="text-text-placeholder text-[10px] font-black uppercase tracking-tighter m-0">{emp.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${percentage === 100 ? 'text-green-500' : 'text-amber-500'}`}>
                            {percentage === 100 ? 'Complete' : `${percentage}%`}
                          </span>
                          <div className="w-16 h-1 bg-surface-alt border border-border-subtle rounded-full overflow-hidden">
                            <div className={`h-full ${percentage === 100 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
