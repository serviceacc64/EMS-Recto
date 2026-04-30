import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }
    
    // Check credentials
    if (username === 'admin' && password === '123') {
      navigate('/dashboard');
    } else {
      alert('Invalid username or password');
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[440px] bg-white/80 border border-white/60 rounded-[28px] shadow-[0_40px_80px_rgba(15,23,32,0.08),inset_0_1px_0_rgba(255,255,255,1)] p-8 md:p-12 animate-[slideIn_0.6s_cubic-bezier(0.16,1,0.3,1)] backdrop-blur-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[60px] h-[60px] rounded-[20px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white mb-6 shadow-[0_16px_32px_rgba(79,70,229,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform duration-300 hover:scale-105">
             <i className="fas fa-users-cog text-[24px]"></i>
          </div>
          <h1 className="text-[#0f1720] text-[32px] mb-2 font-extrabold tracking-tight leading-tight">Welcome Back</h1>
          <p className="text-[#64748b] text-[15px] font-medium">Employee Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label htmlFor="username" className="text-[#334155] font-semibold mb-2 text-[13px] uppercase tracking-wider">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-user text-[#94a3b8]"></i>
              </div>
              <input 
                type="text" 
                id="username" 
                name="username" 
                placeholder="Enter your username" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full py-3.5 pl-11 pr-4 border border-[#e2e8f0] rounded-[16px] text-[15px] transition-all duration-300 bg-white/60 text-[#0f1720] focus:bg-white focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] placeholder:text-[#94a3b8] font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-[#334155] font-semibold text-[13px] uppercase tracking-wider">Password</label>
              <a href="#" className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-lock text-[#94a3b8]"></i>
              </div>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Enter your password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3.5 pl-11 pr-4 border border-[#e2e8f0] rounded-[16px] text-[15px] transition-all duration-300 bg-white/60 text-[#0f1720] focus:bg-white focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] placeholder:text-[#94a3b8] font-medium"
              />
            </div>
          </div>

          <div className="flex items-center pt-2">
            <input 
              type="checkbox" 
              id="remember" 
              name="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-5 h-5 border border-[#cbd5e1] rounded-[6px] cursor-pointer accent-blue-600 transition-all"
            />
            <label htmlFor="remember" className="ml-3 font-medium cursor-pointer text-[14px] text-[#475569] select-none">Remember me for 30 days</label>
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 py-4 bg-gradient-to-r from-[#0f1720] to-[#1e293b] text-white rounded-[16px] text-[16px] font-bold cursor-pointer transition-all duration-300 shadow-[0_12px_24px_rgba(15,23,32,0.15)] hover:-translate-y-1 hover:shadow-[0_20px_32px_rgba(15,23,32,0.25)] hover:from-[#1e293b] hover:to-[#0f1720] active:translate-y-0 flex items-center justify-center gap-2 group"
          >
            Sign In to Dashboard
            <i className="fas fa-arrow-right text-[14px] transition-transform duration-300 group-hover:translate-x-1 opacity-80"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
