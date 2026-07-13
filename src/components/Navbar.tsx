import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Menu, Bell, Check, Shield, Zap } from 'lucide-react';

interface NavbarProps {
  onMenuToggle: () => void;
}

const pageDetails: Record<string, { title: string; subtitle: string; emoji: string }> = {
  Dashboard:             { title: 'Dashboard',             subtitle: 'Real-time snapshot of assets, bookings and requests',            emoji: '⚡' },
  AssetRegistry:         { title: 'Asset Registry',         subtitle: 'Manage and track all corporate physical inventory',             emoji: '📦' },
  AllocationTransfer:    { title: 'Allocation & Transfer',  subtitle: 'Request, approve, or transfer asset assignments',              emoji: '🔄' },
  ResourceBooking:       { title: 'Resource Booking',       subtitle: 'Schedule shared meeting rooms, vehicles, and equipment',       emoji: '📅' },
  Maintenance:           { title: 'Maintenance',            subtitle: 'Submit tickets and track technicians resolving issues',        emoji: '🔧' },
  AssetAudit:            { title: 'Asset Audit Cycles',     subtitle: 'Verify, track missing items, and generate audit reports',      emoji: '📋' },
  Reports:               { title: 'Reports & Analytics',    subtitle: 'Utilization metrics, trends, and operational insights',       emoji: '📊' },
  ActivityNotifications: { title: 'Activity & Alerts',      subtitle: 'History audit trail and real-time operational notifications', emoji: '🔔' },
  OrgSetup:              { title: 'Organization Setup',     subtitle: 'Departments, categories, and employee directory',             emoji: '🏢' },
};

const roleColors: Record<string, string> = {
  'Admin':           '#e11d48',
  'Asset Manager':   '#167C65',
  'Department Head': '#2563eb',
  'Employee':        '#64748b',
};

const roleBg: Record<string, string> = {
  'Admin':           '#fff1f2',
  'Asset Manager':   '#ecfdf8',
  'Department Head': '#eff6ff',
  'Employee':        '#f8fafc',
};

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { currentPage, setCurrentPage, currentUser, activeRole, notifications, markNotificationAsRead } = useAppState();
  const [showNotifications, setShowNotifications] = useState(false);

  const details = pageDetails[currentPage] || { title: 'AssetFlow', subtitle: 'Enterprise ERP', emoji: '⚡' };
  const unreadNotifs = notifications.filter(n => !n.read);

  const handleNotificationClick = (n: any) => {
    markNotificationAsRead(n.id);
    setCurrentPage('ActivityNotifications');
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 right-0 left-0 z-30 h-16 px-5 flex items-center justify-between"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {/* Page emoji indicator */}
          <div className="hidden sm:flex w-8 h-8 rounded-xl items-center justify-center text-base shrink-0"
            style={{ background: 'linear-gradient(135deg, #ecfdf8, #d1fae9)' }}>
            {details.emoji}
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight m-0 select-none"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {details.title}
            </h1>
            <p className="text-[11px] text-gray-400 leading-none hidden sm:block mt-0.5">{details.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl transition-colors cursor-pointer"
            style={{ background: showNotifications ? '#f0fdf4' : undefined }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = showNotifications ? '#f0fdf4' : 'transparent'}
          >
            <Bell className="w-5 h-5 text-gray-500" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white"
                style={{ background: '#e11d48', animation: 'pulse-dot 2s ease-in-out infinite' }}>
                {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50 animate-scale-in"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
                }}>
                <div className="px-4 py-3 flex justify-between items-center"
                  style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-bold text-gray-800">Alerts</span>
                    {unreadNotifs.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-red-600"
                        style={{ background: '#fef2f2' }}>
                        {unreadNotifs.length} new
                      </span>
                    )}
                  </div>
                  <button onClick={() => { setCurrentPage('ActivityNotifications'); setShowNotifications(false); }}
                    className="text-[10px] font-bold text-[#167C65] hover:underline">
                    View All
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {unreadNotifs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      All caught up!
                    </div>
                  ) : (
                    unreadNotifs.slice(0, 6).map(n => (
                      <div key={n.id} onClick={() => handleNotificationClick(n)}
                        className="px-4 py-3 cursor-pointer flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1.5 pulse-dot" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 leading-tight">{n.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); markNotificationAsRead(n.id); }}
                          className="p-1 rounded-lg text-gray-300 hover:text-green-500 hover:bg-green-50 transition-colors shrink-0">
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900 leading-none">{currentUser?.name || 'Guest'}</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {activeRole === 'Admin' && <Shield className="w-2.5 h-2.5" style={{ color: roleColors['Admin'] }} />}
              <span className="text-[9px] font-bold uppercase tracking-wide"
                style={{ color: roleColors[activeRole] || '#64748b' }}>
                {activeRole}
              </span>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #167C65, #0e5a4a)', boxShadow: '0 2px 8px rgba(22,124,101,0.35)' }}>
            {currentUser?.name
              ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)
              : <Zap className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </header>
  );
};
