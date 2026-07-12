import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, UserRole, Department, AssetCategory, Asset, AssetStatus, 
  Booking, MaintenanceRecord, AuditCycle, AuditRecord, AppNotification, Activity,
  NotificationType, AllocationRecord
} from '../types';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}

interface AppStateContextProps {
  currentUser: User | null;
  activeRole: UserRole;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  users: User[];
  departments: Department[];
  categories: AssetCategory[];
  assets: Asset[];
  bookings: Booking[];
  maintenanceRequests: MaintenanceRecord[];
  auditCycles: AuditCycle[];
  notifications: AppNotification[];
  activities: Activity[];
  toasts: Toast[];
  
  // Auth actions
  login: (email: string, role?: UserRole) => boolean;
  signup: (name: string, email: string) => void;
  logout: () => void;
  setActiveRole: (role: UserRole) => void;
  
  // Asset registry actions
  registerAsset: (asset: Omit<Asset, 'maintenanceHistory' | 'allocationHistory'>) => void;
  updateAssetStatus: (tag: string, status: AssetStatus) => void;
  
  // Allocation actions
  allocateAsset: (tag: string, userId: string, notes?: string) => boolean;
  transferAsset: (tag: string, toUserId: string, notes?: string) => boolean;
  returnAsset: (tag: string) => void;
  
  // Booking actions
  createBooking: (booking: Omit<Booking, 'id' | 'status' | 'userName'>) => { success: boolean; error?: string };
  cancelBooking: (id: string) => void;
  
  // Maintenance actions
  raiseMaintenanceRequest: (assetTag: string, issueDescription: string, priority: MaintenanceRecord['priority']) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceRecord['status'], technician?: string) => void;
  
  // Org setup actions
  createDepartment: (name: string, headId?: string, parentDepartment?: string) => void;
  updateDepartment: (id: string, name: string, headId?: string, parentDepartment?: string, status?: 'Active' | 'Inactive') => void;
  createCategory: (name: string, description?: string) => void;
  updateEmployeeRole: (id: string, role: UserRole) => void;
  deactivateEmployee: (id: string) => void;
  
  // Audit actions
  createAuditCycle: (departmentId: string, location: string, assignedAuditorId: string, startDate: string, endDate: string) => void;
  verifyAuditAsset: (cycleId: string, assetTag: string, verificationStatus: AuditRecord['verificationStatus'], notes?: string) => void;
  closeAuditCycle: (cycleId: string) => void;
  
  // Notifications/Toasts
  addToast: (title: string, message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const AppStateContext = createContext<AppStateContextProps | undefined>(undefined);

// Core Seed Data
const initialUsers: User[] = [
  { id: 'usr-1', name: 'Priya Sharma', email: 'priya.sharma@assetflow.com', department: 'IT Operations', role: 'Asset Manager', status: 'Active' },
  { id: 'usr-2', name: 'Amit Patel', email: 'amit.patel@assetflow.com', department: 'Facilities', role: 'Admin', status: 'Active' },
  { id: 'usr-3', name: 'Rohan Das', email: 'rohan.das@assetflow.com', department: 'Human Resources', role: 'Department Head', status: 'Active' },
  { id: 'usr-4', name: 'Vikram Seth', email: 'vikram.seth@assetflow.com', department: 'Finance', role: 'Employee', status: 'Active' },
  { id: 'usr-5', name: 'Sarah Connor', email: 'sarah.c@assetflow.com', department: 'IT Operations', role: 'Employee', status: 'Active' },
  { id: 'usr-6', name: 'John Doe', email: 'john.doe@assetflow.com', department: 'Engineering', role: 'Employee', status: 'Active' },
];

const initialDepartments: Department[] = [
  { id: 'dept-1', name: 'IT Operations', headId: 'usr-1', headName: 'Priya Sharma', status: 'Active' },
  { id: 'dept-2', name: 'Facilities', headId: 'usr-2', headName: 'Amit Patel', status: 'Active' },
  { id: 'dept-3', name: 'Human Resources', headId: 'usr-3', headName: 'Rohan Das', status: 'Active' },
  { id: 'dept-4', name: 'Finance', headId: 'usr-4', headName: 'Vikram Seth', status: 'Active' },
  { id: 'dept-5', name: 'Engineering', headId: 'usr-6', headName: 'John Doe', parentDepartment: 'IT Operations', status: 'Active' },
];

const initialCategories: AssetCategory[] = [
  { id: 'cat-1', name: 'Electronics', description: 'Laptops, mobile devices, monitors' },
  { id: 'cat-2', name: 'Furniture', description: 'Ergonomic chairs, standing desks, conference tables' },
  { id: 'cat-3', name: 'Vehicles', description: 'Company cars, utility vans' },
  { id: 'cat-4', name: 'Office Equipment', description: 'Printers, scanners, projectors' },
  { id: 'cat-5', name: 'IT Equipment', description: 'Servers, routers, switches' },
];

const initialAssets: Asset[] = [
  {
    tag: 'AST-001',
    name: 'MacBook Pro 16" M3 Max',
    category: 'Electronics',
    location: 'HQ - 4th Floor',
    condition: 'Excellent',
    status: 'Allocated',
    serialNumber: 'C02F87XMD6FF',
    acquisitionDate: '2025-01-15',
    currentHolderId: 'usr-1',
    currentHolderName: 'Priya Sharma',
    maintenanceHistory: [],
    allocationHistory: [
      { id: 'alloc-1', assetTag: 'AST-001', userId: 'usr-1', userName: 'Priya Sharma', action: 'Allocated', date: '2025-01-15', notes: 'Primary work machine' }
    ]
  },
  {
    tag: 'AST-002',
    name: 'Steelcase Gesture Ergonomic Chair',
    category: 'Furniture',
    location: 'HQ - 3rd Floor',
    condition: 'Good',
    status: 'Allocated',
    serialNumber: 'SC-GES-9021',
    acquisitionDate: '2024-06-10',
    currentHolderId: 'usr-4',
    currentHolderName: 'Vikram Seth',
    maintenanceHistory: [],
    allocationHistory: [
      { id: 'alloc-2', assetTag: 'AST-002', userId: 'usr-4', userName: 'Vikram Seth', action: 'Allocated', date: '2024-06-12', notes: 'Ergonomic request approved' }
    ]
  },
  {
    tag: 'AST-003',
    name: 'Tesla Model 3 - Red (Corporate)',
    category: 'Vehicles',
    location: 'HQ - Parking Lot B',
    condition: 'Excellent',
    status: 'Available',
    serialNumber: '5YJ3E1EA5LF000000',
    acquisitionDate: '2024-11-20',
    maintenanceHistory: [
      { id: 'm-1', assetTag: 'AST-003', assetName: 'Tesla Model 3 - Red (Corporate)', issueDescription: 'Rear tire pressure warning', priority: 'Medium', assignedTechnician: 'AutoCare Labs', status: 'Resolved', dateRaised: '2025-02-10', dateResolved: '2025-02-12' }
    ],
    allocationHistory: []
  },
  {
    tag: 'AST-004',
    name: 'Dell UltraSharp 34" Curved Monitor',
    category: 'Electronics',
    location: 'HQ - 4th Floor',
    condition: 'Good',
    status: 'Allocated',
    serialNumber: 'CN-0D9Y3P-74445',
    acquisitionDate: '2024-03-05',
    currentHolderId: 'usr-1',
    currentHolderName: 'Priya Sharma',
    maintenanceHistory: [],
    allocationHistory: [
      { id: 'alloc-3', assetTag: 'AST-004', userId: 'usr-1', userName: 'Priya Sharma', action: 'Allocated', date: '2024-03-05' }
    ]
  },
  {
    tag: 'AST-005',
    name: 'Dell XPS 15 9530',
    category: 'Electronics',
    location: 'HQ - 5th Floor',
    condition: 'Fair',
    status: 'Under Maintenance',
    serialNumber: 'DXPS15-99881',
    acquisitionDate: '2023-09-12',
    currentHolderId: 'usr-5',
    currentHolderName: 'Sarah Connor',
    maintenanceHistory: [
      { id: 'm-2', assetTag: 'AST-005', assetName: 'Dell XPS 15 9530', issueDescription: 'Display flickering continuously', priority: 'High', assignedTechnician: 'Alex Mercer (IT)', status: 'In Progress', dateRaised: '2026-07-10' }
    ],
    allocationHistory: [
      { id: 'alloc-4', assetTag: 'AST-005', userId: 'usr-5', userName: 'Sarah Connor', action: 'Allocated', date: '2023-09-12' }
    ]
  },
  {
    tag: 'AST-006',
    name: 'Epson Pro L1070U Laser Projector',
    category: 'Office Equipment',
    location: 'Conference Room Alpha',
    condition: 'Excellent',
    status: 'Reserved',
    serialNumber: 'EPS-L1070-4993',
    acquisitionDate: '2025-05-18',
    maintenanceHistory: [],
    allocationHistory: []
  },
  {
    tag: 'AST-007',
    name: 'iPhone 15 Pro Max 256GB',
    category: 'Electronics',
    location: 'HQ - 2nd Floor',
    condition: 'Excellent',
    status: 'Available',
    serialNumber: 'APP-IP15PM-7711',
    acquisitionDate: '2025-08-01',
    maintenanceHistory: [],
    allocationHistory: []
  }
];

const initialBookings: Booking[] = [
  {
    id: 'b-1',
    resourceId: 'AST-006',
    resourceName: 'Epson Pro L1070U Laser Projector',
    resourceType: 'Equipment',
    userId: 'usr-3',
    userName: 'Rohan Das',
    title: 'Q3 HR Strategy Alignment Meeting',
    startTime: '2026-07-15T10:00',
    endTime: '2026-07-15T12:00',
    status: 'Upcoming'
  },
  {
    id: 'b-2',
    resourceId: 'RM-Alpha',
    resourceName: 'Meeting Room Alpha (HQ 4th Fl)',
    resourceType: 'Meeting Room',
    userId: 'usr-1',
    userName: 'Priya Sharma',
    title: 'ERP Dashboard Sync',
    startTime: '2026-07-12T14:00',
    endTime: '2026-07-12T15:30',
    status: 'Ongoing'
  },
  {
    id: 'b-3',
    resourceId: 'AST-003',
    resourceName: 'Tesla Model 3 - Red (Corporate)',
    resourceType: 'Vehicle',
    userId: 'usr-4',
    userName: 'Vikram Seth',
    title: 'Client Site Visit - Tech Park',
    startTime: '2026-07-14T09:00',
    endTime: '2026-07-14T17:00',
    status: 'Upcoming'
  }
];

const initialNotifications: AppNotification[] = [
  { id: 'nt-1', type: 'Asset Assigned', title: 'Asset Allocated Successfully', message: 'MacBook Pro 16" (AST-001) has been assigned to Priya Sharma.', timestamp: '2026-07-11T16:00', read: false },
  { id: 'nt-2', type: 'Booking Confirmed', title: 'Resource Booking Confirmed', message: 'Your booking for Meeting Room Alpha on July 12 is confirmed.', timestamp: '2026-07-12T08:30', read: false },
  { id: 'nt-3', type: 'Maintenance Approved', title: 'Maintenance Request Approved', message: 'Maintenance for Dell XPS 15 (AST-005) has been approved and assigned.', timestamp: '2026-07-10T11:20', read: true },
  { id: 'nt-4', type: 'Overdue Return', title: 'Asset Return Overdue Warning', message: 'iPad Pro assigned to Vikram Seth was due yesterday.', timestamp: '2026-07-11T09:00', read: false },
];

const initialActivities: Activity[] = [
  { id: 'act-1', type: 'allocation', description: 'allocated MacBook Pro 16" (AST-001) to Priya Sharma', timestamp: '2026-07-11T16:00', user: 'Amit Patel', iconName: 'UserCheck' },
  { id: 'act-2', type: 'booking', description: 'booked Meeting Room Alpha for ERP Dashboard Sync', timestamp: '2026-07-12T08:30', user: 'Priya Sharma', iconName: 'Calendar' },
  { id: 'act-3', type: 'maintenance', description: 'raised high priority maintenance for Dell XPS 15', timestamp: '2026-07-10T10:45', user: 'Sarah Connor', iconName: 'Wrench' },
  { id: 'act-4', type: 'audit', description: 'initiated IT Operations department asset audit cycle', timestamp: '2026-07-09T14:00', user: 'Amit Patel', iconName: 'ClipboardCheck' },
];

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Starts unauthenticated to land on login page by default
  const [activeRole, setActiveRoleState] = useState<UserRole>('Asset Manager');
  const [currentPage, setCurrentPage] = useState<string>('Dashboard');
  
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [categories, setCategories] = useState<AssetCategory[]>(initialCategories);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Track maintenance requests derived or updated
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRecord[]>(
    initialAssets.flatMap(a => a.maintenanceHistory)
  );

  // Seed audits
  const [auditCycles, setAuditCycles] = useState<AuditCycle[]>([
    {
      id: 'aud-1',
      departmentId: 'dept-1',
      departmentName: 'IT Operations',
      location: 'HQ - 4th Floor',
      assignedAuditorId: 'usr-1',
      assignedAuditorName: 'Priya Sharma',
      startDate: '2026-07-01',
      endDate: '2026-07-15',
      status: 'Active',
      discrepancyGenerated: false,
      history: [
        { id: 'ar-1', assetTag: 'AST-001', assetName: 'MacBook Pro 16" M3 Max', verificationStatus: 'Verified', verifiedAt: '2026-07-05T14:30', verifiedBy: 'Priya Sharma', notes: 'In perfect physical shape' },
        { id: 'ar-2', assetTag: 'AST-004', assetName: 'Dell UltraSharp 34" Curved Monitor', verificationStatus: 'Verified', verifiedAt: '2026-07-05T14:50', verifiedBy: 'Priya Sharma' }
      ]
    }
  ]);

  // Keep activeRole in sync with currentUser's role when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setActiveRoleState(currentUser.role);
    }
  }, [currentUser]);

  const addToast = (title: string, message: string, type: Toast['type']) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addNotification = (type: NotificationType, title: string, message: string) => {
    const newNotif: AppNotification = {
      id: `nt-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString().substring(0, 16),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addActivity = (type: string, description: string, user: string, iconName: string) => {
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      type,
      description,
      timestamp: new Date().toISOString().substring(0, 16),
      user,
      iconName
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Auth actions
  const login = (email: string, requestedRole?: UserRole): boolean => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.status === 'Active');
    if (foundUser) {
      setCurrentUser(foundUser);
      if (requestedRole) {
        setActiveRoleState(requestedRole);
      } else {
        setActiveRoleState(foundUser.role);
      }
      addToast('Welcome back!', `Logged in as ${foundUser.name}`, 'success');
      setCurrentPage('Dashboard');
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string) => {
    const newUser: User = {
      id: `usr-${users.length + 1}`,
      name,
      email,
      department: 'Unassigned',
      role: 'Employee', // Signups create Employees only
      status: 'Active'
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setActiveRoleState('Employee');
    addToast('Account Created', 'Your employee account is ready. Roles are assigned by Admin.', 'success');
    setCurrentPage('Dashboard');
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentPage('Login');
    addToast('Logged Out', 'You have been safely signed out.', 'info');
  };

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    addToast('Role Switched', `Viewing dashboard as ${role}`, 'info');
  };

  // Asset registry actions
  const registerAsset = (newAsset: Omit<Asset, 'maintenanceHistory' | 'allocationHistory'>) => {
    const asset: Asset = {
      ...newAsset,
      maintenanceHistory: [],
      allocationHistory: []
    };
    setAssets(prev => [...prev, asset]);
    addActivity('registry', `registered asset ${asset.name} (${asset.tag})`, currentUser?.name || 'System', 'PlusCircle');
    addNotification('Asset Assigned', 'New Asset Registered', `${asset.name} (${asset.tag}) is now in the registry.`);
    addToast('Asset Registered', `${asset.name} added successfully.`, 'success');
  };

  const updateAssetStatus = (tag: string, status: AssetStatus) => {
    setAssets(prev => prev.map(a => a.tag === tag ? { ...a, status } : a));
  };

  // Allocation actions
  const allocateAsset = (tag: string, userId: string, notes?: string): boolean => {
    const asset = assets.find(a => a.tag === tag);
    const user = users.find(u => u.id === userId);
    
    if (!asset || !user) return false;
    if (asset.status !== 'Available') return false;

    const record: AllocationRecord = {
      id: `alloc-${Date.now()}`,
      assetTag: tag,
      userId: user.id,
      userName: user.name,
      action: 'Allocated',
      date: new Date().toISOString().split('T')[0],
      notes
    };

    setAssets(prev => prev.map(a => {
      if (a.tag === tag) {
        return {
          ...a,
          status: 'Allocated',
          currentHolderId: user.id,
          currentHolderName: user.name,
          allocationHistory: [record, ...a.allocationHistory]
        };
      }
      return a;
    }));

    addActivity('allocation', `allocated ${asset.name} to ${user.name}`, currentUser?.name || 'System', 'UserCheck');
    addNotification('Asset Assigned', 'Asset Allocated', `${asset.name} is now allocated to ${user.name}.`);
    addToast('Allocation Complete', `Allocated ${asset.name} to ${user.name}`, 'success');
    return true;
  };

  const transferAsset = (tag: string, toUserId: string, notes?: string): boolean => {
    const asset = assets.find(a => a.tag === tag);
    const user = users.find(u => u.id === toUserId);
    
    if (!asset || !user) return false;
    
    const record: AllocationRecord = {
      id: `alloc-${Date.now()}`,
      assetTag: tag,
      userId: user.id,
      userName: user.name,
      action: 'Transferred',
      date: new Date().toISOString().split('T')[0],
      notes: `Transferred from ${asset.currentHolderName || 'previous holder'}. ${notes || ''}`
    };

    setAssets(prev => prev.map(a => {
      if (a.tag === tag) {
        return {
          ...a,
          status: 'Allocated',
          currentHolderId: user.id,
          currentHolderName: user.name,
          allocationHistory: [record, ...a.allocationHistory]
        };
      }
      return a;
    }));

    addActivity('allocation', `transferred ${asset.name} to ${user.name}`, currentUser?.name || 'System', 'Shuffle');
    addNotification('Transfer Approved', 'Asset Transfer Completed', `${asset.name} transferred to ${user.name}.`);
    addToast('Transfer Approved', `Transferred ${asset.name} to ${user.name}`, 'success');
    return true;
  };

  const returnAsset = (tag: string) => {
    const asset = assets.find(a => a.tag === tag);
    if (!asset) return;

    const record: AllocationRecord = {
      id: `alloc-${Date.now()}`,
      assetTag: tag,
      userId: asset.currentHolderId || '',
      userName: asset.currentHolderName || '',
      action: 'Returned',
      date: new Date().toISOString().split('T')[0]
    };

    setAssets(prev => prev.map(a => {
      if (a.tag === tag) {
        return {
          ...a,
          status: 'Available',
          currentHolderId: undefined,
          currentHolderName: undefined,
          allocationHistory: [record, ...a.allocationHistory]
        };
      }
      return a;
    }));

    addActivity('allocation', `returned ${asset.name} to registry`, currentUser?.name || 'System', 'ArrowLeftRight');
    addToast('Asset Returned', `${asset.name} is now available in the registry.`, 'success');
  };

  // Booking actions
  const createBooking = (newBooking: Omit<Booking, 'id' | 'status' | 'userName'>): { success: boolean; error?: string } => {
    const user = users.find(u => u.id === newBooking.userId);
    if (!user) return { success: false, error: 'User not found' };

    // Validate overlapping bookings (specifically for same resource)
    const newStart = new Date(newBooking.startTime).getTime();
    const newEnd = new Date(newBooking.endTime).getTime();

    if (newStart >= newEnd) {
      return { success: false, error: 'End time must be after start time' };
    }

    const overlap = bookings.find(b => {
      if (b.resourceId !== newBooking.resourceId || b.status === 'Cancelled') return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      
      // Check overlap formula: StartA < EndB and EndA > StartB
      return newStart < bEnd && newEnd > bStart;
    });

    if (overlap) {
      return { 
        success: false, 
        error: `Conflict! Overlaps with booking "${overlap.title}" by ${overlap.userName} (${new Date(overlap.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(overlap.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`
      };
    }

    const booking: Booking = {
      ...newBooking,
      id: `b-${Date.now()}`,
      userName: user.name,
      status: 'Upcoming'
    };

    setBookings(prev => [...prev, booking]);
    
    // Also if the resource is an Asset, we update its status to 'Reserved'
    if (assets.some(a => a.tag === booking.resourceId)) {
      setAssets(prev => prev.map(a => a.tag === booking.resourceId ? { ...a, status: 'Reserved' } : a));
    }

    addActivity('booking', `booked ${booking.resourceName} for "${booking.title}"`, user.name, 'Calendar');
    addNotification('Booking Confirmed', 'Booking Confirmed', `Reserved ${booking.resourceName} for "${booking.title}".`);
    addToast('Booking Confirmed', `Successfully reserved ${booking.resourceName}`, 'success');

    return { success: true };
  };

  const cancelBooking = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' as const } : b));
    
    // If the resource is an Asset, set its status back to Available (if it was reserved)
    if (assets.some(a => a.tag === booking.resourceId && a.status === 'Reserved')) {
      setAssets(prev => prev.map(a => a.tag === booking.resourceId ? { ...a, status: 'Available' } : a));
    }

    addActivity('booking', `cancelled booking for ${booking.resourceName}`, currentUser?.name || 'System', 'CalendarX');
    addNotification('Booking Cancelled', 'Booking Cancelled', `Reservation for ${booking.resourceName} was cancelled.`);
    addToast('Booking Cancelled', 'Reservation has been cancelled.', 'info');
  };

  // Maintenance actions
  const raiseMaintenanceRequest = (assetTag: string, issueDescription: string, priority: MaintenanceRecord['priority']) => {
    const asset = assets.find(a => a.tag === assetTag);
    if (!asset) return;

    const request: MaintenanceRecord = {
      id: `m-${Date.now()}`,
      assetTag,
      assetName: asset.name,
      issueDescription,
      priority,
      status: 'Pending',
      dateRaised: new Date().toISOString().split('T')[0]
    };

    // Update maintenanceRequests list
    setMaintenanceRequests(prev => [request, ...prev]);

    // Update asset status to 'Under Maintenance' and append to its history
    setAssets(prev => prev.map(a => {
      if (a.tag === assetTag) {
        return {
          ...a,
          status: 'Under Maintenance',
          maintenanceHistory: [request, ...a.maintenanceHistory]
        };
      }
      return a;
    }));

    addActivity('maintenance', `raised maintenance for ${asset.name}: "${issueDescription}"`, currentUser?.name || 'System', 'Wrench');
    addNotification('Asset Assigned', 'Maintenance Request Raised', `${asset.name} has been placed under maintenance.`);
    addToast('Maintenance Raised', 'Technician will review this request shortly.', 'warning');
  };

  const updateMaintenanceStatus = (id: string, status: MaintenanceRecord['status'], technician?: string) => {
    let affectedAssetTag = '';
    
    setMaintenanceRequests(prev => prev.map(req => {
      if (req.id === id) {
        affectedAssetTag = req.assetTag;
        return {
          ...req,
          status,
          assignedTechnician: technician || req.assignedTechnician,
          dateResolved: status === 'Resolved' ? new Date().toISOString().split('T')[0] : req.dateResolved
        };
      }
      return req;
    }));

    // Update in asset's internal history and global status
    setAssets(prev => prev.map(a => {
      if (a.tag === affectedAssetTag) {
        const updatedHistory = a.maintenanceHistory.map(req => {
          if (req.id === id) {
            return {
              ...req,
              status,
              assignedTechnician: technician || req.assignedTechnician,
              dateResolved: status === 'Resolved' ? new Date().toISOString().split('T')[0] : req.dateResolved
            };
          }
          return req;
        });

        // If maintenance is resolved, return asset status to 'Available' (or Allocated if it has a current holder)
        let finalStatus: AssetStatus = 'Under Maintenance';
        if (status === 'Resolved') {
          finalStatus = a.currentHolderId ? 'Allocated' : 'Available';
        }

        return {
          ...a,
          status: finalStatus,
          maintenanceHistory: updatedHistory
        };
      }
      return a;
    }));

    const req = maintenanceRequests.find(r => r.id === id);
    if (req) {
      if (status === 'Approved') {
        addNotification('Maintenance Approved', 'Maintenance Request Approved', `Request for ${req.assetName} approved.`);
        addToast('Request Approved', 'Maintenance request has been approved.', 'success');
      } else if (status === 'Resolved') {
        addNotification('Maintenance Approved', 'Maintenance Resolved', `${req.assetName} has been repaired and returned to service.`);
        addToast('Maintenance Resolved', 'Asset status is now updated.', 'success');
      } else {
        addToast('Request Updated', `Status changed to ${status}`, 'info');
      }
    }
  };

  // Org setup actions
  const createDepartment = (name: string, headId?: string, parentDepartment?: string) => {
    const head = users.find(u => u.id === headId);
    const newDept: Department = {
      id: `dept-${departments.length + 1}`,
      name,
      headId,
      headName: head?.name || 'Unassigned',
      parentDepartment,
      status: 'Active'
    };
    setDepartments(prev => [...prev, newDept]);
    addToast('Department Created', `Added new department: ${name}`, 'success');
  };

  const updateDepartment = (id: string, name: string, headId?: string, parentDepartment?: string, status?: 'Active' | 'Inactive') => {
    const head = users.find(u => u.id === headId);
    setDepartments(prev => prev.map(d => d.id === id ? {
      ...d,
      name,
      headId,
      headName: head?.name || 'Unassigned',
      parentDepartment,
      status: status || d.status
    } : d));
    addToast('Department Updated', `Changes saved for ${name}`, 'success');
  };

  const createCategory = (name: string, description?: string) => {
    const newCat: AssetCategory = {
      id: `cat-${categories.length + 1}`,
      name,
      description
    };
    setCategories(prev => [...prev, newCat]);
    addToast('Category Added', `Added asset category: ${name}`, 'success');
  };

  const updateEmployeeRole = (id: string, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    const emp = users.find(u => u.id === id);
    if (emp) {
      addToast('Role Updated', `${emp.name} is now a ${role}`, 'success');
      addActivity('employee', `promoted ${emp.name} to ${role}`, currentUser?.name || 'System', 'ShieldAlert');
    }
  };

  const deactivateEmployee = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Inactive' as const } : u));
    const emp = users.find(u => u.id === id);
    if (emp) {
      addToast('Employee Deactivated', `${emp.name} is now marked inactive.`, 'warning');
      addActivity('employee', `deactivated account of ${emp.name}`, currentUser?.name || 'System', 'UserMinus');
    }
  };

  // Audit actions
  const createAuditCycle = (departmentId: string, location: string, assignedAuditorId: string, startDate: string, endDate: string) => {
    const dept = departments.find(d => d.id === departmentId);
    const auditor = users.find(u => u.id === assignedAuditorId);
    
    if (!dept || !auditor) return;

    const newCycle: AuditCycle = {
      id: `aud-${Date.now()}`,
      departmentId,
      departmentName: dept.name,
      location,
      assignedAuditorId,
      assignedAuditorName: auditor.name,
      startDate,
      endDate,
      status: 'Active',
      discrepancyGenerated: false,
      history: []
    };

    setAuditCycles(prev => [...prev, newCycle]);
    addActivity('audit', `started audit cycle for ${dept.name}`, currentUser?.name || 'System', 'ClipboardList');
    addToast('Audit Cycle Started', `Assigned to ${auditor.name}`, 'success');
  };

  const verifyAuditAsset = (cycleId: string, assetTag: string, verificationStatus: AuditRecord['verificationStatus'], notes?: string) => {
    const asset = assets.find(a => a.tag === assetTag);
    if (!asset) return;

    const record: AuditRecord = {
      id: `ar-${Date.now()}`,
      assetTag,
      assetName: asset.name,
      verificationStatus,
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentUser?.name || 'Auditor',
      notes
    };

    setAuditCycles(prev => prev.map(c => {
      if (c.id === cycleId) {
        // Remove old verify record for same asset if exists
        const cleanedHistory = c.history.filter(r => r.assetTag !== assetTag);
        return {
          ...c,
          history: [...cleanedHistory, record]
        };
      }
      return c;
    }));

    // If marked Missing or Damaged, update asset status/condition
    if (verificationStatus === 'Missing') {
      setAssets(prev => prev.map(a => a.tag === assetTag ? { ...a, status: 'Lost' as const } : a));
      addNotification('Audit Discrepancy', 'Asset Discrepancy Found', `${asset.name} (${asset.tag}) marked MISSING in audit.`);
    } else if (verificationStatus === 'Damaged') {
      setAssets(prev => prev.map(a => a.tag === assetTag ? { ...a, condition: 'Broken' as const } : a));
      addNotification('Audit Discrepancy', 'Asset Discrepancy Found', `${asset.name} (${asset.tag}) marked DAMAGED in audit.`);
    }

    addToast('Asset Verified', `${asset.tag} verified as ${verificationStatus}`, 'success');
  };

  const closeAuditCycle = (cycleId: string) => {
    setAuditCycles(prev => prev.map(c => {
      if (c.id === cycleId) {
        // Generate automatic report
        const total = assets.filter(a => departments.find(d => d.id === c.departmentId)?.name === a.category || true).length; // simple filter mock
        const verifiedCount = c.history.length;
        const missingCount = c.history.filter(r => r.verificationStatus === 'Missing').length;
        const damagedCount = c.history.filter(r => r.verificationStatus === 'Damaged').length;
        
        return {
          ...c,
          status: 'Closed' as const,
          discrepancyGenerated: missingCount > 0 || damagedCount > 0,
        };
      }
      return c;
    }));

    const cycle = auditCycles.find(c => c.id === cycleId);
    if (cycle) {
      addActivity('audit', `closed audit cycle for ${cycle.departmentName}`, currentUser?.name || 'System', 'CheckSquare');
      addToast('Audit Cycle Closed', `Completed audit for ${cycle.departmentName}`, 'success');
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addToast('Success', 'All notifications marked as read', 'success');
  };

  return (
    <AppStateContext.Provider value={{
      currentUser,
      activeRole,
      currentPage,
      setCurrentPage,
      users,
      departments,
      categories,
      assets,
      bookings,
      maintenanceRequests,
      auditCycles,
      notifications,
      activities,
      toasts,
      
      login,
      signup,
      logout,
      setActiveRole,
      
      registerAsset,
      updateAssetStatus,
      
      allocateAsset,
      transferAsset,
      returnAsset,
      
      createBooking,
      cancelBooking,
      
      raiseMaintenanceRequest,
      updateMaintenanceStatus,
      
      createDepartment,
      updateDepartment,
      createCategory,
      updateEmployeeRole,
      deactivateEmployee,
      
      createAuditCycle,
      verifyAuditAsset,
      closeAuditCycle,
      
      addToast,
      removeToast,
      markNotificationAsRead,
      markAllNotificationsAsRead
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
};
