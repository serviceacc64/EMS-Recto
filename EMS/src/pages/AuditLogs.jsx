import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../context/NotificationContext";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out]">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-text-main text-[28px] font-black tracking-tight mb-1">
            System Audit Logs
          </h1>
          <p className="text-text-muted text-[14px] font-medium">
            Monitor administrative actions and data changes.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl bg-surface border border-border-subtle text-text-main hover:bg-surface-alt transition-all"
          title="Refresh Logs"
        >
          <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
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
                        onClick={() => console.log(log)}
                        className="text-accent hover:underline font-black text-[11px] uppercase tracking-wider"
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
    </div>
  );
};

export default AuditLogs;
