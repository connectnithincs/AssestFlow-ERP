import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Menu, Bell, User, Check, Shield } from 'lucide-react';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { 
    currentPage, 
    setCurrentPage,
    currentUser, 
    activeRole, 
    notifications, 
    markNotificationAsRead 
  } = useAppState();

  const [showNotifications, setShowNotifications] = useState(false);

  // Map pages to titles and subtitles
  const getHeaderDetails = () => {
    switch (currentPage) {
      case 'Dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Real-time snapshot of assets, bookings and requests'
        };
      case 'AssetRegistry':
        return {
          title: 'Asset Registry',
          subtitle: 'Manage and track all corporate physical inventory'
        };
      case 'AllocationTransfer':
        return {
          title: 'Allocation & Transfer',
          subtitle: 'Request, approve, or transfer asset assignments'
        };
      case 'ResourceBooking':
        return {
          title: 'Resource Booking',
          subtitle: 'Schedule shared meeting rooms, vehicles, and equipment'
        };
      case 'Maintenance':
        return {
          title: 'Maintenance Management',
          subtitle: 'Submit tickets and track technicians resolving equipment issues'
        };
      case 'AssetAudit':
        return {
          title: 'Asset Audit Cycles',
          subtitle: 'Perform verification, check missing items, and generate reports'
        };
      case 'Reports':
        return {
          title: 'Reports & Analytics',
          subtitle: 'Utilizations, deprecations, and metrics visualizer'
        };
      case 'ActivityNotifications':
        return {
          title: 'Activity Logs & Alerts',
          subtitle: 'History audit trail and real-time operational notifications'
        };
      case 'OrgSetup':
        return {
          title: 'Organization Setup',
          subtitle: 'Departments head configuration, categories and directory'
        };
      default:
        return {
          title: 'AssetFlow',
          subtitle: 'Enterprise Asset & Resource Management ERP'
        };
    }
  };

  const { title, subtitle } = getHeaderDetails();
  const unreadNotifs = notifications.filter(n => !n.read);

  const handleNotificationClick = (n: any) => {
    markNotificationAsRead(n.id);
    setCurrentPage('ActivityNotifications');
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 right-0 left-0 bg-white border-b border-gray-200 z-30 h-16 shadow-xs px-4 flex items-center justify-between">
      {/* Left Title Area */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight m-0 select-none">{title}</h1>
          <p className="text-xs text-gray-500 leading-normal hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 relative">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl rounded-xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Alerts</span>
                  <button 
                    onClick={() => {
                      setCurrentPage('ActivityNotifications');
                      setShowNotifications(false);
                    }}
                    className="text-xs text-[#167C65] font-semibold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {unreadNotifs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      No new notifications.
                    </div>
                  ) : (
                    unreadNotifs.map(n => (
                      <div 
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-900">{n.title}</p>
                          <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{n.message}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationAsRead(n.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-emerald-600 shrink-0"
                          title="Mark read"
                        >
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

        {/* Vertical Separator */}
        <div className="h-6 w-[1px] bg-gray-200" />

        {/* User Info & Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900 leading-none mb-0.5">
              {currentUser?.name || 'Guest User'}
            </p>
            <div className="flex items-center justify-end gap-1">
              {activeRole === 'Admin' && <Shield className="w-3 h-3 text-[#167C65]" />}
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                {activeRole}
              </span>
            </div>
          </div>
          
          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#167C65] font-bold text-sm shadow-xs select-none">
            {currentUser?.name ? (
              currentUser.name.split(' ').map(n => n[0]).join('')
            ) : (
              <User className="w-4 h-4 text-emerald-600" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
