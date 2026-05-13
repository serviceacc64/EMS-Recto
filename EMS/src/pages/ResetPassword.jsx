import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../context/NotificationContext";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  useEffect(() => {
    // Check if we have a recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast("Session expired or invalid. Please request a new link.", "error");
        navigate("/");
      }
    };
    checkSession();
  }, [navigate, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast("Passwords do not match!", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "warning");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Log out to force them to test the new password
      await supabase.auth.signOut();
      
      showToast("Password updated successfully! Please login with your new credentials.", "success");
      navigate("/");
    } catch (err) {
      console.error("Update error:", err);
      showToast(err.message || "Failed to update password", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-surface-alt/30 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border-subtle text-accent mb-4 shadow-xl">
            <i className="fas fa-shield-alt text-2xl"></i>
          </div>
          <h1 className="text-text-main text-2xl font-black tracking-tight">Set New Password</h1>
          <p className="text-text-muted text-sm font-medium mt-1">Choose a strong password for your account.</p>
        </div>

        <div className="bg-surface/90 border border-border-subtle rounded-[28px] shadow-2xl p-8 backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              <label className="text-text-muted font-black mb-2 text-[10px] uppercase tracking-widest pl-1">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-placeholder group-focus-within:text-accent transition-colors">
                  <i className="fas fa-lock text-sm"></i>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 pl-10 pr-12 border border-border-subtle rounded-[14px] text-[14px] transition-all bg-surface-alt/40 text-text-main focus:bg-surface focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-placeholder hover:text-accent transition-colors"
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-text-muted font-black mb-2 text-[10px] uppercase tracking-widest pl-1">Confirm New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-placeholder group-focus-within:text-accent transition-colors">
                  <i className="fas fa-check-circle text-sm"></i>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-3 pl-10 pr-12 border border-border-subtle rounded-[14px] text-[14px] transition-all bg-surface-alt/40 text-text-main focus:bg-surface focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-accent text-accent-text rounded-[16px] text-[15px] font-black transition-all shadow-lg hover:-translate-y-1 hover:shadow-accent/25 hover:bg-accent-hover active:translate-y-0 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? "Updating..." : "Update Password"}
              {!isLoading && <i className="fas fa-check"></i>}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <button 
            onClick={() => navigate("/")}
            className="text-text-placeholder text-[11px] font-black uppercase tracking-widest hover:text-text-main transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
