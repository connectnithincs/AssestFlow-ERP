import React, { useState } from 'react';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';

// Import Views
import { DashboardView } from './components/DashboardView';
import { OrgSetupView } from './components/OrgSetupView';
import { AssetRegistryView } from './components/AssetRegistryView';
import { AllocationTransferView } from './components/AllocationTransferView';
import { ResourceBookingView } from './components/ResourceBookingView';
import { MaintenanceView } from './components/MaintenanceView';
import { AssetAuditView } from './components/AssetAuditView';
import { ReportsView } from './components/ReportsView';
import { ActivityNotificationsView } from './components/ActivityNotificationsView';
import { LoginView } from './components/LoginView';
import { SignupView } from './components/SignupView';

const AppContent: React.FC = () => {
  const { currentPage, currentUser } = useAppState();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Unauthenticated routing
  if (!currentUser) {
    if (currentPage === 'Signup') return <SignupView />;
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentPage) {
      case 'Dashboard':              return <DashboardView />;
      case 'AssetRegistry':          return <AssetRegistryView />;
      case 'AllocationTransfer':     return <AllocationTransferView />;
      case 'ResourceBooking':        return <ResourceBookingView />;
      case 'Maintenance':            return <MaintenanceView />;
      case 'AssetAudit':             return <AssetAuditView />;
      case 'Reports':                return <ReportsView />;
      case 'ActivityNotifications':  return <ActivityNotificationsView />;
      case 'OrgSetup':               return <OrgSetupView />;
      default:                       return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-background)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={mobileSidebarOpen} setIsOpen={setMobileSidebarOpen} />

      {/* Main */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Navbar onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {renderActiveView()}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
