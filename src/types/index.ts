export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'director' | 'leader' | 'department_manager' | 'manager' | 'employee' | 'user';
  firstName?: string;
  lastName?: string;
  avatar?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  reportingManager?: string; // ID of the reporting manager
  jobDetails?: {
    title?: string;
    department?: string;
    employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
    hireDate?: string;
  };
  hireDate?: string;
  lastActive?: string; // Add lastActive property
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  module?: string;
  actionUrl?: string;
}

export interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

export interface DashboardChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: any;
  options?: any;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId: string | null;
  parentDepartmentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  level?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  module: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
}

// Leave Management Types
export interface LeaveType {
  id: string;
  name: string;
  description: string;
  color: string;
  requiresApproval: boolean;
  paid: boolean;
  maxDaysPerYear?: number;
  carryOver?: boolean;
  carryOverLimit?: number;
  accrualRate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface LeavePolicy {
  id: string;
  name: string;
  description: string;
  defaultLeaveTypes: string[];
  minimumServiceDays: number;
  noticeRequired: number;
  maxConsecutiveDays?: number;
  workingDays: number[];
  createdAt: number;
  updatedAt: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName?: string;
  leaveTypeId: string;
  startDate: number;
  endDate: number;
  totalDays: number;
  halfDay?: boolean;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverId?: string;
  approvedAt?: number;
  rejectedAt?: number;
  rejectionReason?: string;
  cancelledAt?: number;
  cancellationReason?: string;
  attachmentUrl?: string;
  comments?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  adjustmentDays: number;
  carryOverDays: number;
  yearEndProcessed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LeaveCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  userId: string;
  leaveRequestId: string;
}

// Work from Home Request Types
export interface WorkFromHomeRequest {
  id: string;
  userId: string;
  userName?: string;
  startDate: number;
  endDate: number;
  totalDays: number;
  reason: string;
  workDetails: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverId?: string;
  approvedAt?: number;
  rejectedAt?: number;
  rejectionReason?: string;
  cancelledAt?: number;
  cancellationReason?: string;
  createdAt: number;
  updatedAt: number;
}

// Add UserProfile type for profile page
export interface UserProfile extends User {
  // Additional properties specific to profile page
}