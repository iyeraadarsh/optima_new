import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  DocumentReference,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Permission, 
  Role, 
  UserPermission, 
  ResourcePermission, 
  PermissionRequest,
  PermissionResult,
  ActionTypes,
  ModuleNames
} from '@/types/rbac';
import { User } from '@/types';

/**
 * Centralized service for handling all permission-related operations
 */
export const permissionService = {
  // Permission Management
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const permissionsRef = collection(db, 'permissions');
      const snapshot = await getDocs(permissionsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Permission));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    try {
      const permissionsRef = collection(db, 'permissions');
      const q = query(permissionsRef, where('module', '==', module));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Permission));
    } catch (error) {
      console.error(`Error fetching permissions for module ${module}:`, error);
      throw error;
    }
  },

  async getPermission(permissionId: string): Promise<Permission | null> {
    try {
      const permissionRef = doc(db, 'permissions', permissionId);
      const permissionDoc = await getDoc(permissionRef);
      
      if (permissionDoc.exists()) {
        return {
          id: permissionDoc.id,
          ...permissionDoc.data()
        } as Permission;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching permission ${permissionId}:`, error);
      throw error;
    }
  },

  async createPermission(permission: Omit<Permission, 'id'>): Promise<Permission> {
    try {
      const permissionsRef = collection(db, 'permissions');
      const newPermissionRef = doc(permissionsRef);
      
      const newPermission: Permission = {
        id: newPermissionRef.id,
        ...permission
      };
      
      await setDoc(newPermissionRef, newPermission);
      
      return newPermission;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  },

  async updatePermission(permissionId: string, updates: Partial<Permission>): Promise<void> {
    try {
      const permissionRef = doc(db, 'permissions', permissionId);
      await updateDoc(permissionRef, updates);
    } catch (error) {
      console.error(`Error updating permission ${permissionId}:`, error);
      throw error;
    }
  },

  async deletePermission(permissionId: string): Promise<void> {
    try {
      const permissionRef = doc(db, 'permissions', permissionId);
      await deleteDoc(permissionRef);
    } catch (error) {
      console.error(`Error deleting permission ${permissionId}:`, error);
      throw error;
    }
  },

  // Role Management
  async getAllRoles(): Promise<Role[]> {
    try {
      const rolesRef = collection(db, 'roles');
      const snapshot = await getDocs(rolesRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Role));
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  async getRole(roleId: string): Promise<Role | null> {
    try {
      const roleRef = doc(db, 'roles', roleId);
      const roleDoc = await getDoc(roleRef);
      
      if (roleDoc.exists()) {
        return {
          id: roleDoc.id,
          ...roleDoc.data()
        } as Role;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching role ${roleId}:`, error);
      throw error;
    }
  },

  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    try {
      const rolesRef = collection(db, 'roles');
      const newRoleRef = doc(rolesRef);
      
      const timestamp = new Date().toISOString();
      
      const newRole: Role = {
        id: newRoleRef.id,
        ...role,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await setDoc(newRoleRef, newRole);
      
      return newRole;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  async updateRole(roleId: string, updates: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const roleRef = doc(db, 'roles', roleId);
      
      await updateDoc(roleRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating role ${roleId}:`, error);
      throw error;
    }
  },

  async deleteRole(roleId: string): Promise<void> {
    try {
      const roleRef = doc(db, 'roles', roleId);
      await deleteDoc(roleRef);
    } catch (error) {
      console.error(`Error deleting role ${roleId}:`, error);
      throw error;
    }
  },

  // User Permission Management
  async getUserPermission(userId: string): Promise<UserPermission | null> {
    try {
      const userPermissionRef = doc(db, 'userPermissions', userId);
      const userPermissionDoc = await getDoc(userPermissionRef);
      
      if (userPermissionDoc.exists()) {
        return {
          userId,
          ...userPermissionDoc.data()
        } as UserPermission;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching user permission for ${userId}:`, error);
      throw error;
    }
  },

  async setUserPermission(userPermission: UserPermission): Promise<void> {
    try {
      const userPermissionRef = doc(db, 'userPermissions', userPermission.userId);
      
      await setDoc(userPermissionRef, {
        ...userPermission,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error setting user permission for ${userPermission.userId}:`, error);
      throw error;
    }
  },

  async updateUserPermission(userId: string, updates: Partial<Omit<UserPermission, 'userId' | 'updatedAt' | 'updatedBy'>>): Promise<void> {
    try {
      const userPermissionRef = doc(db, 'userPermissions', userId);
      
      await updateDoc(userPermissionRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating user permission for ${userId}:`, error);
      throw error;
    }
  },

  async addResourcePermission(userId: string, resourcePermission: ResourcePermission, updatedBy: string): Promise<void> {
    try {
      const userPermissionRef = doc(db, 'userPermissions', userId);
      const userPermissionDoc = await getDoc(userPermissionRef);
      
      if (userPermissionDoc.exists()) {
        const userPermission = userPermissionDoc.data() as Omit<UserPermission, 'userId'>;
        const resourcePermissions = userPermission.resourcePermissions || [];
        
        // Check if resource permission already exists
        const existingIndex = resourcePermissions.findIndex(
          rp => rp.resourceType === resourcePermission.resourceType && 
                rp.resourceId === resourcePermission.resourceId &&
                rp.permissionId === resourcePermission.permissionId
        );
        
        if (existingIndex >= 0) {
          // Update existing resource permission
          resourcePermissions[existingIndex] = resourcePermission;
        } else {
          // Add new resource permission
          resourcePermissions.push(resourcePermission);
        }
        
        await updateDoc(userPermissionRef, {
          resourcePermissions,
          updatedAt: new Date().toISOString(),
          updatedBy
        });
      } else {
        // Create new user permission with resource permission
        await setDoc(userPermissionRef, {
          userId,
          roleId: '', // Default empty role
          resourcePermissions: [resourcePermission],
          updatedAt: new Date().toISOString(),
          updatedBy
        });
      }
    } catch (error) {
      console.error(`Error adding resource permission for ${userId}:`, error);
      throw error;
    }
  },

  async removeResourcePermission(
    userId: string, 
    resourceType: string, 
    resourceId: string, 
    permissionId: string,
    updatedBy: string
  ): Promise<void> {
    try {
      const userPermissionRef = doc(db, 'userPermissions', userId);
      const userPermissionDoc = await getDoc(userPermissionRef);
      
      if (userPermissionDoc.exists()) {
        const userPermission = userPermissionDoc.data() as Omit<UserPermission, 'userId'>;
        const resourcePermissions = userPermission.resourcePermissions || [];
        
        // Filter out the resource permission to remove
        const updatedResourcePermissions = resourcePermissions.filter(
          rp => !(rp.resourceType === resourceType && 
                 rp.resourceId === resourceId &&
                 rp.permissionId === permissionId)
        );
        
        await updateDoc(userPermissionRef, {
          resourcePermissions: updatedResourcePermissions,
          updatedAt: new Date().toISOString(),
          updatedBy
        });
      }
    } catch (error) {
      console.error(`Error removing resource permission for ${userId}:`, error);
      throw error;
    }
  },

  // Permission Checking
  async hasPermission(userId: string, request: PermissionRequest): Promise<PermissionResult> {
    try {
      // Get user profile to check role
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { 
          granted: false,
          reason: 'User not found'
        };
      }
      
      const user = userDoc.data() as User;
      
      // System admin has all permissions
      if (user.role === 'super_admin') {
        return { 
          granted: true,
          reason: 'User is super_admin'
        };
      }
      
      // Get user permissions
      const userPermissionRef = doc(db, 'userPermissions', userId);
      const userPermissionDoc = await getDoc(userPermissionRef);
      
      if (!userPermissionDoc.exists()) {
        // Fall back to role-based check if no specific permissions are set
        return this.checkRoleBasedPermission(user.role, request);
      }
      
      const userPermission = userPermissionDoc.data() as UserPermission;
      
      // Check if user has custom permissions
      if (userPermission.customPermissions && userPermission.customPermissions.length > 0) {
        // Get all permissions by IDs
        const customPermissions = await Promise.all(
          userPermission.customPermissions.map(id => this.getPermission(id))
        );
        
        // Filter out null values
        const validCustomPermissions = customPermissions.filter(p => p !== null) as Permission[];
        
        // Check if any custom permission matches the request
        const hasCustomPermission = this.checkPermissionMatch(validCustomPermissions, request);
        
        if (hasCustomPermission) {
          return { 
            granted: true,
            reason: 'User has custom permission'
          };
        }
      }
      
      // Check if user has resource-specific permissions
      if (request.resource && userPermission.resourcePermissions && userPermission.resourcePermissions.length > 0) {
        const matchingResourcePermissions = userPermission.resourcePermissions.filter(
          rp => rp.resourceType === request.resource?.type && 
               (rp.resourceId === request.resource?.id || !request.resource?.id) // Match specific resource or any of this type
        );
        
        if (matchingResourcePermissions.length > 0) {
          // Get all permissions by IDs
          const permissions = await Promise.all(
            matchingResourcePermissions.map(rp => this.getPermission(rp.permissionId))
          );
          
          // Filter out null values
          const validPermissions = permissions.filter(p => p !== null) as Permission[];
          
          // Check if any resource permission matches the request
          for (const permission of validPermissions) {
            const resourcePermission = matchingResourcePermissions.find(rp => rp.permissionId === permission.id);
            
            if (resourcePermission && resourcePermission.actions.includes(request.action)) {
              return { 
                granted: true,
                reason: 'User has resource-specific permission'
              };
            }
          }
        }
      }
      
      // Check if permission is restricted for this user
      if (userPermission.restrictedPermissions && userPermission.restrictedPermissions.length > 0) {
        // Get all permissions by IDs
        const restrictedPermissions = await Promise.all(
          userPermission.restrictedPermissions.map(id => this.getPermission(id))
        );
        
        // Filter out null values
        const validRestrictedPermissions = restrictedPermissions.filter(p => p !== null) as Permission[];
        
        // Check if any restricted permission matches the request
        const isRestricted = this.checkPermissionMatch(validRestrictedPermissions, request);
        
        if (isRestricted) {
          return { 
            granted: false,
            reason: 'Permission is restricted for this user'
          };
        }
      }
      
      // Fall back to role-based permission check
      return this.checkRoleBasedPermission(user.role, request);
    } catch (error) {
      console.error(`Error checking permission for ${userId}:`, error);
      return { 
        granted: false,
        reason: 'Error checking permission'
      };
    }
  },

  async checkRoleBasedPermission(role: string, request: PermissionRequest): Promise<PermissionResult> {
    try {
      // Get role
      const rolesRef = collection(db, 'roles');
      const q = query(rolesRef, where('name', '==', role));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { 
          granted: false,
          reason: 'Role not found'
        };
      }
      
      const roleData = snapshot.docs[0].data() as Role;
      
      // Get all permissions for this role
      const permissions = await Promise.all(
        roleData.permissions.map(id => this.getPermission(id))
      );
      
      // Filter out null values
      const validPermissions = permissions.filter(p => p !== null) as Permission[];
      
      // Check if any permission matches the request
      const hasPermission = this.checkPermissionMatch(validPermissions, request);
      
      return { 
        granted: hasPermission,
        reason: hasPermission ? 'Role has permission' : 'Role does not have permission'
      };
    } catch (error) {
      console.error(`Error checking role-based permission for ${role}:`, error);
      return { 
        granted: false,
        reason: 'Error checking role-based permission'
      };
    }
  },

  checkPermissionMatch(permissions: Permission[], request: PermissionRequest): boolean {
    return permissions.some(permission => {
      // Check if module matches
      if (permission.module !== request.module) {
        return false;
      }
      
      // Check if action is allowed
      if (!permission.actions.includes(request.action)) {
        return false;
      }
      
      // Check resource if specified in both permission and request
      if (permission.resource && request.resource) {
        // If permission has a specific resource, it must match the request
        const [permResourceType, permResourceId] = permission.resource.split(':');
        
        if (permResourceType !== request.resource.type) {
          return false;
        }
        
        if (permResourceId && request.resource.id && permResourceId !== request.resource.id) {
          return false;
        }
      }
      
      // Check conditions if specified
      if (permission.conditions) {
        // This would require more complex evaluation based on the condition format
        // For now, we'll just return true if there are conditions
        return true;
      }
      
      return true;
    });
  },

  // Helper methods
  async initializeDefaultPermissions(): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Check if permissions already exist
      const permissionsRef = collection(db, 'permissions');
      const permissionsSnapshot = await getDocs(permissionsRef);
      
      if (!permissionsSnapshot.empty) {
        console.log('Permissions already initialized');
        return;
      }
      
      // Create default permissions
      const defaultPermissions: Omit<Permission, 'id'>[] = [
        // User management permissions
        {
          name: 'View Users',
          description: 'View user list and profiles',
          module: ModuleNames.USERS,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage Users',
          description: 'Create, update, and delete users',
          module: ModuleNames.USERS,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        {
          name: 'Assign User Roles',
          description: 'Assign roles to users',
          module: ModuleNames.USERS,
          actions: [ActionTypes.ASSIGN]
        },
        
        // Dashboard permissions
        {
          name: 'View Dashboard',
          description: 'View dashboard metrics and widgets',
          module: ModuleNames.DASHBOARD,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage Dashboard',
          description: 'Customize dashboard layout and widgets',
          module: ModuleNames.DASHBOARD,
          actions: [ActionTypes.READ, ActionTypes.UPDATE]
        },
        {
          name: 'Export Dashboard Data',
          description: 'Export dashboard metrics and reports',
          module: ModuleNames.DASHBOARD,
          actions: [ActionTypes.EXPORT]
        },
        
        // HR permissions - General
        {
          name: 'View HR Data',
          description: 'View HR information',
          module: ModuleNames.HR,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage HR Data',
          description: 'Create, update, and delete HR information',
          module: ModuleNames.HR,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        
        // HR permissions - Employee Management
        {
          name: 'View Employees',
          description: 'View employee profiles and information',
          module: ModuleNames.HR,
          actions: [ActionTypes.READ],
          resource: 'employee'
        },
        {
          name: 'Manage Employees',
          description: 'Create, update, and delete employee records',
          module: ModuleNames.HR,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE],
          resource: 'employee'
        },
        
        // HR permissions - Department Management
        {
          name: 'View Departments',
          description: 'View department information',
          module: ModuleNames.HR,
          actions: [ActionTypes.READ],
          resource: 'department'
        },
        {
          name: 'Manage Departments',
          description: 'Create, update, and delete departments',
          module: ModuleNames.HR,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE],
          resource: 'department'
        },
        
        // HR permissions - Leave Management
        {
          name: 'View Leave Requests',
          description: 'View leave requests',
          module: ModuleNames.HR,
          actions: [ActionTypes.READ],
          resource: 'leave'
        },
        {
          name: 'Manage Leave Requests',
          description: 'Create, update, and delete leave requests',
          module: ModuleNames.HR,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE],
          resource: 'leave'
        },
        {
          name: 'Approve Leave Requests',
          description: 'Approve or reject leave requests',
          module: ModuleNames.HR,
          actions: [ActionTypes.APPROVE],
          resource: 'leave'
        },
        
        // HR permissions - Performance Management
        {
          name: 'View Performance Data',
          description: 'View performance reviews and goals',
          module: ModuleNames.HR,
          actions: [ActionTypes.READ],
          resource: 'performance'
        },
        {
          name: 'Manage Performance Data',
          description: 'Create, update, and delete performance reviews and goals',
          module: ModuleNames.HR,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE],
          resource: 'performance'
        },
        
        // Document permissions
        {
          name: 'View Documents',
          description: 'View documents',
          module: ModuleNames.DOCUMENTS,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage Documents',
          description: 'Create, update, and delete documents',
          module: ModuleNames.DOCUMENTS,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        {
          name: 'Share Documents',
          description: 'Share documents with other users',
          module: ModuleNames.DOCUMENTS,
          actions: [ActionTypes.ASSIGN]
        },
        
        // Asset Management permissions
        {
          name: 'View Assets',
          description: 'View asset inventory and details',
          module: ModuleNames.ASSETS,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage Assets',
          description: 'Create, update, and delete asset records',
          module: ModuleNames.ASSETS,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        {
          name: 'Assign Assets',
          description: 'Assign assets to users or departments',
          module: ModuleNames.ASSETS,
          actions: [ActionTypes.ASSIGN]
        },
        {
          name: 'Approve Asset Requests',
          description: 'Approve or reject asset requests',
          module: ModuleNames.ASSETS,
          actions: [ActionTypes.APPROVE]
        },
        
        // Project Management permissions
        {
          name: 'View Projects',
          description: 'View project details and progress',
          module: ModuleNames.PROJECTS,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage Projects',
          description: 'Create, update, and delete projects',
          module: ModuleNames.PROJECTS,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        {
          name: 'Assign Project Members',
          description: 'Assign users to projects',
          module: ModuleNames.PROJECTS,
          actions: [ActionTypes.ASSIGN]
        },
        {
          name: 'Manage Project Tasks',
          description: 'Create, update, and delete project tasks',
          module: ModuleNames.PROJECTS,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE],
          resource: 'task'
        },
        
        // Helpdesk permissions
        {
          name: 'View Tickets',
          description: 'View support tickets',
          module: ModuleNames.HELPDESK,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Create Tickets',
          description: 'Create new support tickets',
          module: ModuleNames.HELPDESK,
          actions: [ActionTypes.CREATE]
        },
        {
          name: 'Manage Tickets',
          description: 'Update and close support tickets',
          module: ModuleNames.HELPDESK,
          actions: [ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        {
          name: 'Assign Tickets',
          description: 'Assign tickets to support agents',
          module: ModuleNames.HELPDESK,
          actions: [ActionTypes.ASSIGN]
        },
        
        // CRM permissions
        {
          name: 'View Customers',
          description: 'View customer information',
          module: ModuleNames.CRM,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage Customers',
          description: 'Create, update, and delete customer records',
          module: ModuleNames.CRM,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        {
          name: 'View Leads',
          description: 'View sales leads',
          module: ModuleNames.CRM,
          actions: [ActionTypes.READ],
          resource: 'lead'
        },
        {
          name: 'Manage Leads',
          description: 'Create, update, and delete sales leads',
          module: ModuleNames.CRM,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE],
          resource: 'lead'
        },
        
        // Timesheet permissions
        {
          name: 'View Timesheets',
          description: 'View timesheet entries',
          module: ModuleNames.TIMESHEET,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage Timesheets',
          description: 'Create, update, and delete timesheet entries',
          module: ModuleNames.TIMESHEET,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        {
          name: 'Approve Timesheets',
          description: 'Approve or reject timesheet submissions',
          module: ModuleNames.TIMESHEET,
          actions: [ActionTypes.APPROVE]
        },
        
        // Invoicing permissions
        {
          name: 'View Invoices',
          description: 'View invoice details',
          module: ModuleNames.INVOICING,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage Invoices',
          description: 'Create, update, and delete invoices',
          module: ModuleNames.INVOICING,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        {
          name: 'Approve Invoices',
          description: 'Approve invoices for payment',
          module: ModuleNames.INVOICING,
          actions: [ActionTypes.APPROVE]
        },
        
        // Notification permissions
        {
          name: 'View Notifications',
          description: 'View system notifications',
          module: ModuleNames.NOTIFICATIONS,
          actions: [ActionTypes.READ]
        },
        {
          name: 'Manage Notifications',
          description: 'Create and manage notification settings',
          module: ModuleNames.NOTIFICATIONS,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
        },
        
        // Admin permissions
        {
          name: 'Access Admin Settings',
          description: 'Access and modify system settings',
          module: ModuleNames.ADMIN,
          actions: [ActionTypes.READ, ActionTypes.UPDATE]
        },
        {
          name: 'Manage Permissions',
          description: 'Create, update, and delete system permissions',
          module: ModuleNames.ADMIN,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE],
          resource: 'permission'
        },
        {
          name: 'Manage Roles',
          description: 'Create, update, and delete user roles',
          module: ModuleNames.ADMIN,
          actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE],
          resource: 'role'
        },
        {
          name: 'Manage System Configuration',
          description: 'Configure system-wide settings',
          module: ModuleNames.ADMIN,
          actions: [ActionTypes.READ, ActionTypes.UPDATE],
          resource: 'config'
        }
      ];
      
      // Add permissions to batch
      for (const permission of defaultPermissions) {
        const newPermissionRef = doc(permissionsRef);
        batch.set(newPermissionRef, {
          id: newPermissionRef.id,
          ...permission
        });
      }
      
      // Commit batch
      await batch.commit();
      
      console.log('Default permissions initialized');
    } catch (error) {
      console.error('Error initializing default permissions:', error);
      throw error;
    }
  },

  async initializeDefaultRoles(): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Check if roles already exist
      const rolesRef = collection(db, 'roles');
      const rolesSnapshot = await getDocs(rolesRef);
      
      if (!rolesSnapshot.empty) {
        console.log('Roles already initialized');
        return;
      }
      
      // Get all permissions
      const permissions = await this.getAllPermissions();
      
      // Create permission maps by module and name for easier lookup
      const permissionMap: Record<string, Permission> = {};
      permissions.forEach(permission => {
        permissionMap[`${permission.module}:${permission.name}`] = permission;
      });
      
      const timestamp = new Date().toISOString();
      
      // Create default roles
      const defaultRoles: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'super_admin',
          description: 'Super Administrator with full system access',
          permissions: permissions.map(p => p.id), // All permissions
          level: 100
        },
        {
          name: 'admin',
          description: 'Administrator with access to most system functions',
          permissions: permissions
            .filter(p => p.module !== ModuleNames.ADMIN || p.actions.indexOf(ActionTypes.DELETE) === -1)
            .map(p => p.id),
          level: 90
        },
        {
          name: 'manager',
          description: 'Manager with access to team management and approvals',
          permissions: [
            permissionMap[`${ModuleNames.USERS}:View Users`]?.id,
            permissionMap[`${ModuleNames.HR}:View HR Data`]?.id,
            permissionMap[`${ModuleNames.HR}:Approve Leave Requests`]?.id,
            permissionMap[`${ModuleNames.DOCUMENTS}:View Documents`]?.id,
            permissionMap[`${ModuleNames.DOCUMENTS}:Manage Documents`]?.id
          ].filter(Boolean) as string[],
          level: 70
        },
        {
          name: 'employee',
          description: 'Regular employee with basic access',
          permissions: [
            permissionMap[`${ModuleNames.HR}:View HR Data`]?.id,
            permissionMap[`${ModuleNames.DOCUMENTS}:View Documents`]?.id
          ].filter(Boolean) as string[],
          level: 30
        },
        {
          name: 'user',
          description: 'Basic user with minimal access',
          permissions: [
            permissionMap[`${ModuleNames.DOCUMENTS}:View Documents`]?.id
          ].filter(Boolean) as string[],
          level: 10
        }
      ];
      
      // Add roles to batch
      for (const role of defaultRoles) {
        const newRoleRef = doc(rolesRef);
        batch.set(newRoleRef, {
          id: newRoleRef.id,
          ...role,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
      
      // Commit batch
      await batch.commit();
      
      console.log('Default roles initialized');
    } catch (error) {
      console.error('Error initializing default roles:', error);
      throw error;
    }
  }
};