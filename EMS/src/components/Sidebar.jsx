import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/rectologo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'fa-dashboard' },
    { to: '/employee', label: 'Employee', icon: 'fa-users' },
    { to: '/report', label: 'Analytics', icon: 'fa-chart-line' },
  ];

  return (
    <aside className="w-full md:w-[260px] h-auto min-h-0 md:min-h-screen md:h-screen shrink-0 bg-surface border-r border-border-subtle text-text-muted flex flex-col relative md:sticky top-0 overflow-visible md:overflow-hidden z-20 shadow-sm">
      {/* Branding Section */}
      <div className="px-6 py-8 border-b border-border-subtle/50">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="EMS Logo"
            className="w-11 h-11 object-contain p-2 border border-border-subtle rounded-xl bg-surface-alt shadow-sm"
          />
          <div>
            <h2 className="text-text-main text-2xl font-black tracking-tight m-0 leading-none">
              EMS
            </h2>
            <p className="text-[10px] font-bold text-text-placeholder uppercase tracking-widest mt-1 opacity-70">Recto Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 p-4 md:px-4 md:pt-6">
        <div className="mb-4 px-3 text-[10px] font-black text-text-placeholder uppercase tracking-[0.2em] opacity-60">Main Menu</div>
        <ul className="list-none flex md:flex-col gap-1.5 m-0 p-0">
          {navLinks.map((link) => (
            <li key={link.to} className="m-0">
              <NavLink
                to={link.to}
                className={({ isActive }) => `
                  group flex items-center gap-3.5 px-4 py-3 no-underline rounded-xl transition-all duration-200 font-bold text-[14px]
                  ${isActive
                    ? 'bg-accent/10 text-accent shadow-sm translate-x-1'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <i className={`fas ${link.icon} text-[16px] w-[20px] transition-colors duration-200 ${isActive ? 'text-accent' : 'text-text-placeholder group-hover:text-accent'}`}></i>
                    <span className="tracking-tight">{link.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings & Session Section (Side-by-Side) */}
      <div className="p-4 border-t border-border-subtle/50 mt-auto bg-surface-alt/20">
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 h-11 bg-surface text-text-muted border border-border-subtle rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:bg-surface-hover hover:text-accent active:scale-95"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-[16px]`}></i>
          </button>

          <button
            onClick={handleLogout}
            className="flex-1 h-11 bg-surface text-text-muted border border-border-subtle rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 active:scale-95"
            title="Logout of System"
          >
            <i className="fas fa-sign-out-alt text-[16px]"></i>
          </button>
        </div>
        <p className="text-[9px] text-center text-text-placeholder font-bold uppercase tracking-widest mt-3 opacity-40">System v1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
