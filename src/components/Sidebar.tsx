import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { UserRole } from '../types';
import {
  LayoutDashboard, ClipboardList, ArrowLeftRight, Calendar,
  Wrench, ClipboardCheck, BarChart3, Bell, LogOut, Shield,
  ChevronDown, Zap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const roleColors: Record<UserRole, string> = {
  'Admin':           '#e11d48',
  'Asset Manager':   '#167C65',
  'Department Head': '#2563eb',
  'Employee':        '#64748b',
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { currentPage, setCurrentPage, activeRole, setActiveRole, logout } = useAppState();

  const handleNavClick = (page: string) => {
    setCurrentPage(page);
    setIsOpen(false);
  };

  const isAuthorized = (menu: string): boolean => {
    if (menu === 'OrgSetup') return activeRole === 'Admin';
    if (menu === 'AssetAudit') return activeRole !== 'Employee';
    if (menu === 'Reports') return activeRole !== 'Employee';
    return true;
  };

  const navItem = (name: string, label: string, icon: React.ReactNode) => {
    if (!isAuthorized(name)) return null;
    const isActive = currentPage === name;
    return (
      <button
        key={name}
        onClick={() => handleNavClick(name)}
        className={`nav-link w-full ${isActive ? 'active' : ''}`}
      >
        <span className={`transition-colors ${isActive ? 'text-[#4fd9c0]' : 'text-[#5e8a86]'}`}>
          {icon}
        </span>
        <span>{label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full"
            style={{ background: '#4fd9c0', boxShadow: '0 0 6px #4fd9c0' }} />
        )}
      </button>
    );
  };

  const groupLabel = (label: string) => (
    <p className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 mb-1.5 mt-5"
      style={{ color: '#3a6460' }}>
      {label}
    </p>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-45 w-64 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'linear-gradient(180deg, #0a1b19 0%, #0d2320 50%, #0a1f1c 100%)',
          borderRight: '1px solid #1a3330'
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 shrink-0"
          style={{ borderBottom: '1px solid #1a3330' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #167C65 0%, #0e5a4a 100%)', boxShadow: '0 4px 12px rgba(22,124,101,0.45)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              AssetFlow
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ color: '#2a7a6a' }}>
              Enterprise ERP
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {groupLabel('Overview')}
          <div className="space-y-0.5">
            {navItem('Dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
          </div>

          {groupLabel('Operations')}
          <div className="space-y-0.5">
            {navItem('AssetRegistry', 'Asset Registry', <ClipboardList className="w-4 h-4" />)}
            {navItem('AllocationTransfer', 'Allocation & Transfer', <ArrowLeftRight className="w-4 h-4" />)}
            {navItem('ResourceBooking', 'Resource Booking', <Calendar className="w-4 h-4" />)}
            {navItem('Maintenance', 'Maintenance', <Wrench className="w-4 h-4" />)}
            {navItem('AssetAudit', 'Asset Audit', <ClipboardCheck className="w-4 h-4" />)}
          </div>

          {groupLabel('Insights')}
          <div className="space-y-0.5">
            {navItem('Reports', 'Reports & Analytics', <BarChart3 className="w-4 h-4" />)}
            {navItem('ActivityNotifications', 'Activity & Alerts', <Bell className="w-4 h-4" />)}
          </div>

          {activeRole === 'Admin' && (
            <>
              {groupLabel('Administration')}
              <div className="space-y-0.5">
                {navItem('OrgSetup', 'Organization Setup', <Shield className="w-4 h-4" />)}
              </div>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-3 space-y-3 shrink-0"
          style={{ borderTop: '1px solid #1a3330' }}>
          {/* Role switcher */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.12em] block px-1"
              style={{ color: '#3a6460' }}>
              Demo Role View
            </label>
            <div className="relative">
              <select
                value={activeRole}
                onChange={e => setActiveRole(e.target.value as UserRole)}
                className="w-full rounded-xl px-3 py-2 text-xs font-semibold appearance-none cursor-pointer focus:outline-none pr-8 transition-colors"
                style={{
                  background: '#131f1e',
                  border: '1px solid #1f3330',
                  color: roleColors[activeRole] || '#fff',
                }}
              >
                <option value="Admin">Admin</option>
                <option value="Asset Manager">Asset Manager</option>
                <option value="Department Head">Dept Head</option>
                <option value="Employee">Employee</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#5e8a86' }} />
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ color: '#5e8a86' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#f87171';
              (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = '#5e8a86';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
