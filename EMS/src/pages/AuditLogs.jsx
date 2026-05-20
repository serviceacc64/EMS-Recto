import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../context/NotificationContext";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const { showToast } = useNotifications();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [preset, setPreset] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate, preset]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("audit_logs")
        .select(`
          *,
          profiles:performed_by (full_name, role)
        `)
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
      }

      // Default to 100 limit if no dates selected to protect performance
      if (!startDate && !endDate) {
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      showToast("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (selectedPreset) => {
    setPreset(selectedPreset);
    const getLocalDateString = (date) => {
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
      return adjustedDate.toISOString().split("T")[0];
    };

    const todayStr = getLocalDateString(new Date());

    if (selectedPreset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (selectedPreset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (selectedPreset === "7days") {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      setStartDate(getLocalDateString(pastDate));
      setEndDate(todayStr);
    } else if (selectedPreset === "30days") {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      setStartDate(getLocalDateString(pastDate));
      setEndDate(todayStr);
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchStr = searchTerm.toLowerCase();
    const adminName = (log.guest_actor_name || log.profiles?.full_name || "System Admin").toLowerCase();
    const tableName = log.table_name.toLowerCase();
    const action = log.action.toLowerCase();
    
    return adminName.includes(searchStr) || 
           tableName.includes(searchStr) || 
           action.includes(searchStr);
  });

  const getActionColor = (action) => {
    switch (action) {
      case "INSERT": return "text-green-500 bg-green-500/10";
      case "UPDATE": return "text-blue-500 bg-blue-500/10";
      case "DELETE": return "text-red-500 bg-red-500/10";
      default: return "text-text-muted bg-surface-alt";
    }
  };

  const ChangesModal = ({ log, onClose }) => {
    if (!log) return null;

    const oldData = log.old_data || {};
    const newData = log.new_data || {};
    
    // For UPDATE, we only want to show changed fields
    const getChangedFields = () => {
      if (log.action === "INSERT") return Object.keys(newData).map(k => ({ key: k, old: null, new: newData[k] }));
      if (log.action === "DELETE") return Object.keys(oldData).map(k => ({ key: k, old: oldData[k], new: null }));
      
      const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
      return allKeys
        .filter(key => {
          // Skip internal/meta fields
          if (['id', 'created_at', 'updated_at'].includes(key)) return false;
          return JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]);
        })
        .map(key => ({
          key,
          old: oldData[key],
          new: newData[key]
        }));
    };

    const changes = getChangedFields();

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-surface rounded-[28px] shadow-2xl w-full max-w-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[85vh] animate-[slideUp_0.3s_ease-out]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border-subtle bg-surface-alt flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getActionColor(log.action)}`}>
                <i className={`fas ${log.action === 'UPDATE' ? 'fa-pen' : log.action === 'INSERT' ? 'fa-plus' : 'fa-trash'} text-lg`}></i>
              </div>
              <div>
                <h2 className="text-[18px] font-black text-text-main m-0 leading-tight">
                  {log.action} Details
                </h2>
                <p className="text-[11px] font-bold text-text-placeholder uppercase tracking-widest mt-0.5">
                  {log.table_name.replace('_', ' ')} • ID: {log.record_id?.slice(0, 8)}...
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-surface-hover flex items-center justify-center text-text-placeholder transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {changes.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-info-circle text-text-placeholder text-3xl mb-3"></i>
                <p className="text-text-muted font-medium">No significant field changes detected.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-text-placeholder uppercase tracking-widest mb-2">
                  <div className="col-span-4">Field Name</div>
                  <div className="col-span-4">Previous Value</div>
                  <div className="col-span-4">New Value</div>
                </div>
                {changes.map((change, idx) => (
                  <div 
                    key={idx} 
                    className="grid grid-cols-12 gap-4 items-center p-3.5 rounded-2xl bg-surface-alt/50 border border-border-subtle/50 hover:border-accent/30 transition-colors group"
                  >
                    <div className="col-span-4">
                      <span className="text-text-main font-bold text-[13px] capitalize break-words">
                        {change.key.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="col-span-4 overflow-hidden">
                      <div className="bg-red-500/5 text-red-500/80 px-2.5 py-1.5 rounded-lg border border-red-500/10 text-[12px] font-medium truncate italic">
                        {change.old === null || change.old === undefined ? '—' : String(change.old)}
                      </div>
                    </div>
                    <div className="col-span-4 overflow-hidden">
                      <div className="bg-emerald-500/5 text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 text-[12px] font-bold truncate">
                        {change.new === null || change.new === undefined ? '—' : String(change.new)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-subtle bg-surface-alt flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent font-black">
                {log.profiles?.full_name?.charAt(0) || "A"}
              </div>
              <div className="leading-tight">
                <p className="text-[12px] font-bold text-text-main m-0">{log.profiles?.full_name || "System Admin"}</p>
                <p className="text-[10px] text-text-placeholder font-medium m-0">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-text-main text-surface rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-accent hover:text-accent-text transition-all active:scale-95 shadow-sm"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out]">
      <div className="mb-6 flex flex-col gap-4">
        {/* Title and search bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-accent rounded-full opacity-50"></div>
            <span className="text-[10px] font-black text-text-placeholder uppercase tracking-[0.3em]">Activity Ledger</span>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:w-64">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-text-placeholder group-focus-within:text-accent transition-colors text-xs"></i>
              <input 
                type="text"
                placeholder="Search by admin, table, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-border-subtle rounded-xl text-[12px] font-bold text-text-main focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-text-placeholder placeholder:font-medium"
              />
            </div>
            <button
              onClick={fetchLogs}
              className="w-10 h-10 rounded-xl bg-surface border border-border-subtle text-text-main hover:bg-surface-alt transition-all flex items-center justify-center shadow-sm shrink-0"
              title="Refresh Logs"
            >
              <i className={`fas fa-sync-alt text-xs ${loading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-alt/40 p-3 rounded-2xl border border-border-subtle/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <i className="fas fa-calendar-alt text-accent text-xs"></i>
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Date Range:</span>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "7days", label: "Last 7 Days" },
                { id: "30days", label: "Last 30 Days" },
                { id: "custom", label: "Custom Range" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                    preset === p.id
                      ? "bg-accent text-black shadow-sm"
                      : "bg-surface hover:bg-surface-hover text-text-muted border border-border-subtle/50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Picker Fields */}
          {preset === "custom" ? (
            <div className="flex items-center gap-2 animate-[fadeIn_0.2s_ease-out] w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-surface border border-border-subtle rounded-lg text-[11px] font-bold text-text-main focus:outline-none focus:border-accent transition-all cursor-pointer w-full sm:w-auto"
              />
              <span className="text-[11px] font-bold text-text-placeholder">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-surface border border-border-subtle rounded-lg text-[11px] font-bold text-text-main focus:outline-none focus:border-accent transition-all cursor-pointer w-full sm:w-auto"
              />
            </div>
          ) : (
            preset === "all" && (
              <span className="text-[10px] text-text-placeholder font-medium italic hidden md:inline">
                * Showing latest 100 entries. Select a range for older logs.
              </span>
            )
          )}
        </div>
      </div>

      <div className="flex-1 bg-surface border border-border-subtle rounded-[24px] overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="sticky top-0 bg-surface/80 backdrop-blur-md z-10">
              <tr className="border-b border-border-subtle">
                <th className="p-4 font-black uppercase tracking-widest text-[10px] text-text-placeholder">Timestamp</th>
                <th className="p-4 font-black uppercase tracking-widest text-[10px] text-text-placeholder">Admin</th>
                <th className="p-4 font-black uppercase tracking-widest text-[10px] text-text-placeholder">Action</th>
                <th className="p-4 font-black uppercase tracking-widest text-[10px] text-text-placeholder">Table</th>
                <th className="p-4 font-black uppercase tracking-widest text-[10px] text-text-placeholder">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="p-4 h-12 bg-surface-alt/20"></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-text-placeholder font-bold">
                    {searchTerm ? "No results match your search." : "No audit logs found."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-alt/30 transition-colors group">
                    <td className="p-4 whitespace-nowrap text-text-muted font-medium">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[11px] text-accent font-black shrink-0 border border-accent/20">
                          {log.guest_actor_name ? log.guest_actor_name.charAt(0) : (log.profiles?.full_name?.charAt(0) || "A")}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-text-main font-bold truncate">
                            {log.guest_actor_name || log.profiles?.full_name || "System Admin"}
                          </span>
                          {log.guest_actor_name && (
                            <span className="text-[9px] text-accent font-black uppercase tracking-tighter flex items-center gap-1.5 opacity-80">
                              <i className="fas fa-globe text-[8px]"></i> Web Submission
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-text-main font-bold capitalize">{log.table_name.replace("_", " ")}</span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1.5 rounded-lg bg-accent/5 text-accent hover:bg-accent hover:text-accent-text transition-all font-black text-[10px] uppercase tracking-widest"
                      >
                        View Changes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ChangesModal 
        log={selectedLog} 
        onClose={() => setSelectedLog(null)} 
      />
    </div>
  );
};

export default AuditLogs;
