export interface Goal {
  id: string;
  employeeId: string;
  year: number;
  title: string;
  description: string;
  keyMetrics: string[];
  status: 'draft' | 'submitted' | 'approved' | 'completed' | 'archived' | 'rejected';
  createdAt: number;
  updatedAt: number;
  approvedAt?: number;
  approverId?: string;
  approverName?: string;
  completedAt?: number;
  employeeName?: string; // Add this field to support displaying employee name
}

export interface GoalComment {
  id: string;
  goalId: string;
  userId: string;
  userName: string;
  userRole: string;
  comment: string;
  attachments: string[]; // Changed from optional to required with empty array default
  createdAt: number;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  year: number;
  status: 'draft' | 'self_review' | 'manager_review' | 'completed';
  goals?: string[]; // Make goals array optional
  selfRating?: number | null; // Allow null for clearing
  managerRating?: number | null; // Allow null for clearing
  selfComments?: string;
  managerComments?: string;
  createdAt: number;
  updatedAt: number;
  submittedAt?: number;
  completedAt?: number;
}

export interface PerformanceSettings {
  id: string;
  enableSelfRating: boolean;
  ratingScale: number; // 5 or 10 point scale
  reviewCycle: 'annual' | 'biannual' | 'quarterly';
  goalApprovalRequired: boolean;
  createdAt: number;
  updatedAt: number;
}