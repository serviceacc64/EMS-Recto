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
    <aside className="w-full md:w-[260px] h-auto min-h-0 md:min-h-screen md:h-screen shrink-0 bg-surface border-r border-border-subtle text-text-muted flex flex-col relative md:sticky top-0 overflow-visible md:overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.04)] z-20 transition-colors duration-300">
      <div className="relative px-6 py-5 md:pt-7 md:pb-6 border-b border-border-subtle flex items-center gap-3">
        <img 
          src={logo} 
          alt="EMS Logo" 
          className="w-12 h-12 shrink-0 object-contain p-2 border border-border-subtle rounded-[14px] bg-surface-alt shadow-sm"
        />
        <h2 className="text-text-main text-[26px] font-extrabold tracking-tight m-0 leading-none relative after:content-['Employee_Management'] after:block after:mt-[6px] after:text-text-muted after:text-[10px] after:font-bold after:tracking-[0.1em] after:uppercase">
          EMS
        </h2>
      </div>

      <nav className="flex-none md:flex-1 mt-0 p-3 md:px-4 md:pt-6 overflow-visible md:overflow-y-auto">
        <div className="mb-3 px-3 text-[11px] font-bold text-text-placeholder uppercase tracking-wider">Main Menu</div>
        <ul className="list-none flex md:flex-col grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] md:flex gap-1.5 m-0 p-0">
          {navLinks.map((link) => (
            <li key={link.to} className="m-0">
              <NavLink 
                to={link.to} 
                className={({isActive}) => `group flex items-center gap-3 px-4 py-3 no-underline rounded-[12px] transition-all duration-200 font-medium text-[15px] ${isActive ? 'bg-accent/10 text-accent shadow-sm' : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}`}
              >
                {({isActive}) => (
                  <>
                    <i className={`fas ${link.icon} text-[16px] w-[20px] transition-colors duration-200 ${isActive ? 'text-accent' : 'text-text-placeholder group-hover:text-accent'}`}></i>
                    {link.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border-subtle mt-auto flex flex-col gap-2">
        <button onClick={toggleTheme} className="w-full text-center bg-surface text-text-muted border border-border-subtle py-3 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:bg-surface-hover hover:text-text-main hover:-translate-y-0.5">
          <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-[16px]`}></i> {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout} className="w-full text-center bg-surface text-text-muted border border-border-subtle py-3 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:bg-red-900/20 hover:text-red-500 hover:border-red-900/50 hover:-translate-y-0.5">
          <i className="fas fa-sign-out-alt text-[16px]"></i> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
