import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp
} from "firebase/firestore";
import { leaveService } from "./leaveService";
import { userService } from "./userService";
import { LeaveType } from "@/types";

/**
 * Initialize leave management data in Firebase
 * This includes creating default leave types and initializing leave balances for existing users
 */
export async function initializeLeaveManagementData() {
  try {
    console.log("Initializing leave management data...");
    
    // Check if leave types already exist
    const leaveTypesRef = collection(db, "leaveTypes");
    const leaveTypesSnapshot = await getDocs(leaveTypesRef);
    
    if (leaveTypesSnapshot.empty) {
      // Create default leave types
      await createDefaultLeaveTypes();
    }
    
    // Initialize leave balances for all users
    await initializeLeaveBalances();
    
    console.log("Leave management data initialized successfully");
    return { success: true };
  } catch (error) {
    console.error("Error initializing leave management data:", error);
    return { success: false, error };
  }
}

/**
 * Create default leave types in Firebase
 */
async function createDefaultLeaveTypes() {
  console.log("Creating default leave types...");
  
  const defaultLeaveTypes = [
    {
      name: "Annual Leave",
      description: "Regular paid vacation leave",
      color: "#4CAF50",
      requiresApproval: true,
      paid: true,
      maxDaysPerYear: 20,
      carryOver: true,
      carryOverLimit: 5,
      accrualRate: 1.67 // 20 days per year / 12 months
    },
    {
      name: "Sick Leave",
      description: "Leave due to illness or medical appointments",
      color: "#F44336",
      requiresApproval: true,
      paid: true,
      maxDaysPerYear: 10,
      carryOver: false
    },
    {
      name: "Personal Leave",
      description: "Leave for personal matters",
      color: "#2196F3",
      requiresApproval: true,
      paid: true,
      maxDaysPerYear: 3,
      carryOver: false
    },
    {
      name: "Bereavement Leave",
      description: "Leave due to death of a family member",
      color: "#9C27B0",
      requiresApproval: true,
      paid: true,
      maxDaysPerYear: 5,
      carryOver: false
    },
    {
      name: "Unpaid Leave",
      description: "Leave without pay",
      color: "#607D8B",
      requiresApproval: true,
      paid: false,
      carryOver: false
    },
    {
      name: "Maternity Leave",
      description: "Leave for childbirth and childcare",
      color: "#E91E63",
      requiresApproval: true,
      paid: true,
      maxDaysPerYear: 90,
      carryOver: false
    },
    {
      name: "Paternity Leave",
      description: "Leave for fathers after childbirth",
      color: "#3F51B5",
      requiresApproval: true,
      paid: true,
      maxDaysPerYear: 10,
      carryOver: false
    }
  ];
  
  for (const leaveType of defaultLeaveTypes) {
    await leaveService.createLeaveType(leaveType);
  }
  
  console.log(`Created ${defaultLeaveTypes.length} default leave types`);
}

/**
 * Initialize leave balances for all users
 */
async function initializeLeaveBalances() {
  console.log('Initializing leave balances for users...');
  
  // Get all users
  const users = await userService.getAllUsers();
  console.log(`Found ${users.length} users`);
  
  // Get all leave types
  const leaveTypes = await leaveService.getLeaveTypes();
  console.log(`Found ${leaveTypes.length} leave types`);
  
  // Current year
  const currentYear = new Date().getFullYear();
  
  // Initialize leave balances for each user and leave type
  for (const user of users) {
    console.log(`Initializing leave balances for user: ${user.name} (${user.id})`);
    
    for (const leaveType of leaveTypes) {
      // Skip leave types without max days per year (like unpaid leave)
      if (!leaveType.maxDaysPerYear) continue;
      
      console.log(`Processing leave type: ${leaveType.name} (${leaveType.id})`);
      
      try {
        // Check if balance already exists
        const existingBalance = await leaveService.getLeaveBalance(
          user.id,
          leaveType.id,
          currentYear
        );
        
        if (!existingBalance) {
          console.log('No existing balance found, creating new balance');
          
          // Calculate entitled days based on hire date
          let entitledDays = leaveType.maxDaysPerYear;
          
          // If user was hired this year, prorate the entitlement
          if (user.jobDetails?.hireDate) {
            const hireDate = new Date(user.jobDetails.hireDate);
            if (hireDate.getFullYear() === currentYear) {
              const monthsWorked = 12 - hireDate.getMonth();
              entitledDays = Math.floor((monthsWorked / 12) * leaveType.maxDaysPerYear);
              console.log(`User hired this year, prorating entitlement to ${entitledDays} days`);
            }
          }
          
          // Initialize balance
          const balanceId = await leaveService.initializeLeaveBalance(
            user.id,
            leaveType.id,
            currentYear,
            entitledDays
          );
          
          console.log(`Created leave balance with ID: ${balanceId}`);
        } else {
          console.log('Balance already exists, skipping');
        }
      } catch (error) {
        console.error(`Error processing leave balance for user ${user.id} and leave type ${leaveType.id}:`, error);
      }
    }
  }
  
  console.log(`Initialized leave balances for ${users.length} users`);
}

/**
 * Create a leave policy in Firebase
 */
export async function createDefaultLeavePolicy() {
  try {
    console.log("Creating default leave policy...");
    
    // Get leave types
    const leaveTypes = await leaveService.getLeaveTypes();
    const leaveTypeIds = leaveTypes.map(type => type.id);
    
    // Create default policy
    const defaultPolicy = {
      name: "Standard Leave Policy",
      description: "Default leave policy for all employees",
      defaultLeaveTypes: leaveTypeIds,
      minimumServiceDays: 90, // 3 months probation
      noticeRequired: 7, // 1 week notice
      maxConsecutiveDays: 15,
      workingDays: [1, 2, 3, 4, 5] // Monday to Friday
    };
    
    await leaveService.createLeavePolicy(defaultPolicy);
    
    console.log("Default leave policy created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating default leave policy:", error);
    return { success: false, error };
  }
}