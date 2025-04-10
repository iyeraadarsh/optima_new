import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { rbacService } from "./rbacService";
import { adminService } from "./adminService";
import { initializeLeaveManagementData, createDefaultLeavePolicy } from './initLeaveData';
import { initializeUsers, initializeDepartments, initializePositions, initializeRoles } from './userInitialization';

const ROLES_COLLECTION = "roles";
const PERMISSIONS_COLLECTION = "permissions";
const MODULE_CONFIG_COLLECTION = "moduleConfig";

export const initService = {
  /**
   * Initialize the application with default data if needed
   */
  async initializeSystem(userId: string): Promise<void> {
    try {
      // Check if roles exist
      const rolesRef = collection(db, ROLES_COLLECTION);
      const rolesSnap = await getDocs(rolesRef);
      
      if (rolesSnap.empty) {
        console.log("Initializing default RBAC settings...");
        await rbacService.initializeDefaultRbac();
      } else {
        // Ensure all required roles exist
        console.log("Updating roles to include all required roles...");
        await rbacService.updateRoles();
      }
      
      // Check if permissions exist
      const permissionsRef = collection(db, PERMISSIONS_COLLECTION);
      const permissionsSnap = await getDocs(permissionsRef);
      
      if (permissionsSnap.empty) {
        console.log("Initializing default permissions...");
        await rbacService.initializeDefaultRbac();
      }
      
      // Check if modules exist
      const modulesRef = collection(db, MODULE_CONFIG_COLLECTION);
      const modulesSnap = await getDocs(modulesRef);
      
      if (modulesSnap.empty) {
        console.log("Initializing default system configurations...");
        await adminService.initializeDefaultConfigs(userId);
      }
      
      console.log("System initialization check completed");
    } catch (error) {
      console.error("Error during system initialization:", error);
      throw error;
    }
  }
};

// New function to initialize data
export const initializeData = async () => {
  try {
    console.log('Initializing data...');
    
    // Initialize users
    await initializeUsers();
    
    // Initialize departments
    await initializeDepartments();
    
    // Initialize positions
    await initializePositions();
    
    // Initialize roles
    await initializeRoles();
    
    // Initialize leave management data
    await initializeLeaveManagementData();
    await createDefaultLeavePolicy();
    
    console.log('Data initialization complete');
    return { success: true };
  } catch (error) {
    console.error('Error initializing data:', error);
    return { success: false, error };
  }
};