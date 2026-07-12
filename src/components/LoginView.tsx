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

    const success = login(email);
    if (!success) {
      setError('Invalid email address. Please select a demo user or enter a registered email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#14161a] relative overflow-hidden">
      <div className="absolute top-[-220px] right-[-160px] w-[640px] h-[640px] rounded-full blur-[120px] bg-[radial-gradient(circle,_rgba(58,129,245,0.16),_transparent_70%)]" />
      <div className="absolute bottom-[-260px] left-[-180px] w-[520px] h-[520px] rounded-full blur-[120px] bg-[radial-gradient(circle,_rgba(47,91,255,0.10),_transparent_70%)]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-3 font-semibold text-lg tracking-[-0.01em]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3a81f5] to-[#0031fe] shadow-[0_4px_16px_rgba(47,91,255,0.45)]">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
              <path d="M4 12L10 6L14 10L20 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 4H20V10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          AssetFlow
        </div>
        <div className="hidden items-center gap-7 text-sm font-medium text-[#5b5f68] md:flex">
          <a href="#" className="transition hover:text-[#14161a]">Home</a>
          <a href="#" className="transition hover:text-[#14161a]">Features</a>
          <a href="#" className="transition hover:text-[#14161a]">About</a>
          <a href="#" className="transition hover:text-[#14161a]">Contact</a>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 py-8 lg:px-12 lg:py-10 xl:flex-row xl:items-center xl:gap-14 xl:py-14">
        <section className="max-w-2xl pb-10 xl:pb-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfe6f7] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3a81f5] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#3a81f5] shadow-[0_0_0_3px_rgba(58,129,245,0.25)]" />
            Now tracking 40,000+ assets live
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[#14161a] sm:text-5xl lg:text-6xl">
            Manage Every Asset with{' '}
            <span className="bg-gradient-to-r from-[#3a81f5] via-[#8fb3ff] to-[#3a81f5] bg-clip-text text-transparent">
              Total Confidence
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#5b5f68]">
            Track assets in real time, automate maintenance, and give every team a single source of truth from one polished ERP experience.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => login(email)}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#3a81f5] to-[#0031fe] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(47,91,255,0.4)] transition hover:-translate-y-0.5"
            >
              Continue to Dashboard
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('Signup')}
              className="inline-flex items-center justify-center rounded-full border border-[#d7dce6] bg-white px-6 py-3 text-sm font-semibold text-[#14161a] transition hover:bg-[#f4f6fb]"
            >
              Create Account
            </button>
          </div>

          <div className="mt-10 border-t border-[#e4e7ef] pt-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8c8f97]">
              Trusted by 500+ organizations worldwide
            </p>
            <div className="flex flex-wrap gap-5 text-sm font-semibold text-[#5b5f68]">
              <span>Nordholm</span>
              <span>Vantage Rail</span>
              <span>Circa</span>
              <span>Portside Logistics</span>
              <span>Ferrow</span>
            </div>
          </div>
        </section>

        <div className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(20,22,26,0.14)] backdrop-blur md:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3a81f5] to-[#0031fe] text-2xl font-extrabold text-white shadow-md">
              A
            </div>
            <h2 className="text-2xl font-bold text-[#14161a]">Welcome back</h2>
            <p className="mt-2 text-sm text-[#5b5f68]">Sign in to access the AssetFlow dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6e73]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#14161a] outline-none transition focus:border-[#3a81f5]"
                required
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6e73]">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[10px] font-bold text-[#3a81f5] hover:underline"
                  onClick={() => alert('Forgot Password functionality is disabled for this demo.')}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#14161a] outline-none transition focus:border-[#3a81f5]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#167C65] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#126351]"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 border-t border-[#eef0f2] pt-4">
            <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6e73]">
              Quick Demo Accounts
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {users.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    login(u.email);
                  }}
                  className="rounded-lg border border-[#e5e7eb] bg-[#f7f8fa] px-3 py-2 text-left text-sm font-semibold text-[#14161a] transition hover:bg-[#f0f2f6]"
                >
                  {u.name}
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8c8f97]">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 text-center text-sm text-[#5b5f68]">
            Don’t have an account?{' '}
            <button onClick={() => setCurrentPage('Signup')} className="font-bold text-[#167C65] hover:underline">
              Sign Up
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
