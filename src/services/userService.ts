import { db } from "@/lib/firebase";
import { User, UserActivity } from "@/types";
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
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { deleteUser as deleteFirebaseUser } from "firebase/auth";

const USERS_COLLECTION = "users";
const USER_ACTIVITIES_COLLECTION = "userActivities";

export const userService = {
  // Create a new user profile
  async createUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      console.log("Creating user in Firestore:", userId);
      const userRef = doc(db, USERS_COLLECTION, userId);
      
      // Ensure status is one of the allowed values
      const status = userData.status || "active";
      
      const newUser = {
        ...userData,
        id: userId,
        status: status as "active" | "inactive" | "pending" | "suspended",
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
        lastActive: userData.lastActive || new Date().toISOString(),
      };
      
      await setDoc(userRef, newUser);
      console.log("User created successfully in Firestore:", userId);
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
      throw error;
    }
  },

  // Get a user profile by ID
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as User;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  // Update a user profile
  async updateUserProfile(userId: string, userData: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      
      // Create a clean update object without undefined values
      const updateData: Record<string, any> = {
        updatedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      
      // Only include defined fields in the update
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.status !== undefined) updateData.status = userData.status;
      if (userData.phoneNumber !== undefined) updateData.phoneNumber = userData.phoneNumber;
      
      // Handle department, position, and reportingManager specially
      if (userData.department !== undefined) {
        if (userData.department === '') {
          // If empty string, set to null (Firestore will remove the field)
          updateData.department = null;
        } else {
          updateData.department = userData.department;
        }
      }
      
      if (userData.position !== undefined) {
        if (userData.position === '') {
          // If empty string, set to null (Firestore will remove the field)
          updateData.position = null;
        } else {
          updateData.position = userData.position;
        }
      }
      
      if (userData.reportingManager !== undefined) {
        if (!userData.reportingManager || userData.reportingManager === '') {
          // If undefined, null, or empty string, set to null (Firestore will remove the field)
          updateData.reportingManager = null;
        } else {
          updateData.reportingManager = userData.reportingManager;
        }
      }
      
      // Handle jobDetails specially
      if (userData.jobDetails) {
        const jobDetails: Record<string, any> = {};
        
        if (userData.jobDetails.title !== undefined) {
          jobDetails.title = userData.jobDetails.title || null;
        }
        
        if (userData.jobDetails.department !== undefined) {
          if (userData.jobDetails.department === '') {
            jobDetails.department = null;
          } else {
            jobDetails.department = userData.jobDetails.department;
          }
        }
        
        if (userData.jobDetails.employmentType !== undefined) {
          jobDetails.employmentType = userData.jobDetails.employmentType;
        }
        
        if (userData.jobDetails.hireDate !== undefined) {
          jobDetails.hireDate = userData.jobDetails.hireDate || null;
        }
        
        updateData.jobDetails = jobDetails;
      }
      
      // Perform the update with the clean data
      await updateDoc(userRef, updateData);
      
      // Log activity
      await this.logUserActivity(userId, 'update', 'users', { fields: Object.keys(updateData) });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Delete a user
  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete from Firestore
      const userRef = doc(db, USERS_COLLECTION, userId);
      await deleteDoc(userRef);
      
      // Attempt to delete from Firebase Auth
      try {
        const user = auth.currentUser;
        if (user && user.uid === userId) {
          await deleteFirebaseUser(user);
        }
      } catch (authError) {
        console.error("Error deleting Firebase auth user:", authError);
        // Continue with Firestore deletion even if Auth deletion fails
      }
      
      // Log activity
      await this.logUserActivity("system", "delete", "users", { userId });
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const usersSnap = await getDocs(usersRef);
      
      return usersSnap.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  },

  // Get users by role
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("role", "==", role));
      const usersSnap = await getDocs(q);
      
      return usersSnap.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting users by role:", error);
      return [];
    }
  },

  // Get users by department
  async getUsersByDepartment(department: string): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("department", "==", department));
      const usersSnap = await getDocs(q);
      
      return usersSnap.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting users by department:", error);
      return [];
    }
  },

  // Update user's last active timestamp
  async updateLastActive(userId: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, {
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating last active timestamp:", error);
      // Don't throw, as this is a non-critical operation
    }
  },

  // Change user status
  async changeUserStatus(userId: string, status: "active" | "inactive" | "pending" | "suspended"): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, {
        status,
        updatedAt: new Date().toISOString(),
        lastActive: status === "active" ? new Date().toISOString() : undefined
      });
      
      // Log activity
      await this.logUserActivity("system", "status_change", "users", { userId, status });
    } catch (error) {
      console.error("Error changing user status:", error);
      throw error;
    }
  },
  
  // Bulk update users
  async bulkUpdateUsers(userIds: string[], updateData: Partial<User>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      userIds.forEach(userId => {
        const userRef = doc(db, USERS_COLLECTION, userId);
        batch.update(userRef, {
          ...updateData,
          updatedAt: new Date().toISOString()
        });
      });
      
      await batch.commit();
      
      // Log activity
      await this.logUserActivity("system", "bulk_update", "users", { 
        userIds, 
        fields: Object.keys(updateData) 
      });
    } catch (error) {
      console.error("Error bulk updating users:", error);
      throw error;
    }
  },
  
  // Log user activity
  async logUserActivity(
    userId: string, 
    action: string, 
    module: string, 
    details: any,
    ipAddress?: string
  ): Promise<void> {
    try {
      const activitiesRef = collection(db, USER_ACTIVITIES_COLLECTION);
      const newActivityRef = doc(activitiesRef);
      
      const activity: UserActivity = {
        id: newActivityRef.id,
        userId,
        action,
        module,
        details,
        timestamp: new Date().toISOString(),
        ipAddress
      };
      
      await setDoc(newActivityRef, activity);
    } catch (error) {
      console.error("Error logging user activity:", error);
      // Don't throw, as this is a non-critical operation
    }
  },
  
  // Get user activities
  async getUserActivities(userId: string, limitCount: number = 20): Promise<UserActivity[]> {
    try {
      const activitiesRef = collection(db, USER_ACTIVITIES_COLLECTION);
      const q = query(
        activitiesRef, 
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      const activitiesSnap = await getDocs(q);
      
      return activitiesSnap.docs.map(doc => doc.data() as UserActivity);
    } catch (error) {
      console.error("Error getting user activities:", error);
      return [];
    }
  },
  
  // Get users by status
  async getUsersByStatus(status: "active" | "inactive" | "pending" | "suspended"): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("status", "==", status));
      const usersSnap = await getDocs(q);
      
      return usersSnap.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting users by status:", error);
      return [];
    }
  },

  // Get user's direct reports
  async getDirectReports(userId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("reportingManager", "==", userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting direct reports:", error);
      return [];
    }
  },

  // Get user's reporting chain (upward)
  async getReportingChain(userId: string): Promise<User[]> {
    try {
      const chain: User[] = [];
      let currentUserId = userId;
      
      while (currentUserId) {
        const user = await this.getUserProfile(currentUserId);
        if (!user || chain.some(u => u.id === user.id)) break; // Prevent infinite loops
        
        chain.push(user);
        currentUserId = user.reportingManager || "";
      }
      
      return chain;
    } catch (error) {
      console.error("Error getting reporting chain:", error);
      return [];
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<any | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        return null;
      }
      
      return {
        id: userSnapshot.id,
        ...userSnapshot.data()
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
};