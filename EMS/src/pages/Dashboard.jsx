import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    newHires: 0,
    active: 0,
    salaryGrades: [],
    positions: [],
  });
  const [recentActivity, setRecentActivity] = useState([]);

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
      const total = employees.length;
      const male = employees.filter((e) => e.gender === "Male").length;
      const female = employees.filter((e) => e.gender === "Female").length;

      // New Hires (Current month)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newHires = employees.filter((e) => {
        const appointmentDate = new Date(e.original_appointment_date);
        return appointmentDate >= firstDayOfMonth;
      }).length;

      // Positions Breakdown (Top 5)
      const positionCounts = {};
      employees.forEach((e) => {
        const pos = e.position?.split(" ")[0] || "Unassigned";
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
      });
      const positions = Object.entries(positionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Salary Grade Distribution
      const sgCounts = {};
      employees.forEach((e) => {
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

      setStats({
        total,
        male,
        female,
        newHires,
        active: total,
        salaryGrades,
        positions,
      });

      setRecentActivity(employees.slice(0, 5));
    }
    setIsLoading(false);
  };

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
            label: "Total Personnel",
            val: stats.total,
            icon: "fa-users",
            color: "accent",
            trend: "+2% from last month",
          },
          {
            label: "Male Staff",
            val: stats.male,
            icon: "fa-mars",
            color: "icon-cyan",
            trend: "Stable",
          },
          {
            label: "Female Staff",
            val: stats.female,
            icon: "fa-venus",
            color: "icon-pink",
            trend: "+1% from last month",
          },
          {
            label: "New Hires",
            val: stats.newHires,
            icon: "fa-user-plus",
            color: "green-500",
            trend: "Current Month",
          },
          {
            label: "Active Status",
            val: stats.active,
            icon: "fa-check-circle",
            color: "blue-500",
            trend: "System verified",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-surface border border-border-subtle p-5 rounded-[24px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 bg-surface-alt text-${item.color} border border-border-subtle transition-transform group-hover:scale-110`}
            >
              <i className={`fas ${item.icon}`}></i>
            </div>
            <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">
              {item.label}
            </p>
            <h3 className="text-text-main text-2xl font-extrabold mb-2">
              {item.val}
            </h3>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-alt border border-border-subtle ${item.trend.includes("+") ? "text-green-500" : "text-text-placeholder"}`}
              >
                {item.trend}
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
            <select className="bg-surface-alt border border-border-subtle text-text-main text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-accent shadow-sm">
              <option>All Departments</option>
            </select>
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

      {/* Bottom Section: Recent Employees */}
      <div className="bg-surface border border-border-subtle rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-text-main font-bold text-lg m-0">
            Recent Personnel Updates
          </h3>
          <Link
            to="/employee"
            className="text-accent text-sm font-bold hover:underline transition-all"
          >
            View all records
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-alt">
                <th className="px-6 py-4 text-text-muted text-[11px] font-bold uppercase tracking-widest">
                  Name
                </th>
                <th className="px-6 py-4 text-text-muted text-[11px] font-bold uppercase tracking-widest">
                  Position
                </th>
                <th className="px-6 py-4 text-text-muted text-[11px] font-bold uppercase tracking-widest">
                  Employee No
                </th>
                <th className="px-6 py-4 text-text-muted text-[11px] font-bold uppercase tracking-widest text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {recentActivity.map((emp, i) => (
                <tr
                  key={i}
                  className="hover:bg-surface-alt/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-alt border border-border-subtle flex items-center justify-center text-[11px] font-bold text-accent">
                        {emp.last_name?.[0]}
                        {emp.first_name?.[0]}
                      </div>
                      <div>
                        <p className="text-text-main text-sm font-bold m-0 group-hover:text-accent transition-colors">
                          {emp.last_name}, {emp.first_name}
                        </p>
                        <p className="text-text-placeholder text-[11px] font-medium m-0">
                          {emp.gender}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-text-muted text-sm font-semibold">
                      {emp.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-text-placeholder font-bold">
                    {emp.employee_no}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-[11px] font-bold border border-green-500/20">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
