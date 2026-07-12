/* ============================================================================
   ASSETFLOW ENTERPRISE ERP - 10-SCREEN APPLICATION ENGINE (VANILLA JS)
   Self-Contained State-Driven Relational Integrity & Workflow Engine
   ============================================================================ */

const DB_KEY = 'assetflow_db_v1';
let appState = {
  currentUser: null,
  activeScreen: 'dashboard',
  theme: 'dark',
  pendingTransferTargetAssetId: null
};

/* ============================================================================
   1. SEED DATA & STORAGE INITIALIZATION
   ============================================================================ */
function initDatabase() {
  const existing = localStorage.getItem(DB_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.warn("Resetting corrupted database schema.");
    }
  }

  const seedData = {
    users: [
      { id: 'usr-1', name: 'Sriram Admin', email: 'admin@assetflow.local', role: 'Admin', dept: 'CORP-HQ', status: 'Active' },
      { id: 'usr-2', name: 'Priya Sharma', email: 'manager@assetflow.local', role: 'Asset Manager', dept: 'IT-GLOBAL', status: 'Active' },
      { id: 'usr-3', name: 'Rajesh Kumar', email: 'rajesh@assetflow.local', role: 'Department Head', dept: 'OPS-MEDIA', status: 'Active' },
      { id: 'usr-4', name: 'Ananya Iyer', email: 'employee@assetflow.local', role: 'Employee', dept: 'IT-GLOBAL', status: 'Active' },
      { id: 'usr-5', name: 'Vikram Mehta', email: 'vikram@assetflow.local', role: 'Employee', dept: 'OPS-MEDIA', status: 'Active' }
    ],
    departments: [
      { id: 'CORP-HQ', code: 'CORP-HQ', name: 'Executive Headquarters', parent: null, manager: 'Sriram Admin', status: 'Active' },
      { id: 'IT-GLOBAL', code: 'IT-GLOBAL', name: 'Global IT & Cloud Infrastructure', parent: 'CORP-HQ', manager: 'Priya Sharma', status: 'Active' },
      { id: 'OPS-MEDIA', code: 'OPS-MEDIA', name: 'Media Production & Broadcasting', parent: 'CORP-HQ', manager: 'Rajesh Kumar', status: 'Active' },
      { id: 'FIN-AUDIT', code: 'FIN-AUDIT', name: 'Internal Audit & Compliance', parent: 'CORP-HQ', manager: 'Sriram Admin', status: 'Active' }
    ],
    categories: [
      { id: 'cat-1', name: 'Electronics', warranty: 36, customFields: 'CPU, RAM, MAC Address, SSD Storage', assetsCount: 8, status: 'Active' },
      { id: 'cat-2', name: 'Production Equipment', warranty: 24, customFields: 'Sensor Size, Lens Mount, Firmware Version', assetsCount: 4, status: 'Active' },
      { id: 'cat-3', name: 'Furniture', warranty: 60, customFields: 'Material, Ergonomic Rating, Load Capacity', assetsCount: 6, status: 'Active' },
      { id: 'cat-4', name: 'Vehicles', warranty: 36, customFields: 'License Plate, Mileage, Fuel Type, Insurance Expiry', assetsCount: 2, status: 'Active' }
    ],
    assets: [
      { id: 'ast-1', tag: 'AF-0001', name: 'MacBook Pro M3 Max (64GB RAM)', category: 'Electronics', condition: 'New', location: 'Server Room A', assigneeId: 'usr-2', assigneeName: 'Priya Sharma', dept: 'IT-GLOBAL', status: 'Allocated', returnDate: '2026-07-20', history: [{ action: 'Allocated', by: 'Sriram Admin', date: '2026-06-15' }] },
      { id: 'ast-2', tag: 'AF-0002', name: 'Sony FX6 Full-Frame Cinema Camera Kit', category: 'Production Equipment', condition: 'Good', location: 'Media Studio 1', assigneeId: null, assigneeName: null, dept: 'OPS-MEDIA', status: 'Available', returnDate: null, history: [{ action: 'Registered', by: 'Priya Sharma', date: '2026-05-10' }] },
      { id: 'ast-3', tag: 'AF-0114', name: 'Dell XPS 15 OLED Laptop (i9/32GB)', category: 'Electronics', condition: 'Good', location: 'Priya Desk 4B', assigneeId: 'usr-2', assigneeName: 'Priya Sharma', dept: 'IT-GLOBAL', status: 'Allocated', returnDate: '2026-08-01', history: [{ action: 'Allocated', by: 'Priya Sharma', date: '2026-06-01' }] },
      { id: 'ast-4', tag: 'AF-0019', name: 'Herman Miller Aeron Ergonomic Task Chair', category: 'Furniture', condition: 'Good', location: 'Executive Suite 302', assigneeId: 'usr-1', assigneeName: 'Sriram Admin', dept: 'CORP-HQ', status: 'Allocated', returnDate: '2026-12-31', history: [{ action: 'Allocated', by: 'Sriram Admin', date: '2026-01-10' }] },
      { id: 'ast-5', tag: 'AF-0088', name: 'ARRI SkyPanel S60-C LED Softlight', category: 'Production Equipment', condition: 'Fair', location: 'Service Center', assigneeId: null, assigneeName: null, dept: 'OPS-MEDIA', status: 'Under Maintenance', returnDate: null, history: [{ action: 'Maintenance Raised', by: 'Rajesh Kumar', date: '2026-07-10' }] },
      { id: 'ast-6', tag: 'AF-V009', name: 'Ford Transit Custom Utility Van (4WD)', category: 'Vehicles', condition: 'Good', location: 'Underground Garage Bay 4', assigneeId: null, assigneeName: null, dept: 'OPS-MEDIA', status: 'Available', returnDate: null, history: [{ action: 'Returned Check-In (Good)', by: 'Vikram Mehta', date: '2026-07-11' }] },
      { id: 'ast-7', tag: 'AF-0044', name: 'iPad Pro 12.9" M2 w/ Apple Pencil', category: 'Electronics', condition: 'Poor', location: 'IT Depot Locker 8', assigneeId: 'usr-4', assigneeName: 'Ananya Iyer', dept: 'IT-GLOBAL', status: 'Allocated', returnDate: '2026-07-08', history: [{ action: 'Allocated', by: 'Priya Sharma', date: '2026-06-01' }] },
      { id: 'ast-8', tag: 'AF-0092', name: 'Sennheiser MKH 416 Shotgun Mic Kit', category: 'Production Equipment', condition: 'Damaged', location: 'Audit Flagged Area', assigneeId: null, assigneeName: null, dept: 'OPS-MEDIA', status: 'Lost', returnDate: null, history: [{ action: 'Flagged Missing in Audit', by: 'Sriram Admin', date: '2026-07-09' }] }
    ],
    bookings: [
      { id: 'bk-1', resource: 'Boardroom A (4K Video Conferencing)', userId: 'usr-2', userName: 'Priya Sharma', start: '2026-07-12T09:00', end: '2026-07-12T11:00', purpose: 'Executive Strategy Roadmap Sync', status: 'confirmed' },
      { id: 'bk-2', resource: 'Utility Van Ford Transit (AF-V009)', userId: 'usr-3', userName: 'Rajesh Kumar', start: '2026-07-12T13:00', end: '2026-07-12T17:00', purpose: 'On-Location Broadcast Shoot at Stadium', status: 'confirmed' },
      { id: 'bk-3', resource: 'Executive Suite B2', userId: 'usr-1', userName: 'Sriram Admin', start: '2026-07-12T14:00', end: '2026-07-12T16:00', purpose: 'Annual IT Budget Audit Meeting', status: 'confirmed' }
    ],
    maintenance: [
      { id: 'mnt-1', assetId: 'ast-5', assetTag: 'AF-0088', assetName: 'ARRI SkyPanel S60-C LED Softlight', requestedBy: 'Rajesh Kumar', priority: 'high', title: 'Power supply flickering above 80% output', desc: 'Driver ballast overheats during continuous studio recording.', status: 'in_progress', cost: 350, date: '2026-07-10' },
      { id: 'mnt-2', assetId: 'ast-7', assetTag: 'AF-0044', assetName: 'iPad Pro 12.9" M2 w/ Apple Pencil', requestedBy: 'Ananya Iyer', priority: 'medium', title: 'Screen digitizer unresponsive near edges', desc: 'Touch input drops out when using stylus in landscape mode.', status: 'pending', cost: 180, date: '2026-07-11' },
      { id: 'mnt-3', assetId: 'ast-1', assetTag: 'AF-0001', assetName: 'MacBook Pro M3 Max', requestedBy: 'Priya Sharma', priority: 'low', title: 'Thunderbolt port 3 intermittent connection', desc: 'External 4K monitor drops display randomly when cable flexed.', status: 'approved', cost: 0, date: '2026-07-12' }
    ],
    audits: [
      {
        id: 'aud-101',
        title: 'Q3 Global IT & Studio Verification Audit',
        deptScope: 'All Departments',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        status: 'In-Progress',
        records: [
          { recordId: 'rec-1', assetId: 'ast-1', tag: 'AF-0001', name: 'MacBook Pro M3 Max', baselineStatus: 'Allocated', verification: 'Verified', notes: 'Checked with Priya Sharma at desk.' },
          { recordId: 'rec-2', assetId: 'ast-2', tag: 'AF-0002', name: 'Sony FX6 Full-Frame Cinema Camera', baselineStatus: 'Available', verification: 'Verified', notes: 'Serial SN-882910 verified in Studio 1.' },
          { recordId: 'rec-3', assetId: 'ast-3', tag: 'AF-0114', name: 'Dell XPS 15 OLED Laptop', baselineStatus: 'Allocated', verification: 'Verified', notes: 'All good.' },
          { recordId: 'rec-4', assetId: 'ast-8', tag: 'AF-0092', name: 'Sennheiser MKH 416 Shotgun Mic Kit', baselineStatus: 'Available', verification: 'Missing', notes: 'Not found in sound locker 3. Flagged.' }
        ]
      }
    ],
    transfers: [
      { id: 'trf-1', assetId: 'ast-3', assetTag: 'AF-0114', assetName: 'Dell XPS 15 OLED Laptop', currentHolder: 'Priya Sharma', requestedBy: 'Rajesh Kumar', reason: 'Needed for 4K video editing while Priya is on field assignment.', status: 'pending', date: '2026-07-11' }
    ],
    notifications: [
      { id: 'notif-1', title: '🚨 Overdue Return Alert', message: 'Ananya Iyer is overdue returning iPad Pro AF-0044 (Due: 2026-07-08).', time: '10 mins ago', read: false },
      { id: 'notif-2', title: '🔧 Maintenance Approved', message: 'MacBook Pro AF-0001 repair request has been approved and moved to Under Maintenance.', time: '1 hour ago', read: false },
      { id: 'notif-3', title: '📅 Booking Reminder', message: 'Your booking for Boardroom A starts today at 09:00 AM.', time: '2 hours ago', read: false }
    ],
    logs: [
      { id: 'log-1', time: '2026-07-12 09:45:10', user: 'Sriram Admin', module: 'ASSETS', desc: 'Allocated AF-0019 Herman Miller Chair to Sriram Admin' },
      { id: 'log-2', time: '2026-07-12 09:12:05', user: 'Priya Sharma', module: 'BOOKINGS', desc: 'Created confirmed booking for Boardroom A (09:00 - 11:00)' },
      { id: 'log-3', time: '2026-07-11 16:30:22', user: 'Vikram Mehta', module: 'ASSETS', desc: 'Completed Check-In return for Ford Transit Van AF-V009 (Condition: Good)' },
      { id: 'log-4', time: '2026-07-11 14:15:00', user: 'Rajesh Kumar', module: 'MAINTENANCE', desc: 'Raised High-Priority repair ticket for ARRI SkyPanel AF-0088' }
    ]
  };

  saveDB(seedData);
  return seedData;
}

function getDB() {
  const db = localStorage.getItem(DB_KEY);
  return db ? JSON.parse(db) : initDatabase();
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function logActivity(module, desc) {
  const db = getDB();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.logs.unshift({
    id: 'log-' + Date.now(),
    time: now,
    user: appState.currentUser ? appState.currentUser.name : 'System User',
    module: module,
    desc: desc
  });
  saveDB(db);
  renderAllViews();
}

/* ============================================================================
   2. CORE NAVIGATION & THEME CONTROLLER
   ============================================================================ */
window.addEventListener('DOMContentLoaded', () => {
  const db = getDB();
  // Auto login as default Admin for seamless hackathon demonstration
  quickLogin('admin@assetflow.local', 'Admin');
  
  // Set default booking form times
  const startEl = document.getElementById('book-start');
  const endEl = document.getElementById('book-end');
  if (startEl && endEl) {
    const today = new Date().toISOString().split('T')[0];
    startEl.value = `${today}T14:00`;
    endEl.value = `${today}T16:00`;
  }
});

function quickLogin(email, role) {
  const db = getDB();
  const user = db.users.find(u => u.email === email) || {
    id: 'usr-admin', name: 'Sriram Admin', email: email, role: role, dept: 'CORP-HQ'
  };
  
  appState.currentUser = user;
  document.getElementById('current-user-name').innerText = user.name;
  document.getElementById('current-user-role').innerText = user.role;
  document.getElementById('current-user-avatar').innerText = user.name.split(' ').map(n => n[0]).join('');
  
  // Show/Hide Organization Setup based on Admin role (Screen 3 rule)
  const orgSetupBtn = document.getElementById('nav-org-setup');
  if (orgSetupBtn) {
    orgSetupBtn.style.display = (user.role === 'Admin') ? 'flex' : 'none';
  }
  
  document.getElementById('view-login').style.display = 'none';
  document.getElementById('app-workspace').style.display = 'flex';
  
  switchScreen('dashboard');
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  quickLogin(email, email.includes('admin') ? 'Admin' : 'Asset Manager');
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const dept = document.getElementById('signup-dept').value;
  
  const db = getDB();
  if (db.users.some(u => u.email === email)) {
    alert("Email already registered in system.");
    return;
  }
  
  // Per Screen 1 rule: Signup always creates Employee account only
  const newUser = {
    id: 'usr-' + Date.now(),
    name: name,
    email: email,
    role: 'Employee',
    dept: dept,
    status: 'Active'
  };
  
  db.users.push(newUser);
  saveDB(db);
  logActivity('USERS', `New employee registered via Screen 1 signup: ${email} (${dept})`);
  
  alert("Account created successfully with default 'Employee' role. An Admin can promote your account to Department Head or Asset Manager in Organization Setup.");
  quickLogin(email, 'Employee');
}

function handleLogout() {
  appState.currentUser = null;
  document.getElementById('app-workspace').style.display = 'none';
  document.getElementById('view-login').style.display = 'flex';
}

function switchLoginTab(tab) {
  const loginBtn = document.querySelector('#view-login .tab-btn:nth-child(1)');
  const signupBtn = document.querySelector('#view-login .tab-btn:nth-child(2)');
  const loginForm = document.getElementById('login-form-box');
  const signupForm = document.getElementById('signup-form-box');
  
  if (tab === 'login') {
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
  } else {
    loginBtn.classList.remove('active');
    signupBtn.classList.add('active');
    loginForm.classList.remove('active');
    signupForm.classList.add('active');
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById('theme-icon');
  if (html.getAttribute('data-theme') === 'dark') {
    html.setAttribute('data-theme', 'light');
    icon.className = 'fa-solid fa-sun';
  } else {
    html.setAttribute('data-theme', 'dark');
    icon.className = 'fa-solid fa-moon';
  }
}

function switchScreen(screenId) {
  appState.activeScreen = screenId;
  document.querySelectorAll('.screen-view').forEach(view => view.classList.remove('active'));
  const target = document.getElementById('view-' + screenId);
  if (target) target.classList.add('active');
  
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navLink = document.querySelector(`.nav-item[onclick="switchScreen('${screenId}')"]`);
  if (navLink) navLink.classList.add('active');
  
  renderAllViews();
}

function switchSetupTab(tabId, btnElement) {
  document.querySelectorAll('#view-org-setup .tab-btn').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
  document.querySelectorAll('#view-org-setup .tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  populateSelectDropdowns();
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

/* ============================================================================
   3. RENDERING ENGINE FOR ALL 10 SCREENS
   ============================================================================ */
function renderAllViews() {
  const db = getDB();
  populateSelectDropdowns();
  
  // 1. Dashboard Render
  renderDashboard(db);
  // 2. Org Setup Render
  renderOrgSetup(db);
  // 3. Assets Render
  renderAssets(db);
  // 4. Allocation Render
  renderAllocation(db);
  // 5. Bookings Render
  renderBookings(db);
  // 6. Maintenance Render
  renderMaintenance(db);
  // 7. Audit Render
  renderAudit(db);
  // 8. Reports & Heatmaps Render
  renderReports(db);
  // 9. Activity & Notifications Render
  renderActivity(db);
}

function populateSelectDropdowns() {
  const db = getDB();
  
  // Populate asset options
  const allocAsset = document.getElementById('alloc-asset-select');
  const returnAsset = document.getElementById('return-asset-select');
  const repairAsset = document.getElementById('repair-asset-select');
  
  if (allocAsset) {
    allocAsset.innerHTML = db.assets
      .map(a => `<option value="${a.id}">${a.tag} — ${a.name} (${a.status})</option>`)
      .join('');
  }
  if (returnAsset) {
    returnAsset.innerHTML = db.assets
      .filter(a => a.status === 'Allocated')
      .map(a => `<option value="${a.id}">${a.tag} — ${a.name} (Held by: ${a.assigneeName || 'Staff'})</option>`)
      .join('');
  }
  if (repairAsset) {
    repairAsset.innerHTML = db.assets
      .map(a => `<option value="${a.id}">${a.tag} — ${a.name} (${a.condition})</option>`)
      .join('');
  }
  
  // Populate user options
  const allocUser = document.getElementById('alloc-user-select');
  if (allocUser) {
    allocUser.innerHTML = db.users
      .map(u => `<option value="${u.id}">${u.name} (${u.role} — ${u.dept})</option>`)
      .join('');
  }
}

/* --- SCREEN 2: DASHBOARD RENDER --- */
function renderDashboard(db) {
  const availCount = db.assets.filter(a => a.status === 'Available').length;
  const allocCount = db.assets.filter(a => a.status === 'Allocated').length;
  const maintCount = db.maintenance.filter(m => ['pending', 'approved', 'in_progress'].includes(m.status)).length;
  const bookCount = db.bookings.filter(b => b.status === 'confirmed').length;
  const transCount = db.transfers.filter(t => t.status === 'pending').length;
  
  const kpiContainer = document.getElementById('dashboard-kpi-container');
  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <div class="kpi-card" style="border-left: 4px solid #10b981;">
        <div class="kpi-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i class="fa-solid fa-check-circle"></i></div>
        <div class="kpi-info"><h4>${availCount}</h4><p>Assets Available</p></div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid #3b82f6;">
        <div class="kpi-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;"><i class="fa-solid fa-user-check"></i></div>
        <div class="kpi-info"><h4>${allocCount}</h4><p>Assets Allocated</p></div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid #f59e0b;">
        <div class="kpi-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i class="fa-solid fa-wrench"></i></div>
        <div class="kpi-info"><h4>${maintCount}</h4><p>Maintenance Today</p></div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid #8b5cf6;">
        <div class="kpi-icon" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;"><i class="fa-solid fa-calendar-check"></i></div>
        <div class="kpi-info"><h4>${bookCount}</h4><p>Active Bookings</p></div>
      </div>
      <div class="kpi-card" style="border-left: 4px solid #06b6d4;">
        <div class="kpi-icon" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;"><i class="fa-solid fa-right-left"></i></div>
        <div class="kpi-info"><h4>${transCount}</h4><p>Pending Transfers</p></div>
      </div>
    `;
  }
  
  // Overdue Returns Table (Past expected return date highlighted separately as required)
  const now = new Date();
  const overdueItems = db.assets.filter(a => a.status === 'Allocated' && a.returnDate && new Date(a.returnDate) < now);
  const overdueBody = document.getElementById('overdue-table-body');
  if (overdueBody) {
    document.getElementById('overdue-count-badge').innerText = `${overdueItems.length} Overdue`;
    overdueBody.innerHTML = overdueItems.length ? overdueItems.map(a => {
      const diffDays = Math.ceil((now - new Date(a.returnDate)) / (1000 * 60 * 60 * 24));
      return `
        <tr>
          <td><strong style="color: #ef4444;">${a.tag}</strong></td>
          <td>${a.name}</td>
          <td>${a.assigneeName || 'Staff'} (${a.dept})</td>
          <td>${a.returnDate}</td>
          <td><span class="badge badge-lost">${diffDays} Days Overdue</span></td>
          <td><button class="btn-danger" style="font-size: 0.78rem;" onclick="switchScreen('allocation')"><i class="fa-solid fa-bell"></i> Request Return</button></td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">✅ No overdue asset allocations recorded today.</td></tr>`;
  }
  
  // Recent activity / bookings table
  const recentTable = document.getElementById('dashboard-recent-table');
  if (recentTable) {
    recentTable.innerHTML = db.bookings.map(b => `
      <tr>
        <td><strong>${b.resource}</strong></td>
        <td>${b.userName}</td>
        <td>${b.start.replace('T', ' ')} &rarr; ${b.end.split('T')[1]}</td>
        <td><span class="badge badge-allocated">Confirmed</span></td>
      </tr>
    `).join('');
  }
}

/* --- SCREEN 3: ORG SETUP RENDER --- */
function renderOrgSetup(db) {
  // Departments Table
  const deptsBody = document.getElementById('table-depts-body');
  if (deptsBody) {
    deptsBody.innerHTML = db.departments.map(d => `
      <tr>
        <td><strong>${d.code}</strong></td>
        <td>${d.name}</td>
        <td>${d.parent || '<span style="color:var(--text-muted);">Root Dept</span>'}</td>
        <td>${d.manager}</td>
        <td><span class="badge badge-available">Active</span></td>
      </tr>
    `).join('');
  }
  
  // Categories Table
  const catsBody = document.getElementById('table-cats-body');
  if (catsBody) {
    catsBody.innerHTML = db.categories.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.warranty} Months</td>
        <td><code style="background:rgba(0,0,0,0.3); padding:4px 8px; border-radius:4px; font-size:0.8rem;">${c.customFields}</code></td>
        <td>${c.assetsCount} Items</td>
        <td><span class="badge badge-available">Active</span></td>
      </tr>
    `).join('');
  }
  
  // Users Table & Role Promotion Dropdown (Screen 3 Tab C Rule)
  const usersBody = document.getElementById('table-users-body');
  if (usersBody) {
    usersBody.innerHTML = db.users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.dept}</td>
        <td><span class="badge ${u.role === 'Admin' ? 'badge-reserved' : u.role === 'Asset Manager' ? 'badge-allocated' : 'badge-available'}">${u.role}</span></td>
        <td>
          <select onchange="promoteUser('${u.id}', this.value)" style="padding:4px 8px; font-size:0.8rem; background:var(--bg-glass); border-color:var(--accent-primary);">
            <option value="Employee" ${u.role === 'Employee' ? 'selected' : ''}>Employee (Standard)</option>
            <option value="Department Head" ${u.role === 'Department Head' ? 'selected' : ''}>Department Head</option>
            <option value="Asset Manager" ${u.role === 'Asset Manager' ? 'selected' : ''}>Asset Manager</option>
            <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
      </tr>
    `).join('');
  }
}

function promoteUser(userId, targetRole) {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (user && user.role !== targetRole) {
    const oldRole = user.role;
    user.role = targetRole;
    saveDB(db);
    logActivity('USERS', `Admin promoted ${user.name} from '${oldRole}' to '${targetRole}' in Screen 3 Tab C.`);
    alert(`✅ RBAC Update Complete: ${user.name} has been promoted to ${targetRole}!`);
  }
}

/* --- SCREEN 4: ASSETS DIRECTORY RENDER --- */
function renderAssets(db) {
  const tbody = document.getElementById('table-assets-body');
  if (!tbody) return;
  
  const catFilter = document.getElementById('filter-category')?.value || '';
  const statFilter = document.getElementById('filter-status')?.value || '';
  const deptFilter = document.getElementById('filter-dept')?.value || '';
  
  const filtered = db.assets.filter(a => {
    if (catFilter && a.category !== catFilter) return false;
    if (statFilter && a.status !== statFilter) return false;
    if (deptFilter && a.dept !== deptFilter) return false;
    return true;
  });
  
  tbody.innerHTML = filtered.map(a => `
    <tr>
      <td><strong style="color:var(--accent-primary); font-size:0.95rem;">${a.tag}</strong></td>
      <td><strong>${a.name}</strong><br/><span style="font-size:0.75rem; color:var(--text-muted);">Dept: ${a.dept}</span></td>
      <td>${a.category}</td>
      <td>${a.location}</td>
      <td>${a.assigneeName || '<span style="color:var(--text-muted);">&mdash;</span>'}</td>
      <td>
        <span class="badge ${a.status === 'Available' ? 'badge-available' : a.status === 'Allocated' ? 'badge-allocated' : a.status === 'Under Maintenance' ? 'badge-maintenance' : 'badge-lost'}">
          ${a.status}
        </span>
      </td>
      <td><span style="font-size:0.85rem; font-weight:600; color:${a.condition === 'New' || a.condition === 'Good' ? '#10b981' : '#f59e0b'};">${a.condition}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn-secondary" style="padding:6px 10px; font-size:0.75rem;" onclick="prefillAllocate('${a.id}')" title="Allocate/Transfer">
            <i class="fa-solid fa-right-left"></i>
          </button>
          <button class="btn-secondary" style="padding:6px 10px; font-size:0.75rem;" onclick="viewAssetHistory('${a.id}')" title="Audit History">
            <i class="fa-solid fa-clipboard-list"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function applyAssetFilters() {
  renderAssets(getDB());
}

function resetAssetFilters() {
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-dept').value = '';
  renderAssets(getDB());
}

function prefillAllocate(assetId) {
  switchScreen('allocation');
  const select = document.getElementById('alloc-asset-select');
  if (select) select.value = assetId;
}

function viewAssetHistory(assetId) {
  const db = getDB();
  const a = db.assets.find(ast => ast.id === assetId);
  if (!a) return;
  const histText = (a.history || []).map(h => `• [${h.date}] ${h.action} (by ${h.by})`).join('\n');
  alert(`📋 Lifecycle Audit Trail for ${a.tag} (${a.name}):\n\nCurrent Status: ${a.status}\nCondition: ${a.condition}\nAssigned Department: ${a.dept}\n\nHistory Events:\n${histText || 'No history logged.'}`);
}

/* --- SCREEN 5: ALLOCATION & TRANSFER RENDER & ACTIONS --- */
function renderAllocation(db) {
  // Transfers ledger
  const tbody = document.getElementById('table-transfers-body');
  if (tbody) {
    tbody.innerHTML = db.transfers.map(t => `
      <tr>
        <td><strong>${t.assetTag}</strong> — ${t.assetName}</td>
        <td><span class="badge badge-allocated">${t.currentHolder}</span></td>
        <td>${t.requestedBy}</td>
        <td>${t.reason}</td>
        <td><span class="badge badge-maintenance">${t.status}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn-primary" style="padding:6px 12px; font-size:0.78rem;" onclick="approveTransfer('${t.id}')">Approve Transfer</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

function handleAllocateSubmit(e) {
  e.preventDefault();
  const assetId = document.getElementById('alloc-asset-select').value;
  const userId = document.getElementById('alloc-user-select').value;
  const returnDate = document.getElementById('alloc-return-date').value;
  
  const db = getDB();
  const asset = db.assets.find(a => a.id === assetId);
  const targetUser = db.users.find(u => u.id === userId);
  
  if (!asset || !targetUser) return;
  
  // Screen 5 CONFLICT RULE CHECK:
  // "You can't allocate an asset that's already taken. If Raj tries to allocate it too, system blocks it, shows currently held by Priya, and offers a Transfer Request button instead."
  if (asset.status === 'Allocated' || asset.assigneeId) {
    const holder = asset.assigneeName || 'Another Staff Member';
    appState.pendingTransferTargetAssetId = asset.id;
    document.getElementById('conflict-msg').innerText = `Asset ${asset.tag} (${asset.name}) is currently allocated to and held by ${holder}. Overwriting an active allocation directly is blocked to prevent double-booking.`;
    openModal('modal-conflict');
    return;
  }
  
  // Execute clean allocation
  asset.status = 'Allocated';
  asset.assigneeId = targetUser.id;
  asset.assigneeName = targetUser.name;
  asset.dept = targetUser.dept;
  asset.returnDate = returnDate || '2026-08-30';
  asset.history = asset.history || [];
  asset.history.push({ action: `Allocated to ${targetUser.name}`, by: appState.currentUser ? appState.currentUser.name : 'System', date: new Date().toISOString().split('T')[0] });
  
  saveDB(db);
  logActivity('ASSETS', `Allocated asset ${asset.tag} (${asset.name}) to employee ${targetUser.name}`);
  alert(`✅ Asset ${asset.tag} successfully allocated to ${targetUser.name}!`);
  renderAllViews();
}

function convertConflictToTransfer() {
  closeModal('modal-conflict');
  const db = getDB();
  const asset = db.assets.find(a => a.id === appState.pendingTransferTargetAssetId);
  if (!asset) return;
  
  const newTransfer = {
    id: 'trf-' + Date.now(),
    assetId: asset.id,
    assetTag: asset.tag,
    assetName: asset.name,
    currentHolder: asset.assigneeName || 'Staff',
    requestedBy: appState.currentUser ? appState.currentUser.name : 'Staff Member',
    reason: 'Requested transfer handover during high-priority project assignment.',
    status: 'pending',
    date: new Date().toISOString().split('T')[0]
  };
  
  db.transfers.push(newTransfer);
  saveDB(db);
  logActivity('ASSETS', `Initiated formal Transfer Request for ${asset.tag} from ${asset.assigneeName}`);
  alert(`✅ Transfer Request Raised for ${asset.tag}! Asset Manager / Department Head can now review and approve in the Transfer Ledger below.`);
  renderAllViews();
}

function approveTransfer(transferId) {
  const db = getDB();
  const tIndex = db.transfers.findIndex(t => t.id === transferId);
  if (tIndex === -1) return;
  const trf = db.transfers[tIndex];
  
  const asset = db.assets.find(a => a.id === trf.assetId);
  if (asset) {
    asset.assigneeName = trf.requestedBy;
    asset.history.push({ action: `Handed over via Transfer Request from ${trf.currentHolder} to ${trf.requestedBy}`, by: appState.currentUser ? appState.currentUser.name : 'Manager', date: new Date().toISOString().split('T')[0] });
  }
  
  trf.status = 'Approved & Handed Over';
  db.transfers.splice(tIndex, 1);
  saveDB(db);
  logActivity('ASSETS', `Approved transfer handover for ${trf.assetTag} to ${trf.requestedBy}`);
  alert(`✅ Transfer Approved! Asset ${trf.assetTag} is now officially assigned to ${trf.requestedBy}.`);
  renderAllViews();
}

function handleReturnSubmit(e) {
  e.preventDefault();
  const assetId = document.getElementById('return-asset-select').value;
  const cond = document.getElementById('return-condition').value;
  const notes = document.getElementById('return-notes').value || 'Returned in good working condition.';
  
  const db = getDB();
  const asset = db.assets.find(a => a.id === assetId);
  if (!asset) return;
  
  const oldHolder = asset.assigneeName || 'Staff';
  asset.status = 'Available';
  asset.assigneeId = null;
  asset.assigneeName = null;
  asset.returnDate = null;
  asset.condition = cond;
  asset.history.push({ action: `Returned Check-In (Condition: ${cond} — ${notes})`, by: appState.currentUser ? appState.currentUser.name : 'Staff', date: new Date().toISOString().split('T')[0] });
  
  saveDB(db);
  logActivity('ASSETS', `Check-in verification completed for ${asset.tag} from ${oldHolder} (Condition: ${cond})`);
  alert(`✅ Return Check-In Complete! Asset ${asset.tag} reverted to 'Available' status with condition: ${cond}.`);
  renderAllViews();
}

/* --- SCREEN 6: RESOURCE BOOKINGS RENDER & OVERLAP CHECK --- */
function renderBookings(db) {
  // Booking Calendar Grid
  const gridBody = document.getElementById('booking-grid-body');
  if (gridBody) {
    const resources = [
      "Boardroom A (4K Video Conferencing)",
      "Executive Suite B2",
      "Utility Van Ford Transit (AF-V009)",
      "4K Mobile Live Streaming Cart"
    ];
    
    gridBody.innerHTML = resources.map(res => {
      // Check bookings matching time windows
      const checkSlot = (startHour, endHour) => {
        const booked = db.bookings.find(b => b.resource === res && b.status !== 'cancelled' && b.start.includes(`T${startHour < 10 ? '0' + startHour : startHour}`));
        if (booked) {
          return `<td style="background: rgba(239, 68, 68, 0.18); color: #ef4444; font-weight: 600;">Booked: ${booked.userName.split(' ')[0]}</td>`;
        }
        return `<td style="background: rgba(16, 185, 129, 0.08); color: #10b981; font-weight: 500;">Available</td>`;
      };
      
      return `
        <tr>
          <td><strong>${res}</strong></td>
          <td>Shared Room / Eq</td>
          ${checkSlot(9, 11)}
          ${checkSlot(11, 13)}
          ${checkSlot(13, 15)}
          ${checkSlot(15, 17)}
        </tr>
      `;
    }).join('');
  }
  
  // Bookings Ledger
  const tbody = document.getElementById('table-bookings-body');
  if (tbody) {
    tbody.innerHTML = db.bookings.map(b => `
      <tr>
        <td><code>${b.id}</code></td>
        <td><strong>${b.resource}</strong></td>
        <td>${b.userName}</td>
        <td>${b.start.replace('T', ' ')}</td>
        <td>${b.end.split('T')[1]}</td>
        <td>${b.purpose}</td>
        <td><span class="badge ${b.status === 'confirmed' ? 'badge-allocated' : 'badge-lost'}">${b.status}</span></td>
        <td>
          ${b.status === 'confirmed' ? `<button class="btn-danger" style="font-size:0.75rem; padding:4px 10px;" onclick="cancelBooking('${b.id}')">Cancel</button>` : `<span style="color:var(--text-muted);">Cancelled</span>`}
        </td>
      </tr>
    `).join('');
  }
}

function handleBookingSubmit(e) {
  e.preventDefault();
  const resource = document.getElementById('book-resource-select').value;
  const startStr = document.getElementById('book-start').value;
  const endStr = document.getElementById('book-end').value;
  const purpose = document.getElementById('book-purpose').value;
  
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (end <= start) {
    alert("End time must be after start time.");
    return;
  }
  
  const db = getDB();
  
  // STRICT OVERLAP VALIDATION (`btree_gist` simulation):
  // "Two people can't book the same room at overlapping times. Example: Room B2 is booked 9:00-10:00. Request for 9:30-10:30 gets rejected since it overlaps; request for 10:00-11:00 is fine since it starts right after."
  const overlap = db.bookings.find(b => {
    if (b.resource !== resource || b.status === 'cancelled') return false;
    const bStart = new Date(b.start);
    const bEnd = new Date(b.end);
    return (start < bEnd && end > bStart);
  });
  
  if (overlap) {
    alert(`⚠️ OVERLAP VALIDATION REJECTED:\n\n${resource} is already booked from ${overlap.start.replace('T', ' ')} to ${overlap.end.split('T')[1]} by ${overlap.userName} (${overlap.purpose}).\n\nPlease choose a non-overlapping time slot.`);
    return;
  }
  
  const newBooking = {
    id: 'bk-' + Date.now(),
    resource: resource,
    userId: appState.currentUser ? appState.currentUser.id : 'usr-demo',
    userName: appState.currentUser ? appState.currentUser.name : 'Sriram Admin',
    start: startStr,
    end: endStr,
    purpose: purpose,
    status: 'confirmed'
  };
  
  db.bookings.push(newBooking);
  saveDB(db);
  logActivity('BOOKINGS', `Booked ${resource} from ${startStr.replace('T', ' ')} to ${endStr.split('T')[1]}`);
  closeModal('modal-book-resource');
  alert(`✅ Resource Booking Confirmed without overlap!`);
  renderAllViews();
}

function cancelBooking(bkId) {
  const db = getDB();
  const b = db.bookings.find(item => item.id === bkId);
  if (b) {
    b.status = 'cancelled';
    saveDB(db);
    logActivity('BOOKINGS', `Cancelled booking ${b.resource} for ${b.userName}`);
    renderAllViews();
  }
}

/* --- SCREEN 7: MAINTENANCE RENDER & KANBAN WORKFLOW --- */
function renderMaintenance(db) {
  const pPending = document.getElementById('kanban-pending');
  const pApproved = document.getElementById('kanban-approved');
  const pProgress = document.getElementById('kanban-progress');
  const pResolved = document.getElementById('kanban-resolved');
  
  if (!pPending) return;
  pPending.innerHTML = pApproved.innerHTML = pProgress.innerHTML = pResolved.innerHTML = '';
  
  db.maintenance.forEach(m => {
    const cardHtml = `
      <div class="glass-card" style="padding: 14px; background: rgba(15, 23, 42, 0.9);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <strong style="color:var(--accent-primary); font-size:0.85rem;">${m.assetTag}</strong>
          <span class="badge ${m.priority === 'high' ? 'badge-lost' : 'badge-maintenance'}" style="font-size:0.7rem;">${m.priority.toUpperCase()}</span>
        </div>
        <h5 style="font-size:0.92rem; margin-bottom:4px;">${m.title}</h5>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">${m.desc}</p>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:12px;">Requested by: <strong>${m.requestedBy}</strong></div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${m.status === 'pending' ? `
            <button class="btn-primary" style="flex:1; padding:6px; font-size:0.75rem; justify-content:center;" onclick="stepWorkflow('${m.id}', 'approve')">Approve (Lock Asset)</button>
          ` : m.status === 'approved' ? `
            <button class="btn-secondary" style="flex:1; padding:6px; font-size:0.75rem; justify-content:center;" onclick="stepWorkflow('${m.id}', 'assign_technician')">Assign Tech</button>
          ` : m.status === 'in_progress' ? `
            <button class="btn-primary" style="flex:1; padding:6px; font-size:0.75rem; justify-content:center; background:#10b981;" onclick="stepWorkflow('${m.id}', 'resolve')">Mark Resolved</button>
          ` : `<span style="font-size:0.78rem; color:#10b981; font-weight:700;">✅ Repair Completed</span>`}
        </div>
      </div>
    `;
    
    if (m.status === 'pending') pPending.innerHTML += cardHtml;
    else if (m.status === 'approved') pApproved.innerHTML += cardHtml;
    else if (m.status === 'in_progress' || m.status === 'technician_assigned') pProgress.innerHTML += cardHtml;
    else pResolved.innerHTML += cardHtml;
  });
}

function handleRaiseRepairSubmit(e) {
  e.preventDefault();
  const assetId = document.getElementById('repair-asset-select').value;
  const priority = document.getElementById('repair-priority').value;
  const title = document.getElementById('repair-title').value;
  const desc = document.getElementById('repair-desc').value;
  
  const db = getDB();
  const asset = db.assets.find(a => a.id === assetId);
  if (!asset) return;
  
  const newMnt = {
    id: 'mnt-' + Date.now(),
    assetId: asset.id,
    assetTag: asset.tag,
    assetName: asset.name,
    requestedBy: appState.currentUser ? appState.currentUser.name : 'Staff',
    priority: priority,
    title: title,
    desc: desc,
    status: 'pending',
    cost: 150,
    date: new Date().toISOString().split('T')[0]
  };
  
  db.maintenance.unshift(newMnt);
  saveDB(db);
  logActivity('MAINTENANCE', `Raised ${priority}-priority repair ticket for ${asset.tag}: ${title}`);
  closeModal('modal-raise-repair');
  alert(`✅ Repair Request Raised for ${asset.tag}!`);
  renderAllViews();
}

function stepWorkflow(ticketId, action) {
  const db = getDB();
  const ticket = db.maintenance.find(m => m.id === ticketId);
  if (!ticket) return;
  
  const asset = db.assets.find(a => a.id === ticket.assetId);
  
  if (action === 'approve') {
    ticket.status = 'approved';
    if (asset) {
      asset.status = 'Under Maintenance';
      asset.history.push({ action: `Maintenance Approved & Locked (${ticket.title})`, by: 'Asset Manager', date: new Date().toISOString().split('T')[0] });
    }
    logActivity('MAINTENANCE', `Approved maintenance for ${ticket.assetTag}. Asset status auto-updated to 'Under Maintenance'.`);
    alert(`✅ Ticket Approved! Asset ${ticket.assetTag} status has automatically updated to 'Under Maintenance'.`);
  } else if (action === 'assign_technician') {
    ticket.status = 'in_progress';
    logActivity('MAINTENANCE', `Assigned technician and started work on ${ticket.assetTag}`);
  } else if (action === 'resolve') {
    ticket.status = 'resolved';
    if (asset && asset.status === 'Under Maintenance') {
      asset.status = 'Available';
      asset.history.push({ action: `Maintenance Resolved & Returned to Service`, by: 'Technician', date: new Date().toISOString().split('T')[0] });
    }
    logActivity('MAINTENANCE', `Resolved maintenance ticket for ${ticket.assetTag}. Asset status reverted to 'Available'.`);
    alert(`✅ Repair Resolved! Asset ${ticket.assetTag} has been certified and reverted to 'Available' status.`);
  }
  
  saveDB(db);
  renderAllViews();
}

/* --- SCREEN 8: AUDIT VERIFICATION CYCLES RENDER --- */
function renderAudit(db) {
  const container = document.getElementById('audit-cycles-container');
  if (!container) return;
  
  container.innerHTML = db.audits.map(aud => `
    <div class="glass-card" style="margin-bottom: 28px; border-top: 4px solid var(--accent-primary);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div>
          <h3 style="font-size:1.4rem;">${aud.title}</h3>
          <p style="color:var(--text-muted); font-size:0.88rem;">Scope: ${aud.deptScope} | Duration: ${aud.startDate} &rarr; ${aud.endDate}</p>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <span class="badge badge-allocated" style="font-size:0.85rem;">${aud.status}</span>
          ${aud.status === 'In-Progress' ? `
            <button class="btn-primary" style="background:#10b981;" onclick="closeAuditCycle('${aud.id}')">
              <i class="fa-solid fa-lock"></i> Close Cycle & Reconcile Discrepancies
            </button>
          ` : `<span class="badge badge-available">✅ Reconciled & Closed</span>`}
        </div>
      </div>
      
      <div class="data-table-container">
        <table class="data-table">
          <thead><tr><th>Asset Tag</th><th>Asset Name</th><th>Baseline Status</th><th>Auditor Check</th><th>Verification Notes</th></tr></thead>
          <tbody>
            ${aud.records.map(rec => `
              <tr>
                <td><strong>${rec.tag}</strong></td>
                <td>${rec.name}</td>
                <td><span class="badge badge-allocated">${rec.baselineStatus}</span></td>
                <td>
                  ${aud.status === 'In-Progress' ? `
                    <div style="display:flex; gap:6px;">
                      <button class="btn-secondary ${rec.verification === 'Verified' ? 'badge-available' : ''}" style="padding:4px 10px; font-size:0.75rem;" onclick="toggleAuditCheck('${aud.id}', '${rec.recordId}', 'Verified')">Verified ✅</button>
                      <button class="btn-secondary ${rec.verification === 'Missing' ? 'badge-lost' : ''}" style="padding:4px 10px; font-size:0.75rem;" onclick="toggleAuditCheck('${aud.id}', '${rec.recordId}', 'Missing')">Missing ❌</button>
                      <button class="btn-secondary ${rec.verification === 'Damaged' ? 'badge-maintenance' : ''}" style="padding:4px 10px; font-size:0.75rem;" onclick="toggleAuditCheck('${aud.id}', '${rec.recordId}', 'Damaged')">Damaged ⚠️</button>
                    </div>
                  ` : `<span class="badge ${rec.verification === 'Verified' ? 'badge-available' : rec.verification === 'Missing' ? 'badge-lost' : 'badge-maintenance'}">${rec.verification}</span>`}
                </td>
                <td>${rec.notes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');
}

function toggleAuditCheck(cycleId, recordId, newStatus) {
  const db = getDB();
  const aud = db.audits.find(a => a.id === cycleId);
  if (!aud) return;
  const rec = aud.records.find(r => r.recordId === recordId);
  if (rec) {
    rec.verification = newStatus;
    saveDB(db);
    renderAllViews();
  }
}

function closeAuditCycle(cycleId) {
  const db = getDB();
  const aud = db.audits.find(a => a.id === cycleId);
  if (!aud) return;
  
  // Batch update missing items to 'Lost'
  let missingCount = 0;
  aud.records.forEach(rec => {
    if (rec.verification === 'Missing') {
      missingCount++;
      const asset = db.assets.find(ast => ast.id === rec.assetId);
      if (asset) {
        asset.status = 'Lost';
        asset.history.push({ action: `Flagged as MISSING during Audit Cycle #${aud.id}`, by: 'Auditor Team', date: new Date().toISOString().split('T')[0] });
      }
    }
  });
  
  aud.status = 'Closed';
  saveDB(db);
  logActivity('AUDITS', `Closed audit cycle ${aud.title}. Reconciled ${missingCount} missing assets to 'Lost'.`);
  alert(`✅ Audit Cycle Closed & Reconciled!\n\nDiscrepancy Summary:\n• Total Items Checked: ${aud.records.length}\n• Flagged Missing -> Updated to 'Lost': ${missingCount} items`);
  renderAllViews();
}

/* --- SCREEN 9: REPORTS & ANALYTICS RENDER --- */
function renderReports(db) {
  // Utilization Bars
  const utilContainer = document.getElementById('utilization-chart-container');
  if (utilContainer) {
    const total = db.assets.length || 1;
    const alloc = db.assets.filter(a => a.status === 'Allocated').length;
    const avail = db.assets.filter(a => a.status === 'Available').length;
    const maint = db.assets.filter(a => a.status === 'Under Maintenance').length;
    
    utilContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
            <span><strong>Active Employee Allocations (Most-Used)</strong></span>
            <span>${Math.round((alloc/total)*100)}% (${alloc} assets)</span>
          </div>
          <div style="height:12px; border-radius:6px; background:rgba(255,255,255,0.08); overflow:hidden;">
            <div style="height:100%; width:${(alloc/total)*100}%; background:var(--accent-gradient);"></div>
          </div>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
            <span><strong>Idle / Available Buffer Pool</strong></span>
            <span>${Math.round((avail/total)*100)}% (${avail} assets)</span>
          </div>
          <div style="height:12px; border-radius:6px; background:rgba(255,255,255,0.08); overflow:hidden;">
            <div style="height:100%; width:${(avail/total)*100}%; background:#10b981;"></div>
          </div>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
            <span><strong>Maintenance / Repair Bay</strong></span>
            <span>${Math.round((maint/total)*100)}% (${maint} assets)</span>
          </div>
          <div style="height:12px; border-radius:6px; background:rgba(255,255,255,0.08); overflow:hidden;">
            <div style="height:100%; width:${(maint/total)*100}%; background:#f59e0b;"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Category Breakdown Bars
  const catContainer = document.getElementById('category-chart-container');
  if (catContainer) {
    catContainer.innerHTML = db.categories.map(c => `
      <div style="margin-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:4px;">
          <span>${c.name}</span>
          <span style="font-weight:700;">${c.assetsCount} Items</span>
        </div>
        <div style="height:8px; border-radius:4px; background:rgba(255,255,255,0.08); overflow:hidden;">
          <div style="height:100%; width:${Math.min(100, c.assetsCount * 12)}%; background:#06b6d4;"></div>
        </div>
      </div>
    `).join('');
  }
  
  // Booking Heatmap Table
  const heatBody = document.getElementById('heatmap-table-body');
  if (heatBody) {
    heatBody.innerHTML = `
      <tr><td>Boardroom A</td><td>4 bookings</td><td>6 bookings</td><td>8 bookings (Peak)</td><td>5 bookings</td><td>2 bookings</td><td><span class="badge badge-lost">Wednesday Peak</span></td></tr>
      <tr><td>Utility Van (AF-V009)</td><td>2 bookings</td><td>1 booking</td><td>3 bookings</td><td>6 bookings (Peak)</td><td>5 bookings</td><td><span class="badge badge-maintenance">Thursday Peak</span></td></tr>
      <tr><td>Executive Suite B2</td><td>1 booking</td><td>4 bookings (Peak)</td><td>2 bookings</td><td>1 booking</td><td>3 bookings</td><td><span class="badge badge-allocated">Tuesday Peak</span></td></tr>
    `;
  }
}

/* --- SCREEN 10: ACTIVITY & NOTIFICATIONS RENDER --- */
function renderActivity(db) {
  // Notifications List
  const notifContainer = document.getElementById('notifications-list');
  if (notifContainer) {
    const unreadCount = db.notifications.filter(n => !n.read).length;
    document.getElementById('badge-notif').innerText = unreadCount || 0;
    
    notifContainer.innerHTML = db.notifications.map(n => `
      <div class="glass-card" style="padding:14px; border-left:4px solid ${n.read ? 'var(--border-color)' : '#ef4444'}; opacity:${n.read ? '0.6' : '1'};">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <strong style="font-size:0.9rem;">${n.title}</strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">${n.time}</span>
        </div>
        <p style="font-size:0.82rem; color:var(--text-secondary);">${n.message}</p>
      </div>
    `).join('');
  }
  
  // Activity Logs Table
  const logsBody = document.getElementById('table-logs-body');
  if (logsBody) {
    logsBody.innerHTML = db.logs.map(l => `
      <tr>
        <td><code style="font-size:0.78rem;">${l.time}</code></td>
        <td><strong>${l.user}</strong></td>
        <td><span class="badge badge-allocated" style="font-size:0.7rem;">${l.module}</span></td>
        <td>${l.desc}</td>
      </tr>
    `).join('');
  }
}

function markAllNotifsRead() {
  const db = getDB();
  db.notifications.forEach(n => n.read = true);
  saveDB(db);
  renderAllViews();
}

function handleGlobalSearch(query) {
  if (!query || query.trim() === '') {
    renderAssets(getDB());
    return;
  }
  switchScreen('assets');
  const q = query.toLowerCase();
  const db = getDB();
  const filtered = db.assets.filter(a => a.tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.location.toLowerCase().includes(q));
  
  const tbody = document.getElementById('table-assets-body');
  if (tbody) {
    tbody.innerHTML = filtered.map(a => `
      <tr>
        <td><strong style="color:var(--accent-primary);">${a.tag}</strong></td>
        <td><strong>${a.name}</strong><br/><span style="font-size:0.75rem; color:var(--text-muted);">Dept: ${a.dept}</span></td>
        <td>${a.category}</td>
        <td>${a.location}</td>
        <td>${a.assigneeName || '&mdash;'}</td>
        <td><span class="badge badge-allocated">${a.status}</span></td>
        <td>${a.condition}</td>
        <td><button class="btn-secondary" style="padding:6px 10px; font-size:0.75rem;" onclick="prefillAllocate('${a.id}')">Allocate</button></td>
      </tr>
    `).join('');
  }
}

function handleCreateDepartment(e) {
  e.preventDefault();
  const code = document.getElementById('dept-code').value;
  const name = document.getElementById('dept-name').value;
  const parent = document.getElementById('dept-parent').value || null;
  
  const db = getDB();
  db.departments.push({ id: code, code: code, name: name, parent: parent, manager: appState.currentUser ? appState.currentUser.name : 'Admin', status: 'Active' });
  saveDB(db);
  logActivity('USERS', `Created new department ${code} (${name})`);
  alert(`✅ Department ${code} created successfully!`);
  e.target.reset();
  renderAllViews();
}

function handleCreateCategory(e) {
  e.preventDefault();
  const name = document.getElementById('cat-name').value;
  const warranty = parseInt(document.getElementById('cat-warranty').value || '12');
  const custom = document.getElementById('cat-custom').value || 'Standard fields';
  
  const db = getDB();
  db.categories.push({ id: 'cat-' + Date.now(), name: name, warranty: warranty, customFields: custom, assetsCount: 0, status: 'Active' });
  saveDB(db);
  logActivity('ASSETS', `Created new asset category ${name} (Warranty: ${warranty} mos)`);
  alert(`✅ Category ${name} created successfully!`);
  e.target.reset();
  renderAllViews();
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const cat = document.getElementById('reg-category').value;
  const serial = document.getElementById('reg-serial').value || 'SN-' + Math.floor(Math.random() * 900000);
  const cond = document.getElementById('reg-condition').value;
  const loc = document.getElementById('reg-location').value;
  const dept = document.getElementById('reg-dept').value;
  
  const db = getDB();
  const newTag = `AF-${String(db.assets.length + 1).padStart(4, '0')}`;
  
  const newAsset = {
    id: 'ast-' + Date.now(),
    tag: newTag,
    name: name,
    category: cat,
    condition: cond,
    location: loc,
    assigneeId: null,
    assigneeName: null,
    dept: dept,
    status: 'Available',
    returnDate: null,
    history: [{ action: `Registered into Directory (${cond})`, by: appState.currentUser ? appState.currentUser.name : 'Admin', date: new Date().toISOString().split('T')[0] }]
  };
  
  db.assets.unshift(newAsset);
  // increment category count
  const cObj = db.categories.find(c => c.name === cat);
  if (cObj) cObj.assetsCount++;
  
  saveDB(db);
  logActivity('ASSETS', `Registered new asset ${newTag} (${name}) into directory.`);
  closeModal('modal-register');
  alert(`✅ Asset Registered Successfully!\n\nAsset Tag Auto-Generated: ${newTag}\nStatus: Available\nCondition: ${cond}`);
  renderAllViews();
}
