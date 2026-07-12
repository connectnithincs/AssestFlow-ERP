import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';

export const SignupView: React.FC = () => {
  const { signup, setCurrentPage } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert('Please fill all fields.');
      return;
    }
    signup(name, email);
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
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Create Account</h2>
            <p className="text-xs text-gray-500 font-medium">Join AssetFlow Enterprise Management System</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. John Doe" 
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
              required
            />
          </div>

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
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Password
            </label>
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
            Create Employee Account
          </button>
        </form>

        {/* Signin navigation link */}
        <div className="text-center pt-2 text-xs">
          <span className="text-gray-500">Already have an account? </span>
          <button 
            onClick={() => setCurrentPage('Login')}
            className="font-bold text-[#167C65] hover:underline"
          >
            Sign In
          </button>
        </div>

        {/* Footer Info */}
        <div className="text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-relaxed pt-2 border-t border-gray-100">
          <p>Every signup creates an Employee account only.</p>
          <p className="mt-0.5 text-gray-400 font-medium">Roles are assigned later by Admin.</p>
        </div>

      </div>
    </div>
  );
};
