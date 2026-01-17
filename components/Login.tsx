import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Video, Facebook, ArrowLeft, CheckCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setLoading(true);
    // Simulate network authentication delay
    setTimeout(() => {
      onLogin();
    }, 1000);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate password reset email sending
    setTimeout(() => {
      setLoading(false);
      setResetSent(true);
    }, 1500);
  };

  const MicrosoftLogo = () => (
    <svg width="18" height="18" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#f25022" d="M1 1H10V10H1Z"/>
      <path fill="#00a4ef" d="M1 12H10V21H1Z"/>
      <path fill="#7fba00" d="M12 1H21V10H12Z"/>
      <path fill="#ffb900" d="M12 12H21V21H12Z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Video size={32} className="text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center text-white mb-2">
            {isResetMode ? "Reset Password" : "Face Recognition"}
          </h2>
          <p className="text-slate-400 text-center mb-8">
            {isResetMode 
              ? (resetSent ? "Check your inbox" : "Enter email to reset password") 
              : "Sign in or Sign up"}
          </p>

          {isResetMode && resetSent ? (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-lg border border-emerald-500/20 flex flex-col items-center gap-2">
                    <CheckCircle size={32} />
                    <p className="text-sm">We've sent a password reset link to your email address.</p>
                </div>
                <button 
                  onClick={() => { setIsResetMode(false); setResetSent(false); }}
                  className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 w-full transition-colors group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Sign In
                </button>
            </div>
          ) : (
            <form onSubmit={isResetMode ? handleReset : handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                    placeholder="admin@facetrace.ai"
                  />
                </div>
              </div>

              {!isResetMode && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                    <button 
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="text-xs text-emerald-500 hover:text-emerald-400 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {isResetMode ? "Sending..." : "Authenticating..."}
                  </span>
                ) : (
                  <>
                    {isResetMode ? "Send Reset Link" : "Sign In"} <ArrowRight size={18} />
                  </>
                )}
              </button>

              {isResetMode && (
                 <button 
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="w-full text-slate-500 hover:text-slate-300 text-sm transition-colors pt-2"
                >
                  Cancel
                </button>
              )}
            </form>
          )}

          {/* Social Login Divider - Only show if not in reset mode */}
          {!isResetMode && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-500">Or continue with</span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleLogin()}
                  className="flex items-center justify-center gap-2 py-2.5 border border-slate-700 rounded-lg text-slate-300 hover:bg-[#1877F2]/10 hover:border-[#1877F2]/50 hover:text-white transition-all disabled:opacity-50"
                >
                  <Facebook size={18} className="text-[#1877F2]" />
                  <span className="text-sm font-medium">Facebook</span>
                </button>
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleLogin()}
                  className="flex items-center justify-center gap-2 py-2.5 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
                >
                  <MicrosoftLogo />
                  <span className="text-sm font-medium">Microsoft</span>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-slate-500">
                  By accessing this system, you agree to the <span className="text-emerald-500/80 cursor-pointer hover:underline">Privacy Policy</span> and <span className="text-emerald-500/80 cursor-pointer hover:underline">Terms of Service</span>.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};