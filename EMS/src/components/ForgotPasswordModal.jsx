import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../context/NotificationContext";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { showToast } = useNotifications();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast("Please enter your email address", "warning");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSent(true);
      showToast("Reset link sent to your email!", "success");
    } catch (err) {
      console.error("Reset error:", err);
      showToast(err.message || "Failed to send reset link", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-surface rounded-[28px] shadow-2xl w-full max-w-[400px] border border-border-subtle overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <i className="fas fa-key text-xl"></i>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-alt flex items-center justify-center text-text-placeholder transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {!isSent ? (
            <>
              <h2 className="text-text-main text-[22px] font-black mb-2 tracking-tight">Forgot Password?</h2>
              <p className="text-text-muted text-[14px] font-medium mb-6 leading-relaxed">
                No worries! Enter the email associated with your admin account and we'll send you a secure reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col">
                  <label className="text-text-muted font-black mb-1.5 text-[10px] uppercase tracking-widest pl-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-placeholder group-focus-within:text-accent transition-colors">
                      <i className="fas fa-envelope text-sm"></i>
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="admin@ems.gov"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-3 pl-10 pr-4 border border-border-subtle rounded-[14px] text-[14px] transition-all bg-surface-alt/40 text-text-main focus:bg-surface focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-accent text-accent-text rounded-[14px] text-[15px] font-black transition-all shadow-lg hover:-translate-y-1 hover:bg-accent-hover active:translate-y-0 disabled:opacity-70"
                >
                  {isLoading ? "Sending Link..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 animate-[fadeIn_0.5s_ease-out]">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <i className="fas fa-paper-plane text-2xl"></i>
              </div>
              <h2 className="text-text-main text-[22px] font-black mb-2 tracking-tight">Check Your Inbox!</h2>
              <p className="text-text-muted text-[14px] font-medium leading-relaxed mb-8 px-2">
                We've sent a password reset link to <strong className="text-text-main">{email}</strong>. Please check your email (and spam folder) to proceed.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-surface-alt text-text-main border border-border-subtle rounded-[14px] text-[14px] font-black hover:bg-surface-hover transition-all"
              >
                Close & Wait
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
