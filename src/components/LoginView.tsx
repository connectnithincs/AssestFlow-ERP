import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';

export const LoginView: React.FC = () => {
  const { login, users, setCurrentPage } = useAppState();
  const [email, setEmail] = useState('priya.sharma@assetflow.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // In our prototype, password check is mocked, email must match a preseeded user
    const success = login(email);
    if (!success) {
      setError('Invalid email address. Please select a demo user or enter a registered email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-[#167C65] items-center justify-center shadow-sm mx-auto">
            <span className="text-white font-extrabold text-2xl">A</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">AssetFlow</h2>
            <p className="text-xs text-gray-500 font-medium">Enterprise Asset & Resource Management ERP</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@company.com" 
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Password
              </label>
              <button 
                type="button"
                className="text-[10px] font-bold text-[#167C65] hover:underline"
                onClick={() => alert('Forgot Password functionality is disabled for this demo.')}
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </form>

        {/* Quick Demo Logins Helper */}
        <div className="pt-2 border-t border-gray-150">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2 text-center">
            Quick-Login Demo Accounts
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {users.slice(0, 4).map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setEmail(u.email);
                  login(u.email);
                }}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold py-1.5 px-2 rounded-lg text-left truncate transition-colors"
              >
                {u.name}
                <span className="block text-[8px] text-gray-400 font-semibold uppercase leading-none mt-0.5">{u.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Register navigation link */}
        <div className="text-center pt-2 text-xs">
          <span className="text-gray-500">Don't have an account? </span>
          <button 
            onClick={() => setCurrentPage('Signup')}
            className="font-bold text-[#167C65] hover:underline"
          >
            Sign Up
          </button>
        </div>

        {/* Footer Roles Info */}
        <div className="text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-relaxed pt-2 border-t border-gray-100">
          <p>Signup only creates Employee accounts.</p>
          <p className="mt-0.5 text-gray-400 font-medium">Only Admin can assign Department Head & Manager roles.</p>
        </div>

      </div>
    </div>
  );
};
