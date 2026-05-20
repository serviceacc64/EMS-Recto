import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import logo from "../assets/rectologo.png";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { isDarkMode, toggleTheme } = useTheme();
  const { signOut, isSuperAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    showToast("Logged out successfully", "info");
    navigate("/");
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const mainLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "fa-house" },
    { to: "/employee", label: "Personnel", icon: "fa-id-card" },
    { to: "/report", label: "Analytics", icon: "fa-chart-pie" },
  ];

  const educationLinks = [
    { to: "/junior-high", label: "Junior High", icon: "fa-school" },
    { to: "/senior-high", label: "Senior High", icon: "fa-graduation-cap" },
  ];

  const leaveLinks = [
    { to: "/leave-tracker", label: "Leave Tracker", icon: "fa-calendar-check" },
  ];

  const NavItem = ({ to, label, icon }) => (
    <li className="m-0">
      <NavLink
        to={to}
        className={({ isActive }) => `
          group flex items-center justify-between px-3 py-2 no-underline rounded-xl transition-all duration-300 font-semibold text-[13px]
          ${isActive
            ? "bg-text-main/10 text-text-main shadow-sm"
            : "text-text-muted hover:bg-text-main/5 hover:text-text-main"
          }
          ${isCollapsed ? "justify-center px-0" : ""}
        `}
      >
        {({ isActive }) => (
          <>
            <div
              className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}
            >
              <i
                className={`fas ${icon} text-[16px] w-[20px] transition-all duration-300 ${isActive
                    ? "text-text-main"
                    : "text-text-muted group-hover:text-text-main"
                  } ${isCollapsed ? "m-0" : ""}`}
              ></i>
              {!isCollapsed && (
                <span className="tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300">
                  {label}
                </span>
              )}
            </div>
            {!isCollapsed && isActive && (
              <i className="fas fa-chevron-right text-[10px] text-text-placeholder opacity-50 group-hover:translate-x-0.5 transition-transform"></i>
            )}
          </>
        )}
      </NavLink>
    </li>
  );

  const SectionDivider = () => (
    <div className={`h-px bg-border-subtle opacity-30 transition-all duration-300 ${isCollapsed ? "mx-2" : "mx-3"}`} />
  );

  return (
    <aside
      className={`
      h-auto min-h-0 md:min-h-screen md:h-screen shrink-0 bg-surface border-r border-border-subtle text-text-muted flex flex-col relative md:sticky top-0 z-20 transition-all duration-300 ease-in-out
      ${isCollapsed ? "w-full md:w-[72px]" : "w-full md:w-[240px]"}
    `}
    >
      {/* Branding Section */}
      <div
        className={`px-4 py-4 flex items-center justify-between ${isCollapsed ? "flex-col gap-3" : ""}`}
      >
        <div
          className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}
        >
          <img
            src={logo}
            alt="EMS Logo"
            className="w-8 h-8 object-contain p-1 border border-border-subtle rounded-lg bg-surface-alt shadow-sm shrink-0"
          />
          {!isCollapsed && (
            <div>
              <h2 className="text-text-main text-lg font-black tracking-tight m-0 leading-none">
                EMS
              </h2>
              <p className="text-[10px] font-bold text-text-placeholder uppercase tracking-widest mt-1 opacity-70">
                Recto Portal
              </p>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapse}
          className={`
            p-2 rounded-lg text-text-placeholder hover:bg-surface-hover hover:text-text-main transition-colors duration-200
            ${isCollapsed ? "w-10 h-10 flex items-center justify-center" : ""}
          `}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <i
            className={`fas ${isCollapsed ? "fa-indent" : "fa-outdent"} text-[13px]`}
          ></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 space-y-4">
        {/* Main Section */}
        <nav>
          {!isCollapsed && (
            <div className="mb-3 px-3 text-[10px] font-black text-text-placeholder uppercase tracking-[0.2em] opacity-60">
              Main Menu
            </div>
          )}
          <ul className="list-none flex md:flex-col gap-1 m-0 p-0">
            <NavItem to="/dashboard" label="Dashboard" icon="fa-house" />
            <NavItem to="/employee" label="Personnel" icon="fa-id-card" />
            {isSuperAdmin && <NavItem to="/report" label="Analytics" icon="fa-chart-pie" />}
          </ul>
        </nav>
        <SectionDivider />

        {/* Education Section */}
        {isSuperAdmin && (
          <>
            <nav>
              {!isCollapsed && (
                <div className="mb-3 px-3 text-[10px] font-black text-text-placeholder uppercase tracking-[0.2em] opacity-60">
                  Education
                </div>
              )}
              <ul className="list-none flex md:flex-col gap-1 m-0 p-0">
                {educationLinks.map((link) => (
                  <NavItem key={link.to} {...link} />
                ))}
              </ul>
            </nav>
            <SectionDivider />
          </>
        )}

        {/* Leave Section */}
        {isSuperAdmin && (
          <nav>
            {!isCollapsed && (
              <div className="mb-3 px-3 text-[10px] font-black text-text-placeholder uppercase tracking-[0.2em] opacity-60">
                Operations
              </div>
            )}
            <ul className="list-none flex md:flex-col gap-1 m-0 p-0">
              {leaveLinks.map((link) => (
                <NavItem key={link.to} {...link} />
              ))}
            </ul>
          </nav>
        )}

        {isSuperAdmin && (
          <>
            <SectionDivider />
            <nav>
              {!isCollapsed && (
                <div className="mb-3 px-3 text-[10px] font-black text-text-placeholder uppercase tracking-[0.2em] opacity-60">
                  Administration
                </div>
              )}
              <ul className="list-none flex md:flex-col gap-1 m-0 p-0">
                <NavItem to="/admin-management" label="Admin Roles" icon="fa-user-shield" />
                <NavItem to="/salary-rates" label="Salary Rates" icon="fa-coins" />
                <NavItem to="/audit-logs" label="Audit Logs" icon="fa-shield-halved" />
              </ul>
            </nav>
          </>
        )}
      </div>
      <SectionDivider />
      {/* Bottom Section Card */}
      <div className="p-3 mt-auto">
        {!isCollapsed ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-accent/5 rounded-full blur-xl group-hover:bg-accent/10 transition-colors duration-500"></div>
            <div className="relative z-10">
              <h4 className="text-text-main text-[10px] font-black uppercase tracking-wider mb-0.5">
                System Status
              </h4>
              <p className="text-text-muted text-[10px] leading-relaxed mb-2.5 opacity-80">
                EMS v1.2.0 is up to date.
              </p>
              <div className="flex gap-2 items-center">
                <button
                  onClick={toggleTheme}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 shadow-sm active:scale-90 group/theme border
                    ${isDarkMode
                      ? "bg-zinc-800 border-zinc-700 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.1)] hover:bg-zinc-700 hover:shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                      : "bg-white border-zinc-200 text-indigo-600 hover:bg-zinc-50 shadow-black/5"
                    }
                  `}
                  title={
                    isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                  }
                >
                  <i
                    className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"} text-sm transition-all duration-500 group-hover/theme:rotate-12`}
                  ></i>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 h-8 bg-text-main text-surface text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500 transition-all duration-300 active:scale-95 shadow-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 bg-surface text-text-muted border border-border-subtle rounded-lg flex items-center justify-center hover:text-accent hover:border-accent/30 transition-all shadow-sm active:scale-95"
            >
              <i
                className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"} text-[12px]`}
              ></i>
            </button>
            <button
              onClick={handleLogout}
              className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-all shadow-sm active:scale-95"
            >
              <i className="fas fa-sign-out-alt text-[12px]"></i>
            </button>
          </div>
        )}
        {!isCollapsed && (
          <p className="text-[8px] text-center text-text-placeholder font-bold uppercase tracking-widest mt-3 opacity-30">
            Employee Management System
          </p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
