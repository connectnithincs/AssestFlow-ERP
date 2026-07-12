export type UserRole = 'Admin' | 'Asset Manager' | 'Department Head' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
}

export interface Department {
  id: string;
  name: string;
  headId?: string;
  headName?: string;
  parentDepartment?: string;
  status: 'Active' | 'Inactive';
}

export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
}

export type AssetStatus = 'Available' | 'Allocated' | 'Reserved' | 'Under Maintenance' | 'Lost' | 'Retired' | 'Disposed';

export interface AllocationRecord {
  id: string;
  assetTag: string;
  userId: string;
  userName: string;
  action: 'Allocated' | 'Returned' | 'Transferred';
  date: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  assetTag: string;
  assetName: string;
  issueDescription: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTechnician?: string;
  status: 'Pending' | 'Approved' | 'Technician Assigned' | 'In Progress' | 'Resolved';
  dateRaised: string;
  dateResolved?: string;
}

export interface Asset {
  tag: string; // e.g. AST-001
  name: string;
  category: string;
  location: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Broken';
  status: AssetStatus;
  serialNumber: string;
  acquisitionDate: string;
  currentHolderId?: string;
  currentHolderName?: string;
  maintenanceHistory: MaintenanceRecord[];
  allocationHistory: AllocationRecord[];
}

export interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: 'Meeting Room' | 'Vehicle' | 'Equipment';
  userId: string;
  userName: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
}

export interface AuditRecord {
  id: string;
  assetTag: string;
  assetName: string;
  verificationStatus: 'Verified' | 'Missing' | 'Damaged';
  verifiedAt: string;
  verifiedBy: string;
  notes?: string;
}

export interface AuditCycle {
  id: string;
  departmentId: string;
  departmentName: string;
  location: string;
  assignedAuditorId: string;
  assignedAuditorName: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Closed';
  discrepancyGenerated: boolean;
  history: AuditRecord[];
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
  iconName: string;
}

export type NotificationType =
  | 'Asset Assigned'
  | 'Booking Confirmed'
  | 'Booking Reminder'
  | 'Booking Cancelled'
  | 'Maintenance Approved'
  | 'Maintenance Rejected'
  | 'Transfer Approved'
  | 'Overdue Return'
  | 'Audit Discrepancy';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
