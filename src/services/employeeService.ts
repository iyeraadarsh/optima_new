import { db } from "@/lib/firebase";
import { User } from "@/types";
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
import { userService } from "@/services/userService";

const USERS_COLLECTION = "users";

export const employeeService = {
  // Get all employees (users with employee-related roles)
  async getAllEmployees(): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(
        usersRef, 
        where("role", "in", ["employee", "manager", "department_manager", "leader", "director"])
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // If no employees with specific roles, return all users except admins
        const allUsers = await userService.getAllUsers();
        return allUsers.filter(user => 
          user.role !== "super_admin" && 
          user.role !== "admin"
        );
      }
      
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting all employees:", error);
      return [];
    }
  },

  // Get employee by ID
  async getEmployeeById(employeeId: string): Promise<User | null> {
    return userService.getUserProfile(employeeId);
  },

  // Create a new employee
  async createEmployee(employeeData: Partial<User>): Promise<string> {
    try {
      // Generate a new document ID
      const employeesRef = collection(db, USERS_COLLECTION);
      const newEmployeeRef = doc(employeesRef);
      const employeeId = newEmployeeRef.id;
      
      // Ensure employee has appropriate role
      const role = employeeData.role || "employee";
      
      // Create a clean employee object without undefined values
      const newEmployee: Record<string, any> = {
        id: employeeId,
        role: role as User["role"],
        status: employeeData.status || "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      // Only add fields that are defined
      if (employeeData.name) newEmployee.name = employeeData.name;
      if (employeeData.email) newEmployee.email = employeeData.email;
      if (employeeData.phoneNumber) newEmployee.phoneNumber = employeeData.phoneNumber;
      if (employeeData.department) newEmployee.department = employeeData.department;
      if (employeeData.position) newEmployee.position = employeeData.position;
      if (employeeData.reportingManager) newEmployee.reportingManager = employeeData.reportingManager;
      
      // Handle job details
      if (employeeData.jobDetails) {
        const jobDetails: Record<string, any> = {};
        
        if (employeeData.jobDetails.title) jobDetails.title = employeeData.jobDetails.title;
        if (employeeData.jobDetails.department) jobDetails.department = employeeData.jobDetails.department;
        if (employeeData.jobDetails.employmentType) jobDetails.employmentType = employeeData.jobDetails.employmentType;
        if (employeeData.jobDetails.hireDate) jobDetails.hireDate = employeeData.jobDetails.hireDate;
        
        if (Object.keys(jobDetails).length > 0) {
          newEmployee.jobDetails = jobDetails;
        }
      }
      
      await setDoc(newEmployeeRef, newEmployee);
      
      return employeeId;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
  },

  // Update an employee
  async updateEmployee(employeeId: string, employeeData: Partial<User>): Promise<void> {
    return userService.updateUserProfile(employeeId, employeeData);
  },

  // Delete an employee
  async deleteEmployee(employeeId: string): Promise<void> {
    return userService.deleteUser(employeeId);
  },

  // Get employees by department
  async getEmployeesByDepartment(departmentId: string): Promise<User[]> {
    return userService.getUsersByDepartment(departmentId);
  },

  // Get direct reports for a manager
  async getDirectReports(managerId: string): Promise<User[]> {
    return userService.getDirectReports(managerId);
  },

  // Get employee's reporting chain (upward)
  async getReportingChain(employeeId: string): Promise<User[]> {
    return userService.getReportingChain(employeeId);
  },

  // Get employees by position
  async getEmployeesByPosition(positionId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("position", "==", positionId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting employees by position:", error);
      return [];
    }
  },

  // Get employees by status
  async getEmployeesByStatus(status: "active" | "inactive" | "pending" | "suspended"): Promise<User[]> {
    return userService.getUsersByStatus(status);
  },

  // Get employees by role
  async getEmployeesByRole(role: User["role"]): Promise<User[]> {
    return userService.getUsersByRole(role);
  },

  // Get all managers (users with manager role or who have direct reports)
  async getAllManagers(): Promise<User[]> {
    try {
      // First get users with manager roles
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(
        usersRef, 
        where("role", "in", ["manager", "department_manager", "leader", "director"])
      );
      const snapshot = await getDocs(q);
      
      const managers = snapshot.docs.map(doc => doc.data() as User);
      
      // Then get users who have direct reports but might not have manager role
      const allUsers = await userService.getAllUsers();
      const usersWithReports = allUsers.filter(user => 
        !managers.some(manager => manager.id === user.id) && // Not already in managers list
        allUsers.some(u => u.reportingManager === user.id) // Has at least one direct report
      );
      
      return [...managers, ...usersWithReports];
    } catch (error) {
      console.error("Error getting all managers:", error);
      return [];
    }
  }
};