import { db } from "@/lib/firebase";
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
import { 
  SystemConfig, 
  ModuleConfig, 
  WorkflowConfig, 
  SecurityConfig,
  RoleModuleAccess, 
  UserModuleAccess 
} from "@/types/admin";

const SYSTEM_CONFIG_COLLECTION = "systemConfig";
const MODULE_CONFIG_COLLECTION = "moduleConfig";
const WORKFLOW_CONFIG_COLLECTION = "workflowConfig";
const SECURITY_CONFIG_COLLECTION = "securityConfig";
const ROLE_MODULE_ACCESS_COLLECTION = 'roleModuleAccess';
const USER_MODULE_ACCESS_COLLECTION = 'userModuleAccess';

export const adminService = {
  // System Configuration
  async getSystemConfigs(): Promise<SystemConfig[]> {
    const configRef = collection(db, SYSTEM_CONFIG_COLLECTION);
    const configSnap = await getDocs(configRef);
    
    return configSnap.docs.map(doc => doc.data() as SystemConfig);
  },

  async getSystemConfigByName(name: string): Promise<SystemConfig | null> {
    const configRef = collection(db, SYSTEM_CONFIG_COLLECTION);
    const q = query(configRef, where("name", "==", name));
    const configSnap = await getDocs(q);
    
    if (!configSnap.empty) {
      return configSnap.docs[0].data() as SystemConfig;
    }
    
    return null;
  },

  async saveSystemConfig(config: SystemConfig): Promise<void> {
    const configRef = doc(db, SYSTEM_CONFIG_COLLECTION, config.id);
    await setDoc(configRef, {
      ...config,
      updatedAt: new Date().toISOString()
    });
  },

  // Module Configuration
  async getModuleConfigs(): Promise<ModuleConfig[]> {
    const moduleRef = collection(db, MODULE_CONFIG_COLLECTION);
    const moduleSnap = await getDocs(moduleRef);
    
    return moduleSnap.docs.map(doc => doc.data() as ModuleConfig);
  },

  async getModuleConfigById(id: string): Promise<ModuleConfig | null> {
    const moduleRef = doc(db, MODULE_CONFIG_COLLECTION, id);
    const moduleSnap = await getDoc(moduleRef);
    
    if (moduleSnap.exists()) {
      return moduleSnap.data() as ModuleConfig;
    }
    
    return null;
  },

  async saveModuleConfig(config: ModuleConfig): Promise<void> {
    const moduleRef = doc(db, MODULE_CONFIG_COLLECTION, config.id);
    await setDoc(moduleRef, {
      ...config,
      updatedAt: new Date().toISOString()
    });
  },

  async toggleModuleStatus(id: string, enabled: boolean, updatedBy: string): Promise<void> {
    const moduleRef = doc(db, MODULE_CONFIG_COLLECTION, id);
    await updateDoc(moduleRef, {
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy
    });
  },

  // Workflow Configuration
  async getWorkflowConfigs(): Promise<WorkflowConfig[]> {
    const workflowRef = collection(db, WORKFLOW_CONFIG_COLLECTION);
    const workflowSnap = await getDocs(workflowRef);
    
    return workflowSnap.docs.map(doc => doc.data() as WorkflowConfig);
  },

  async getWorkflowConfigById(id: string): Promise<WorkflowConfig | null> {
    const workflowRef = doc(db, WORKFLOW_CONFIG_COLLECTION, id);
    const workflowSnap = await getDoc(workflowRef);
    
    if (workflowSnap.exists()) {
      return workflowSnap.data() as WorkflowConfig;
    }
    
    return null;
  },

  async saveWorkflowConfig(config: WorkflowConfig): Promise<void> {
    const workflowRef = doc(db, WORKFLOW_CONFIG_COLLECTION, config.id);
    await setDoc(workflowRef, {
      ...config,
      updatedAt: new Date().toISOString()
    });
  },

  async toggleWorkflowStatus(id: string, enabled: boolean, updatedBy: string): Promise<void> {
    const workflowRef = doc(db, WORKFLOW_CONFIG_COLLECTION, id);
    await updateDoc(workflowRef, {
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy
    });
  },

  // Security Configuration
  async getSecurityConfigs(): Promise<SecurityConfig[]> {
    const securityRef = collection(db, SECURITY_CONFIG_COLLECTION);
    const securitySnap = await getDocs(securityRef);
    
    return securitySnap.docs.map(doc => doc.data() as SecurityConfig);
  },

  async getSecurityConfigByName(name: string): Promise<SecurityConfig | null> {
    const securityRef = collection(db, SECURITY_CONFIG_COLLECTION);
    const q = query(securityRef, where("name", "==", name));
    const securitySnap = await getDocs(q);
    
    if (!securitySnap.empty) {
      return securitySnap.docs[0].data() as SecurityConfig;
    }
    
    return null;
  },

  async saveSecurityConfig(config: SecurityConfig): Promise<void> {
    const securityRef = doc(db, SECURITY_CONFIG_COLLECTION, config.id);
    await setDoc(securityRef, {
      ...config,
      updatedAt: new Date().toISOString()
    });
  },

  // Role-Module Access Configuration
  async getRoleModuleAccess(): Promise<RoleModuleAccess[]> {
    const accessRef = collection(db, ROLE_MODULE_ACCESS_COLLECTION);
    const accessSnap = await getDocs(accessRef);
    
    return accessSnap.docs.map(doc => doc.data() as RoleModuleAccess);
  },

  async getRoleModuleAccessByRole(roleId: string): Promise<RoleModuleAccess[]> {
    const accessRef = collection(db, ROLE_MODULE_ACCESS_COLLECTION);
    const q = query(accessRef, where('roleId', '==', roleId));
    const accessSnap = await getDocs(q);
    
    return accessSnap.docs.map(doc => doc.data() as RoleModuleAccess);
  },

  async saveRoleModuleAccess(access: RoleModuleAccess): Promise<void> {
    const accessRef = doc(db, ROLE_MODULE_ACCESS_COLLECTION, access.id);
    await setDoc(accessRef, access);
  },

  // User-Module Access Configuration
  async getUserModuleAccess(): Promise<UserModuleAccess[]> {
    const accessRef = collection(db, USER_MODULE_ACCESS_COLLECTION);
    const accessSnap = await getDocs(accessRef);
    
    return accessSnap.docs.map(doc => doc.data() as UserModuleAccess);
  },

  async getUserModuleAccessByUser(userId: string): Promise<UserModuleAccess[]> {
    const accessRef = collection(db, USER_MODULE_ACCESS_COLLECTION);
    const q = query(accessRef, where('userId', '==', userId));
    const accessSnap = await getDocs(q);
    
    return accessSnap.docs.map(doc => doc.data() as UserModuleAccess);
  },

  async saveUserModuleAccess(access: UserModuleAccess): Promise<void> {
    const accessRef = doc(db, USER_MODULE_ACCESS_COLLECTION, access.id);
    await setDoc(accessRef, access);
  },

  // Initialize default system configurations
  async initializeDefaultConfigs(userId: string): Promise<void> {
    // Default system configs
    const systemConfigs: SystemConfig[] = [
      {
        id: "config_system_name",
        name: "system_name",
        value: "Enterprise Management System",
        description: "The name of the system displayed throughout the application",
        type: "string",
        category: "general",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      },
      {
        id: "config_company_name",
        name: "company_name",
        value: "Your Company",
        description: "Your company name",
        type: "string",
        category: "general",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      },
      {
        id: "config_session_timeout",
        name: "session_timeout",
        value: 30,
        description: "Session timeout in minutes",
        type: "number",
        category: "security",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }
    ];
    
    // Default module configs
    const moduleConfigs: ModuleConfig[] = [
      {
        id: "module_dashboard",
        name: "dashboard",
        displayName: "Dashboard",
        description: "Main dashboard and analytics",
        enabled: true,
        requiredPermissions: [],
        dependencies: [],
        version: "1.0.0",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      },
      {
        id: "module_users",
        name: "users",
        displayName: "User Management",
        description: "Manage users, roles, and permissions",
        enabled: true,
        requiredPermissions: [],
        dependencies: [],
        version: "1.0.0",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      },
      {
        id: "module_hr",
        name: "hr",
        displayName: "HR Management",
        description: "Manage employees, departments, and HR processes",
        enabled: true,
        requiredPermissions: [],
        dependencies: [],
        version: "1.0.0",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      },
      {
        id: "module_helpdesk",
        name: "helpdesk",
        displayName: "Help Desk",
        description: "Support ticketing system and knowledge base",
        enabled: true,
        requiredPermissions: [],
        dependencies: [],
        version: "1.0.0",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      },
      {
        id: "module_documents",
        name: "documents",
        displayName: "Document Management",
        description: "Secure document storage and sharing",
        enabled: true,
        requiredPermissions: [],
        dependencies: [],
        version: "1.0.0",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      },
      {
        id: "module_assets",
        name: "assets",
        displayName: "Asset Management",
        description: "Track hardware, software, and other assets",
        enabled: true,
        requiredPermissions: [],
        dependencies: [],
        version: "1.0.0",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }
    ];
    
    // Save system configs
    for (const config of systemConfigs) {
      await this.saveSystemConfig(config);
    }
    
    // Save module configs
    for (const config of moduleConfigs) {
      await this.saveModuleConfig(config);
    }
  }
};