import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setIsLoading(false);

    if (error) {
      alert(error.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[440px] bg-surface/90 border border-border-subtle rounded-[28px] shadow-2xl p-8 md:p-12 animate-[slideIn_0.6s_cubic-bezier(0.16,1,0.3,1)] backdrop-blur-2xl transition-colors duration-300">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[60px] h-[60px] rounded-[20px] bg-surface-alt border border-accent/20 text-accent mb-6 shadow-md transition-transform duration-300 hover:scale-105">
             <i className="fas fa-users-cog text-[24px]"></i>
          </div>
          <h1 className="text-text-main text-[32px] mb-2 font-extrabold tracking-tight leading-tight">Welcome Back</h1>
          <p className="text-text-muted text-[15px] font-medium">Employee Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label htmlFor="email" className="text-text-muted font-semibold mb-2 text-[13px] uppercase tracking-wider">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-envelope text-text-placeholder"></i>
              </div>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Enter your admin email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3.5 pl-11 pr-4 border border-border-subtle rounded-[16px] text-[15px] transition-all duration-300 bg-surface-alt/60 text-text-main focus:bg-surface-alt focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 placeholder:text-text-placeholder font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-text-muted font-semibold text-[13px] uppercase tracking-wider">Password</label>
              <a href="#" className="text-[13px] font-semibold text-accent hover:text-accent-hover transition-colors">Forgot?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-lock text-text-placeholder"></i>
              </div>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Enter your password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3.5 pl-11 pr-4 border border-border-subtle rounded-[16px] text-[15px] transition-all duration-300 bg-surface-alt/60 text-text-main focus:bg-surface-alt focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 placeholder:text-text-placeholder font-medium"
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
              className="w-5 h-5 border border-border-subtle rounded-[6px] cursor-pointer accent-accent bg-surface-alt transition-all"
            />
            <label htmlFor="remember" className="ml-3 font-medium cursor-pointer text-[14px] text-text-muted select-none">Remember me for 30 days</label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-4 py-4 bg-accent text-accent-text rounded-[16px] text-[16px] font-bold cursor-pointer transition-all duration-300 shadow-md hover:-translate-y-1 hover:shadow-lg hover:bg-accent-hover active:translate-y-0 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-wait"
          >
            {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
            {!isLoading && <i className="fas fa-arrow-right text-[14px] transition-transform duration-300 group-hover:translate-x-1 opacity-80"></i>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
