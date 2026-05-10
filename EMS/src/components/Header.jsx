import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return;

    if (data) {
      setEmployees(data);
      
      // Notifications Logic
      const newNotifications = [];
      const incomplete = data.filter(e => !e.photo_url || !e.philhealth_no || !e.tin || !e.pagibig_no);
      if (incomplete.length > 0) {
        newNotifications.push({
          id: 'incomplete',
          type: 'alert',
          title: 'Incomplete Profiles',
          message: `${incomplete.length} staff members are missing key documents.`,
          icon: 'fa-exclamation-triangle',
          color: 'text-orange-500',
          data: incomplete
        });
      }

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      const birthdays = data.filter(e => {
        if (!e.birthdate) return false;
        const bday = new Date(e.birthdate);
        const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
        if (thisYearBday < today && bday.getMonth() === 0 && today.getMonth() === 11) {
          thisYearBday.setFullYear(today.getFullYear() + 1);
        }
        return thisYearBday >= today && thisYearBday <= nextWeek;
      });

      if (birthdays.length > 0) {
        newNotifications.push({
          id: 'birthdays',
          type: 'celebration',
          title: 'Upcoming Birthdays',
          message: `${birthdays.length} employees are celebrating this week!`,
          icon: 'fa-birthday-cake',
          color: 'text-icon-pink',
          data: birthdays
        });
      }
      setNotifications(newNotifications);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.length > 1) {
      const filtered = employees.filter(emp => 
        emp.first_name?.toLowerCase().includes(term.toLowerCase()) ||
        emp.last_name?.toLowerCase().includes(term.toLowerCase()) ||
        emp.employee_no?.toLowerCase().includes(term.toLowerCase())
      ).slice(0, 5);
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return { title: 'System Admin', subtitle: 'Welcome back,' };
    if (path === '/employee') return { title: 'Employee Management', subtitle: 'Manage your workforce' };
    if (path === '/junior-high') return { title: 'Junior Highschool', subtitle: 'Personnel Directory' };
    if (path === '/senior-high') return { title: 'Senior Highschool', subtitle: 'Personnel Directory' };
    if (path === '/report') return { title: 'System Analytics', subtitle: 'Performance & data' };
    if (path === '/leave-tracker') return { title: 'Leave & Attendance Tracker', subtitle: 'Leave Management' };
    return { title: 'EMS Recto', subtitle: 'Personnel System' };
  };

  const pageInfo = getPageTitle();

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-text text-lg font-bold shadow-lg shadow-accent/20">
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-[3px] border-base rounded-full"></div>
        </div>
        <div>
          <p className="text-text-muted text-[12px] font-semibold m-0">{pageInfo.subtitle}</p>
          <h1 className="text-text-main text-xl md:text-2xl font-extrabold tracking-tight m-0 leading-tight">{pageInfo.title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full lg:w-auto relative">
        {/* Search */}
        <div className="relative flex-1 lg:w-72">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder"></i>
          <input 
            type="text" 
            placeholder="Search employee..." 
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            onFocus={() => searchTerm.length > 1 && setShowSearchResults(true)}
            className="w-full bg-surface border border-border-subtle rounded-2xl py-2.5 pl-10 pr-4 text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all shadow-sm"
          />

          {showSearchResults && (
            <div className="absolute top-14 left-0 w-full bg-surface border border-border-subtle rounded-[24px] shadow-xl z-50 overflow-hidden animate-[slideIn_0.2s_ease-out]">
              <div className="p-3 border-b border-border-subtle bg-surface-alt">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-placeholder">Quick Results</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-xs font-medium">No results found for "{searchTerm}"</div>
                ) : (
                  searchResults.map((emp, i) => (
                    <Link key={i} to={`/employee?id=${emp.employee_no}&action=view`} className="flex items-center gap-3 p-3 hover:bg-surface-alt transition-colors group border-b border-border-subtle last:border-0">
                      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">{emp.last_name?.[0]}{emp.first_name?.[0]}</div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-text-main text-[13px] font-bold m-0 truncate group-hover:text-accent transition-colors">{emp.last_name}, {emp.first_name}</p>
                          {(() => {
                            const missing = [];
                            if (!emp.photo_url) missing.push("Photo");
                            if (!emp.philhealth_no) missing.push("PhilHealth");
                            if (!emp.tin) missing.push("TIN");
                            if (!emp.pagibig_no) missing.push("Pag-IBIG");
                            if (missing.length > 0) {
                              return <i className="fas fa-exclamation-circle text-red-500 text-[10px]" title={`Missing: ${missing.join(", ")}`}></i>;
                            }
                            return null;
                          })()}
                        </div>
                        <p className="text-text-placeholder text-[11px] font-medium m-0 truncate">{emp.position}</p>
                      </div>
                      <i className="fas fa-chevron-right text-[10px] text-text-placeholder ml-auto group-hover:translate-x-0.5 transition-transform"></i>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="w-10 h-10 bg-surface border border-border-subtle rounded-xl flex items-center justify-center text-text-main hover:bg-surface-alt transition-all shadow-sm relative group"
            title="Notifications"
          >
            <i className={`fas fa-bell text-[16px] transition-all duration-300 ${notifications.length > 0 ? 'text-accent animate-swing' : 'text-text-placeholder group-hover:text-text-main'}`}></i>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-surface shadow-sm">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 top-12 w-72 bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-[24px] shadow-2xl z-30 overflow-hidden animate-[slideIn_0.3s_ease-out] origin-top-right">
                <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface/50">
                  <h4 className="text-text-main font-black text-sm uppercase tracking-wider m-0">Notifications</h4>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[10px] font-black text-accent uppercase tracking-widest hover:opacity-70 transition-opacity"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-12 px-8 text-center">
                      <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4 text-text-placeholder opacity-50">
                        <i className="fas fa-bell-slash text-2xl"></i>
                      </div>
                      <p className="text-text-main font-bold text-sm m-0">All caught up!</p>
                      <p className="text-text-muted text-[11px] mt-1 m-0">No new alerts at the moment.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-subtle/50">
                      {notifications.map((n, i) => (
                        <div 
                          key={i} 
                          onClick={() => { setSelectedNotification(n); setShowNotifications(false); }} 
                          className="p-5 hover:bg-surface-hover/50 transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className="flex gap-4 relative z-10">
                            <div className={`w-10 h-10 rounded-xl ${n.color.replace('text', 'bg')}/10 ${n.color} flex items-center justify-center text-sm shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                              <i className={`fas ${n.icon}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-0.5">
                                <p className="text-text-main text-[13px] font-black m-0 group-hover:text-accent transition-colors truncate pr-2">{n.title}</p>
                                <span className="text-[9px] font-black text-text-placeholder uppercase tracking-tighter shrink-0">Just Now</span>
                              </div>
                              <p className="text-text-muted text-[11px] font-medium leading-relaxed m-0 line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-4 bg-surface/30 border-t border-border-subtle text-center">
                    <button className="text-[10px] font-black text-text-placeholder uppercase tracking-widest hover:text-text-main transition-colors">View All Activity</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNotification(null)}></div>
          <div className="bg-surface border border-border-subtle w-full max-w-lg rounded-[32px] shadow-2xl z-[101] overflow-hidden animate-[slideIn_0.3s_ease-out]">
            <div className="p-6 border-b border-border-subtle bg-surface-alt flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${selectedNotification.color.replace('text', 'bg')}/10 ${selectedNotification.color} flex items-center justify-center`}><i className={`fas ${selectedNotification.icon}`}></i></div>
                <div>
                  <h3 className="text-text-main font-bold m-0">{selectedNotification.title}</h3>
                  <p className="text-text-muted text-xs font-medium m-0">{selectedNotification.data.length} records found</p>
                </div>
              </div>
              <button onClick={() => setSelectedNotification(null)} className="w-10 h-10 rounded-full hover:bg-surface-alt transition-colors flex items-center justify-center text-text-muted"><i className="fas fa-times"></i></button>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-4 flex flex-col gap-3">
              {selectedNotification.data.map((emp, i) => (
                <div key={i} className="bg-surface-alt/50 border border-border-subtle p-4 rounded-2xl flex items-center justify-between group hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-xs font-bold text-accent shadow-sm">{emp.last_name?.[0]}{emp.first_name?.[0]}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-text-main text-[14px] font-bold m-0">{emp.last_name}, {emp.first_name}</p>
                        {(() => {
                          const missing = [];
                          if (!emp.photo_url) missing.push("Photo");
                          if (!emp.philhealth_no) missing.push("PhilHealth");
                          if (!emp.tin) missing.push("TIN");
                          if (!emp.pagibig_no) missing.push("Pag-IBIG");
                          if (missing.length > 0) {
                            return <i className="fas fa-exclamation-circle text-red-500 text-[10px]" title={`Missing: ${missing.join(", ")}`}></i>;
                          }
                          return null;
                        })()}
                      </div>
                      <p className="text-text-muted text-[11px] font-medium m-0">{selectedNotification.id === 'birthdays' ? `Birthday: ${new Date(emp.birthdate).toLocaleDateString()}` : emp.position}</p>
                    </div>
                  </div>
                  <Link to={`/employee?id=${emp.employee_no}&action=view`} className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-accent border border-border-subtle hover:bg-accent hover:text-accent-text transition-all shadow-sm"><i className="fas fa-arrow-right text-xs"></i></Link>
                </div>
              ))}
            </div>
            <div className="p-6 bg-surface-alt border-t border-border-subtle flex justify-end">
              <button onClick={() => setSelectedNotification(null)} className="bg-accent text-accent-text px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
