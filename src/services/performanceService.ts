
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
  deleteDoc,
  serverTimestamp,
  Timestamp,
  CollectionReference
} from "firebase/firestore";
import { Goal, GoalComment, PerformanceReview, PerformanceSettings } from "@/types/performance";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const GOALS_COLLECTION = "goals";
const GOAL_COMMENTS_COLLECTION = "goalComments";
const PERFORMANCE_REVIEWS_COLLECTION = "performanceReviews";
const PERFORMANCE_SETTINGS_COLLECTION = "performanceSettings";

export const performanceService = {
  // Goal Management
  async createGoal(goal: Partial<Goal>): Promise<string> {
    try {
      // Validate required fields
      if (!goal.employeeId) {
        throw new Error('Employee ID is required');
      }
      
      if (!goal.title || goal.title.trim() === '') {
        throw new Error('Goal title is required');
      }
      
      if (!goal.description || goal.description.trim() === '') {
        throw new Error('Goal description is required');
      }
      
      if (!goal.keyMetrics || goal.keyMetrics.length === 0) {
        throw new Error('At least one key metric is required');
      }
      
      if (!goal.year) {
        throw new Error('Year is required');
      }
      
      const goalRef = doc(collection(db, GOALS_COLLECTION));
      const newGoal = {
        ...goal,
        id: goalRef.id,
        status: goal.status || 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Ensure keyMetrics is an array
      if (!Array.isArray(newGoal.keyMetrics)) {
        newGoal.keyMetrics = [newGoal.keyMetrics as unknown as string];
      }
      
      // Filter out empty metrics
      newGoal.keyMetrics = newGoal.keyMetrics.filter(metric => 
        typeof metric === 'string' && metric.trim() !== ''
      );
      
      console.log('Creating goal with data:', newGoal);
      
      await setDoc(goalRef, newGoal);
      return goalRef.id;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },
  
  async getGoals(filters?: {
    employeeId?: string;
    year?: number;
    status?: string;
  }): Promise<Goal[]> {
    try {
      console.log('Getting goals with filters:', filters);
      
      const goalsCollection = collection(db, GOALS_COLLECTION);
      let goalsQuery;
      
      const constraints = [];
      
      if (filters?.employeeId) {
        constraints.push(where('employeeId', '==', filters.employeeId));
      }
      
      if (filters?.year) {
        constraints.push(where('year', '==', filters.year));
      }
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      if (constraints.length > 0) {
        goalsQuery = query(goalsCollection, ...constraints);
      } else {
        goalsQuery = query(goalsCollection);
      }
      
      const goalsSnapshot = await getDocs(goalsQuery);
      
      console.log('Goals snapshot size:', goalsSnapshot.size);
      
      const goals = goalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
          approvedAt: data.approvedAt instanceof Timestamp ? data.approvedAt.toMillis() : data.approvedAt,
          completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toMillis() : data.completedAt
        } as Goal;
      });
      
      console.log('Processed goals:', goals);
      
      return goals;
    } catch (error) {
      console.error('Error getting goals:', error);
      throw error;
    }
  },
  
  async getGoal(id: string): Promise<Goal | null> {
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
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
        approvedAt: data.approvedAt instanceof Timestamp ? data.approvedAt.toMillis() : data.approvedAt,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toMillis() : data.completedAt
      } as Goal;
    } catch (error) {
      console.error("Error getting goal:", error);
      throw error;
    }
  },
  
  async updateGoal(id: string, goal: Partial<Goal>): Promise<void> {
    try {
      const goalRef = doc(db, GOALS_COLLECTION, id);
      
      await updateDoc(goalRef, {
        ...goal,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  },
  
  async submitGoal(id: string): Promise<void> {
    try {
      const goalRef = doc(db, GOALS_COLLECTION, id);
      
      await updateDoc(goalRef, {
        status: "submitted",
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error submitting goal:", error);
      throw error;
    }
  },
  
  async approveGoal(id: string, approverId: string, approverName: string): Promise<void> {
    try {
      const goalRef = doc(db, GOALS_COLLECTION, id);
      
      await updateDoc(goalRef, {
        status: "approved",
        approverId,
        approverName,
        approvedAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error approving goal:", error);
      throw error;
    }
  },
  
  async completeGoal(id: string): Promise<void> {
    try {
      const goalRef = doc(db, GOALS_COLLECTION, id);
      
      await updateDoc(goalRef, {
        status: "completed",
        completedAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error completing goal:", error);
      throw error;
    }
  },
  
  async archiveGoal(id: string): Promise<void> {
    try {
      const goalRef = doc(db, GOALS_COLLECTION, id);
      
      await updateDoc(goalRef, {
        status: "archived",
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error archiving goal:", error);
      throw error;
    }
  },
  
  // Goal Comments
  async addGoalComment(comment: Partial<GoalComment>, files?: File[]): Promise<string> {
    try {
      console.log('Adding goal comment:', comment);
      
      // Validate required fields
      if (!comment.goalId) {
        throw new Error('Goal ID is required for comment');
      }
      
      if (!comment.userId) {
        throw new Error('User ID is required for comment');
      }
      
      if (!comment.comment || comment.comment.trim() === '') {
        throw new Error('Comment text is required');
      }
      
      const commentRef = doc(collection(db, GOAL_COMMENTS_COLLECTION));
      
      let attachments: string[] = [];
      
      // Upload files if any
      if (files && files.length > 0) {
        console.log(`Uploading ${files.length} files for comment`);
        
        try {
          for (const file of files) {
            console.log(`Uploading file: ${file.name}`);
            const storageRef = ref(storage, `goal-comments/${commentRef.id}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            attachments.push(downloadURL);
            console.log(`File uploaded successfully: ${downloadURL}`);
          }
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          // Continue with comment creation even if file upload fails
          // But include error information in the comment
          comment.comment += "\n\n[Note: Some attachments failed to upload]";
        }
      }
      
      const newComment: GoalComment = {
        id: commentRef.id,
        goalId: comment.goalId,
        userId: comment.userId,
        userName: comment.userName || 'User',
        userRole: comment.userRole || 'employee',
        comment: comment.comment,
        attachments: attachments,
        createdAt: Date.now()
      };
      
      console.log('Saving comment to Firestore:', newComment);
      
      await setDoc(commentRef, newComment);
      console.log('Comment saved successfully with ID:', commentRef.id);
      return commentRef.id;
    } catch (error) {
      console.error('Error adding goal comment:', error);
      // Rethrow with more specific message
      if (error instanceof Error) {
        throw new Error(`Failed to add comment: ${error.message}`);
      }
      throw error;
    }
  },
  
  async getGoalComments(goalId: string): Promise<GoalComment[]> {
    try {
      console.log('Getting comments for goal:', goalId);
      
      // First try with the composite index
      try {
        const commentsQuery = query(
          collection(db, GOAL_COMMENTS_COLLECTION),
          where('goalId', '==', goalId),
          orderBy('createdAt', 'asc')
        );
        
        const commentsSnapshot = await getDocs(commentsQuery);
        console.log(`Found ${commentsSnapshot.size} comments for goal ${goalId}`);
        
        return commentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt
          } as GoalComment;
        });
      } catch (indexError) {
        console.error('Error with indexed query, falling back to simple query:', indexError);
        
        // If the index isn't ready yet, fall back to a simpler query without ordering
        const fallbackQuery = query(
          collection(db, GOAL_COMMENTS_COLLECTION),
          where('goalId', '==', goalId)
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        console.log(`Fallback query found ${fallbackSnapshot.size} comments`);
        
        // Sort manually in memory
        const comments = fallbackSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt
          } as GoalComment;
        });
        
        // Sort by createdAt
        return comments.sort((a, b) => a.createdAt - b.createdAt);
      }
    } catch (error) {
      console.error('Error getting goal comments:', error);
      throw error;
    }
  },
  
  // Performance Reviews
  async createPerformanceReview(review: Partial<PerformanceReview>): Promise<string> {
    try {
      const reviewRef = doc(collection(db, PERFORMANCE_REVIEWS_COLLECTION));
      const newReview = {
        ...review,
        id: reviewRef.id,
        status: review.status || 'draft',
        goals: review.goals || [], // Ensure goals is always an array, even if not provided
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await setDoc(reviewRef, newReview);
      return reviewRef.id;
    } catch (error) {
      console.error('Error creating performance review:', error);
      throw error;
    }
  },
  
  async getPerformanceReviews(filters?: {
    employeeId?: string;
    managerId?: string;
    year?: number;
    status?: string;
  }): Promise<PerformanceReview[]> {
    try {
      let reviewsQuery = collection(db, PERFORMANCE_REVIEWS_COLLECTION);
      let constraints = [];
      
      if (filters?.employeeId) {
        constraints.push(where('employeeId', '==', filters.employeeId));
      }
      
      if (filters?.managerId) {
        constraints.push(where('managerId', '==', filters.managerId));
      }
      
      if (filters?.year) {
        constraints.push(where('year', '==', filters.year));
      }
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      constraints.push(orderBy('updatedAt', 'desc'));
      
      const q = query(reviewsQuery, ...constraints);
      const reviewsSnapshot = await getDocs(q);
      
      return reviewsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toMillis() : data.submittedAt,
          completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toMillis() : data.completedAt
        } as PerformanceReview;
      });
    } catch (error) {
      console.error("Error getting performance reviews:", error);
      throw error;
    }
  },
  
  async getPerformanceReview(id: string): Promise<PerformanceReview | null> {
    try {
      const reviewRef = doc(db, PERFORMANCE_REVIEWS_COLLECTION, id);
      const reviewSnapshot = await getDoc(reviewRef);
      
      if (!reviewSnapshot.exists()) {
        return null;
      }
      
      const data = reviewSnapshot.data();
      return {
        ...data,
        id: reviewSnapshot.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
        submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toMillis() : data.submittedAt,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toMillis() : data.completedAt
      } as PerformanceReview;
    } catch (error) {
      console.error("Error getting performance review:", error);
      throw error;
    }
  },
  
  async updatePerformanceReview(id: string, review: Partial<PerformanceReview>): Promise<void> {
    try {
      const reviewRef = doc(db, PERFORMANCE_REVIEWS_COLLECTION, id);
      
      await updateDoc(reviewRef, {
        ...review,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error updating performance review:", error);
      throw error;
    }
  },
  
  async deletePerformanceReview(id: string): Promise<void> {
    try {
      const reviewRef = doc(db, PERFORMANCE_REVIEWS_COLLECTION, id);
      await deleteDoc(reviewRef);
    } catch (error) {
      console.error("Error deleting performance review:", error);
      throw error;
    }
  },
  
  async deleteGoal(id: string): Promise<void> {
    try {
      const goalRef = doc(db, GOALS_COLLECTION, id);
      await deleteDoc(goalRef);
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  },
  
  // Additional methods for performance review workflow
  async submitSelfReview(id: string, rating: number, comments: string): Promise<void> {
    try {
      const reviewRef = doc(db, PERFORMANCE_REVIEWS_COLLECTION, id);
      
      await updateDoc(reviewRef, {
        status: "manager_review",
        selfRating: rating,
        selfComments: comments,
        submittedAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error submitting self review:", error);
      throw error;
    }
  },
  
  async completeManagerReview(id: string, rating: number, comments: string): Promise<void> {
    try {
      const reviewRef = doc(db, PERFORMANCE_REVIEWS_COLLECTION, id);
      
      await updateDoc(reviewRef, {
        status: "completed",
        managerRating: rating,
        managerComments: comments,
        completedAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error completing manager review:", error);
      throw error;
    }
  },

  // New method to change review status
  async changeReviewStatus(id: string, newStatus: 'draft' | 'self_review' | 'manager_review' | 'completed'): Promise<void> {
    try {
      const reviewRef = doc(db, PERFORMANCE_REVIEWS_COLLECTION, id);
      
      const updateData: any = {
        status: newStatus,
        updatedAt: Date.now()
      };
      
      // Add timestamp for the specific status change
      if (newStatus === 'completed') {
        updateData.completedAt = Date.now();
      } else if (newStatus === 'self_review') {
        // Reset submittedAt if moving back to self_review
        updateData.submittedAt = null;
      }
      
      await updateDoc(reviewRef, updateData);
    } catch (error) {
      console.error(`Error changing review status to ${newStatus}:`, error);
      throw error;
    }
  },
  
  // Performance Settings
  async getPerformanceSettings(): Promise<PerformanceSettings | null> {
    try {
      const settingsRef = doc(db, PERFORMANCE_SETTINGS_COLLECTION, "default");
      const settingsSnapshot = await getDoc(settingsRef);
      
      if (!settingsSnapshot.exists()) {
        // Create default settings if they don't exist
        const defaultSettings: PerformanceSettings = {
          id: "default",
          enableSelfRating: true,
          ratingScale: 5,
          reviewCycle: "annual",
          goalApprovalRequired: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        await setDoc(settingsRef, defaultSettings);
        return defaultSettings;
      }
      
      const data = settingsSnapshot.data();
      return {
        ...data,
        id: settingsSnapshot.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt
      } as PerformanceSettings;
    } catch (error) {
      console.error("Error getting performance settings:", error);
      throw error;
    }
  },
  
  async updatePerformanceSettings(settings: Partial<PerformanceSettings>): Promise<void> {
    try {
      const settingsRef = doc(db, PERFORMANCE_SETTINGS_COLLECTION, "default");
      
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error updating performance settings:", error);
      throw error;
    }
  }
};
