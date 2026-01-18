import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Loader2, 
  LogIn,
  AlertCircle,
  ArrowLeft,
  SendHorizontal
} from 'lucide-react';
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from '../services/firebase';
import { BackgroundGradientAnimation } from './ui/background-gradient-animation';

const AuthPage: React.FC = () => {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Auth Error:", err);
      let message = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/invalid-credential') message = 'Invalid email or password.';
      if (err.code === 'auth/too-many-requests') message = 'Access temporarily disabled. Try again later.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Reset protocol initiated. Please check your email inbox.');
    } catch (err: any) {
      setError('Failed to send reset link. Verify your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden font-poppins">
      <BackgroundGradientAnimation 
        containerClassName="opacity-100"
        gradientBackgroundStart="rgb(248, 250, 252)" 
        gradientBackgroundEnd="rgb(226, 232, 240)"
        firstColor="186, 230, 253"
        secondColor="191, 219, 254"
        thirdColor="219, 234, 254"
        fourthColor="224, 242, 254"
        fifthColor="241, 245, 249"
        pointerColor="37, 99, 235"
      />

      <div className="liquid-glass w-full max-w-[450px] p-8 lg:p-12 relative z-10 animate-in zoom-in-95 duration-500 shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-6 scale-110">
            <ShieldCheck size={32} />
          </div>
          <h1 className="font-title text-5xl text-slate-900 tracking-tight leading-none text-center">
            <span className="text-blue-600 font-bold italic mr-2">Cekap</span>Guard
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 font-poppins">
            {view === 'login' ? 'Security Access Protocol' : 'Recovery Protocol'}
          </p>
        </div>

        {view === 'login' ? (
          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wider leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Credential Hub</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="email" required placeholder="identity@cekapguard.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Vector</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full btn-premium py-4 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] font-bold shadow-xl shadow-blue-500/10 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              Authorize Session
            </button>

            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
              >
                Forgot Password / First Time Access?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5 animate-in slide-in-from-right-4">
            {error && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3 text-red-600">
                <AlertCircle size={18} />
                <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3 text-emerald-600">
                <ShieldCheck size={18} />
                <p className="text-[10px] font-bold uppercase tracking-wider">{success}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Registered Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" required placeholder="identity@cekapguard.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl text-sm font-bold outline-none shadow-inner"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading || success !== ''}
              className="w-full btn-premium py-4 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] font-bold shadow-xl shadow-blue-500/10"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <SendHorizontal size={18} />}
              Request Reset Link
            </button>

            <button 
              type="button" 
              onClick={() => setView('login')}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Entry
            </button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Unauthorized access attempts are monitored by corporate security protocols.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;