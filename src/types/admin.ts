export interface SystemConfig {
  id: string;
  name: string;
  value: any;
  description: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  category: "general" | "security" | "modules" | "workflows" | "notifications" | "appearance";
  updatedAt: string;
  updatedBy: string;
}

export interface ModuleConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  enabled: boolean;
  requiredPermissions: string[];
  dependencies: string[];
  version: string;
  updatedAt: string;
  updatedBy: string;
}

// New interface for role-based module access
export interface RoleModuleAccess {
  id: string;
  roleId: string;
  moduleId: string;
  access: boolean;
  updatedAt: string;
  updatedBy: string;
}

// New interface for user-based module access
export interface UserModuleAccess {
  id: string;
  userId: string;
  moduleId: string;
  access: boolean; // true = granted, false = denied (overrides role-based access)
  updatedAt: string;
  updatedBy: string;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  module: string;
  steps: WorkflowStep[];
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: "approval" | "notification" | "action" | "condition";
  config: any;
  nextSteps: string[];
  requiredRole?: string;
}

export interface SecurityConfig {
  id: string;
  name: string;
  value: any;
  description: string;
  category: "authentication" | "authorization" | "data" | "network";
  updatedAt: string;
  updatedBy: string;
}