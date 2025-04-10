
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Initialize users in Firebase
 */
export async function initializeUsers() {
  try {
    console.log("Initializing default users...");
    
    const defaultUsers = [
      {
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        department: "Management",
        position: "System Administrator",
        status: "active",
        jobDetails: {
          title: "System Administrator",
          department: "Management",
          employmentType: "full-time",
          hireDate: "2023-01-01"
        }
      },
      {
        name: "HR Manager",
        email: "hr@example.com",
        role: "department_manager",
        department: "Human Resources",
        position: "HR Manager",
        status: "active",
        jobDetails: {
          title: "HR Manager",
          department: "Human Resources",
          employmentType: "full-time",
          hireDate: "2023-01-15"
        }
      },
      {
        name: "Employee One",
        email: "employee1@example.com",
        role: "employee",
        department: "Engineering",
        position: "Software Developer",
        status: "active",
        reportingManager: "manager@example.com",
        jobDetails: {
          title: "Software Developer",
          department: "Engineering",
          employmentType: "full-time",
          hireDate: "2023-02-01"
        }
      }
    ];
    
    // Add users to Firestore
    const usersRef = collection(db, "users");
    
    for (const user of defaultUsers) {
      const userDocRef = doc(usersRef);
      await setDoc(userDocRef, {
        ...user,
        id: userDocRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`Created ${defaultUsers.length} default users`);
    return { success: true };
  } catch (error) {
    console.error("Error initializing users:", error);
    return { success: false, error };
  }
}

/**
 * Initialize departments in Firebase
 */
export async function initializeDepartments() {
  try {
    console.log("Initializing default departments...");
    
    const defaultDepartments = [
      {
        name: "Management",
        description: "Company management and administration",
        managerId: null,
        parentDepartmentId: null
      },
      {
        name: "Human Resources",
        description: "HR department responsible for personnel management",
        managerId: null,
        parentDepartmentId: null
      },
      {
        name: "Engineering",
        description: "Software development and engineering",
        managerId: null,
        parentDepartmentId: null
      },
      {
        name: "Marketing",
        description: "Marketing and communications",
        managerId: null,
        parentDepartmentId: null
      },
      {
        name: "Finance",
        description: "Financial operations and accounting",
        managerId: null,
        parentDepartmentId: null
      }
    ];
    
    // Add departments to Firestore
    const departmentsRef = collection(db, "departments");
    
    for (const department of defaultDepartments) {
      const departmentDocRef = doc(departmentsRef);
      await setDoc(departmentDocRef, {
        ...department,
        id: departmentDocRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`Created ${defaultDepartments.length} default departments`);
    return { success: true };
  } catch (error) {
    console.error("Error initializing departments:", error);
    return { success: false, error };
  }
}

/**
 * Initialize positions in Firebase
 */
export async function initializePositions() {
  try {
    console.log("Initializing default positions...");
    
    const defaultPositions = [
      {
        name: "System Administrator",
        description: "Manages system configuration and administration",
        departmentId: null, // Will be updated after departments are created
        level: 5,
        isActive: true
      },
      {
        name: "HR Manager",
        description: "Manages HR operations and personnel",
        departmentId: null,
        level: 4,
        isActive: true
      },
      {
        name: "Software Developer",
        description: "Develops and maintains software applications",
        departmentId: null,
        level: 3,
        isActive: true
      },
      {
        name: "Marketing Specialist",
        description: "Handles marketing campaigns and communications",
        departmentId: null,
        level: 3,
        isActive: true
      },
      {
        name: "Financial Analyst",
        description: "Analyzes financial data and prepares reports",
        departmentId: null,
        level: 3,
        isActive: true
      }
    ];
    
    // Add positions to Firestore
    const positionsRef = collection(db, "positions");
    
    for (const position of defaultPositions) {
      const positionDocRef = doc(positionsRef);
      await setDoc(positionDocRef, {
        ...position,
        id: positionDocRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`Created ${defaultPositions.length} default positions`);
    return { success: true };
  } catch (error) {
    console.error("Error initializing positions:", error);
    return { success: false, error };
  }
}

/**
 * Initialize roles in Firebase
 */
export async function initializeRoles() {
  try {
    console.log("Initializing default roles...");
    
    // This is just a placeholder - actual role initialization is handled by rbacService
    return { success: true };
  } catch (error) {
    console.error("Error initializing roles:", error);
    return { success: false, error };
  }
}
