import React, { useEffect, useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import {
  Package, UserCheck, Wrench, CalendarDays, ArrowLeftRight, Clock,
  Plus, Calendar, Bell, ArrowRight, TrendingUp, AlertTriangle
} from 'lucide-react';

// Animated counter hook
const useCounter = (target: number, duration = 800) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

interface KpiData { title: string; value: number; sub: string; icon: React.ReactNode; iconClass: string; trend?: string; }

const KpiCard: React.FC<KpiData> = ({ title, value, sub, icon, iconClass, trend }) => {
  const count = useCounter(value);
  return (
    <div className="card-premium gradient-card-hover p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 leading-none mb-1 animate-count-up"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {count}
        </div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
      </div>
    </div>
  );
};

export const DashboardView: React.FC = () => {
  const {
    currentUser, assets, bookings, maintenanceRequests, notifications, activities,
    addToast, setCurrentPage, registerAsset, createBooking, raiseMaintenanceRequest, categories, users
  } = useAppState();

  const [welcomeTriggered, setWelcomeTriggered] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const [newAsset, setNewAsset] = useState({ tag: '', name: '', category: 'Electronics', location: '', condition: 'Excellent' as any, serialNumber: '' });
  const [newBooking, setNewBooking] = useState({ resourceId: '', title: '', startTime: '', endTime: '', resourceType: 'Meeting Room' as any });
  const [newMaint, setNewMaint] = useState({ assetTag: '', issueDescription: '', priority: 'Medium' as any });

  useEffect(() => {
    if (!welcomeTriggered && currentUser) {
      addToast('Welcome back!', `Logged in as ${currentUser.name}`, 'success');
      setWelcomeTriggered(true);
    }
  }, [welcomeTriggered, currentUser, addToast]);

  const kpis = {
    available:        assets.filter(a => a.status === 'Available').length,
    allocated:        assets.filter(a => a.status === 'Allocated').length,
    maintenance:      maintenanceRequests.filter(m => m.status !== 'Resolved').length,
    activeBookings:   bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length,
    pendingTransfers: 3,
    upcomingReturns:  2,
  };

  const overdueReturns = [
    { id: 'od-1', tag: 'AST-104', name: 'Lenovo ThinkPad P16',    holder: 'Sarah Connor', delay: '1 day overdue' },
    { id: 'od-2', tag: 'AST-098', name: 'iPad Pro 12.9" Cellular', holder: 'Vikram Seth',  delay: '2 days overdue' },
  ];

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.tag || !newAsset.name || !newAsset.location || !newAsset.serialNumber) { alert('Please fill all fields'); return; }
    registerAsset({ tag: newAsset.tag, name: newAsset.name, category: newAsset.category, location: newAsset.location, condition: newAsset.condition, status: 'Available', serialNumber: newAsset.serialNumber, acquisitionDate: new Date().toISOString().split('T')[0] });
    setNewAsset({ tag: '', name: '', category: 'Electronics', location: '', condition: 'Excellent', serialNumber: '' });
    setShowRegisterModal(false);
  };

  const handleBookResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.resourceId || !newBooking.title || !newBooking.startTime || !newBooking.endTime) { alert('Please fill all fields'); return; }
    let rName = newBooking.resourceId;
    const matched = assets.find(a => a.tag === newBooking.resourceId);
    if (matched) rName = matched.name;
    else if (newBooking.resourceId === 'RM-Alpha') rName = 'Meeting Room Alpha (HQ 4th Fl)';
    const result = createBooking({ resourceId: newBooking.resourceId, resourceName: rName, resourceType: newBooking.resourceType, userId: currentUser?.id || 'usr-1', title: newBooking.title, startTime: newBooking.startTime, endTime: newBooking.endTime });
    if (result.success) { setNewBooking({ resourceId: '', title: '', startTime: '', endTime: '', resourceType: 'Meeting Room' }); setShowBookingModal(false); }
    else alert(result.error);
  };

  const handleRaiseMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaint.assetTag || !newMaint.issueDescription) { alert('Please select an asset and describe the issue.'); return; }
    raiseMaintenanceRequest(newMaint.assetTag, newMaint.issueDescription, newMaint.priority);
    setNewMaint({ assetTag: '', issueDescription: '', priority: 'Medium' });
    setShowMaintenanceModal(false);
  };

  const modalOverlay = (children: React.ReactNode) => (
    <div className="modal-overlay animate-fade-in">{children}</div>
  );

  const modalHeader = (title: string, onClose: () => void) => (
    <div className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
      <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
      <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        ✕
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 animate-slide-up" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Good morning, {currentUser?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 animate-slide-up stagger-1">Here's what's moving across the org today.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl">
          <div className="pulse-dot" />
          Live • {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Assets Available"   value={kpis.available}        sub="Ready to assign"       icon={<Package className="w-5 h-5" />}        iconClass="kpi-icon-brand"  trend="+3" />
        <KpiCard title="Assets Allocated"   value={kpis.allocated}        sub="Currently in use"      icon={<UserCheck className="w-5 h-5" />}       iconClass="kpi-icon-blue"   />
        <KpiCard title="Maintenance Active" value={kpis.maintenance}      sub="Repair jobs open"      icon={<Wrench className="w-5 h-5" />}          iconClass="kpi-icon-amber"  />
        <KpiCard title="Active Bookings"    value={kpis.activeBookings}   sub="Ongoing & scheduled"   icon={<CalendarDays className="w-5 h-5" />}    iconClass="kpi-icon-indigo" />
        <KpiCard title="Pending Transfers"  value={kpis.pendingTransfers} sub="Awaiting approval"     icon={<ArrowLeftRight className="w-5 h-5" />}  iconClass="kpi-icon-purple" />
        <KpiCard title="Upcoming Returns"   value={kpis.upcomingReturns}  sub="Due this week"         icon={<Clock className="w-5 h-5" />}           iconClass="kpi-icon-rose"   />
      </div>

      {/* Quick Actions */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="section-title">Quick Actions</h4>
          <span className="text-[10px] text-gray-400 font-medium">Jump-start common tasks</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowRegisterModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Register Asset
          </button>
          <button onClick={() => setShowBookingModal(true)} className="btn-secondary">
            <Calendar className="w-4 h-4" /> Book Resource
          </button>
          <button onClick={() => setShowMaintenanceModal(true)} className="btn-secondary">
            <Wrench className="w-4 h-4" /> Raise Maintenance
          </button>
        </div>
      </div>

      {/* Bottom 3-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Overdue Returns */}
        <div className="card-premium p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="section-title">Overdue Returns</h4>
            <span className="badge badge-danger-pill flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Critical
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {overdueReturns.map((item, i) => (
              <div key={item.id}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 animate-slide-up stagger-${i + 1}`}
                style={{ background: '#fff1f2', borderColor: '#fecdd3' }}>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{item.tag}</span>
                  <span className="text-xs font-bold text-gray-900 block truncate mt-0.5">{item.name}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">Held by <span className="font-semibold">{item.holder}</span></span>
                </div>
                <span className="text-[9px] font-bold text-red-500 whitespace-nowrap px-2 py-1 rounded-lg bg-white border border-red-100 shrink-0">
                  {item.delay}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => setCurrentPage('AllocationTransfer')}
            className="text-xs text-[#167C65] font-bold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-gray-100">
            Manage Transfers <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Recent Alerts */}
        <div className="card-premium p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="section-title">Recent Alerts</h4>
            <span className="badge badge-brand-pill">System</span>
          </div>
          <div className="space-y-2.5 flex-1 max-h-56 overflow-y-auto pr-1">
            {notifications.slice(0, 5).map((n, i) => (
              <div key={n.id}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors animate-slide-up stagger-${i + 1} ${n.read ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.read ? 'bg-gray-300' : 'pulse-dot'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 leading-tight">{n.title}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                    {new Date(n.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setCurrentPage('ActivityNotifications')}
            className="text-xs text-[#167C65] font-bold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-gray-100">
            View All Notifications <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Activity Timeline */}
        <div className="card-premium p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="section-title">Activity Timeline</h4>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> Live
            </div>
          </div>
          <div className="space-y-4 flex-1 max-h-56 overflow-y-auto pr-1">
            {activities.slice(0, 5).map((act, i) => (
              <div key={act.id} className={`flex gap-3 relative animate-slide-up stagger-${i + 1}`}>
                {i < 4 && <div className="absolute left-3 top-6 bottom-[-16px] w-px bg-gray-100" />}
                <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-[9px] font-bold text-gray-500">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-bold text-gray-900">{act.user}</span> {act.description}
                  </p>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
                    {new Date(act.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setCurrentPage('ActivityNotifications')}
            className="text-xs text-[#167C65] font-bold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-gray-100">
            View Activity Logs <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Register Asset */}
      {showRegisterModal && modalOverlay(
        <div className="modal-panel w-full max-w-md">
          {modalHeader('Register Corporate Asset', () => setShowRegisterModal(false))}
          <form onSubmit={handleRegisterAsset} className="p-6 space-y-4 overflow-y-auto">
            <div><label className="input-label">Asset Tag ID *</label><input type="text" placeholder="e.g. AST-008" value={newAsset.tag} onChange={e => setNewAsset(p => ({ ...p, tag: e.target.value }))} className="input-field" required /></div>
            <div><label className="input-label">Asset Name *</label><input type="text" placeholder="e.g. Dell Monitor 27" value={newAsset.name} onChange={e => setNewAsset(p => ({ ...p, name: e.target.value }))} className="input-field" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="input-label">Category</label><select value={newAsset.category} onChange={e => setNewAsset(p => ({ ...p, category: e.target.value }))} className="input-field">{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              <div><label className="input-label">Condition</label><select value={newAsset.condition} onChange={e => setNewAsset(p => ({ ...p, condition: e.target.value as any }))} className="input-field"><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option><option>Broken</option></select></div>
            </div>
            <div><label className="input-label">Serial Number *</label><input type="text" placeholder="e.g. SN-99881112A" value={newAsset.serialNumber} onChange={e => setNewAsset(p => ({ ...p, serialNumber: e.target.value }))} className="input-field" required /></div>
            <div><label className="input-label">Location *</label><input type="text" placeholder="e.g. HQ - 4th Floor" value={newAsset.location} onChange={e => setNewAsset(p => ({ ...p, location: e.target.value }))} className="input-field" required /></div>
            <div className="pt-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowRegisterModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Register Asset</button>
            </div>
          </form>
        </div>
      )}

      {/* Book Resource */}
      {showBookingModal && modalOverlay(
        <div className="modal-panel w-full max-w-md">
          {modalHeader('Schedule Booking', () => setShowBookingModal(false))}
          <form onSubmit={handleBookResource} className="p-6 space-y-4 overflow-y-auto">
            <div><label className="input-label">Resource Type</label><select value={newBooking.resourceType} onChange={e => setNewBooking(p => ({ ...p, resourceType: e.target.value as any }))} className="input-field"><option value="Meeting Room">Meeting Room</option><option value="Vehicle">Vehicle</option><option value="Equipment">Equipment</option></select></div>
            <div>
              <label className="input-label">Select Resource *</label>
              <select value={newBooking.resourceId} onChange={e => setNewBooking(p => ({ ...p, resourceId: e.target.value }))} className="input-field" required>
                <option value="">-- Choose Resource --</option>
                {newBooking.resourceType === 'Meeting Room' && <option value="RM-Alpha">Meeting Room Alpha (HQ 4th Fl)</option>}
                {newBooking.resourceType === 'Vehicle' && assets.filter(a => a.category === 'Vehicles').map(v => <option key={v.tag} value={v.tag}>{v.name}</option>)}
                {newBooking.resourceType === 'Equipment' && assets.filter(a => a.category === 'Office Equipment' || a.category === 'Electronics').map(a => <option key={a.tag} value={a.tag}>{a.name}</option>)}
              </select>
            </div>
            <div><label className="input-label">Purpose / Title *</label><input type="text" placeholder="e.g. Sprint Planning" value={newBooking.title} onChange={e => setNewBooking(p => ({ ...p, title: e.target.value }))} className="input-field" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="input-label">Start Time *</label><input type="datetime-local" value={newBooking.startTime} onChange={e => setNewBooking(p => ({ ...p, startTime: e.target.value }))} className="input-field" required /></div>
              <div><label className="input-label">End Time *</label><input type="datetime-local" value={newBooking.endTime} onChange={e => setNewBooking(p => ({ ...p, endTime: e.target.value }))} className="input-field" required /></div>
            </div>
            <div className="pt-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowBookingModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Submit Booking</button>
            </div>
          </form>
        </div>
      )}

      {/* Raise Maintenance */}
      {showMaintenanceModal && modalOverlay(
        <div className="modal-panel w-full max-w-md">
          {modalHeader('Raise Maintenance Ticket', () => setShowMaintenanceModal(false))}
          <form onSubmit={handleRaiseMaintenance} className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="input-label">Affected Asset *</label>
              <select value={newMaint.assetTag} onChange={e => setNewMaint(p => ({ ...p, assetTag: e.target.value }))} className="input-field" required>
                <option value="">-- Choose Asset --</option>
                {assets.map(a => <option key={a.tag} value={a.tag}>{a.tag} – {a.name} ({a.status})</option>)}
              </select>
            </div>
            <div><label className="input-label">Issue Description *</label><textarea placeholder="Describe the problem..." value={newMaint.issueDescription} onChange={e => setNewMaint(p => ({ ...p, issueDescription: e.target.value }))} className="input-field h-24 resize-none" required /></div>
            <div>
              <label className="input-label">Priority Level</label>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Critical'] as const).map(level => (
                  <button key={level} type="button"
                    onClick={() => setNewMaint(p => ({ ...p, priority: level }))}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${newMaint.priority === level ? 'bg-amber-50 text-amber-700 border-amber-400 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowMaintenanceModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary"><Wrench className="w-4 h-4" /> Raise Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
