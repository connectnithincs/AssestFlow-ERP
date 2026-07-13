import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { NotificationType } from '../types';
import {
  Bell, CheckCheck, Clock, UserCheck, Calendar, Wrench,
  ClipboardCheck, ArrowLeftRight, Check, CheckCircle2, ShieldAlert
} from 'lucide-react';

const notifIconBg: Record<string, { bg: string; border: string }> = {
  'Asset Assigned':        { bg: '#f0fdf4', border: '#bbf7d0' },
  'Booking Confirmed':     { bg: '#eff6ff', border: '#bfdbfe' },
  'Booking Reminder':      { bg: '#eff6ff', border: '#bfdbfe' },
  'Booking Cancelled':     { bg: '#fff1f2', border: '#fecdd3' },
  'Maintenance Approved':  { bg: '#f0fdf4', border: '#bbf7d0' },
  'Maintenance Rejected':  { bg: '#fff1f2', border: '#fecdd3' },
  'Transfer Approved':     { bg: '#f0fdf4', border: '#bbf7d0' },
  'Overdue Return':        { bg: '#fffbeb', border: '#fde68a' },
  'Audit Discrepancy':     { bg: '#fff1f2', border: '#fecdd3' },
};

export const ActivityNotificationsView: React.FC = () => {
  const { notifications, activities, markNotificationAsRead, markAllNotificationsAsRead } = useAppState();
  const [activeTab, setActiveTab] = useState<'notifications' | 'activities'>('notifications');
  const [filterType, setFilterType] = useState<string>('All');

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'All') return true;
    if (filterType === 'Unread') return !n.read;
    if (filterType === 'Read') return n.read;
    return n.type === filterType;
  });

  const getNotificationIcon = (type: NotificationType) => {
    const map: Record<string, React.ReactNode> = {
      'Asset Assigned':       <UserCheck className="w-4 h-4 text-green-600" />,
      'Booking Confirmed':    <Calendar className="w-4 h-4 text-blue-500" />,
      'Booking Reminder':     <Clock className="w-4 h-4 text-blue-500" />,
      'Booking Cancelled':    <Clock className="w-4 h-4 text-red-500" />,
      'Maintenance Approved': <Wrench className="w-4 h-4 text-green-600" />,
      'Maintenance Rejected': <Wrench className="w-4 h-4 text-rose-500" />,
      'Transfer Approved':    <ArrowLeftRight className="w-4 h-4 text-green-600" />,
      'Overdue Return':       <ShieldAlert className="w-4 h-4 text-amber-500" />,
      'Audit Discrepancy':    <ClipboardCheck className="w-4 h-4 text-rose-500" />,
    };
    return map[type] || <Bell className="w-4 h-4 text-gray-500" />;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'notifications' as const, label: `Notifications`, badge: unreadCount },
    { id: 'activities' as const, label: 'Activity Audit Trail', badge: 0 },
  ];

  const filterChips = ['All', 'Unread', 'Read', 'Asset Assigned', 'Booking Confirmed', 'Maintenance Approved', 'Overdue Return'];

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between"
        style={{ borderBottom: '2px solid #e2e8f0' }}>
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 -mb-[2px] transition-colors cursor-pointer ${activeTab === tab.id ? 'border-[#167C65] text-[#167C65]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {tab.label}
              {tab.badge > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: '#e11d48' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        {activeTab === 'notifications' && notifications.some(n => !n.read) && (
          <button onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 text-xs font-bold text-[#167C65] hover:underline cursor-pointer">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* NOTIFICATIONS VIEW */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap">
            {filterChips.map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-all ${filterType === f ? 'text-[#167C65] border-[#167C65] bg-green-50' : 'text-gray-600 border-gray-200 bg-white hover:border-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="space-y-2.5">
            {filteredNotifs.length === 0 ? (
              <div className="card-premium p-10 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400">No notifications matching this filter.</p>
              </div>
            ) : (
              filteredNotifs.map((n, i) => {
                const style = notifIconBg[n.type] || { bg: '#f8fafc', border: '#e2e8f0' };
                return (
                  <div key={n.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all animate-slide-up stagger-${Math.min(i + 1, 6)} ${n.read ? 'opacity-60' : 'shadow-sm'}`}
                    style={{
                      background: n.read ? '#f8fafc' : '#fff',
                      borderColor: n.read ? '#e2e8f0' : '#cbd5e1',
                      borderLeft: n.read ? '3px solid #e2e8f0' : '3px solid #167C65',
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">{n.title}</h4>
                        <span className="text-[9px] text-gray-400 font-semibold shrink-0">
                          {new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{n.message}</p>
                      {!n.read && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-[#167C65]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#167C65] animate-pulse" /> New
                        </span>
                      )}
                    </div>
                    {!n.read && (
                      <button onClick={() => markNotificationAsRead(n.id)} title="Mark read"
                        className="p-1.5 rounded-lg text-gray-300 hover:text-green-600 hover:bg-green-50 transition-colors shrink-0">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ACTIVITY TRAIL */}
      {activeTab === 'activities' && (
        <div className="card-premium p-6 space-y-5 animate-fade-in">
          <div className="pb-3 border-b border-gray-100">
            <h4 className="section-title">Enterprise Operations Ledger</h4>
            <p className="text-xs text-gray-400 mt-0.5">Chronological record of asset allocations, bookings, and maintenance.</p>
          </div>

          <div className="space-y-4 relative pl-4">
            {/* Vertical line */}
            <div className="absolute left-[28px] top-4 bottom-4 w-px" style={{ background: 'linear-gradient(180deg, #167C65, #e2e8f0)' }} />

            {activities.map((act, i) => (
              <div key={act.id} className={`flex gap-4 items-start relative animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                <div className="w-8 h-8 rounded-full bg-white border-2 border-[#167C65] flex items-center justify-center shrink-0 z-10 shadow-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span className="badge badge-brand-pill mb-1">{act.type}</span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-bold text-gray-900">{act.user}</span> {act.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                    {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
