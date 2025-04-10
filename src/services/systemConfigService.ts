
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const systemConfigService = {
  /**
   * Check if a super admin user exists in the system
   */
  async checkSuperAdminExists(): Promise<boolean> {
    try {
      const usersRef = collection(db, "users");
      const superAdminQuery = query(
        usersRef,
        where("role", "==", "super_admin"),
        limit(1)
      );
      
      const querySnapshot = await getDocs(superAdminQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking if super admin exists:", error);
      // Default to true in case of error to prevent unauthorized registrations
      return true;
    }
  },

  /**
   * Check if the current user has permission to manage users
   * Only super_admin and admin roles can manage users
   */
  async canManageUsers(userRole: string | undefined): Promise<boolean> {
    return userRole === "super_admin" || userRole === "admin";
  }
};
