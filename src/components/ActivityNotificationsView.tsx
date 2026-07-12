import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { NotificationType } from '../types';
import { 
  Bell, CheckCheck, Clock, UserCheck, Calendar, Wrench, 
  ClipboardCheck, ArrowLeftRight, Check, CheckCircle2, ShieldAlert
} from 'lucide-react';

export const ActivityNotificationsView: React.FC = () => {
  const { notifications, activities, markNotificationAsRead, markAllNotificationsAsRead } = useAppState();

  const [activeTab, setActiveTab] = useState<'notifications' | 'activities'>('notifications');
  const [filterType, setFilterType] = useState<string>('All');

  // Filtered notifications
  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'All') return true;
    if (filterType === 'Unread') return !n.read;
    if (filterType === 'Read') return n.read;
    return n.type === filterType;
  });

  const getNotificationIcon = (type: NotificationType) => {
    const styles = {
      'Asset Assigned': <UserCheck className="w-4 h-4 text-emerald-600" />,
      'Booking Confirmed': <Calendar className="w-4 h-4 text-indigo-500" />,
      'Booking Reminder': <Clock className="w-4 h-4 text-blue-500" />,
      'Booking Cancelled': <Clock className="w-4 h-4 text-red-500" />,
      'Maintenance Approved': <Wrench className="w-4 h-4 text-emerald-600" />,
      'Maintenance Rejected': <Wrench className="w-4 h-4 text-rose-500" />,
      'Transfer Approved': <ArrowLeftRight className="w-4 h-4 text-emerald-600" />,
      'Overdue Return': <ShieldAlert className="w-4 h-4 text-amber-500" />,
      'Audit Discrepancy': <ClipboardCheck className="w-4 h-4 text-rose-500" />
    };
    return styles[type] || <Bell className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation header */}
      <div className="flex justify-between items-center border-b border-gray-200">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'notifications' 
                ? 'border-[#167C65] text-[#167C65]' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Notifications ({notifications.filter(n => !n.read).length} Unread)
          </button>
          <button 
            onClick={() => setActiveTab('activities')}
            className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'activities' 
                ? 'border-[#167C65] text-[#167C65]' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Activity Audit Trail
          </button>
        </div>

        {/* Global Controls */}
        {activeTab === 'notifications' && notifications.some(n => !n.read) && (
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1 text-xs text-[#167C65] font-bold hover:underline cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* 1. NOTIFICATIONS LIST VIEW */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Filters strip */}
          <div className="flex gap-2 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-3xs overflow-x-auto">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 shrink-0">Filter by</span>
            {['All', 'Unread', 'Read', 'Asset Assigned', 'Booking Confirmed', 'Maintenance Approved', 'Overdue Return', 'Audit Discrepancy'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  filterType === t 
                    ? 'bg-[#167C65]/10 text-[#167C65] border-[#167C65]/20' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredNotifs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-xs">
                No notifications matching this filter.
              </div>
            ) : (
              filteredNotifs.map(n => (
                <div 
                  key={n.id}
                  className={`p-4 bg-white rounded-2xl border transition-all flex items-start gap-4 ${
                    n.read ? 'border-gray-200 opacity-75' : 'border-[#167C65] shadow-xs'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>
                  
                  <div className="grow space-y-1">
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="text-xs font-bold text-gray-950 leading-tight">{n.title}</h4>
                      <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                        {new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => markNotificationAsRead(n.id)}
                      className="p-1 hover:bg-emerald-50 hover:text-emerald-600 text-gray-300 rounded transition-colors shrink-0 cursor-pointer"
                      title="Mark read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. ACTIVITY AUDIT TRAIL TIMELINE */}
      {activeTab === 'activities' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enterprise Operations Ledger</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Chronological record of corporate assets allocation, bookings and maintenance.</p>
          </div>

          <div className="space-y-6 relative pl-4">
            {/* Center vertical connector line */}
            <div className="absolute left-[29px] top-2 bottom-2 w-[1.5px] bg-gray-200" />

            {activities.map(act => (
              <div key={act.id} className="flex gap-4 relative items-start">
                {/* Checkpoint Dot */}
                <div className="w-8 h-8 rounded-full bg-white border-2 border-[#167C65] flex items-center justify-center shrink-0 shadow-2xs z-10 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                
                {/* Event detail */}
                <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl grow flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">{act.type}</span>
                    <p className="text-xs text-gray-700 leading-normal">
                      <span className="font-bold text-gray-900">{act.user}</span> {act.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold shrink-0 sm:text-right">
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
