import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { UserActivity } from "@/types";

const ACTIVITIES_COLLECTION = "userActivities";

export const userActivityService = {
  /**
   * Log a user activity
   */
  async logActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<string> {
    try {
      const activityRef = doc(collection(db, ACTIVITIES_COLLECTION));
      
      // Create a clean activity object with required fields only
      const cleanActivity = {
        userId: activity.userId,
        action: activity.action,
        module: activity.module,
        details: activity.details || {},
        id: activityRef.id,
        timestamp: new Date().toISOString()
        // Removed ipAddress field to prevent undefined value errors
      };
      
      // Save to Firestore - no undefined fields
      await setDoc(activityRef, cleanActivity);
      return activityRef.id;
    } catch (error) {
      console.error('Error logging user activity:', error);
      throw error;
    }
  }
};