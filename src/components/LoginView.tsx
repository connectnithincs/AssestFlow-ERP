import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Eye, EyeOff, Zap } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users, setCurrentPage } = useAppState();
  const [email, setEmail] = useState('priya.sharma@assetflow.com');
  const [password, setPassword] = useState('password');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const success = login(email);
    if (!success) {
      setError('Invalid email. Use a demo account below or a registered email.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050f0e 0%, #0a2420 35%, #0f3830 60%, #167C65 100%)' }}>
      
      {/* Decorative glowing orbs */}
      <div className="absolute top-[-120px] right-[-80px] w-[480px] h-[480px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #167C65 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-100px] left-[-60px] w-[360px] h-[360px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-[420px] animate-slide-up">
        {/* Card */}
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
                AssetFlow
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Enterprise Asset & Resource Management</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold text-red-700 animate-slide-up"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email Address</label>
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
              <div className="flex justify-between items-center mb-1">
                <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
                <button type="button" className="text-[10px] font-bold text-[#167C65] hover:underline"
                  onClick={() => alert('Password reset is disabled in this demo.')}>
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Quick demo login
              </span>
            </div>
          </div>

          {/* Demo Users */}
          <div className="grid grid-cols-2 gap-2">
            {users.slice(0, 4).map((u, i) => (
              <button
                key={u.id}
                type="button"
                onClick={() => { setEmail(u.email); login(u.email); }}
                className={`text-left p-2.5 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer animate-slide-up stagger-${i + 1}`}
                style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#167C65'; (e.currentTarget as HTMLElement).style.background = '#ecfdf8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #167C65, #0e5a4a)' }}>
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-gray-800 truncate">{u.name}</div>
                    <div className="text-[9px] font-semibold uppercase tracking-wide"
                      style={{ color: u.role === 'Admin' ? '#e11d48' : u.role === 'Asset Manager' ? '#167C65' : u.role === 'Department Head' ? '#2563eb' : '#64748b' }}>
                      {u.role}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Sign up link */}
          <div className="text-center text-xs">
            <span className="text-gray-500">Don't have an account? </span>
            <button onClick={() => setCurrentPage('Signup')}
              className="font-bold text-[#167C65] hover:underline">
              Sign Up
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-400 leading-relaxed border-t border-gray-100 pt-4">
            Signups create Employee accounts only. Admins assign elevated roles.
          </p>
        </div>
      </div>
    </div>
  );
};
