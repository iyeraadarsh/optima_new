
import { db } from "@/lib/firebase";
import { Position } from "@/types";
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

const POSITIONS_COLLECTION = "positions";

export const positionService = {
  // Create a new position
  async createPosition(position: Omit<Position, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const positionsRef = collection(db, POSITIONS_COLLECTION);
    const newPositionRef = doc(positionsRef);
    
    const newPosition = {
      ...position,
      id: newPositionRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(newPositionRef, newPosition);
    
    return newPositionRef.id;
  },

  // Get a position by ID
  async getPosition(positionId: string): Promise<Position | null> {
    const positionRef = doc(db, POSITIONS_COLLECTION, positionId);
    const positionSnap = await getDoc(positionRef);
    
    if (positionSnap.exists()) {
      return positionSnap.data() as Position;
    }
    
    return null;
  },

  // Update a position
  async updatePosition(positionId: string, positionData: Partial<Position>): Promise<void> {
    const positionRef = doc(db, POSITIONS_COLLECTION, positionId);
    await updateDoc(positionRef, {
      ...positionData,
      updatedAt: new Date().toISOString()
    });
  },

  // Delete a position
  async deletePosition(positionId: string): Promise<void> {
    const positionRef = doc(db, POSITIONS_COLLECTION, positionId);
    await deleteDoc(positionRef);
  },

  // Get all positions
  async getAllPositions(): Promise<Position[]> {
    const positionsRef = collection(db, POSITIONS_COLLECTION);
    const q = query(positionsRef, orderBy("name", "asc"));
    const positionsSnap = await getDocs(q);
    
    return positionsSnap.docs.map(doc => doc.data() as Position);
  },

  // Get active positions
  async getActivePositions(): Promise<Position[]> {
    const positionsRef = collection(db, POSITIONS_COLLECTION);
    const q = query(
      positionsRef, 
      where("isActive", "==", true),
      orderBy("name", "asc")
    );
    const positionsSnap = await getDocs(q);
    
    return positionsSnap.docs.map(doc => doc.data() as Position);
  },

  // Get positions by department
  async getPositionsByDepartment(departmentId: string): Promise<Position[]> {
    const positionsRef = collection(db, POSITIONS_COLLECTION);
    const q = query(
      positionsRef, 
      where("departmentId", "==", departmentId),
      orderBy("name", "asc")
    );
    const positionsSnap = await getDocs(q);
    
    return positionsSnap.docs.map(doc => doc.data() as Position);
  },

  // Toggle position status
  async togglePositionStatus(positionId: string, isActive: boolean): Promise<void> {
    const positionRef = doc(db, POSITIONS_COLLECTION, positionId);
    await updateDoc(positionRef, {
      isActive,
      updatedAt: new Date().toISOString()
    });
  }
};
