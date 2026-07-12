import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, ClipboardList, ArrowLeftRight, Calendar, 
  Wrench, ClipboardCheck, BarChart3, Bell, LogOut, Shield, ChevronDown
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { 
    currentPage, 
    setCurrentPage, 
    activeRole, 
    setActiveRole, 
    logout 
  } = useAppState();

  const handleNavClick = (page: string) => {
    setCurrentPage(page);
    setIsOpen(false); // Close mobile drawer
  };

  // Check role-based menu authorization
  const isAuthorized = (menu: string): boolean => {
    if (menu === 'OrgSetup') {
      return activeRole === 'Admin';
    }
    if (menu === 'AllocationTransfer') {
      return activeRole !== 'Employee'; // Employees do not see the admin allocation approval queue
    }
    if (menu === 'AssetAudit') {
      return activeRole !== 'Employee'; // Admin, Asset Manager, Department Head can audit
    }
    if (menu === 'Reports') {
      return activeRole !== 'Employee'; // Insights reports restricted
    }
    return true;
  };

  const navItem = (name: string, label: string, icon: React.ReactNode) => {
    if (!isAuthorized(name)) return null;

    const isActive = currentPage === name;
    return (
      <button
        onClick={() => handleNavClick(name)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive 
            ? 'bg-[#167C65] text-white shadow-md' 
            : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-45 w-64 bg-[#171F2E] flex flex-col justify-between transition-transform duration-350 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo and Navigation */}
        <div className="flex flex-col overflow-y-auto px-4 py-6 grow">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#167C65] flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-lg">A</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-wide">AssetFlow</span>
              <span className="text-xs text-[#167C65] block font-semibold leading-none">ENTERPRISE ERP</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            <div>
              <p className="text-[11px] font-bold text-gray-500 tracking-wider uppercase px-2 mb-2">Overview</p>
              <div className="space-y-1">
                {navItem('Dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-500 tracking-wider uppercase px-2 mb-2">Operations</p>
              <div className="space-y-1">
                {navItem('AssetRegistry', 'Asset Registry', <ClipboardList className="w-4 h-4" />)}
                {navItem('AllocationTransfer', 'Allocation & Transfer', <ArrowLeftRight className="w-4 h-4" />)}
                {navItem('ResourceBooking', 'Resource Booking', <Calendar className="w-4 h-4" />)}
                {navItem('Maintenance', 'Maintenance', <Wrench className="w-4 h-4" />)}
                {navItem('AssetAudit', 'Asset Audit', <ClipboardCheck className="w-4 h-4" />)}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-500 tracking-wider uppercase px-2 mb-2">Insights</p>
              <div className="space-y-1">
                {navItem('Reports', 'Reports & Analytics', <BarChart3 className="w-4 h-4" />)}
                {navItem('ActivityNotifications', 'Activity & Alerts', <Bell className="w-4 h-4" />)}
              </div>
            </div>
            
            {activeRole === 'Admin' && (
              <div>
                <p className="text-[11px] font-bold text-gray-500 tracking-wider uppercase px-2 mb-2">Administration</p>
                <div className="space-y-1">
                  {navItem('OrgSetup', 'Organization Setup', <Shield className="w-4 h-4" />)}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom: User Controls & Role Switcher */}
        <div className="p-4 border-t border-[#232e42] bg-[#121926]/40 space-y-4">
          {/* Role Switcher Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase block">
              Preview As (Demo)
            </label>
            <div className="relative group">
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="w-full bg-[#1e293b] text-white border border-[#2d3a4f] rounded-lg px-3 py-2 text-xs font-semibold appearance-none cursor-pointer focus:outline-none focus:border-[#167C65] transition-colors pr-8"
              >
                <option value="Admin">Admin</option>
                <option value="Asset Manager">Asset Manager</option>
                <option value="Department Head">Dept Head</option>
                <option value="Employee">Employee</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-between text-gray-400 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
