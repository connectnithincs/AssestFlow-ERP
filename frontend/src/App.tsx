import React, { useState } from 'react';
import { useAppState, UserRole } from './context/AppStateContext';
import {
  useDashboardKPIs,
  useAssetDirectory,
  useAssetFinancialValuations,
  useQuickScanAsset,
  useBookResource,
  useApproveMaintenanceRequest,
  useRaisedTicketsQueue,
  useMyTicketProgress,
  useRaiseUserTicket,
  supabase
} from './sdk/tanstack-query-hooks';

export default function App() {
  const { currentRole, setRole, simulateLogin, userId } = useAppState();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [activeOrgTab, setActiveOrgTab] = useState<string>('dept');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Filters for Asset Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Mutation states/inputs
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<any>(null);
  const [quickScanTag, setQuickScanTag] = useState('AF-0010');
  const [quickScanUser, setQuickScanUser] = useState('f1111111-1111-4111-8111-111111111111');
  const [quickScanResult, setQuickScanResult] = useState<string | null>(null);

  // New Asset input states
  const [newAssetTag, setNewAssetTag] = useState('AF-0501');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCat, setNewAssetCat] = useState('CAT-COMP');
  const [newAssetLoc, setNewAssetLoc] = useState('Chennai HQ');
  const [newAssetStatus, setNewAssetStatus] = useState('Available');

  // Booking states
  const [bookingResource, setBookingResource] = useState('Executive Boardroom A');
  const [bookStart, setBookStart] = useState('11:30');
  const [bookEnd, setBookEnd] = useState('12:30');
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Maintenance Ticket states
  const [maintAsset, setMaintAsset] = useState('AF-0010');
  const [maintSummary, setMaintSummary] = useState('');
  const [maintPriority, setMaintPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Queries
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  
  const { data: assets, isLoading: assetsLoading, refetch: refetchAssets } = useAssetDirectory(
    undefined, // We filter client-side to allow search query matching
  );

  const { data: valuations, isLoading: valuationsLoading } = useAssetFinancialValuations();
  const { data: tickets, isLoading: ticketsLoading } = useRaisedTicketsQueue();
  const { data: myTickets } = useMyTicketProgress(userId);

  // Mutations
  const quickScanMutation = useQuickScanAsset();
  const bookMutation = useBookResource();
  const maintenanceMutation = useRaiseUserTicket();

  // Client-side filtering of Assets
  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = catFilter === 'ALL' || asset.category === catFilter;
    const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Action handlers
  const handleQuickScan = async () => {
    setQuickScanResult(null);
    try {
      const res = await quickScanMutation.mutateAsync({
        assetTag: quickScanTag,
        userId: quickScanUser,
      });
      setQuickScanResult(`Success: ${res.message} (${res.new_status})`);
      refetchAssets();
    } catch (err: any) {
      setQuickScanResult(`Exception: ${err.message}`);
    }
  };

  const handleBooking = async () => {
    setBookingError(null);
    try {
      const startIso = new Date();
      const [sh, sm] = bookStart.split(':');
      startIso.setHours(parseInt(sh), parseInt(sm), 0);
      
      const endIso = new Date();
      const [eh, em] = bookEnd.split(':');
      endIso.setHours(parseInt(eh), parseInt(em), 0);

      await bookMutation.mutateAsync({
        resourceId: bookingResource === 'Executive Boardroom A' ? 'a0000000-0000-0000-0000-000000000034' : 'a0000000-0000-0000-0000-000000000035',
        userId,
        startTime: startIso.toISOString(),
        endTime: endIso.toISOString(),
        purpose: 'Enterprise Alignment & Strategy Sync',
      });
      alert('Booking request completed successfully!');
    } catch (err: any) {
      setBookingError(err.message);
    }
  };

  const handleRegisterAsset = async () => {
    try {
      const categoryName = newAssetCat === 'CAT-COMP' ? 'Electronics' : newAssetCat === 'CAT-FURN' ? 'Furniture' : 'Vehicles';
      const categoryId = newAssetCat === 'CAT-COMP' ? 'c0000000-0000-0000-0000-000000000001' : newAssetCat === 'CAT-FURN' ? 'c0000000-0000-0000-0000-000000000004' : 'c0000000-0000-0000-0000-000000000005';
      const { error } = await supabase.from('assets').insert([
        {
          asset_tag: newAssetTag,
          name: newAssetName || 'MacBook Pro 16',
          category: categoryName,
          category_id: categoryId,
          location: newAssetLoc,
          status: newAssetStatus,
          condition: 'New',
          is_bookable: newAssetCat === 'CAT-SERV',
        }
      ]);
      if (error) throw error;
      alert('Asset registered in PostgreSQL database engine!');
      setActiveModal(null);
      refetchAssets();
    } catch (err: any) {
      alert(`Failed to save asset: ${err.message}`);
    }
  };

  const handleRaiseTicket = async () => {
    try {
      await maintenanceMutation.mutateAsync({
        userId,
        assetTag: maintAsset,
        issueTitle: maintSummary || 'Hardware Diagnostic Alarm',
        detailedDescription: 'Escalated diagnostic warning from hardware layer.',
        priority: maintPriority,
      });
      alert('Maintenance request raised successfully!');
      setActiveModal(null);
    } catch (err: any) {
      alert(`Failed to raise maintenance ticket: ${err.message}`);
    }
  };

  return (
    <>
      {/* SVG Gradient Definitions */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#93c5fd" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ================= INTERACTIVE MODALS ================= */}
      {activeModal === 'register' && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>Register New Asset (`assets`)</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
            </div>
            <div className="field">
              <label>Asset Tag</label>
              <input type="text" value={newAssetTag} onChange={(e) => setNewAssetTag(e.target.value)} className="mono" />
            </div>
            <div className="field">
              <label>Asset Name</label>
              <input type="text" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} placeholder="e.g. MacBook Pro 16 (M3 Max)" />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={newAssetCat} onChange={(e) => setNewAssetCat(e.target.value)}>
                <option value="CAT-COMP">Electronics (Computers)</option>
                <option value="CAT-FURN">Furniture</option>
                <option value="CAT-VEH">Vehicles</option>
              </select>
            </div>
            <div className="field">
              <label>Location</label>
              <select value={newAssetLoc} onChange={(e) => setNewAssetLoc(e.target.value)}>
                <option value="Chennai HQ">Chennai HQ</option>
                <option value="Bangalore Ofc">Bangalore Ofc</option>
                <option value="Mumbai Branch">Mumbai Branch</option>
              </select>
            </div>
            <div className="field">
              <label>Initial Status</label>
              <select value={newAssetStatus} onChange={(e) => setNewAssetStatus(e.target.value)}>
                <option value="Available">Available</option>
                <option value="Allocated">Allocated</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
            <button className="btn btn-primary btn-block" onClick={handleRegisterAsset}>Save Asset to Database Engine</button>
          </div>
        </div>
      )}

      {activeModal === 'ticket' && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>Raise Maintenance Request</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
            </div>
            <div className="field">
              <label>Select Asset</label>
              <select value={maintAsset} onChange={(e) => setMaintAsset(e.target.value)}>
                {assets?.map(a => (
                  <option key={a.id} value={a.asset_tag}>{a.asset_tag} · {a.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Issue Summary</label>
              <input type="text" value={maintSummary} onChange={(e) => setMaintSummary(e.target.value)} placeholder="e.g. Battery overheating under load" />
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={maintPriority} onChange={(e) => setMaintPriority(e.target.value as any)}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Issue</option>
              </select>
            </div>
            <button className="btn btn-primary btn-block" onClick={handleRaiseTicket}>Submit Ticket to PostgreSQL Engine</button>
          </div>
        </div>
      )}

      {/* ================= APP SHELL ================= */}
      <div id="app-screen" style={{ display: 'block' }}>
        <div className="shell">
          <div className="sidebar">
            <div className="login-logo"><div className="mark"></div><span>AssetFlow</span></div>
            <div className="sidebar-scroll">
              <div className="nav-group-label">Overview</div>
              <div className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" /><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" /><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" /><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" /></svg>
                Dashboard
              </div>
              <div className="nav-group-label">Manage</div>
              <div className={`nav-item role-admin ${activeView === 'org' ? 'active' : ''}`} onClick={() => setActiveView('org')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="5" r="2" stroke="currentColor" /><circle cx="11" cy="5" r="2" stroke="currentColor" /><path d="M2 14c0-2.2 1.3-4 3-4s3 1.8 3 4M8 14c0-2.2 1.3-4 3-4s3 1.8 3 4" stroke="currentColor" /></svg>
                Organization setup
              </div>
              <div className={`nav-item ${activeView === 'assets' ? 'active' : ''}`} onClick={() => setActiveView('assets')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 5l7-3 7 3-7 3-7-3z" stroke="currentColor" /><path d="M1 5v6l7 3 7-3V5" stroke="currentColor" /></svg>
                Asset directory
              </div>
              <div className={`nav-item ${activeView === 'allocation' ? 'active' : ''}`} onClick={() => setActiveView('allocation')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h9M11 5l-2.5-2.5M11 5l-2.5 2.5" stroke="currentColor" /><path d="M14 11H5M5 11l2.5-2.5M5 11l2.5 2.5" stroke="currentColor" /></svg>
                Allocation & transfer
              </div>
              <div className={`nav-item ${activeView === 'booking' ? 'active' : ''}`} onClick={() => setActiveView('booking')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" /><path d="M1.5 6h13M4.5 1v3M11.5 1v3" stroke="currentColor" /></svg>
                Resource booking
              </div>
              <div className={`nav-item ${activeView === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveView('maintenance')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 2.5a3 3 0 00-3.9 3.9L2 10l2 2 3.6-3.6a3 3 0 003.9-3.9L10 6 8 8l-2-2 2-2 1.5-1.5z" stroke="currentColor" strokeLinejoin="round" /></svg>
                Maintenance
              </div>
              <div className={`nav-item ${activeView === 'audit' ? 'active' : ''}`} onClick={() => setActiveView('audit')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" /><path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" /></svg>
                Asset audits
              </div>
              <div className="nav-group-label">Insights</div>
              <div className={`nav-item ${activeView === 'reports' ? 'active' : ''}`} onClick={() => setActiveView('reports')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 14V8M7 14V4M12 14v-6" stroke="currentColor" /><path d="M1.5 14.5h13" stroke="currentColor" /></svg>
                Reports & analytics
              </div>
              <div className={`nav-item ${activeView === 'activity' ? 'active' : ''}`} onClick={() => setActiveView('activity')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6a4 4 0 018 0c0 3 1 4 1 4H3s1-1 1-4z" stroke="currentColor" /><path d="M6.5 12a1.5 1.5 0 003 0" stroke="currentColor" /></svg>
                Activity & notifications
              </div>
            </div>
            <div className="sidebar-foot">Signed in as <span id="sidebar-role-name">
              {userId === 'f1111111-1111-4111-8111-111111111111' ? 'Priya Nair' : 
               userId === 'f2222222-2222-4222-8222-222222222222' ? 'Priya Sharma' :
               userId === 'f3333333-3333-4333-8333-333333333333' ? 'Rajesh Kumar' : 'Jordan Blake'}
            </span></div>
          </div>

          <div className="main">
            <div className="topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="topbar-title" id="topbar-title">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</div>
                <span className="status-badge-live">⚡ Live Connected: Enterprise Engine</span>
              </div>
              <div className="topbar-right">
                <select className="role-pill" value={currentRole} onChange={(e) => simulateLogin(e.target.value as UserRole)}>
                  <option value="admin">Viewing as: Admin (Priya Nair)</option>
                  <option value="manager">Viewing as: Asset manager (Anita Desai)</option>
                  <option value="head">Viewing as: Department head (Sam Lee)</option>
                  <option value="employee">Viewing as: Employee (Jordan Blake / usr-02)</option>
                </select>
                <div className="bell-wrap" onClick={() => setActiveView('activity')} style={{ cursor: 'pointer' }}>
                  <svg width="19" height="19" viewBox="0 0 16 16" fill="none"><path d="M4 6a4 0 018 0c0 3 1 4 1 4H3s1-1 1-4z" stroke="var(--text-secondary)" /><path d="M6.5 12a1.5 1.5 0 003 0" stroke="var(--text-secondary)" /></svg>
                  <div className="bell-dot"></div>
                </div>
                <div className="avatar" id="topbar-avatar">
                  {userId === 'f1111111-1111-4111-8111-111111111111' ? 'PN' : 
                   userId === 'f2222222-2222-4222-8222-222222222222' ? 'PS' :
                   userId === 'f3333333-3333-4333-8333-333333333333' ? 'RK' : 'JB'}
                </div>
              </div>
            </div>

            <div className="content">

              {/* ===== DASHBOARD ===== */}
              {activeView === 'dashboard' && (
                <div className="view active" id="view-dashboard">
                  <div className="view-header">
                    <h1 id="welcome-heading">Good morning, {
                      userId === 'f1111111-1111-4111-8111-111111111111' ? 'Priya' : 
                      userId === 'f2222222-2222-4222-8222-222222222222' ? 'Priya' :
                      userId === 'f3333333-3333-4333-8333-333333333333' ? 'Rajesh' : 'Jordan'
                    }</h1>
                    <p>Here's what's moving across the org today synced from PostgreSQL engine.</p>
                  </div>
                  <div className="grid grid-4" style={{ marginBottom: '16px' }}>
                    <div className="card kpi">
                      <div className="label">Assets available</div>
                      <div className="num" id="kpi-avail">{kpisLoading ? '--' : kpis?.count_available}</div>
                    </div>
                    <div className="card kpi">
                      <div className="label">Assets allocated</div>
                      <div className="num" id="kpi-alloc">{kpisLoading ? '--' : kpis?.count_allocated}</div>
                    </div>
                    <div className="card kpi">
                      <div className="label">Under maintenance</div>
                      <div className="num" id="kpi-maint">{kpisLoading ? '--' : kpis?.count_under_maintenance}</div>
                    </div>
                    <div className="card kpi">
                      <div className="label">Total registry</div>
                      <div className="num" id="kpi-total">{kpisLoading ? '--' : kpis?.total_assets}</div>
                    </div>
                  </div>
                  <div className="grid grid-2">
                    <div className="card">
                      <div className="section-title">Overdue returns & Critical flags</div>
                      <div id="overdue-list">
                        <div className="list-row"><div><b>AF-0114</b> · Dell laptop <div className="small muted">Priya Nair · Engineering</div></div><span className="badge badge-danger">4 days overdue</span></div>
                        <div className="list-row"><div><b>AF-0330</b> · Projector <div className="small muted">Marketing dept</div></div><span className="badge badge-danger">1 day overdue</span></div>
                        <div className="list-row"><div><b>AF-0092</b> · Company vehicle <div className="small muted">Facilities</div></div><span className="badge badge-danger">7 days overdue</span></div>
                      </div>
                    </div>
                    <div className="card">
                      <div className="section-title">Upcoming returns & bookings</div>
                      <div id="upcoming-list">
                        <div className="list-row"><div>Room B2 booking <div className="small muted">Today, 3:00–4:00 PM</div></div><span className="badge badge-accent">Upcoming</span></div>
                        <div className="list-row"><div>AF-0221 expected return <div className="small muted">Tomorrow</div></div><span className="badge badge-gray">Due soon</span></div>
                        <div className="list-row"><div>Delivery van booking <div className="small muted">Fri, 9:00 AM</div></div><span className="badge badge-accent">Upcoming</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="section-title" style={{ marginTop: '20px' }}>Quick actions</div>
                  <div className="grid grid-3">
                    <button className="btn" onClick={() => setActiveModal('register')} style={{ height: '44px' }}>Register asset</button>
                    <button className="btn" onClick={() => setActiveView('booking')} style={{ height: '44px' }}>Book resource</button>
                    <button className="btn" onClick={() => setActiveModal('ticket')} style={{ height: '44px' }}>Raise maintenance request</button>
                  </div>
                </div>
              )}

              {/* ===== ORG SETUP ===== */}
              {activeView === 'org' && (
                <div className="view active" id="view-org">
                  <div className="view-header"><h1>Organization setup</h1><p>Master data that everything else depends on. Admin only.</p></div>
                  <div className="tabs">
                    <div className={`tab ${activeOrgTab === 'dept' ? 'active' : ''}`} onClick={() => setActiveOrgTab('dept')}>Departments</div>
                    <div className={`tab ${activeOrgTab === 'cat' ? 'active' : ''}`} onClick={() => setActiveOrgTab('cat')}>Asset categories</div>
                    <div className={`tab ${activeOrgTab === 'emp' ? 'active' : ''}`} onClick={() => setActiveOrgTab('emp')}>Employee directory</div>
                  </div>

                  {activeOrgTab === 'dept' && (
                    <div className="org-panel" id="org-dept">
                      <div className="card">
                        <table id="table-dept">
                          <thead><tr><th>Department</th><th>Head</th><th>Parent</th><th>Status</th></tr></thead>
                          <tbody>
                            <tr><td>Engineering</td><td>Priya Nair</td><td>—</td><td><span className="badge badge-success">Active</span></td></tr>
                            <tr><td>Marketing</td><td>Sam Lee</td><td>—</td><td><span className="badge badge-success">Active</span></td></tr>
                            <tr><td>Facilities</td><td>Anita Desai</td><td>Operations</td><td><span className="badge badge-success">Active</span></td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeOrgTab === 'cat' && (
                    <div className="org-panel" id="org-cat">
                      <div className="card">
                        <table>
                          <thead><tr><th>Category</th><th>Custom fields</th><th>Assets</th></tr></thead>
                          <tbody>
                            <tr><td>Electronics</td><td>Warranty period, useful life (36m)</td><td>21</td></tr>
                            <tr><td>Furniture</td><td>Ergonomic rating, useful life (60m)</td><td>8</td></tr>
                            <tr><td>Vehicles</td><td>Registration no., insurance expiry</td><td>6</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeOrgTab === 'emp' && (
                    <div className="org-panel" id="org-emp">
                      <div className="card">
                        <table>
                          <thead><tr><th>Name</th><th>Department</th><th>Role</th><th>Status</th></tr></thead>
                          <tbody id="tbody-emp">
                            <tr><td>Priya Nair</td><td>Engineering</td><td><span className="badge badge-accent">Department head</span></td><td><span className="badge badge-success">Active</span></td></tr>
                            <tr><td>Anita Desai</td><td>Facilities</td><td><span className="badge badge-accent">Asset manager</span></td><td><span className="badge badge-success">Active</span></td></tr>
                            <tr><td>Sam Lee</td><td>Marketing</td><td><span className="badge badge-accent">Department head</span></td><td><span className="badge badge-success">Active</span></td></tr>
                            <tr><td>Jordan Blake</td><td>Marketing</td><td><span className="badge badge-gray">Employee</span></td><td><span className="badge badge-gray">Inactive</span></td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== ASSET DIRECTORY ===== */}
              {activeView === 'assets' && (
                <div className="view active" id="view-assets">
                  <div className="view-header"><h1>Asset directory</h1><p>Live synchronized from PostgreSQL database engine.</p></div>
                  <div className="card">
                    <div className="toolbar">
                      <input className="search-input" placeholder="Search by tag or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                        <option value="ALL">All categories</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Vehicles">Vehicles</option>
                      </select>
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">All statuses</option>
                        <option value="Available">Available</option>
                        <option value="Allocated">Allocated</option>
                        <option value="Under Maintenance">Under maintenance</option>
                      </select>
                      <div className="spacer"></div>
                      <button className="btn btn-primary" onClick={() => setActiveModal('register')}>Register asset</button>
                    </div>
                    <table id="table-assets">
                      <thead><tr><th>Tag</th><th>Name</th><th>Category</th><th>Location</th><th>Status</th><th>Details</th></tr></thead>
                      <tbody>
                        {assetsLoading ? (
                          <tr><td colSpan={6}>Loading directory item data...</td></tr>
                        ) : filteredAssets?.map(asset => (
                          <tr key={asset.id}>
                            <td className="mono">{asset.asset_tag}</td>
                            <td>{asset.name}</td>
                            <td>{asset.category}</td>
                            <td>{asset.location}</td>
                            <td><span className={`badge ${asset.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>{asset.status}</span></td>
                            <td><button className="btn" onClick={() => setSelectedAssetDetail(asset)} style={{ padding: '2px 8px', fontSize: '12px' }}>View</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedAssetDetail && (
                    <div className="card" id="assetDetailCard" style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="section-title" style={{ marginBottom: '2px' }}>{selectedAssetDetail.asset_tag} · {selectedAssetDetail.name}</div>
                          <div className="small muted">Location: {selectedAssetDetail.location} · Bookable: {selectedAssetDetail.is_bookable ? 'Yes' : 'No'}</div>
                        </div>
                        <span className="badge badge-accent">{selectedAssetDetail.status}</span>
                      </div>
                      <div className="divider"></div>
                      <button className="btn" onClick={() => setSelectedAssetDetail(null)}>Close Details</button>
                    </div>
                  )}
                </div>
              )}

              {/* ===== ALLOCATION ===== */}
              {activeView === 'allocation' && (
                <div className="view active" id="view-allocation">
                  <div className="view-header"><h1>Allocation & transfer</h1><p>Assign assets, with the atomic quick-scan check-out & check-in mutation engine.</p></div>
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>Atomic Barcode Quick-Scan Check-Out / Check-In (`fn_quick_scan_asset`)</div>
                        <div className="small muted">Simulates barcode scanning tag instantly in a single database transaction.</div>
                      </div>
                      <span className="badge badge-accent">Live DB Engine</span>
                    </div>
                    <div className="divider"></div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select value={quickScanTag} onChange={(e) => setQuickScanTag(e.target.value)} style={{ flex: '1', height: '36px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '0 10px' }}>
                        {assets?.map(a => (
                          <option key={a.id} value={a.asset_tag}>{a.asset_tag} · {a.name}</option>
                        ))}
                      </select>
                      <select value={quickScanUser} onChange={(e) => setQuickScanUser(e.target.value)} style={{ flex: '1', height: '36px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '0 10px' }}>
                        <option value="f1111111-1111-4111-8111-111111111111">Priya Nair (Admin)</option>
                        <option value="f4444444-4444-4444-8444-444444444444">Jordan Blake (Employee)</option>
                      </select>
                      <button className="btn btn-primary" onClick={handleQuickScan} disabled={quickScanMutation.isPending}>
                        {quickScanMutation.isPending ? 'Processing...' : 'Scan & Check-Out / Return'}
                      </button>
                    </div>
                    {quickScanResult && (
                      <div id="allocResult" style={{ marginTop: '14px', fontWeight: 'bold' }}>
                        {quickScanResult}
                      </div>
                    )}
                  </div>

                  <div className="section-title" style={{ marginTop: '20px' }}>Open transfer requests (`v_raised_tickets_queue`)</div>
                  <div className="card">
                    <table>
                      <thead><tr><th>Asset</th><th>Type</th><th>Requested By</th><th>Status</th></tr></thead>
                      <tbody>
                        {ticketsLoading ? (
                          <tr><td colSpan={4}>Loading tickets...</td></tr>
                        ) : tickets?.map(t => (
                          <tr key={t.ticket_id}>
                            <td className="mono">{t.asset_tag}</td>
                            <td>{t.ticket_type}</td>
                            <td>{t.requested_by}</td>
                            <td><span className="badge badge-warning">{t.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===== BOOKING ===== */}
              {activeView === 'booking' && (
                <div className="view active" id="view-booking">
                  <div className="view-header"><h1>Resource booking</h1><p>Book shared resources by time slot, with automatic exclusion constraint (`btree_gist`) overlap validation.</p></div>
                  <div className="card">
                    <div className="toolbar">
                      <select value={bookingResource} onChange={(e) => setBookingResource(e.target.value)}>
                        <option value="Executive Boardroom A">Executive Boardroom A</option>
                        <option value="Delivery van">Delivery van</option>
                      </select>
                      <div className="spacer"></div>
                      <span className="small muted">Today, 9:00 AM – 5:00 PM</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '26px' }}>
                      <label className="small muted">Start</label>
                      <input value={bookStart} onChange={(e) => setBookStart(e.target.value)} type="text" style={{ width: '70px', height: '34px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '0 8px' }} />
                      <label className="small muted">End</label>
                      <input value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} type="text" style={{ width: '70px', height: '34px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '0 8px' }} />
                      <button className="btn btn-primary" onClick={handleBooking} disabled={bookMutation.isPending}>
                        {bookMutation.isPending ? 'Requesting...' : 'Request booking'}
                      </button>
                    </div>
                    {bookingError && (
                      <div id="bookResult" style={{ marginTop: '12px', color: 'var(--danger)', fontWeight: 'bold' }}>
                        {bookingError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== MAINTENANCE ===== */}
              {activeView === 'maintenance' && (
                <div className="view active" id="view-maintenance">
                  <div className="view-header"><h1>Maintenance management</h1><p>Route repair work through approval and observe real-time resolution progress.</p></div>
                  <div className="card">
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>PostgreSQL Maintenance State Locks</div>
                        <div className="small muted">Submit new requests to start resolution workflow triggers.</div>
                      </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setActiveModal('ticket')}>Raise new request</button>
                  </div>
                </div>
              )}

              {/* ===== AUDIT ===== */}
              {activeView === 'audit' && (
                <div className="view active" id="view-audit">
                  <div className="view-header"><h1>Asset audits</h1><p>Run cycle validations and discrepancies.</p></div>
                  <div className="grid grid-2">
                    <div className="card">
                      <div className="section-title">Active cycle · Chennai HQ, Q3</div>
                      <div className="small muted" style={{ marginBottom: '12px' }}>Jul 1 – Jul 20, 2026</div>
                      <table>
                        <thead><tr><th>Asset Tag</th><th>Verification Status</th></tr></thead>
                        <tbody>
                          <tr><td className="mono">AF-0114 · Laptop</td><td>Verified</td></tr>
                          <tr><td className="mono">AF-0092 · Vehicle</td><td>Missing</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== REPORTS ===== */}
              {activeView === 'reports' && (
                <div className="view active" id="view-reports">
                  <div className="view-header"><h1>Reports & analytics</h1><p>Operational insight for managers and financial depreciation engine.</p></div>
                  <div className="grid grid-2">
                    <div className="chart-glass-card">
                      <div className="chart-header-row">
                        <div className="chart-title-group">
                          <div className="chart-main-title">Asset Utilization</div>
                          <div className="chart-sub-title">Real-time lifecycle & category telemetry</div>
                        </div>
                        <div className="chart-legend">
                          <div className="chart-legend-item"><span className="chart-legend-dot active"></span> Active</div>
                          <div className="chart-legend-item"><span className="chart-legend-dot idle"></span> Idle</div>
                        </div>
                      </div>

                      <div className="chart-body-wrapper">
                        {/* Floating 98% Uptime Glass Card on the left */}
                        <div className="chart-floating-uptime">
                          <div className="chart-uptime-top">
                            <span className="chart-uptime-label">System Uptime</span>
                            <span className="chart-uptime-live">LIVE</span>
                          </div>
                          <div className="chart-uptime-value">98.4%</div>
                        </div>

                        {/* Clean Grid Lines */}
                        <div className="chart-grid-lines">
                          <div className="chart-grid-line"></div>
                          <div className="chart-grid-line"></div>
                        </div>

                        {/* SVG Curved Area Chart with Gradient */}
                        <svg className="chart-svg-container" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 180" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                              <stop offset="65%" stopColor="#93c5fd" stopOpacity="0.12" />
                              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path className="chart-area-path" d="M 40,130 C 110,130 150,22 230,35 C 310,48 360,110 460,45 L 460,180 L 40,180 Z" />
                          <path className="chart-line-path" d="M 40,130 C 110,130 150,22 230,35 C 310,48 360,110 460,45" />
                        </svg>

                        {/* Glowing Interactive Data Points + Tooltips */}
                        <div style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '12' }}>
                          <div style={{ position: 'absolute', left: '8%', top: '72%', pointerEvents: 'auto' }}>
                            <div className="chart-point" tabIndex={0}></div>
                            <div className="chart-tooltip">Rooms: 41% Active</div>
                          </div>
                          <div style={{ position: 'absolute', left: '46%', top: '19.4%', pointerEvents: 'auto' }}>
                            <div className="chart-point" tabIndex={0}></div>
                            <div className="chart-tooltip">Electronics: 88% Active (+$4.2k)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="section-title">Financial Depreciation Sample (`Straight-Line`)</div>
                      <table>
                        <thead><tr><th>Asset Tag</th><th>Cost</th><th>Book Val</th><th>Depr %</th></tr></thead>
                        <tbody>
                          {valuationsLoading ? (
                            <tr><td colSpan={4}>Loading financial valuations...</td></tr>
                          ) : valuations?.slice(0, 5).map(v => (
                            <tr key={v.asset_id}>
                              <td className="mono">{v.asset_tag}</td>
                              <td>${v.purchase_cost.toFixed(2)}</td>
                              <td>${v.current_book_value.toFixed(2)}</td>
                              <td>{((1 - v.current_book_value / v.purchase_cost) * 100).toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== ACTIVITY ===== */}
              {activeView === 'activity' && (
                <div className="view active" id="view-activity">
                  <div className="view-header"><h1>Activity & notifications</h1><p>Every role stays informed without digging.</p></div>
                  <div className="grid grid-2">
                    <div className="card">
                      <div className="section-title">Notifications</div>
                      <div className="list-row small"><span>Overdue return alert · AF-0114</span><span className="muted">2h ago</span></div>
                    </div>
                    <div className="card">
                      <div className="section-title">Live Activity Log</div>
                      <div id="activity-list">
                        {myTickets?.map(t => (
                          <div key={t.ticket_id} className="list-row small">
                            <span>{t.summary}</span>
                            <span className="muted">{t.progress_description} ({t.progress_percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
