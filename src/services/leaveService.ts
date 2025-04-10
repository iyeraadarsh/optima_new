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
  limit
} from "firebase/firestore";
import { LeaveType, LeavePolicy, LeaveRequest, LeaveBalance } from "@/types";

const LEAVE_TYPES_COLLECTION = "leaveTypes";
const LEAVE_POLICIES_COLLECTION = "leavePolicies";
const LEAVE_REQUESTS_COLLECTION = "leaveRequests";
const LEAVE_BALANCES_COLLECTION = "leaveBalances";

export const leaveService = {
  /**
   * Create a new leave type
   */
  async createLeaveType(leaveType: Partial<LeaveType>): Promise<string> {
    try {
      const leaveTypeRef = doc(collection(db, LEAVE_TYPES_COLLECTION));
      const timestamp = Date.now();
      const newLeaveType = {
        ...leaveType,
        id: leaveTypeRef.id,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await setDoc(leaveTypeRef, newLeaveType);
      
      // Initialize leave balances for all users for this new leave type
      await this.initializeLeaveBalancesForAllUsers(leaveTypeRef.id, leaveType.maxDaysPerYear || 0);
      
      return leaveTypeRef.id;
    } catch (error) {
      console.error("Error creating leave type:", error);
      throw error;
    }
  },
  
  /**
   * Initialize leave balances for all users for a new leave type
   */
  async initializeLeaveBalancesForAllUsers(leaveTypeId: string, entitledDays: number): Promise<void> {
    try {
      // Get all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const currentYear = new Date().getFullYear();
      
      // For each user, create a leave balance for the current year
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Check if balance already exists
        const existingBalance = await this.getLeaveBalance(userId, leaveTypeId, currentYear);
        
        if (!existingBalance) {
          await this.initializeLeaveBalance(userId, leaveTypeId, currentYear, entitledDays);
        }
      }
    } catch (error) {
      console.error("Error initializing leave balances for all users:", error);
      // Don't throw, as this is a background operation
    }
  },
  
  /**
   * Get all leave types
   */
  async getLeaveTypes(): Promise<LeaveType[]> {
    try {
      const leaveTypesRef = collection(db, LEAVE_TYPES_COLLECTION);
      const leaveTypesSnapshot = await getDocs(leaveTypesRef);
      
      return leaveTypesSnapshot.docs.map(doc => {
        const data = doc.data();
        // Handle different timestamp formats or use default values
        let createdAt = Date.now();
        let updatedAt = Date.now();
        
        // Check if createdAt is a Firestore Timestamp
        if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
          createdAt = data.createdAt.toMillis();
        } else if (data.createdAt) {
          // If it's a number, use it directly
          createdAt = data.createdAt;
        }
        
        // Check if updatedAt is a Firestore Timestamp
        if (data.updatedAt && typeof data.updatedAt.toMillis === 'function') {
          updatedAt = data.updatedAt.toMillis();
        } else if (data.updatedAt) {
          // If it's a number, use it directly
          updatedAt = data.updatedAt;
        }
        
        return {
          ...data,
          id: doc.id,
          createdAt: createdAt,
          updatedAt: updatedAt
        } as LeaveType;
      });
    } catch (error) {
      console.error('Error getting leave types:', error);
      throw error;
    }
  },
  
  /**
   * Get a leave type by ID
   */
  async getLeaveType(id: string): Promise<LeaveType | null> {
    try {
      const leaveTypeRef = doc(db, LEAVE_TYPES_COLLECTION, id);
      const leaveTypeSnapshot = await getDoc(leaveTypeRef);
      
      if (!leaveTypeSnapshot.exists()) {
        return null;
      }
      
      const data = leaveTypeSnapshot.data();
      return {
        ...data,
        id: leaveTypeSnapshot.id,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
        maxDaysPerYear: data.maxDaysPerYear || 0
      } as LeaveType;
    } catch (error) {
      console.error("Error getting leave type:", error);
      throw error;
    }
  },
  
  /**
   * Update a leave type
   */
  async updateLeaveType(id: string, leaveType: Partial<LeaveType>): Promise<void> {
    try {
      const leaveTypeRef = doc(db, LEAVE_TYPES_COLLECTION, id);
      
      // Get the current leave type to check if maxDaysPerYear has changed
      const currentLeaveType = await this.getLeaveType(id);
      const newMaxDays = leaveType.maxDaysPerYear;
      
      await updateDoc(leaveTypeRef, {
        ...leaveType,
        updatedAt: serverTimestamp()
      });
      
      // If maxDaysPerYear has changed, update all leave balances for this type
      if (newMaxDays !== undefined && currentLeaveType && newMaxDays !== currentLeaveType.maxDaysPerYear) {
        await this.updateLeaveBalancesForType(id, newMaxDays);
      }
    } catch (error) {
      console.error("Error updating leave type:", error);
      throw error;
    }
  },
  
  /**
   * Update leave balances for all users when a leave type's maxDaysPerYear changes
   */
  async updateLeaveBalancesForType(leaveTypeId: string, newMaxDays: number): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      
      // Get all leave balances for this type and year
      const balancesRef = collection(db, LEAVE_BALANCES_COLLECTION);
      const q = query(
        balancesRef,
        where("leaveTypeId", "==", leaveTypeId),
        where("year", "==", currentYear)
      );
      
      const balancesSnapshot = await getDocs(q);
      
      // Update each balance
      for (const balanceDoc of balancesSnapshot.docs) {
        const balance = balanceDoc.data() as LeaveBalance;
        
        // Calculate the difference in days
        const oldEntitledDays = balance.entitledDays;
        const daysDifference = newMaxDays - oldEntitledDays;
        
        // Update the balance
        await updateDoc(balanceDoc.ref, {
          entitledDays: newMaxDays,
          remainingDays: balance.remainingDays + daysDifference,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error updating leave balances for type:", error);
      // Don't throw, as this is a background operation
    }
  },
  
  /**
   * Delete a leave type
   */
  async deleteLeaveType(id: string): Promise<void> {
    try {
      const leaveTypeRef = doc(db, LEAVE_TYPES_COLLECTION, id);
      await deleteDoc(leaveTypeRef);
      
      // Delete all leave balances for this type
      await this.deleteLeaveBalancesForType(id);
    } catch (error) {
      console.error("Error deleting leave type:", error);
      throw error;
    }
  },
  
  /**
   * Delete all leave balances for a leave type
   */
  async deleteLeaveBalancesForType(leaveTypeId: string): Promise<void> {
    try {
      // Get all leave balances for this type
      const balancesRef = collection(db, LEAVE_BALANCES_COLLECTION);
      const q = query(balancesRef, where("leaveTypeId", "==", leaveTypeId));
      
      const balancesSnapshot = await getDocs(q);
      
      // Delete each balance
      for (const balanceDoc of balancesSnapshot.docs) {
        await deleteDoc(balanceDoc.ref);
      }
    } catch (error) {
      console.error("Error deleting leave balances for type:", error);
      // Don't throw, as this is a background operation
    }
  },
  
  /**
   * Create a new leave policy
   */
  async createLeavePolicy(leavePolicy: Partial<LeavePolicy>): Promise<string> {
    try {
      const leavePolicyRef = doc(collection(db, LEAVE_POLICIES_COLLECTION));
      const newLeavePolicy = {
        ...leavePolicy,
        id: leavePolicyRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(leavePolicyRef, newLeavePolicy);
      return leavePolicyRef.id;
    } catch (error) {
      console.error("Error creating leave policy:", error);
      throw error;
    }
  },
  
  /**
   * Get all leave policies
   */
  async getLeavePolicies(): Promise<LeavePolicy[]> {
    try {
      const leavePoliciesRef = collection(db, LEAVE_POLICIES_COLLECTION);
      const leavePoliciesSnapshot = await getDocs(leavePoliciesRef);
      
      return leavePoliciesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          updatedAt: data.updatedAt?.toMillis() || Date.now()
        } as LeavePolicy;
      });
    } catch (error) {
      console.error("Error getting leave policies:", error);
      throw error;
    }
  },
  
  /**
   * Get a leave policy by ID
   */
  async getLeavePolicy(id: string): Promise<LeavePolicy | null> {
    try {
      const leavePolicyRef = doc(db, LEAVE_POLICIES_COLLECTION, id);
      const leavePolicySnapshot = await getDoc(leavePolicyRef);
      
      if (!leavePolicySnapshot.exists()) {
        return null;
      }
      
      const data = leavePolicySnapshot.data();
      return {
        ...data,
        id: leavePolicySnapshot.id,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      } as LeavePolicy;
    } catch (error) {
      console.error("Error getting leave policy:", error);
      throw error;
    }
  },
  
  /**
   * Update a leave policy
   */
  async updateLeavePolicy(id: string, leavePolicy: Partial<LeavePolicy>): Promise<void> {
    try {
      const leavePolicyRef = doc(db, LEAVE_POLICIES_COLLECTION, id);
      
      await updateDoc(leavePolicyRef, {
        ...leavePolicy,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating leave policy:", error);
      throw error;
    }
  },
  
  /**
   * Delete a leave policy
   */
  async deleteLeavePolicy(id: string): Promise<void> {
    try {
      const leavePolicyRef = doc(db, LEAVE_POLICIES_COLLECTION, id);
      await deleteDoc(leavePolicyRef);
    } catch (error) {
      console.error("Error deleting leave policy:", error);
      throw error;
    }
  },
  
  /**
   * Create a new leave request
   */
  async createLeaveRequest(leaveRequest: Partial<LeaveRequest>): Promise<string> {
    try {
      const leaveRequestRef = doc(collection(db, LEAVE_REQUESTS_COLLECTION));
      const timestamp = Date.now();
      
      const newLeaveRequest = {
        ...leaveRequest,
        id: leaveRequestRef.id,
        status: leaveRequest.status || "pending",
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await setDoc(leaveRequestRef, newLeaveRequest);
      
      // Update leave balance for pending days
      if (leaveRequest.userId && leaveRequest.leaveTypeId && leaveRequest.totalDays) {
        const currentYear = new Date(leaveRequest.startDate as number).getFullYear();
        await this.updateLeaveBalanceForRequest(
          leaveRequest.userId,
          leaveRequest.leaveTypeId,
          currentYear,
          leaveRequest.totalDays,
          "pending"
        );
      }
      
      return leaveRequestRef.id;
    } catch (error) {
      console.error("Error creating leave request:", error);
      throw error;
    }
  },
  
  /**
   * Get leave requests with optional filters
   */
  async getLeaveRequests(filters?: {
    userId?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
    leaveTypeId?: string;
  }): Promise<LeaveRequest[]> {
    try {
      console.log('Getting leave requests with filters:', filters);
      let leaveRequestsQuery = collection(db, LEAVE_REQUESTS_COLLECTION);
      let constraints = [];
      
      // Simplify the query to avoid complex index requirements
      if (filters?.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      if (filters?.leaveTypeId) {
        constraints.push(where('leaveTypeId', '==', filters.leaveTypeId));
      }
      
      // Create the query with the constraints
      const q = query(leaveRequestsQuery, ...constraints);
      const leaveRequestsSnapshot = await getDocs(q);
      
      console.log(`Found ${leaveRequestsSnapshot.docs.length} leave requests`);
      
      // Get all leave requests and then filter them in memory
      let leaveRequests = leaveRequestsSnapshot.docs.map(doc => {
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
        } as LeaveRequest;
      });
      
      // Apply additional filters in memory
      if (filters?.startDate) {
        leaveRequests = leaveRequests.filter(request => request.startDate >= filters.startDate!);
      }
      
      if (filters?.endDate) {
        leaveRequests = leaveRequests.filter(request => request.endDate <= filters.endDate!);
      }
      
      // Sort by startDate in descending order
      leaveRequests.sort((a, b) => b.startDate - a.startDate);
      
      return leaveRequests;
    } catch (error) {
      console.error('Error getting leave requests:', error);
      throw error;
    }
  },
  
  /**
   * Get a leave request by ID
   */
  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    try {
      const leaveRequestRef = doc(db, LEAVE_REQUESTS_COLLECTION, id);
      const leaveRequestSnapshot = await getDoc(leaveRequestRef);
      
      if (!leaveRequestSnapshot.exists()) {
        return null;
      }
      
      const data = leaveRequestSnapshot.data();
      
      // Handle different timestamp formats
      let createdAt = Date.now();
      let updatedAt = Date.now();
      
      // Check if createdAt is a Firestore Timestamp
      if (data.createdAt && typeof data.createdAt === 'object' && 'toMillis' in data.createdAt) {
        createdAt = data.createdAt.toMillis();
      } else if (data.createdAt) {
        // If it's a number, use it directly
        createdAt = data.createdAt;
      }
      
      // Check if updatedAt is a Firestore Timestamp
      if (data.updatedAt && typeof data.updatedAt === 'object' && 'toMillis' in data.updatedAt) {
        updatedAt = data.updatedAt.toMillis();
      } else if (data.updatedAt) {
        // If it's a number, use it directly
        updatedAt = data.updatedAt;
      }
      
      return {
        ...data,
        id: leaveRequestSnapshot.id,
        createdAt: createdAt,
        updatedAt: updatedAt
      } as LeaveRequest;
    } catch (error) {
      console.error("Error getting leave request:", error);
      throw error;
    }
  },
  
  /**
   * Update a leave request
   */
  async updateLeaveRequest(id: string, leaveRequest: Partial<LeaveRequest>): Promise<void> {
    try {
      const leaveRequestRef = doc(db, LEAVE_REQUESTS_COLLECTION, id);
      const currentRequest = await this.getLeaveRequest(id);
      
      if (!currentRequest) {
        throw new Error("Leave request not found");
      }
      
      // Check if status is changing
      const statusChanged = leaveRequest.status && leaveRequest.status !== currentRequest.status;
      
      // Update the request
      await updateDoc(leaveRequestRef, {
        ...leaveRequest,
        updatedAt: serverTimestamp()
      });
      
      // If status is changing, update leave balance
      if (statusChanged && leaveRequest.status) {
        const currentYear = new Date(currentRequest.startDate).getFullYear();
        
        // If request was pending and is now approved or rejected
        if (currentRequest.status === "pending") {
          // First, remove the pending days
          await this.updateLeaveBalanceForRequest(
            currentRequest.userId,
            currentRequest.leaveTypeId,
            currentYear,
            -currentRequest.totalDays, // Negative to remove
            "pending"
          );
          
          // Then, if approved, add to used days
          if (leaveRequest.status === "approved") {
            await this.updateLeaveBalanceForRequest(
              currentRequest.userId,
              currentRequest.leaveTypeId,
              currentYear,
              currentRequest.totalDays,
              "used"
            );
          }
        }
        // If request was approved and is now cancelled or rejected
        else if (currentRequest.status === "approved" && 
                (leaveRequest.status === "cancelled" || leaveRequest.status === "rejected")) {
          // Remove from used days
          await this.updateLeaveBalanceForRequest(
            currentRequest.userId,
            currentRequest.leaveTypeId,
            currentYear,
            -currentRequest.totalDays, // Negative to remove
            "used"
          );
        }
      }
    } catch (error) {
      console.error("Error updating leave request:", error);
      throw error;
    }
  },
  
  /**
   * Delete a leave request
   */
  async deleteLeaveRequest(id: string): Promise<void> {
    try {
      const leaveRequestRef = doc(db, LEAVE_REQUESTS_COLLECTION, id);
      const currentRequest = await this.getLeaveRequest(id);
      
      if (!currentRequest) {
        throw new Error("Leave request not found");
      }
      
      await deleteDoc(leaveRequestRef);
      
      // Update leave balance
      const currentYear = new Date(currentRequest.startDate).getFullYear();
      
      if (currentRequest.status === "pending") {
        // Remove pending days
        await this.updateLeaveBalanceForRequest(
          currentRequest.userId,
          currentRequest.leaveTypeId,
          currentYear,
          -currentRequest.totalDays, // Negative to remove
          "pending"
        );
      } else if (currentRequest.status === "approved") {
        // Remove used days
        await this.updateLeaveBalanceForRequest(
          currentRequest.userId,
          currentRequest.leaveTypeId,
          currentYear,
          -currentRequest.totalDays, // Negative to remove
          "used"
        );
      }
    } catch (error) {
      console.error("Error deleting leave request:", error);
      throw error;
    }
  },
  
  /**
   * Approve a leave request
   */
  async approveLeaveRequest(id: string, approverId: string, comments?: string): Promise<void> {
    try {
      const leaveRequestRef = doc(db, LEAVE_REQUESTS_COLLECTION, id);
      const leaveRequestSnapshot = await getDoc(leaveRequestRef);
      
      if (!leaveRequestSnapshot.exists()) {
        throw new Error('Leave request not found');
      }
      
      const currentRequest = leaveRequestSnapshot.data() as LeaveRequest;
      if (!currentRequest) {
        throw new Error('Leave request data is invalid');
      }
      
      const timestamp = Date.now();
      
      // Update the request status to approved
      await updateDoc(leaveRequestRef, {
        status: 'approved',
        approverId,
        approvedAt: timestamp,
        comments: comments || '',
        updatedAt: timestamp
      });
      
      console.log(`Leave request ${id} approved by ${approverId}`);
      
      // Update leave balance for the request owner (not the approver)
      const requestOwnerId = currentRequest.userId;
      const currentYear = new Date(currentRequest.startDate).getFullYear();
      
      // First, remove pending days
      if (currentRequest.status === 'pending') {
        await this.updateLeaveBalanceForRequest(
          requestOwnerId,
          currentRequest.leaveTypeId,
          currentYear,
          -currentRequest.totalDays, // Negative to remove
          'pending'
        );
      }
      
      // Then add used days
      await this.updateLeaveBalanceForRequest(
        requestOwnerId,
        currentRequest.leaveTypeId,
        currentYear,
        currentRequest.totalDays,
        'used'
      );
    } catch (error) {
      console.error('Error approving leave request:', error);
      throw error;
    }
  },
  
  /**
   * Reject a leave request
   */
  async rejectLeaveRequest(id: string, approverId: string, reason: string): Promise<void> {
    try {
      const leaveRequestRef = doc(db, LEAVE_REQUESTS_COLLECTION, id);
      const currentRequest = await this.getLeaveRequest(id);
      
      if (!currentRequest) {
        throw new Error("Leave request not found");
      }
      
      const timestamp = Date.now();
      
      await updateDoc(leaveRequestRef, {
        status: "rejected",
        approverId,
        rejectedAt: timestamp,
        rejectionReason: reason,
        updatedAt: timestamp
      });
      
      // Update leave balance - remove pending days
      if (currentRequest.status === "pending") {
        const currentYear = new Date(currentRequest.startDate).getFullYear();
        
        await this.updateLeaveBalanceForRequest(
          currentRequest.userId,
          currentRequest.leaveTypeId,
          currentYear,
          -currentRequest.totalDays, // Negative to remove
          "pending"
        );
      }
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      throw error;
    }
  },
  
  /**
   * Cancel a leave request
   */
  async cancelLeaveRequest(id: string, reason?: string): Promise<void> {
    try {
      const leaveRequestRef = doc(db, LEAVE_REQUESTS_COLLECTION, id);
      const currentRequest = await this.getLeaveRequest(id);
      
      if (!currentRequest) {
        throw new Error("Leave request not found");
      }
      
      const timestamp = Date.now();
      
      await updateDoc(leaveRequestRef, {
        status: "cancelled",
        cancellationReason: reason || "",
        cancelledAt: timestamp,
        updatedAt: timestamp
      });
      
      // Update leave balance
      const currentYear = new Date(currentRequest.startDate).getFullYear();
      
      if (currentRequest.status === "pending") {
        // Remove pending days
        await this.updateLeaveBalanceForRequest(
          currentRequest.userId,
          currentRequest.leaveTypeId,
          currentYear,
          -currentRequest.totalDays, // Negative to remove
          "pending"
        );
      } else if (currentRequest.status === "approved") {
        // Remove used days
        await this.updateLeaveBalanceForRequest(
          currentRequest.userId,
          currentRequest.leaveTypeId,
          currentYear,
          -currentRequest.totalDays, // Negative to remove
          "used"
        );
      }
    } catch (error) {
      console.error("Error cancelling leave request:", error);
      throw error;
    }
  },
  
  /**
   * Update leave balance for a request
   */
  async updateLeaveBalanceForRequest(
    userId: string,
    leaveTypeId: string,
    year: number,
    days: number,
    type: "pending" | "used"
  ): Promise<void> {
    try {
      // Get or create the leave balance
      let balance = await this.getLeaveBalance(userId, leaveTypeId, year);
      
      if (!balance) {
        // If balance doesn't exist, get the leave type to get the entitled days
        const leaveType = await this.getLeaveType(leaveTypeId);
        if (!leaveType) {
          throw new Error("Leave type not found");
        }
        
        // Create a new balance
        const balanceId = await this.initializeLeaveBalance(
          userId,
          leaveTypeId,
          year,
          leaveType.maxDaysPerYear || 0
        );
        
        balance = await this.getLeaveBalance(userId, leaveTypeId, year);
        
        if (!balance) {
          throw new Error("Failed to create leave balance");
        }
      }
      
      // Update the balance
      const updates: Partial<LeaveBalance> = {
        updatedAt: Date.now()
      };
      
      if (type === "pending") {
        updates.pendingDays = balance.pendingDays + days;
      } else if (type === "used") {
        updates.usedDays = balance.usedDays + days;
        updates.remainingDays = balance.entitledDays - (balance.usedDays + days);
      }
      
      await this.updateLeaveBalance(balance.id, updates);
    } catch (error) {
      console.error("Error updating leave balance for request:", error);
      throw error;
    }
  },
  
  /**
   * Initialize leave balance for a user
   */
  async initializeLeaveBalance(
    userId: string,
    leaveTypeId: string,
    year: number,
    entitledDays: number
  ): Promise<string> {
    try {
      console.log(`Initializing leave balance for user ${userId}, leave type ${leaveTypeId}, year ${year}, entitled days ${entitledDays}`);
      
      // Check if balance already exists
      const existingBalance = await this.getLeaveBalance(userId, leaveTypeId, year);
      if (existingBalance) {
        console.log(`Balance already exists with ID: ${existingBalance.id}`);
        return existingBalance.id;
      }
      
      const leaveBalanceRef = doc(collection(db, LEAVE_BALANCES_COLLECTION));
      const timestamp = Date.now();
      const newLeaveBalance = {
        id: leaveBalanceRef.id,
        userId,
        leaveTypeId,
        year,
        entitledDays,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: entitledDays,
        adjustmentDays: 0,
        carryOverDays: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await setDoc(leaveBalanceRef, newLeaveBalance);
      console.log('Leave balance created with ID:', leaveBalanceRef.id);
      return leaveBalanceRef.id;
    } catch (error) {
      console.error('Error initializing leave balance:', error);
      throw error;
    }
  },
  
  /**
   * Get leave balance for a user
   */
  async getLeaveBalance(
    userId: string,
    leaveTypeId: string,
    year: number
  ): Promise<LeaveBalance | null> {
    try {
      const leaveBalancesRef = collection(db, LEAVE_BALANCES_COLLECTION);
      const q = query(
        leaveBalancesRef,
        where("userId", "==", userId),
        where("leaveTypeId", "==", leaveTypeId),
        where("year", "==", year),
        limit(1)
      );
      
      const leaveBalancesSnapshot = await getDocs(q);
      
      if (leaveBalancesSnapshot.empty) {
        return null;
      }
      
      const docSnapshot = leaveBalancesSnapshot.docs[0];
      const data = docSnapshot.data();
      
      return {
        ...data,
        id: docSnapshot.id,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()
      } as LeaveBalance;
    } catch (error) {
      console.error("Error getting leave balance:", error);
      throw error;
    }
  },
  
  /**
   * Get all leave balances for a user
   */
  async getUserLeaveBalances(userId: string, year?: number): Promise<LeaveBalance[]> {
    try {
      const currentYear = year || new Date().getFullYear();
      console.log(`Getting leave balances for user ${userId} and year ${currentYear}`);
      
      // Get all leave types from the configured leave types
      const leaveTypes = await this.getLeaveTypes();
      console.log(`Found ${leaveTypes.length} leave types`);
      
      if (leaveTypes.length === 0) {
        console.error('No leave types found');
        return [];
      }
      
      // Get existing balances from Firestore
      const leaveBalancesRef = collection(db, LEAVE_BALANCES_COLLECTION);
      const q = query(
        leaveBalancesRef,
        where('userId', '==', userId),
        where('year', '==', currentYear)
      );
      
      const balancesSnapshot = await getDocs(q);
      const existingBalances = balancesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()
        } as LeaveBalance;
      });
      
      console.log(`Found ${existingBalances.length} existing balances for year ${currentYear}`);
      
      // Create a map of existing balances by leave type ID to prevent duplicates
      const balanceMap = new Map<string, LeaveBalance>();
      
      // First, check if the leave type still exists before adding to the map
      existingBalances.forEach(balance => {
        const leaveTypeExists = leaveTypes.some(lt => lt.id === balance.leaveTypeId);
        
        if (leaveTypeExists) {
          // Only add to the map if it's not already there
          if (!balanceMap.has(balance.leaveTypeId)) {
            balanceMap.set(balance.leaveTypeId, balance);
          } else {
            // If we have duplicate balances for the same leave type, we'll delete the duplicate
            console.log(`Found duplicate balance for leave type ${balance.leaveTypeId}, will delete it`);
            this.deleteLeaveBalance(balance.id).catch(err => 
              console.error(`Error deleting duplicate balance ${balance.id}:`, err)
            );
          }
        } else {
          // If the leave type doesn't exist anymore, delete the balance
          console.log(`Leave type ${balance.leaveTypeId} no longer exists, deleting balance`);
          this.deleteLeaveBalance(balance.id).catch(err => 
            console.error(`Error deleting orphaned balance ${balance.id}:`, err)
          );
        }
      });
      
      // Create balances for leave types that don't have one
      const balancesToCreate: Promise<string>[] = [];
      
      for (const leaveType of leaveTypes) {
        if (!balanceMap.has(leaveType.id)) {
          // Get the entitled days from the leave type
          // First check maxDaysPerYear only
          const entitledDays = leaveType.maxDaysPerYear || 0;
          
          console.log(`Creating balance for leave type ${leaveType.name} with ${entitledDays} days`);
          // Create a new balance for this leave type
          balancesToCreate.push(
            this.initializeLeaveBalance(
              userId,
              leaveType.id,
              currentYear,
              entitledDays
            )
          );
        }
      }
      
      // Wait for all balances to be created
      if (balancesToCreate.length > 0) {
        console.log(`Creating ${balancesToCreate.length} new balances`);
        await Promise.all(balancesToCreate);
        
        // Fetch the updated balances
        const updatedBalancesSnapshot = await getDocs(q);
        
        // Clear the map and rebuild it to ensure we have the latest data
        balanceMap.clear();
        
        updatedBalancesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const balance = {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()
          } as LeaveBalance;
          
          // Check if the leave type exists before adding to the map
          const leaveTypeExists = leaveTypes.some(lt => lt.id === balance.leaveTypeId);
          
          if (leaveTypeExists) {
            // Only add to the map if it's not already there
            if (!balanceMap.has(balance.leaveTypeId)) {
              balanceMap.set(balance.leaveTypeId, balance);
            } else {
              // If we have duplicate balances for the same leave type, we'll delete the duplicate
              console.log(`Found duplicate balance for leave type ${balance.leaveTypeId}, will delete it`);
              this.deleteLeaveBalance(balance.id).catch(err => 
                console.error(`Error deleting duplicate balance ${balance.id}:`, err)
              );
            }
          }
        });
        
        // Convert the map values to an array
        const uniqueBalances = Array.from(balanceMap.values());
        console.log(`Returning ${uniqueBalances.length} unique balances`);
        
        return uniqueBalances;
      }
      
      // If no new balances were created, return the existing ones (already de-duped)
      const uniqueBalances = Array.from(balanceMap.values());
      console.log(`Returning ${uniqueBalances.length} unique balances (no new ones created)`);
      return uniqueBalances;
    } catch (error) {
      console.error('Error getting user leave balances:', error);
      throw error;
    }
  },
  
  /**
   * Delete a leave balance
   */
  async deleteLeaveBalance(id: string): Promise<void> {
    try {
      const leaveBalanceRef = doc(db, LEAVE_BALANCES_COLLECTION, id);
      await deleteDoc(leaveBalanceRef);
      console.log(`Deleted leave balance with ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting leave balance ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Ensure default leave types exist
   */
  async ensureDefaultLeaveTypes(): Promise<void> {
    try {
      // Get existing leave types
      const existingTypes = await this.getLeaveTypes();
      
      if (existingTypes.length === 0) {
        console.log('No leave types found, creating defaults...');
        
        // Create default leave types
        const defaultTypes = [
          {
            name: 'Annual Leave',
            description: 'Regular vacation leave',
            color: '#4CAF50',
            requiresApproval: true,
            paid: true,
            maxDaysPerYear: 20,
            carryOver: true,
            carryOverLimit: 5
          },
          {
            name: 'Sick Leave',
            description: 'Leave for medical reasons',
            color: '#F44336',
            requiresApproval: true,
            paid: true,
            maxDaysPerYear: 10,
            carryOver: false
          },
          {
            name: 'Personal Leave',
            description: 'Leave for personal matters',
            color: '#2196F3',
            requiresApproval: true,
            paid: true,
            maxDaysPerYear: 3,
            carryOver: false
          }
        ];
        
        // Create each default type
        for (const type of defaultTypes) {
          await this.createLeaveType(type);
        }
        
        console.log('Default leave types created');
      }
    } catch (error) {
      console.error('Error ensuring default leave types:', error);
    }
  },
  
  /**
   * Update leave balance
   */
  async updateLeaveBalance(id: string, updates: Partial<LeaveBalance>): Promise<void> {
    try {
      const leaveBalanceRef = doc(db, LEAVE_BALANCES_COLLECTION, id);
      
      await updateDoc(leaveBalanceRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error updating leave balance:", error);
      throw error;
    }
  },
  
  /**
   * Process year-end leave balances
   */
  async processYearEndBalances(currentYear: number, newYear: number): Promise<void> {
    try {
      // Get all leave types
      const leaveTypes = await this.getLeaveTypes();
      
      // Get all leave balances for the current year
      const leaveBalancesRef = collection(db, LEAVE_BALANCES_COLLECTION);
      const q = query(leaveBalancesRef, where("year", "==", currentYear));
      const leaveBalancesSnapshot = await getDocs(q);
      
      // Process each balance
      for (const doc of leaveBalancesSnapshot.docs) {
        const balance = doc.data() as LeaveBalance;
        const leaveType = leaveTypes.find(lt => lt.id === balance.leaveTypeId);
        
        if (!leaveType) continue;
        
        // Calculate carry-over days
        let carryOverDays = 0;
        
        if (leaveType.carryOver && balance.remainingDays > 0) {
          carryOverDays = leaveType.carryOverLimit 
            ? Math.min(balance.remainingDays, leaveType.carryOverLimit)
            : balance.remainingDays;
        }
        
        // Create new balance for the next year
        const entitledDays = leaveType.maxDaysPerYear || 0;
        
        await this.initializeLeaveBalance(
          balance.userId,
          balance.leaveTypeId,
          newYear,
          entitledDays + carryOverDays
        );
        
        // Update current year balance to mark as processed
        await updateDoc(doc.ref, {
          yearEndProcessed: true,
          carryOverDays,
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      console.error("Error processing year-end balances:", error);
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
  },

  /**
   * Get leave settings
   */
  async getLeaveSettings(): Promise<any> {
    try {
      const settingsRef = doc(db, 'leaveSettings', 'default');
      const settingsSnapshot = await getDoc(settingsRef);
      
      if (!settingsSnapshot.exists()) {
        // Create default settings if they don't exist
        const defaultSettings = {
          approvalRequired: true,
          allowHalfDay: true,
          maxConsecutiveDays: 14,
          minNoticeWorkDays: 3,
          allowNegativeBalance: false,
          allowWorkFromHome: true,
          workFromHomeApprovalRequired: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        await setDoc(settingsRef, defaultSettings);
        return defaultSettings;
      }
      
      return settingsSnapshot.data();
    } catch (error) {
      console.error('Error getting leave settings:', error);
      throw error;
    }
  },
  
  /**
   * Update leave settings
   */
  async updateLeaveSettings(settings: any): Promise<void> {
    try {
      const settingsRef = doc(db, 'leaveSettings', 'default');
      
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating leave settings:', error);
      throw error;
    }
  },
  
  /**
   * Recalculate all leave balances for a user
   */
  async recalculateLeaveBalances(userId: string, year?: number): Promise<void> {
    try {
      const currentYear = year || new Date().getFullYear();
      
      // Get all leave types
      const leaveTypes = await this.getLeaveTypes();
      
      // For each leave type, recalculate the balance
      for (const leaveType of leaveTypes) {
        if (!leaveType.maxDaysPerYear) continue;
        
        // Get or create the leave balance
        let balance = await this.getLeaveBalance(userId, leaveType.id, currentYear);
        
        if (!balance) {
          // Create a new balance
          const balanceId = await this.initializeLeaveBalance(
            userId,
            leaveType.id,
            currentYear,
            leaveType.maxDaysPerYear
          );
          
          balance = await this.getLeaveBalance(userId, leaveType.id, currentYear);
          
          if (!balance) {
            console.error(`Failed to create leave balance for user ${userId}, leave type ${leaveType.id}, year ${currentYear}`);
            continue;
          }
        }
        
        // Get all leave requests for this user, leave type, and year
        const startOfYear = new Date(currentYear, 0, 1).getTime();
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).getTime();
        
        const leaveRequests = await this.getLeaveRequests({
          userId,
          leaveTypeId: leaveType.id,
          startDate: startOfYear,
          endDate: endOfYear
        });
        
        // Calculate used and pending days
        let usedDays = 0;
        let pendingDays = 0;
        
        for (const request of leaveRequests) {
          if (request.status === "approved") {
            usedDays += request.totalDays;
          } else if (request.status === "pending") {
            pendingDays += request.totalDays;
          }
        }
        
        // Update the balance
        await this.updateLeaveBalance(balance.id, {
          usedDays,
          pendingDays,
          remainingDays: balance.entitledDays - usedDays,
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      console.error("Error recalculating leave balances:", error);
      throw error;
    }
  }
};