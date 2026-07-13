import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Eye, EyeOff, Zap, ArrowLeft, ShieldCheck } from 'lucide-react';

export const SignupView: React.FC = () => {
  const { signup, setCurrentPage } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    signup(name, email);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050f0e 0%, #0a2420 35%, #0f3830 60%, #167C65 100%)' }}>

      {/* Decorative orbs */}
      <div className="absolute top-[-120px] right-[-80px] w-[480px] h-[480px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #167C65 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-100px] left-[-60px] w-[360px] h-[360px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-[420px] animate-slide-up">
        <div className="glass rounded-2xl p-8 space-y-6"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12) inset' }}>

          {/* Brand */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
              style={{ background: 'linear-gradient(135deg, #167C65 0%, #0e5a4a 100%)', boxShadow: '0 8px 24px rgba(22,124,101,0.45)' }}>
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Create Account
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Join AssetFlow Enterprise Management</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="input-field pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Employee Account'}
            </button>
          </form>

          {/* Role notice */}
          <div className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-green-700 leading-relaxed font-medium">
              New accounts are always created as <strong>Employee</strong> role. Elevated roles are assigned exclusively by an Admin from the employee directory.
            </p>
          </div>

          <div className="text-center text-xs">
            <button onClick={() => setCurrentPage('Login')}
              className="flex items-center gap-1.5 text-[#167C65] font-bold hover:underline mx-auto">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
