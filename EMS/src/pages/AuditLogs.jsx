import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../context/NotificationContext";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const { showToast } = useNotifications();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          *,
          profiles:performed_by (full_name, role)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      showToast("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-1 h-4 bg-accent rounded-full opacity-50"></div>
          <span className="text-[10px] font-black text-text-placeholder uppercase tracking-[0.3em]">Activity Ledger</span>
        </div>
        <button
          onClick={fetchLogs}
          className="w-10 h-10 rounded-xl bg-surface border border-border-subtle text-text-main hover:bg-surface-alt transition-all flex items-center justify-center shadow-sm"
          title="Refresh Logs"
        >
          <i className={`fas fa-sync-alt text-xs ${loading ? 'animate-spin' : ''}`}></i>
        </button>
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
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-text-placeholder font-bold">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-alt/30 transition-colors group">
                    <td className="p-4 whitespace-nowrap text-text-muted font-medium">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent font-black">
                          {log.profiles?.full_name?.charAt(0) || "A"}
                        </div>
                        <span className="text-text-main font-bold">
                          {log.profiles?.full_name || "System Admin"}
                        </span>
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
