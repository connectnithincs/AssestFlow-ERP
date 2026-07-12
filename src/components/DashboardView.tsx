import React, { useEffect, useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { 
  Package, UserCheck, Wrench, CalendarDays, ArrowLeftRight, Clock,
  Plus, Calendar, PlusCircle, Bell, ArrowRight
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    currentUser,
    activeRole,
    assets, 
    bookings, 
    maintenanceRequests, 
    notifications, 
    activities, 
    addToast,
    setCurrentPage,
    registerAsset,
    createBooking,
    raiseMaintenanceRequest,
    returnAsset,
    cancelBooking,
    categories,
    users
  } = useAppState();

  const [welcomeTriggered, setWelcomeTriggered] = useState(false);
  
  // Modals for Quick Actions
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Quick Action form states
  const [newAsset, setNewAsset] = useState({ tag: '', name: '', category: 'Electronics', location: '', condition: 'Excellent' as any, serialNumber: '' });
  const [newBooking, setNewBooking] = useState({ resourceId: '', title: '', startTime: '', endTime: '', resourceType: 'Meeting Room' as any });
  const [newMaint, setNewMaint] = useState({ assetTag: '', issueDescription: '', priority: 'Medium' as any });

  // Welcome Toast on Mount
  useEffect(() => {
    if (!welcomeTriggered && currentUser) {
      addToast('Welcome back!', `Logged in as ${currentUser.name}`, 'success');
      setWelcomeTriggered(true);
    }
  }, [welcomeTriggered, currentUser, addToast]);

  // Derived KPI data
  const kpis = {
    available: assets.filter(a => a.status === 'Available').length,
    allocated: assets.filter(a => a.status === 'Allocated').length,
    maintenance: maintenanceRequests.filter(m => m.status !== 'Resolved').length,
    activeBookings: bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length,
    pendingTransfers: 3, // Mocked pending transfer count
    upcomingReturns: 2, // Mocked upcoming return count
  };

  // Mocked Overdue Returns
  const overdueReturns = [
    { id: 'od-1', tag: 'AST-104', name: 'Lenovo ThinkPad P16', holder: 'Sarah Connor', due: 'Yesterday', delay: '1 day overdue' },
    { id: 'od-2', tag: 'AST-098', name: 'iPad Pro 12.9" Cellular', holder: 'Vikram Seth', due: 'July 10, 2026', delay: '2 days overdue' },
  ];

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.tag || !newAsset.name || !newAsset.location || !newAsset.serialNumber) {
      alert('Please fill all fields');
      return;
    }
    registerAsset({
      tag: newAsset.tag,
      name: newAsset.name,
      category: newAsset.category,
      location: newAsset.location,
      condition: newAsset.condition,
      status: 'Available',
      serialNumber: newAsset.serialNumber,
      acquisitionDate: new Date().toISOString().split('T')[0],
    });
    setNewAsset({ tag: '', name: '', category: 'Electronics', location: '', condition: 'Excellent', serialNumber: '' });
    setShowRegisterModal(false);
  };

  const handleBookResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.resourceId || !newBooking.title || !newBooking.startTime || !newBooking.endTime) {
      alert('Please fill all fields');
      return;
    }
    
    // Find resource name
    let rName = newBooking.resourceId;
    const matchedAsset = assets.find(a => a.tag === newBooking.resourceId);
    if (matchedAsset) {
      rName = matchedAsset.name;
    } else if (newBooking.resourceId === 'RM-Alpha') {
      rName = 'Meeting Room Alpha (HQ 4th Fl)';
    }

    const result = createBooking({
      resourceId: newBooking.resourceId,
      resourceName: rName,
      resourceType: newBooking.resourceType,
      userId: currentUser?.id || 'usr-1',
      title: newBooking.title,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime
    });

    if (result.success) {
      setNewBooking({ resourceId: '', title: '', startTime: '', endTime: '', resourceType: 'Meeting Room' });
      setShowBookingModal(false);
    } else {
      alert(result.error);
    }
  };

  const handleRaiseMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaint.assetTag || !newMaint.issueDescription) {
      alert('Please select an asset and describe the issue.');
      return;
    }
    raiseMaintenanceRequest(newMaint.assetTag, newMaint.issueDescription, newMaint.priority);
    setNewMaint({ assetTag: '', issueDescription: '', priority: 'Medium' });
    setShowMaintenanceModal(false);
  };

  const kpiCard = (title: string, value: number, icon: React.ReactNode, sub: string) => (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl font-bold text-gray-900 leading-none">{value}</h3>
        <p className="text-[11px] text-gray-400 font-medium">{sub}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600">
        {icon}
      </div>
    </div>
  );

  // Derived Employee data
  const myAssignedAssets = assets.filter(a => a.currentHolderId === currentUser?.id);
  const myActiveBookings = bookings.filter(b => b.userId === currentUser?.id && b.status !== 'Cancelled');
  const myOpenTickets = maintenanceRequests.filter(m => {
    const holdsAsset = assets.some(a => a.tag === m.assetTag && a.currentHolderId === currentUser?.id);
    return holdsAsset && m.status !== 'Resolved';
  });

  if (activeRole === 'Employee') {
    return (
      <div className="space-y-6">
        {/* Employee KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCard('My Assigned Assets', myAssignedAssets.length, <Package className="w-5 h-5 text-[#167C65]" />, 'Assets currently held')}
          {kpiCard('My Active Bookings', myActiveBookings.length, <CalendarDays className="w-5 h-5 text-indigo-500" />, 'Shared resource slots')}
          {kpiCard('My Open Tickets', myOpenTickets.length, <Wrench className="w-5 h-5 text-amber-500" />, 'Active maintenance jobs')}
          {kpiCard('Available Assets', kpis.available, <UserCheck className="w-5 h-5 text-blue-600" />, 'Ready for allocation')}
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Quick Operations Actions</h4>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowBookingModal(true)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Book Shared Resource
            </button>
            <button 
              onClick={() => setShowMaintenanceModal(true)}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              Raise Maintenance ticket
            </button>
          </div>
        </div>

        {/* Employee Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: My Assigned Assets */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-900">My Assigned Assets</h4>
                <span className="text-[10px] font-bold bg-emerald-50 text-[#167C65] px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
                {myAssignedAssets.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-12">No assets currently allocated to you.</p>
                ) : (
                  myAssignedAssets.map(asset => (
                    <div key={asset.tag} className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 block">{asset.tag}</span>
                          <h5 className="text-xs font-bold text-gray-900 leading-tight">{asset.name}</h5>
                          <span className="text-[10px] text-gray-500 block mt-0.5">{asset.location}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                          asset.status === 'Under Maintenance' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {asset.status}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 pt-1 border-t border-gray-200/50">
                        <button
                          onClick={() => returnAsset(asset.tag)}
                          className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          Request Return
                        </button>
                        <button
                          onClick={() => {
                            const partner = prompt("Enter Colleague email to transfer to:");
                            if (!partner) return;
                            const target = users.find(u => u.email.toLowerCase() === partner.toLowerCase());
                            if (target) {
                              addToast('Transfer Requested', `Request to transfer ${asset.name} to ${target.name} forwarded to HOD.`, 'success');
                            } else {
                              alert("Colleague email not found in directory.");
                            }
                          }}
                          className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border border-[#167C65]/20 bg-[#167C65]/5 hover:bg-[#167C65]/10 text-[#167C65] transition-colors"
                        >
                          Request Transfer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentPage('AssetRegistry')}
              className="text-xs text-[#167C65] font-bold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-gray-100"
            >
              Browse All Registry Assets <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Column 2: My Resource Bookings */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-900">My Resource Bookings</h4>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Bookings</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
                {myActiveBookings.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-12">No active bookings scheduled.</p>
                ) : (
                  myActiveBookings.map(b => (
                    <div key={b.id} className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-start text-xs gap-3">
                      <div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider block w-fit mb-1 ${
                          b.status === 'Upcoming' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {b.status}
                        </span>
                        <h5 className="font-bold text-gray-900 leading-tight mb-0.5">{b.title}</h5>
                        <p className="text-gray-500 text-[10px] leading-none mb-1">{b.resourceName}</p>
                        <p className="text-[9px] text-[#167C65] font-semibold mt-1">
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      {b.status === 'Upcoming' && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="text-[9px] font-bold text-red-600 hover:underline shrink-0 pt-0.5"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <button 
              onClick={() => setCurrentPage('ResourceBooking')}
              className="text-xs text-[#167C65] font-bold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-gray-100"
            >
              Open Booking Calendar <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Column 3: My Maintenance Tickets */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-900">My Maintenance Tickets</h4>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Tickets</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
                {myOpenTickets.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-12">No open maintenance tickets.</p>
                ) : (
                  myOpenTickets.map(req => (
                    <div key={req.id} className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 block">{req.assetTag}</span>
                          <h5 className="text-xs font-bold text-gray-900 leading-tight w-36 truncate">{req.assetName}</h5>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase bg-amber-50 text-amber-600">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-normal line-clamp-2">{req.issueDescription}</p>
                      <div className="flex justify-between items-center text-[9px] text-gray-400 pt-1 border-t border-gray-200/50">
                        <span>Technician: {req.assignedTechnician || 'Pending'}</span>
                        <span>Raised: {req.dateRaised}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button 
              onClick={() => setCurrentPage('Maintenance')}
              className="text-xs text-[#167C65] font-bold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-gray-100"
            >
              Open Maintenance Board <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCard('Assets Available', kpis.available, <Package className="w-5 h-5 text-emerald-600" />, 'Ready to assign')}
        {kpiCard('Assets Allocated', kpis.allocated, <UserCheck className="w-5 h-5 text-blue-600" />, 'Currently in use')}
        {kpiCard('Maintenance Active', kpis.maintenance, <Wrench className="w-5 h-5 text-amber-500" />, 'Repair jobs open')}
        {kpiCard('Active Bookings', kpis.activeBookings, <CalendarDays className="w-5 h-5 text-indigo-500" />, 'Ongoing & scheduled')}
        {kpiCard('Pending Transfers', kpis.pendingTransfers, <ArrowLeftRight className="w-5 h-5 text-purple-500" />, 'Awaiting approval')}
        {kpiCard('Upcoming Returns', kpis.upcomingReturns, <Clock className="w-5 h-5 text-rose-500" />, 'Due this week')}
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
        <h4 className="text-sm font-bold text-gray-900 mb-4">Quick Operations Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register Asset
          </button>
          <button 
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            Book Resource
          </button>
          <button 
            onClick={() => setShowMaintenanceModal(true)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            Raise Maintenance
          </button>
        </div>
      </div>

      {/* Bottom Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Overdue Returns */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-gray-900">Overdue Returns</h4>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Critical</span>
            </div>
            
            <div className="space-y-3">
              {overdueReturns.map(item => (
                <div key={item.id} className="p-3 bg-rose-50/40 rounded-xl border border-rose-100 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 block mb-0.5">{item.tag}</span>
                    <h5 className="text-xs font-bold text-gray-900 leading-tight mb-1">{item.name}</h5>
                    <p className="text-[11px] text-gray-600">Assigned: <span className="font-semibold">{item.holder}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-rose-600 block">{item.due}</span>
                    <span className="text-[9px] font-medium text-gray-400 block mt-0.5">{item.delay}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => setCurrentPage('AllocationTransfer')}
            className="text-xs text-[#167C65] font-bold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-gray-100"
          >
            Manage Allocations & Transfers <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Middle Column: Notifications Panel */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-gray-900">Recent Alerts</h4>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">System</span>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {notifications.slice(0, 4).map(n => (
                <div key={n.id} className={`p-2.5 rounded-xl border flex items-start gap-3 transition-colors ${n.read ? 'bg-gray-50/50 border-gray-100' : 'bg-white border-[#E5E7EB] shadow-2xs'}`}>
                  <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 leading-tight mb-0.5">{n.title}</h5>
                    <p className="text-[11px] text-gray-500 leading-normal mb-1">{n.message}</p>
                    <span className="text-[9px] text-gray-400 font-semibold block">{new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setCurrentPage('ActivityNotifications')}
            className="text-xs text-[#167C65] font-bold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-gray-100"
          >
            View All Notifications <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Right Column: Recent Activity Timeline */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-gray-900">Recent Activity Timeline</h4>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
            </div>
            
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {activities.slice(0, 4).map((act, index) => (
                <div key={act.id} className="flex gap-3 relative">
                  {/* Timeline connector line */}
                  {index !== 3 && (
                    <div className="absolute left-3 top-6 bottom-[-16px] w-[1px] bg-gray-200" />
                  )}
                  <div className="w-6.5 h-6.5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-600 text-[10px]">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xs text-gray-700 leading-normal mb-0.5">
                      <span className="font-bold text-gray-900">{act.user}</span> {act.description}
                    </p>
                    <span className="text-[9px] text-gray-400 font-semibold block">{new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setCurrentPage('ActivityNotifications')}
            className="text-xs text-[#167C65] font-bold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-gray-100"
          >
            View Activity Logs <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* QUICK ACTIONS MODALS */}
      
      {/* Register Asset Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Register Corporate Asset</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Close</button>
            </div>
            
            <form onSubmit={handleRegisterAsset} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Asset Tag ID *</label>
                <input 
                  type="text" 
                  placeholder="e.g. AST-008" 
                  value={newAsset.tag}
                  onChange={e => setNewAsset(prev => ({ ...prev, tag: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Asset Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dell Monitor 27" 
                  value={newAsset.name}
                  onChange={e => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category *</label>
                  <select 
                    value={newAsset.category}
                    onChange={e => setNewAsset(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Condition *</label>
                  <select 
                    value={newAsset.condition}
                    onChange={e => setNewAsset(prev => ({ ...prev, condition: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Broken">Broken</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Serial Number *</label>
                <input 
                  type="text" 
                  placeholder="e.g. SN-99881112A" 
                  value={newAsset.serialNumber}
                  onChange={e => setNewAsset(prev => ({ ...prev, serialNumber: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Location *</label>
                <input 
                  type="text" 
                  placeholder="e.g. HQ - 4th Floor" 
                  value={newAsset.location}
                  onChange={e => setNewAsset(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Resource Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Schedule Booking</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Close</button>
            </div>
            
            <form onSubmit={handleBookResource} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Resource Type *</label>
                <select 
                  value={newBooking.resourceType}
                  onChange={e => setNewBooking(prev => ({ ...prev, resourceType: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                >
                  <option value="Meeting Room">Meeting Room</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Equipment">Equipment (Projector, etc.)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Select Specific Resource *</label>
                <select 
                  value={newBooking.resourceId}
                  onChange={e => setNewBooking(prev => ({ ...prev, resourceId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                >
                  <option value="">-- Choose Resource --</option>
                  {newBooking.resourceType === 'Meeting Room' && (
                    <option value="RM-Alpha">Meeting Room Alpha (HQ 4th Fl)</option>
                  )}
                  {newBooking.resourceType === 'Vehicle' && (
                    assets.filter(a => a.category === 'Vehicles').map(v => <option key={v.tag} value={v.tag}>{v.name}</option>)
                  )}
                  {newBooking.resourceType === 'Equipment' && (
                    assets.filter(a => a.category === 'Office Equipment' || a.category === 'Electronics').map(e => <option key={e.tag} value={e.tag}>{e.name}</option>)
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Purpose / Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sprint Planning Session" 
                  value={newBooking.title}
                  onChange={e => setNewBooking(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Start Time *</label>
                  <input 
                    type="datetime-local" 
                    value={newBooking.startTime}
                    onChange={e => setNewBooking(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">End Time *</label>
                  <input 
                    type="datetime-local" 
                    value={newBooking.endTime}
                    onChange={e => setNewBooking(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Submit Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Raise Maintenance Ticket</h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Close</button>
            </div>
            
            <form onSubmit={handleRaiseMaintenance} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Select Affected Asset *</label>
                <select 
                  value={newMaint.assetTag}
                  onChange={e => setNewMaint(prev => ({ ...prev, assetTag: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.tag} value={a.tag}>{a.tag} - {a.name} ({a.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Issue Description *</label>
                <textarea 
                  placeholder="Please specify display problems, physical damage, software crashes..." 
                  value={newMaint.issueDescription}
                  onChange={e => setNewMaint(prev => ({ ...prev, issueDescription: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65] h-24 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Priority Level *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewMaint(prev => ({ ...prev, priority: level as any }))}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        newMaint.priority === level 
                          ? 'bg-amber-500/10 text-amber-700 border-amber-500' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Raise Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
