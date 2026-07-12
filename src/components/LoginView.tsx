import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';

export const LoginView: React.FC = () => {
  const { login, users, setCurrentPage } = useAppState();
  const [email, setEmail] = useState('priya.sharma@assetflow.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(email);
    if (!success) {
      setError('Invalid email address. Please select a demo user or enter a registered email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#14161a] relative overflow-hidden flex flex-col">
      {/* Background glow using emerald/green colors matching the dashboard */}
      <div className="absolute top-[-220px] right-[-160px] w-[640px] h-[640px] rounded-full blur-[120px] bg-[radial-gradient(circle,_rgba(22,124,101,0.12),_transparent_70%)]" />
      <div className="absolute bottom-[-260px] left-[-180px] w-[520px] h-[520px] rounded-full blur-[120px] bg-[radial-gradient(circle,_rgba(22,124,101,0.08),_transparent_70%)]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12 border-b border-[#e5e7eb]/80 bg-white/50 backdrop-blur-md">
        <div 
          className="flex items-center gap-3 font-semibold text-lg tracking-[-0.01em] cursor-pointer"
          onClick={() => setShowLoginForm(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#167C65] to-[#126351] shadow-[0_4px_16px_rgba(22,124,101,0.4)]">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
              <path d="M4 12L10 6L14 10L20 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 4H20V10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          AssetFlow
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-7 text-sm font-medium text-[#5b5f68] md:flex">
            <button onClick={() => setShowLoginForm(false)} className="transition hover:text-[#167C65] cursor-pointer">Home</button>
            <a href="#" className="transition hover:text-[#167C65]">Features</a>
            <a href="#" className="transition hover:text-[#167C65]">About</a>
            <a href="#" className="transition hover:text-[#167C65]">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLoginForm(true)}
              className="text-sm font-semibold text-[#5b5f68] hover:text-[#167C65] transition px-4 py-2 cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => setCurrentPage('Signup')}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#167C65] to-[#126351] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-105 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 mx-auto flex-1 flex max-w-7xl flex-col px-6 py-8 lg:px-12 lg:py-10 w-full justify-center">
        {!showLoginForm ? (
          <div className="flex flex-col xl:flex-row xl:items-center xl:gap-14 xl:py-14 w-full animate-fade-in">
            {/* Left Column: Hero Copy */}
            <section className="max-w-2xl pb-10 xl:pb-0 flex-1">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#167C65]/20 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#167C65] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#167C65] shadow-[0_0_0_3px_rgba(22,124,101,0.25)] animate-pulse" />
                Now tracking 40,000+ assets live
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[#14161a] sm:text-5xl lg:text-6xl">
                Manage Every Asset with{' '}
                <span className="bg-gradient-to-r from-[#167C65] via-[#3ebd9f] to-[#167C65] bg-clip-text text-transparent">
                  Total Confidence
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#5b5f68]">
                Track assets in real time, automate maintenance, and give every team a single source of truth from one polished ERP experience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setShowLoginForm(true)}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#167C65] to-[#126351] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(22,124,101,0.2)] transition hover:-translate-y-0.5 cursor-pointer"
                >
                  Login to System
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('Signup')}
                  className="inline-flex items-center justify-center rounded-full border border-[#d7dce6] bg-white px-6 py-3 text-sm font-semibold text-[#14161a] transition hover:bg-[#f4f6fb] cursor-pointer"
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

            {/* Right Column: Mock Dashboard Preview */}
            <section className="flex-1 flex justify-center w-full max-w-2xl">
              <div className="w-full relative">
                <div className="absolute z-0 -inset-6 bg-gradient-to-tr from-[#167C65]/10 to-transparent blur-2xl rounded-full" />
                <div className="absolute -top-4 right-6 z-20 bg-[#14161a] text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[#17a672] animate-pulse" />
                  Live: QR Warehouse Scan
                </div>

                <div className="relative z-10 bg-white/85 border border-white/60 rounded-[28px] p-6 shadow-[0_24px_60px_rgba(20,22,26,0.06)] backdrop-blur grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-3 flex flex-col gap-4">
                    <div className="bg-[#f7f8fa]/90 border border-[#e7e9ef] rounded-[18px] p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#6b6e73] mb-3">
                        <span className="w-[22px] h-[22px] rounded-[7px] bg-[#e7fffa] flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3"><path d="M3 17l6-6 4 4 8-8" stroke="#167C65" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        Utilization Trend
                      </div>
                      <div className="text-2xl font-black text-[#14161a]">78.4%</div>
                      <div className="flex items-end gap-1.5 h-16 mt-3">
                        <div className="flex-1 rounded-t bg-gradient-to-t from-[#167C65]/20 to-[#167C65] h-[35%]"></div>
                        <div className="flex-1 rounded-t bg-gradient-to-t from-[#167C65]/20 to-[#167C65] h-[52%]"></div>
                        <div className="flex-1 rounded-t bg-gradient-to-t from-[#167C65]/20 to-[#167C65] h-[40%]"></div>
                        <div className="flex-1 rounded-t bg-gradient-to-t from-[#167C65]/20 to-[#167C65] h-[68%]"></div>
                        <div className="flex-1 rounded-t bg-gradient-to-t from-[#167C65]/20 to-[#167C65] h-[58%]"></div>
                        <div className="flex-1 rounded-t bg-gradient-to-t from-[#167C65]/20 to-[#167C65] h-[82%]"></div>
                        <div className="flex-1 rounded-t bg-gradient-to-t from-[#167C65]/20 to-[#167C65] h-full"></div>
                      </div>
                      <div className="flex justify-between mt-2 text-[9px] font-bold text-[#9a9da3] tracking-wide">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                        <span>Sun</span>
                      </div>
                    </div>

                    <div className="bg-[#f7f8fa]/90 border border-[#e7e9ef] rounded-[18px] p-4 shadow-sm flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#6b6e73] mb-3">
                        <span className="w-[22px] h-[22px] rounded-[7px] bg-[#eef0f2] flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3"><path d="M12 6v6l4 2" stroke="#6b6e73" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#6b6e73" strokeWidth="2.2"/></svg>
                        </span>
                        Recent Activity
                      </div>
                      <div className="space-y-3 flex-1 flex flex-col justify-center text-left">
                        <div className="flex items-start gap-2.5 pb-2.5 border-b border-[#e7e9ef]">
                          <span className="w-5 h-5 rounded-md bg-[#e4f7ee] flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 stroke-[#17a672]"><path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                          <div>
                            <strong className="block text-xs font-semibold text-[#15171a]">Forklift #A-204 passed inspection</strong>
                            <span className="text-[10px] text-[#8b8e94]">2 minutes ago</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-[#fdefe0] flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 stroke-[#d98a1f]"><path d="M12 8v5M12 16h.01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" strokeWidth="2.5"/></svg>
                          </span>
                          <div>
                            <strong className="block text-xs font-semibold text-[#15171a]">HVAC Unit B-12 maintenance due</strong>
                            <span className="text-[10px] text-[#8b8e94]">Scheduled reminder</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-4">
                    <div className="bg-[#fff4ea] border border-[#f3ddc2] rounded-[18px] p-4 shadow-sm text-left">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7a5a26] mb-2">
                        <span className="w-5 h-5 rounded-md bg-[#f4a531] flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 stroke-white"><path d="M12 8v5M12 16h.01" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        Alert
                      </div>
                      <p className="text-xs text-[#7a5a26] font-medium leading-relaxed">
                        3 assets need attention this week across 2 sites.
                      </p>
                    </div>

                    <div className="bg-[#f7f8fa]/90 border border-[#e7e9ef] rounded-[18px] p-4 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="relative w-[76px] h-[76px] flex-shrink-0 mb-3">
                        <svg width="76" height="76" viewBox="0 0 76 76" className="transform -rotate-90">
                          <circle cx="38" cy="38" r="32" fill="none" stroke="#eceef1" strokeWidth="8"/>
                          <circle cx="38" cy="38" r="32" fill="none" stroke="#17a672" strokeWidth="8"
                            strokeDasharray="201" strokeDashoffset="36" strokeLinecap="round"/>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-lg text-[#15171a]">82%</div>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6e73] mb-0.5">Inventory Health</span>
                        <strong className="block text-sm text-[#15171a] font-bold">Good</strong>
                        <span className="inline-block mt-1 bg-[#e4f7ee] text-[#17a672] text-[9px] font-bold px-2 py-0.5 rounded-full">On track</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#9a9da3] font-medium mt-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="stroke-[#9a9da3]"><rect x="3" y="3" width="7" height="7" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" strokeWidth="2"/></svg>
                      Last synced 12s ago
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* Centered stand-alone login card */
          <div className="flex justify-center items-center w-full py-8 animate-fade-in">
            <div className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_60px_rgba(22,124,101,0.08)] backdrop-blur md:p-8 relative">
              <button 
                type="button" 
                onClick={() => setShowLoginForm(false)} 
                className="absolute top-6 right-6 text-sm font-semibold text-gray-500 hover:text-[#167C65] flex items-center gap-1 transition cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#167C65] to-[#126351] text-2xl font-extrabold text-white shadow-md">
                  A
                </div>
                <h2 className="text-2xl font-bold text-[#14161a]">Welcome back</h2>
                <p className="mt-2 text-sm text-[#5b5f68]">Sign in to access the AssetFlow dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
                    className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#14161a] outline-none transition focus:border-[#167C65]"
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
                      className="text-[10px] font-bold text-[#167C65] hover:underline cursor-pointer"
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
                    className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#14161a] outline-none transition focus:border-[#167C65]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#167C65] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#126351] cursor-pointer"
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
                      className="rounded-lg border border-[#e5e7eb] bg-[#f7f8fa] px-3 py-2 text-left text-sm font-semibold text-[#14161a] transition hover:bg-[#f0f2f6] cursor-pointer"
                    >
                      {u.name}
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#167C65]">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 text-center text-sm text-[#5b5f68]">
                Don’t have an account?{' '}
                <button onClick={() => setCurrentPage('Signup')} className="font-bold text-[#167C65] hover:underline cursor-pointer">
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
