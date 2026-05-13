import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

const AdminManagement = () => {
  const { showToast } = useNotifications();
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("role", { ascending: false })
        .order("full_name", { ascending: true });

      if (error) throw error;
      setAdmins(data);
    } catch (err) {
      console.error("Error fetching admins:", err);
      showToast("Failed to load admin list", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId, currentRole, newRole) => {
    if (targetUserId === currentUser.id) {
      showToast("You cannot change your own role.", "warning");
      return;
    }

    const confirmMsg = `Are you sure you want to change this user's role from ${currentRole} to ${newRole}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", targetUserId);

      if (error) throw error;
      
      showToast("Role updated successfully", "success");
      fetchAdmins();
    } catch (err) {
      console.error("Error updating role:", err);
      showToast("Failed to update role", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "super_admin":
        return "bg-accent text-accent-text";
      case "admin":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      default:
        return "bg-surface-alt text-text-muted";
    }
  };

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out]">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-1 h-4 bg-accent rounded-full opacity-50"></div>
          <span className="text-[10px] font-black text-text-placeholder uppercase tracking-[0.3em]">Administrator Privileges</span>
        </div>
        <button
          onClick={fetchAdmins}
          disabled={loading}
          className="w-10 h-10 rounded-xl bg-surface border border-border-subtle text-text-main hover:bg-surface-alt transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
          title="Refresh List"
        >
          <i className={`fas fa-sync-alt text-xs ${loading ? 'animate-spin' : ''}`}></i>
        </button>
      </div>

      <div className="flex-1 bg-surface border border-border-subtle rounded-[24px] overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="sticky top-0 bg-surface/80 backdrop-blur-md z-10">
              <tr className="border-b border-border-subtle">
                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-text-placeholder">Admin User</th>
                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-text-placeholder">Current Role</th>
                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-text-placeholder text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="3" className="p-5 h-16 bg-surface-alt/20"></td>
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-12 text-center text-text-placeholder font-bold italic">
                    No administrator profiles found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-surface-alt/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-alt border border-border-subtle flex items-center justify-center text-[12px] text-text-main font-black shrink-0 shadow-sm">
                          {admin.full_name?.charAt(0) || "A"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-text-main font-black truncate leading-tight">
                            {admin.full_name}
                            {admin.id === currentUser.id && (
                              <span className="ml-2 text-[9px] text-accent font-black uppercase">(You)</span>
                            )}
                          </span>
                          <span className="text-text-placeholder text-[10px] font-medium">
                            Joined {new Date(admin.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getRoleBadge(admin.role)}`}>
                        {admin.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-2">
                        {admin.id !== currentUser.id ? (
                          <>
                            {admin.role === "admin" ? (
                              <button
                                onClick={() => handleRoleChange(admin.id, admin.role, "super_admin")}
                                disabled={isUpdating}
                                className="px-4 py-2 bg-accent/5 text-accent border border-accent/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-accent-text transition-all active:scale-95 disabled:opacity-50"
                              >
                                Promote to Super Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleChange(admin.id, admin.role, "admin")}
                                disabled={isUpdating}
                                className="px-4 py-2 bg-red-500/5 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                              >
                                Demote to Admin
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-text-placeholder text-[10px] font-bold uppercase italic opacity-50">
                            Self-Management Disabled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-5 bg-surface-alt/30 border border-border-subtle rounded-[20px] flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
          <i className="fas fa-info-circle text-lg"></i>
        </div>
        <div>
          <h4 className="text-text-main text-[13px] font-black uppercase tracking-widest mb-1">Role Definitions</h4>
          <p className="text-text-muted text-[12px] font-medium leading-relaxed m-0">
            <strong className="text-accent">Super Admin:</strong> Full access to system settings, role management, and sensitive operations.
            <br />
            <strong className="text-blue-500">Admin:</strong> Can manage personnel and leaves, but cannot change roles or delete critical logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
