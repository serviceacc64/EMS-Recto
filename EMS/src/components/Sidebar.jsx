import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/rectologo.png';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'fa-dashboard', activeColor: 'text-amber-500' },
    { to: '/employee', label: 'Employee', icon: 'fa-users', activeColor: 'text-blue-600' },
    { to: '/report', label: 'Analytics', icon: 'fa-chart-line', activeColor: 'text-emerald-500' },
  ];

  return (
    <aside className="w-full md:w-[260px] h-auto min-h-0 md:min-h-screen md:h-screen shrink-0 bg-white border-r border-[#e2e8f0] text-[#334155] flex flex-col relative md:sticky top-0 overflow-visible md:overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
      <div className="relative px-6 py-5 md:pt-7 md:pb-6 border-b border-[#e2e8f0] flex items-center gap-3">
        <img 
          src={logo} 
          alt="EMS Logo" 
          className="w-12 h-12 shrink-0 object-contain p-2 border border-[#e2e8f0] rounded-[14px] bg-[#f8fafc] shadow-sm"
        />
        <h2 className="text-[#0f172a] text-[26px] font-extrabold tracking-tight m-0 leading-none relative after:content-['Employee_Management'] after:block after:mt-[6px] after:text-[#64748b] after:text-[10px] after:font-bold after:tracking-[0.1em] after:uppercase">
          EMS
        </h2>
      </div>

      <nav className="flex-none md:flex-1 mt-0 p-3 md:px-4 md:pt-6 overflow-visible md:overflow-y-auto">
        <div className="mb-3 px-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Main Menu</div>
        <ul className="list-none flex md:flex-col grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] md:flex gap-1.5 m-0 p-0">
          {navLinks.map((link) => (
            <li key={link.to} className="m-0">
              <NavLink 
                to={link.to} 
                className={({isActive}) => `group flex items-center gap-3 px-4 py-3 no-underline rounded-[12px] transition-all duration-200 font-medium text-[15px] ${isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] hover:translate-x-1'}`}
              >
                {({isActive}) => (
                  <>
                    <i className={`fas ${link.icon} text-[16px] w-[20px] transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-[#94a3b8] group-hover:text-blue-600'}`}></i>
                    {link.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#e2e8f0] mt-auto">
        <button onClick={handleLogout} className="w-full text-center bg-white text-[#475569] border border-[#e2e8f0] py-3 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 hover:-translate-y-0.5">
          <i className="fas fa-sign-out-alt text-[16px]"></i> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
