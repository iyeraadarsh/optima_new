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
  serverTimestamp
} from "firebase/firestore";
import { WorkFromHomeRequest } from "@/types";

const WFH_REQUESTS_COLLECTION = "workFromHomeRequests";

export const workFromHomeService = {
  /**
   * Create a new work from home request
   */
  async createWorkFromHomeRequest(wfhRequest: Partial<WorkFromHomeRequest>): Promise<string> {
    try {
      const wfhRequestRef = doc(collection(db, WFH_REQUESTS_COLLECTION));
      
      // Ensure required fields are present
      if (!wfhRequest.userId) {
        throw new Error('User ID is required');
      }
      
      if (!wfhRequest.startDate || !wfhRequest.endDate) {
        throw new Error('Start and end dates are required');
      }
      
      // Create the new request with proper field names
      const newWfhRequest = {
        ...wfhRequest,
        id: wfhRequestRef.id,
        status: wfhRequest.status || 'pending',
        // Make sure we're using the correct field name (userId, not employeeId)
        userId: wfhRequest.userId,
        // Store dates as timestamps for proper querying
        startDate: wfhRequest.startDate,
        endDate: wfhRequest.endDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('Creating WFH request with data:', newWfhRequest);
      
      await setDoc(wfhRequestRef, newWfhRequest);
      return wfhRequestRef.id;
    } catch (error) {
      console.error('Error creating work from home request:', error);
      throw error;
    }
  },
  
  /**
   * Get work from home requests with optional filters
   */
  async getWorkFromHomeRequests(filters?: {
    userId?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<WorkFromHomeRequest[]> {
    try {
      console.log('Getting WFH requests with filters:', filters);
      
      let wfhRequestsQuery = collection(db, WFH_REQUESTS_COLLECTION);
      let constraints = [];
      
      // Handle filters
      if (filters?.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      // Add date range filters if provided
      if (filters?.startDate) {
        constraints.push(where('startDate', '>=', filters.startDate));
      }
      
      if (filters?.endDate) {
        constraints.push(where('endDate', '<=', filters.endDate));
      }
      
      // Add ordering
      constraints.push(orderBy('createdAt', 'desc'));
      
      const q = query(wfhRequestsQuery, ...constraints);
      console.log('Executing query with constraints:', constraints);
      
      const wfhRequestsSnapshot = await getDocs(q);
      console.log(`Found ${wfhRequestsSnapshot.size} WFH requests`);
      
      return wfhRequestsSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle different timestamp formats
        let createdAt = Date.now();
        let updatedAt = Date.now();
        
        if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
          createdAt = data.createdAt.toMillis();
        } else if (data.createdAt) {
          createdAt = data.createdAt;
        }
        
        if (data.updatedAt && typeof data.updatedAt.toMillis === 'function') {
          updatedAt = data.updatedAt.toMillis();
        } else if (data.updatedAt) {
          updatedAt = data.updatedAt;
        }
        
        return {
          ...data,
          id: doc.id,
          createdAt: createdAt,
          updatedAt: updatedAt
        } as WorkFromHomeRequest;
      });
    } catch (error) {
      console.error('Error getting work from home requests:', error);
      throw error;
    }
  },
  
  /**
   * Get a work from home request by ID
   */
  async getWorkFromHomeRequest(id: string): Promise<WorkFromHomeRequest | null> {
    try {
      const wfhRequestRef = doc(db, WFH_REQUESTS_COLLECTION, id);
      const wfhRequestSnapshot = await getDoc(wfhRequestRef);
      
      if (!wfhRequestSnapshot.exists()) {
        return null;
      }
      
      const data = wfhRequestSnapshot.data();
      return {
        ...data,
        id: wfhRequestSnapshot.id,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      } as WorkFromHomeRequest;
    } catch (error) {
      console.error("Error getting work from home request:", error);
      throw error;
    }
  },
  
  /**
   * Update a work from home request
   */
  async updateWorkFromHomeRequest(id: string, wfhRequest: Partial<WorkFromHomeRequest>): Promise<void> {
    try {
      const wfhRequestRef = doc(db, WFH_REQUESTS_COLLECTION, id);
      
      await updateDoc(wfhRequestRef, {
        ...wfhRequest,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating work from home request:", error);
      throw error;
    }
  },
  
  /**
   * Delete a work from home request
   */
  async deleteWorkFromHomeRequest(id: string): Promise<void> {
    try {
      const wfhRequestRef = doc(db, WFH_REQUESTS_COLLECTION, id);
      await deleteDoc(wfhRequestRef);
    } catch (error) {
      console.error("Error deleting work from home request:", error);
      throw error;
    }
  },
  
  /**
   * Approve a work from home request
   */
  async approveWorkFromHomeRequest(id: string, approverId: string, comments?: string): Promise<void> {
    try {
      const wfhRequestRef = doc(db, WFH_REQUESTS_COLLECTION, id);
      
      await updateDoc(wfhRequestRef, {
        status: "approved",
        approverId,
        approvedAt: serverTimestamp(),
        comments: comments || "",
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error approving work from home request:", error);
      throw error;
    }
  },
  
  /**
   * Reject a work from home request
   */
  async rejectWorkFromHomeRequest(id: string, approverId: string, reason: string): Promise<void> {
    try {
      const wfhRequestRef = doc(db, WFH_REQUESTS_COLLECTION, id);
      
      await updateDoc(wfhRequestRef, {
        status: "rejected",
        approverId,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error rejecting work from home request:", error);
      throw error;
    }
  },
  
  /**
   * Cancel a work from home request
   */
  async cancelWorkFromHomeRequest(id: string, reason?: string): Promise<void> {
    try {
      const wfhRequestRef = doc(db, WFH_REQUESTS_COLLECTION, id);
      
      await updateDoc(wfhRequestRef, {
        status: "cancelled",
        cancellationReason: reason || "",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error cancelling work from home request:", error);
      throw error;
    }
  },
  
  /**
   * Get approvers for a user
   */
  async getApprovers(userId: string): Promise<any[]> {
    try {
      // Get the user's profile to find their department and reporting manager
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return [];
      }
      
      const userData = userDoc.data();
      const userDepartment = userData.department;
      const reportingManager = userData.reportingManager;
      
      // Get all users with manager roles
      const usersRef = collection(db, 'users');
      const managersQuery = query(
        usersRef,
        where('role', 'in', ['manager', 'department_manager', 'director', 'admin', 'super_admin'])
      );
      
      const managersSnapshot = await getDocs(managersQuery);
      
      // Filter managers based on relevance to the user
      const approvers = managersSnapshot.docs
        .map(doc => {
          const managerData = doc.data();
          return {
            id: doc.id,
            name: managerData.name,
            role: managerData.role,
            department: managerData.department,
            // Add a relevance score to sort by
            relevance: 
              // Direct manager gets highest priority
              (reportingManager && doc.id === reportingManager) ? 10 :
              // Same department managers get next priority
              (userDepartment && managerData.department === userDepartment) ? 5 :
              // HR department managers get next priority
              (managerData.department === 'Human Resources') ? 3 :
              // Other managers get lowest priority
              1
          };
        })
        .sort((a, b) => b.relevance - a.relevance);
      
      return approvers;
    } catch (error) {
      console.error('Error getting approvers:', error);
      return [];
    }
  }
};