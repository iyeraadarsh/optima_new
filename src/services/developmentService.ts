
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  deleteDoc
} from "firebase/firestore";
import { DevelopmentGoal, DevelopmentActivity } from "@/types/skills";

const GOALS_COLLECTION = "developmentGoals";
const ACTIVITIES_COLLECTION = "developmentActivities";

export const developmentService = {
  /**
   * Create a new development goal
   */
  async createGoal(goal: any): Promise<string> {
    try {
      // Create a reference to a new document with auto-generated ID
      const goalRef = doc(collection(db, GOALS_COLLECTION));
      const timestamp = Date.now();
      
      // Create a clean goal object with required fields only
      const cleanGoal: Record<string, any> = {
        userId: goal.userId,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        progress: goal.progress || 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        id: goalRef.id
      };
      
      // Only add optional fields if they have actual values
      if (goal.targetDate && goal.targetDate.trim() !== '') {
        cleanGoal.targetDate = goal.targetDate;
      }
      
      if (goal.completedDate && goal.completedDate.trim() !== '') {
        cleanGoal.completedDate = goal.completedDate;
      }
      
      if (goal.category && goal.category.trim() !== '') {
        cleanGoal.category = goal.category;
      }
      
      if (goal.relatedSkills && Array.isArray(goal.relatedSkills) && goal.relatedSkills.length > 0) {
        cleanGoal.relatedSkills = goal.relatedSkills;
      }
      
      if (goal.notes && goal.notes.trim() !== '') {
        cleanGoal.notes = goal.notes;
      }
      
      console.log('Saving goal with data:', cleanGoal);
      
      // Save to Firestore
      await setDoc(goalRef, cleanGoal);
      return goalRef.id;
    } catch (error) {
      console.error("Error creating development goal:", error);
      throw error;
    }
  },
  
  /**
   * Get all development goals for a user
   */
  async getUserGoals(userId: string): Promise<DevelopmentGoal[]> {
    try {
      const goalsRef = collection(db, GOALS_COLLECTION);
      const q = query(
        goalsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const goalsSnapshot = await getDocs(q);
      
      return goalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now()
        } as DevelopmentGoal;
      });
    } catch (error) {
      console.error("Error getting user development goals:", error);
      throw error;
    }
  },
  
  /**
   * Get a development goal by ID
   */
  async getGoal(id: string): Promise<DevelopmentGoal | null> {
    try {
      const goalRef = doc(db, GOALS_COLLECTION, id);
      const goalSnapshot = await getDoc(goalRef);
      
      if (!goalSnapshot.exists()) {
        return null;
      }
      
      const data = goalSnapshot.data();
      return {
        ...data,
        id: goalSnapshot.id,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now()
      } as DevelopmentGoal;
    } catch (error) {
      console.error("Error getting development goal:", error);
      throw error;
    }
  },
  
  /**
   * Update a development goal
   */
  async updateGoal(id: string, goal: Partial<DevelopmentGoal>): Promise<void> {
    try {
      const goalRef = doc(db, GOALS_COLLECTION, id);
      
      // Create a clean update object without undefined values
      const updateData: Record<string, any> = {
        updatedAt: Date.now()
      };
      
      // Only add fields that are defined
      if (goal.title !== undefined) updateData.title = goal.title;
      if (goal.description !== undefined) updateData.description = goal.description;
      if (goal.status !== undefined) updateData.status = goal.status;
      if (goal.progress !== undefined) updateData.progress = goal.progress;
      
      // Handle optional fields
      if (goal.targetDate !== undefined) {
        if (goal.targetDate === '') {
          // If empty string, remove the field
          updateData.targetDate = null;
        } else {
          updateData.targetDate = goal.targetDate;
        }
      }
      
      if (goal.completedDate !== undefined) {
        if (goal.completedDate === '') {
          updateData.completedDate = null;
        } else {
          updateData.completedDate = goal.completedDate;
        }
      }
      
      if (goal.category !== undefined) {
        if (goal.category === '') {
          updateData.category = null;
        } else {
          updateData.category = goal.category;
        }
      }
      
      if (goal.relatedSkills !== undefined) {
        updateData.relatedSkills = goal.relatedSkills;
      }
      
      if (goal.notes !== undefined) {
        if (goal.notes === '') {
          updateData.notes = null;
        } else {
          updateData.notes = goal.notes;
        }
      }
      
      await updateDoc(goalRef, updateData);
    } catch (error) {
      console.error("Error updating development goal:", error);
      throw error;
    }
  },
  
  /**
   * Delete a development goal
   */
  async deleteGoal(id: string): Promise<void> {
    try {
      const goalRef = doc(db, GOALS_COLLECTION, id);
      await deleteDoc(goalRef);
    } catch (error) {
      console.error("Error deleting development goal:", error);
      throw error;
    }
  },
  
  /**
   * Create a new development activity
   */
  async createActivity(activity: any): Promise<string> {
    try {
      const activityRef = doc(collection(db, ACTIVITIES_COLLECTION));
      const timestamp = Date.now();
      
      // Create a clean activity object without undefined values
      const cleanActivity: Record<string, any> = {
        goalId: activity.goalId,
        userId: activity.userId,
        title: activity.title,
        date: activity.date,
        status: activity.status,
        createdAt: timestamp,
        updatedAt: timestamp,
        id: activityRef.id
      };
      
      // Only add optional fields if they have values
      if (activity.description && activity.description.trim() !== '') {
        cleanActivity.description = activity.description;
      }
      
      if (activity.duration !== undefined) {
        cleanActivity.duration = activity.duration;
      }
      
      if (activity.notes && activity.notes.trim() !== '') {
        cleanActivity.notes = activity.notes;
      }
      
      await setDoc(activityRef, cleanActivity);
      return activityRef.id;
    } catch (error) {
      console.error("Error creating development activity:", error);
      throw error;
    }
  },
  
  /**
   * Get all activities for a development goal
   */
  async getGoalActivities(goalId: string): Promise<DevelopmentActivity[]> {
    try {
      const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
      const q = query(
        activitiesRef,
        where("goalId", "==", goalId),
        orderBy("date", "desc")
      );
      
      const activitiesSnapshot = await getDocs(q);
      
      return activitiesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now()
        } as DevelopmentActivity;
      });
    } catch (error) {
      console.error("Error getting goal activities:", error);
      throw error;
    }
  },
  
  /**
   * Update a development activity
   */
  async updateActivity(id: string, activity: Partial<DevelopmentActivity>): Promise<void> {
    try {
      const activityRef = doc(db, ACTIVITIES_COLLECTION, id);
      
      // Create a clean update object without undefined values
      const updateData: Record<string, any> = {
        updatedAt: Date.now()
      };
      
      // Only add fields that are defined
      if (activity.title !== undefined) updateData.title = activity.title;
      if (activity.date !== undefined) updateData.date = activity.date;
      if (activity.status !== undefined) updateData.status = activity.status;
      if (activity.duration !== undefined) updateData.duration = activity.duration;
      
      // Handle optional fields
      if (activity.description !== undefined) {
        if (activity.description === '') {
          updateData.description = null;
        } else {
          updateData.description = activity.description;
        }
      }
      
      if (activity.notes !== undefined) {
        if (activity.notes === '') {
          updateData.notes = null;
        } else {
          updateData.notes = activity.notes;
        }
      }
      
      await updateDoc(activityRef, updateData);
    } catch (error) {
      console.error("Error updating development activity:", error);
      throw error;
    }
  },
  
  /**
   * Delete a development activity
   */
  async deleteActivity(id: string): Promise<void> {
    try {
      const activityRef = doc(db, ACTIVITIES_COLLECTION, id);
      await deleteDoc(activityRef);
    } catch (error) {
      console.error("Error deleting development activity:", error);
      throw error;
    }
  }
};
