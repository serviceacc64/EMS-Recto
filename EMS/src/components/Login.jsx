import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import PublicResultModal from "./PublicResultModal";

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { user, isAdmin } = useAuth();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user && isAdmin) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, navigate]);
  
  // Tabs: 'inquiry' or 'admin'
  const [activeTab, setActiveTab] = useState("inquiry");
  
  // Admin Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Inquiry State
  const [empNo, setEmpNo] = useState("");
  const [lastName, setLastName] = useState("");
  const [isInquiring, setIsInquiring] = useState(false);
  const [inquiryResult, setInquiryResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter both email and password", "error");
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    setIsLoading(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast(`Welcome back, Admin!`, "success");
      navigate("/dashboard");
    }
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!empNo || !lastName) {
      showToast("Please enter both Employee No. and Last Name", "warning");
      return;
    }
    setIsInquiring(true);
    try {
      const { data, error } = await supabase.rpc("get_public_personnel_data", {
        p_emp_no: empNo.trim(),
        p_last_name: lastName.trim()
      });

      if (error) throw error;

      if (!data) {
        showToast("No record found. Please check your credentials.", "error");
      } else {
        setInquiryResult(data);
        setShowResultModal(true);
      }
    } catch (err) {
      console.error("Inquiry error:", err);
      showToast("An error occurred during inquiry.", "error");
    } finally {
      setIsInquiring(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-surface-alt/30 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-icon-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[460px] relative z-10 py-4 flex flex-col min-h-0 max-h-screen">
        {/* Header - More compact */}
        <div className="text-center mb-6 animate-[fadeIn_0.6s_ease-out] shrink-0">
          <div className="inline-flex items-center justify-center w-[56px] h-[56px] rounded-[20px] bg-surface border border-border-subtle text-accent mb-3 shadow-xl transition-transform duration-500 hover:scale-105 hover:rotate-3">
            <i className="fas fa-university text-[22px]"></i>
          </div>
          <h1 className="text-text-main text-[28px] mb-1 font-black tracking-tight leading-tight">
            EMS-Recto
          </h1>
          <p className="text-text-muted text-[12px] font-bold uppercase tracking-[0.2em] opacity-70">
            Personnel Information System
          </p>
        </div>

        {/* Tab Switcher - More compact */}
        <div className="flex p-1 bg-surface border border-border-subtle rounded-[16px] mb-6 shadow-sm shrink-0">
          <button
            onClick={() => setActiveTab("inquiry")}
            className={`flex-1 py-2.5 text-[12px] font-black uppercase tracking-wider rounded-[12px] transition-all duration-300 ${
              activeTab === "inquiry"
                ? "bg-accent text-accent-text shadow-md"
                : "text-text-placeholder hover:text-text-main"
            }`}
          >
            <i className="fas fa-search mr-2"></i> Inquiry
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-2.5 text-[12px] font-black uppercase tracking-wider rounded-[12px] transition-all duration-300 ${
              activeTab === "admin"
                ? "bg-accent text-accent-text shadow-md"
                : "text-text-placeholder hover:text-text-main"
            }`}
          >
            <i className="fas fa-user-shield mr-2"></i> Admin Portal
          </button>
        </div>

        <div className="bg-surface/90 border border-border-subtle rounded-[28px] shadow-2xl p-6 md:p-8 backdrop-blur-2xl transition-all duration-500 hover:shadow-accent/5 animate-[slideIn_0.6s_cubic-bezier(0.16,1,0.3,1)] overflow-y-auto custom-scrollbar">
          {activeTab === "inquiry" ? (
            /* Inquiry Form */
            <div className="animate-[fadeIn_0.4s_ease-out]">
              <div className="mb-6">
                <h2 className="text-text-main text-[20px] font-black mb-1">Personnel Inquiry</h2>
                <p className="text-text-muted text-[13px] font-medium">Verify your record and leave status.</p>
              </div>

              <form onSubmit={handleInquirySubmit} className="flex flex-col gap-5">
                <div className="flex flex-col">
                  <label className="text-text-muted font-black mb-1.5 text-[10px] uppercase tracking-widest">Employee Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-placeholder group-focus-within:text-accent transition-colors">
                      <i className="fas fa-id-card text-sm"></i>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., EMS-2026-001"
                      value={empNo}
                      onChange={(e) => setEmpNo(e.target.value)}
                      className="w-full py-3 pl-10 pr-4 border border-border-subtle rounded-[14px] text-[14px] transition-all duration-300 bg-surface-alt/40 text-text-main focus:bg-surface focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 placeholder:text-text-placeholder font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-text-muted font-black mb-1.5 text-[10px] uppercase tracking-widest">Last Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-placeholder group-focus-within:text-accent transition-colors">
                      <i className="fas fa-user text-sm"></i>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full py-3 pl-10 pr-4 border border-border-subtle rounded-[14px] text-[14px] transition-all duration-300 bg-surface-alt/40 text-text-main focus:bg-surface focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 placeholder:text-text-placeholder font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isInquiring}
                  className="w-full mt-2 py-3.5 bg-accent text-accent-text rounded-[14px] text-[15px] font-black cursor-pointer transition-all duration-300 shadow-lg hover:-translate-y-1 hover:shadow-accent/20 hover:bg-accent-hover active:translate-y-0 flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {isInquiring ? "Searching..." : "Verify Identity"}
                  {!isInquiring && <i className="fas fa-search text-[12px] transition-transform group-hover:scale-110"></i>}
                </button>
              </form>
            </div>
          ) : (
            /* Admin Portal Form */
            <div className="animate-[fadeIn_0.4s_ease-out]">
              <div className="mb-6">
                <h2 className="text-text-main text-[20px] font-black mb-1">Admin Portal</h2>
                <p className="text-text-muted text-[13px] font-medium">Access system dashboard.</p>
              </div>

              <form onSubmit={handleAdminSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col">
                  <label className="text-text-muted font-black mb-1.5 text-[10px] uppercase tracking-widest">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-placeholder group-focus-within:text-accent transition-colors">
                      <i className="fas fa-envelope text-sm"></i>
                    </div>
                    <input
                      type="email"
                      placeholder="admin@ems.gov"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-3 pl-10 pr-4 border border-border-subtle rounded-[14px] text-[14px] transition-all duration-300 bg-surface-alt/40 text-text-main focus:bg-surface focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 placeholder:text-text-placeholder font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-text-muted font-black mb-1.5 text-[10px] uppercase tracking-widest">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-placeholder group-focus-within:text-accent transition-colors">
                      <i className="fas fa-lock text-sm"></i>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-3 pl-10 pr-12 border border-border-subtle rounded-[14px] text-[14px] transition-all duration-300 bg-surface-alt/40 text-text-main focus:bg-surface focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 placeholder:text-text-placeholder font-bold"
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 bg-accent text-accent-text rounded-[14px] text-[15px] font-black cursor-pointer transition-all duration-300 shadow-lg hover:-translate-y-1 hover:shadow-accent/20 hover:bg-accent-hover active:translate-y-0 flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {isLoading ? "Signing In..." : "Login to System"}
                  {!isLoading && <i className="fas fa-arrow-right text-[12px] transition-transform group-hover:translate-x-1"></i>}
                </button>
              </form>
            </div>
          )}
        </div>
        
        {/* Footer info - Compact */}
        <div className="text-center mt-6 animate-[fadeIn_1s_ease-out] shrink-0">
          <p className="text-text-placeholder text-[10px] font-black uppercase tracking-[0.2em]">
            © 2026 EMS-Recto Institutional Systems
          </p>
        </div>
      </div>

      {/* Result Modal */}
      <PublicResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        data={inquiryResult}
      />
    </div>
  );
};

export default Login;
