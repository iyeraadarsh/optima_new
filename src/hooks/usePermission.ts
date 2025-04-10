import { useCallback } from 'react';
import { usePermission as usePermissionContext } from '@/contexts/PermissionContext';
import { ModuleNames, ActionTypes, PermissionRequest } from '@/types/rbac';

/**
 * Custom hook for checking permissions in components
 */
export function usePermission() {
  const { checkPermission, checkPermissionWithResult, isLoading, refreshPermissions } = usePermissionContext();

  // Common permission checks
  const canViewUsers = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.USERS,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageUsers = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.USERS,
      action: ActionTypes.MANAGE
    });
  }, [checkPermission]);

  // Dashboard permissions
  const canViewDashboard = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.DASHBOARD,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageDashboard = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.DASHBOARD,
      action: ActionTypes.UPDATE
    });
  }, [checkPermission]);

  const canExportDashboard = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.DASHBOARD,
      action: ActionTypes.EXPORT
    });
  }, [checkPermission]);

  // HR permissions
  const canViewHR = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageHR = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.MANAGE
    });
  }, [checkPermission]);

  const canViewEmployees = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.READ,
      resource: {
        type: 'employee'
      }
    });
  }, [checkPermission]);

  const canManageEmployees = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.MANAGE,
      resource: {
        type: 'employee'
      }
    });
  }, [checkPermission]);

  const canViewDepartments = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.READ,
      resource: {
        type: 'department'
      }
    });
  }, [checkPermission]);

  const canManageDepartments = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.MANAGE,
      resource: {
        type: 'department'
      }
    });
  }, [checkPermission]);

  const canViewLeave = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.READ,
      resource: {
        type: 'leave'
      }
    });
  }, [checkPermission]);

  const canManageLeave = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.MANAGE,
      resource: {
        type: 'leave'
      }
    });
  }, [checkPermission]);

  const canApproveLeave = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.APPROVE,
      resource: {
        type: 'leave'
      }
    });
  }, [checkPermission]);

  const canViewPerformance = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.READ,
      resource: {
        type: 'performance'
      }
    });
  }, [checkPermission]);

  const canManagePerformance = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HR,
      action: ActionTypes.MANAGE,
      resource: {
        type: 'performance'
      }
    });
  }, [checkPermission]);

  // Document permissions
  const canViewDocuments = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.DOCUMENTS,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageDocuments = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.DOCUMENTS,
      action: ActionTypes.MANAGE
    });
  }, [checkPermission]);

  // Asset Management permissions
  const canViewAssets = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.ASSETS,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageAssets = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.ASSETS,
      action: ActionTypes.MANAGE
    });
  }, [checkPermission]);

  const canAssignAssets = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.ASSETS,
      action: ActionTypes.ASSIGN
    });
  }, [checkPermission]);

  // Project Management permissions
  const canViewProjects = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.PROJECTS,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageProjects = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.PROJECTS,
      action: ActionTypes.MANAGE
    });
  }, [checkPermission]);

  const canManageProjectTasks = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.PROJECTS,
      action: ActionTypes.MANAGE,
      resource: {
        type: 'task'
      }
    });
  }, [checkPermission]);

  // Helpdesk permissions
  const canViewTickets = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HELPDESK,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageTickets = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HELPDESK,
      action: ActionTypes.MANAGE
    });
  }, [checkPermission]);

  const canAssignTickets = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.HELPDESK,
      action: ActionTypes.ASSIGN
    });
  }, [checkPermission]);

  // CRM permissions
  const canViewCustomers = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.CRM,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageCustomers = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.CRM,
      action: ActionTypes.MANAGE
    });
  }, [checkPermission]);

  const canViewLeads = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.CRM,
      action: ActionTypes.READ,
      resource: {
        type: 'lead'
      }
    });
  }, [checkPermission]);

  // Timesheet permissions
  const canViewTimesheets = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.TIMESHEET,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageTimesheets = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.TIMESHEET,
      action: ActionTypes.MANAGE
    });
  }, [checkPermission]);

  const canApproveTimesheets = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.TIMESHEET,
      action: ActionTypes.APPROVE
    });
  }, [checkPermission]);

  // Invoicing permissions
  const canViewInvoices = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.INVOICING,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageInvoices = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.INVOICING,
      action: ActionTypes.MANAGE
    });
  }, [checkPermission]);

  const canApproveInvoices = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.INVOICING,
      action: ActionTypes.APPROVE
    });
  }, [checkPermission]);

  // Admin permissions
  const canAccessAdmin = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.ADMIN,
      action: ActionTypes.READ
    });
  }, [checkPermission]);

  const canManageSystemConfig = useCallback(async () => {
    return checkPermission({
      module: ModuleNames.ADMIN,
      action: ActionTypes.MANAGE,
      resource: {
        type: 'config'
      }
    });
  }, [checkPermission]);

  // Resource-specific permission check
  const canAccessResource = useCallback(async (
    module: string,
    action: string,
    resourceType: string,
    resourceId?: string
  ) => {
    return checkPermission({
      module,
      action,
      resource: {
        type: resourceType,
        id: resourceId
      }
    });
  }, [checkPermission]);

  return {
    // Basic permission checking
    checkPermission,
    checkPermissionWithResult,
    isLoading,
    refreshPermissions,

    // Common permission checks
    canViewUsers,
    canManageUsers,
    
    // Dashboard permissions
    canViewDashboard,
    canManageDashboard,
    canExportDashboard,
    
    // HR permissions
    canViewHR,
    canManageHR,
    canViewEmployees,
    canManageEmployees,
    canViewDepartments,
    canManageDepartments,
    canViewLeave,
    canManageLeave,
    canApproveLeave,
    canViewPerformance,
    canManagePerformance,
    
    // Document permissions
    canViewDocuments,
    canManageDocuments,
    
    // Asset Management permissions
    canViewAssets,
    canManageAssets,
    canAssignAssets,
    
    // Project Management permissions
    canViewProjects,
    canManageProjects,
    canManageProjectTasks,
    
    // Helpdesk permissions
    canViewTickets,
    canManageTickets,
    canAssignTickets,
    
    // CRM permissions
    canViewCustomers,
    canManageCustomers,
    canViewLeads,
    
    // Timesheet permissions
    canViewTimesheets,
    canManageTimesheets,
    canApproveTimesheets,
    
    // Invoicing permissions
    canViewInvoices,
    canManageInvoices,
    canApproveInvoices,
    
    // Admin permissions
    canAccessAdmin,
    canManageSystemConfig,

    // Resource-specific permission checks
    canAccessResource,

    // Constants for easier usage
    ModuleNames,
    ActionTypes
  };
}