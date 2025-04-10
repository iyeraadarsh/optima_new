import { db } from "@/lib/firebase";
import { Permission, Role, UserPermission, AccessLevels, ModuleNames, ActionTypes } from "@/types/rbac";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from "firebase/firestore";

const ROLES_COLLECTION = "roles";
const PERMISSIONS_COLLECTION = "permissions";
const USER_PERMISSIONS_COLLECTION = "userPermissions";

export const rbacService = {
  // Get all permissions
  async getAllPermissions(): Promise<Permission[]> {
    const permissionsRef = collection(db, PERMISSIONS_COLLECTION);
    const permissionsSnap = await getDocs(permissionsRef);
    
    return permissionsSnap.docs.map(doc => doc.data() as Permission);
  },

  // Get permissions by module
  async getPermissionsByModule(module: string): Promise<Permission[]> {
    const permissionsRef = collection(db, PERMISSIONS_COLLECTION);
    const q = query(permissionsRef, where("module", "==", module));
    const permissionsSnap = await getDocs(q);
    
    return permissionsSnap.docs.map(doc => doc.data() as Permission);
  },

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    const rolesRef = collection(db, ROLES_COLLECTION);
    const q = query(rolesRef, orderBy("level", "desc"));
    const rolesSnap = await getDocs(q);
    
    return rolesSnap.docs.map(doc => doc.data() as Role);
  },

  // Get role by ID
  async getRoleById(roleId: string): Promise<Role | null> {
    const roleRef = doc(db, ROLES_COLLECTION, roleId);
    const roleSnap = await getDoc(roleRef);
    
    if (roleSnap.exists()) {
      return roleSnap.data() as Role;
    }
    
    return null;
  },

  // Create or update role
  async saveRole(role: Role): Promise<void> {
    const roleRef = doc(db, ROLES_COLLECTION, role.id);
    await setDoc(roleRef, {
      ...role,
      updatedAt: new Date().toISOString()
    });
  },

  // Delete role
  async deleteRole(roleId: string): Promise<void> {
    const roleRef = doc(db, ROLES_COLLECTION, roleId);
    await deleteDoc(roleRef);
  },

  // Get user permissions
  async getUserPermissions(userId: string): Promise<UserPermission | null> {
    const userPermRef = doc(db, USER_PERMISSIONS_COLLECTION, userId);
    const userPermSnap = await getDoc(userPermRef);
    
    if (userPermSnap.exists()) {
      return userPermSnap.data() as UserPermission;
    }
    
    return null;
  },

  // Set user permissions
  async setUserPermissions(userPermission: UserPermission): Promise<void> {
    const userPermRef = doc(db, USER_PERMISSIONS_COLLECTION, userPermission.userId);
    await setDoc(userPermRef, {
      ...userPermission,
      updatedAt: new Date().toISOString()
    });
  },

  // Check if user has permission
  async hasPermission(userId: string, module: string, action: string): Promise<boolean> {
    try {
      // Get user permissions
      const userPerm = await this.getUserPermissions(userId);
      if (!userPerm) return false;
      
      // Get user role
      const role = await this.getRoleById(userPerm.roleId);
      if (!role) return false;
      
      // Get all permissions
      const allPermissions = await this.getAllPermissions();
      
      // Filter permissions by module and action
      const requiredPermission = allPermissions.find(
        p => p.module === module && p.actions.includes(action)
      );
      
      if (!requiredPermission) return false;
      
      // Check if permission is in role
      const hasRolePermission = role.permissions.includes(requiredPermission.id);
      
      // Check if permission is explicitly granted
      const hasCustomPermission = userPerm.customPermissions?.includes(requiredPermission.id) || false;
      
      // Check if permission is explicitly restricted
      const isRestricted = userPerm.restrictedPermissions?.includes(requiredPermission.id) || false;
      
      return (hasRolePermission || hasCustomPermission) && !isRestricted;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  },

  // Initialize default roles and permissions
  async initializeDefaultRbac(): Promise<void> {
    // Create default permissions
    const defaultPermissions: Permission[] = [
      // User management permissions
      {
        id: "perm_users_view",
        name: "View Users",
        description: "View user list and profiles",
        module: ModuleNames.USERS,
        actions: [ActionTypes.READ]
      },
      {
        id: "perm_users_create",
        name: "Create Users",
        description: "Create new user accounts",
        module: ModuleNames.USERS,
        actions: [ActionTypes.CREATE]
      },
      {
        id: "perm_users_edit",
        name: "Edit Users",
        description: "Edit user profiles and details",
        module: ModuleNames.USERS,
        actions: [ActionTypes.UPDATE]
      },
      {
        id: "perm_users_delete",
        name: "Delete Users",
        description: "Delete user accounts",
        module: ModuleNames.USERS,
        actions: [ActionTypes.DELETE]
      },
      {
        id: "perm_roles_manage",
        name: "Manage Roles",
        description: "Create, edit, and assign roles",
        module: ModuleNames.USERS,
        actions: [ActionTypes.CREATE, ActionTypes.READ, ActionTypes.UPDATE, ActionTypes.DELETE]
      }
    ];
    
    // Create default roles
    const defaultRoles: Role[] = [
      {
        id: "role_super_admin",
        name: "Super Administrator",
        description: "Complete system access with all privileges",
        permissions: ["perm_users_view", "perm_users_create", "perm_users_edit", "perm_users_delete", "perm_roles_manage"],
        level: AccessLevels.SYSTEM_ADMIN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "role_admin",
        name: "Administrator",
        description: "Full system access",
        permissions: ["perm_users_view", "perm_users_create", "perm_users_edit", "perm_users_delete", "perm_roles_manage"],
        level: AccessLevels.ADMIN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "role_director",
        name: "Director",
        description: "Executive level access for organizational oversight",
        permissions: ["perm_users_view", "perm_users_create", "perm_users_edit", "perm_roles_manage"],
        level: AccessLevels.DIRECTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "role_leader",
        name: "Leader",
        description: "Team leadership access",
        permissions: ["perm_users_view", "perm_users_create", "perm_users_edit"],
        level: AccessLevels.LEADER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "role_department_manager",
        name: "Department Manager",
        description: "Department-level management access",
        permissions: ["perm_users_view", "perm_users_create", "perm_users_edit"],
        level: AccessLevels.DEPARTMENT_MANAGER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "role_manager",
        name: "Manager",
        description: "Department management access",
        permissions: ["perm_users_view", "perm_users_create", "perm_users_edit"],
        level: AccessLevels.MANAGER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "role_employee",
        name: "Employee",
        description: "Standard employee access",
        permissions: ["perm_users_view"],
        level: AccessLevels.EMPLOYEE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "role_user",
        name: "User",
        description: "Basic user access",
        permissions: [],
        level: AccessLevels.USER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Save permissions
    for (const permission of defaultPermissions) {
      const permRef = doc(db, PERMISSIONS_COLLECTION, permission.id);
      await setDoc(permRef, permission);
    }
    
    // Save roles
    for (const role of defaultRoles) {
      const roleRef = doc(db, ROLES_COLLECTION, role.id);
      await setDoc(roleRef, role);
    }
  },

  // Force update of roles to include new roles
  async updateRoles(): Promise<void> {
    try {
      // Get existing roles
      const existingRoles = await this.getAllRoles();
      
      // Define additional roles to ensure they exist
      const additionalRoles: Role[] = [
        {
          id: "role_director",
          name: "Director",
          description: "Executive level access for organizational oversight",
          permissions: ["perm_users_view", "perm_users_create", "perm_users_edit", "perm_roles_manage"],
          level: AccessLevels.DIRECTOR,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "role_leader",
          name: "Leader",
          description: "Team leadership access",
          permissions: ["perm_users_view", "perm_users_create", "perm_users_edit"],
          level: AccessLevels.LEADER,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "role_department_manager",
          name: "Department Manager",
          description: "Department-level management access",
          permissions: ["perm_users_view", "perm_users_create", "perm_users_edit"],
          level: AccessLevels.DEPARTMENT_MANAGER,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Save or update each role
      for (const role of additionalRoles) {
        const existingRole = existingRoles.find(r => r.id === role.id);
        if (!existingRole) {
          // Role doesn't exist, create it
          await this.saveRole(role);
        } else {
          // Role exists, update it if needed
          await this.saveRole({
            ...existingRole,
            ...role,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error updating roles:', error);
      throw error;
    }
  }
};