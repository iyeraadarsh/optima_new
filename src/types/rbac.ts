// Role-based access control types
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  actions: string[]; // e.g., ["create", "read", "update", "delete"]
  resource?: string; // Optional resource identifier (e.g., "department:123")
  conditions?: Record<string, any>; // Optional conditions for permission (e.g., {"ownerId": "$userId"})
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  level: number; // Hierarchy level (higher number = more authority)
  createdAt: string;
  updatedAt: string;
}

export interface UserPermission {
  userId: string;
  roleId: string;
  customPermissions?: string[]; // Additional permissions beyond role
  restrictedPermissions?: string[]; // Permissions removed from role
  resourcePermissions?: ResourcePermission[]; // Resource-specific permissions
  updatedAt: string;
  updatedBy: string;
}

// New interface for resource-specific permissions
export interface ResourcePermission {
  permissionId: string;
  resourceType: string; // e.g., "department", "project"
  resourceId: string; // ID of the specific resource
  actions: string[]; // Allowed actions for this specific resource
}

// Enhanced permission request interface
export interface PermissionRequest {
  module: string;
  action: string;
  resource?: {
    type: string;
    id?: string;
  };
  userId?: string; // For checking if user has permission on behalf of another user
}

// Access control helpers
export const AccessLevels = {
  SYSTEM_ADMIN: 100,
  ADMIN: 90,
  DIRECTOR: 85,
  LEADER: 80,
  DEPARTMENT_MANAGER: 75,
  MANAGER: 70,
  SUPERVISOR: 50,
  EMPLOYEE: 30,
  USER: 10,
  GUEST: 0
};

export const ModuleNames = {
  USERS: "users",
  HR: "hr",
  DASHBOARD: "dashboard",
  HELPDESK: "helpdesk",
  DOCUMENTS: "documents",
  ASSETS: "assets",
  PROJECTS: "projects",
  TIMESHEET: "timesheet",
  INVOICING: "invoicing",
  TIME_TRACKING: "time-tracking",
  NOTIFICATIONS: "notifications",
  CRM: "crm",
  ADMIN: "admin"
};

export const ActionTypes = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  APPROVE: "approve",
  ASSIGN: "assign",
  EXPORT: "export",
  IMPORT: "import",
  MANAGE: "manage"
};

// Common permission sets that can be reused
export const CommonPermissionSets = {
  FULL_ACCESS: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE, ActionTypes.APPROVE, ActionTypes.ASSIGN, ActionTypes.EXPORT, ActionTypes.IMPORT, ActionTypes.MANAGE],
  READ_ONLY: [ActionTypes.READ],
  STANDARD_USER: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE],
  MANAGER: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.APPROVE, ActionTypes.ASSIGN]
};

// Permission result with reason for debugging/logging
export interface PermissionResult {
  granted: boolean;
  reason?: string;
}