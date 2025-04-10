import { db } from "@/lib/firebase";
import { Department } from "@/types";
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

const DEPARTMENTS_COLLECTION = "departments";

export const departmentService = {
  // Create a new department
  async createDepartment(department: Omit<Department, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const departmentsRef = collection(db, DEPARTMENTS_COLLECTION);
    const newDepartmentRef = doc(departmentsRef);
    
    // Create a clean department object without undefined values
    const departmentData: any = {
      name: department.name,
      managerId: department.managerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id: newDepartmentRef.id
    };
    
    // Only add optional fields if they have values
    if (department.description) {
      departmentData.description = department.description;
    }
    
    if (department.parentDepartmentId) {
      departmentData.parentDepartmentId = department.parentDepartmentId;
    }
    
    await setDoc(newDepartmentRef, departmentData);
    
    return newDepartmentRef.id;
  },

  // Get a department by ID
  async getDepartment(departmentId: string): Promise<Department | null> {
    const departmentRef = doc(db, DEPARTMENTS_COLLECTION, departmentId);
    const departmentSnap = await getDoc(departmentRef);
    
    if (departmentSnap.exists()) {
      return departmentSnap.data() as Department;
    }
    
    return null;
  },

  // Update a department
  async updateDepartment(departmentId: string, departmentData: Partial<Department>): Promise<void> {
    const departmentRef = doc(db, DEPARTMENTS_COLLECTION, departmentId);
    
    // Create a clean update object without undefined values
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    // Only include defined fields in the update
    if (departmentData.name !== undefined) updateData.name = departmentData.name;
    if (departmentData.description !== undefined) updateData.description = departmentData.description;
    if (departmentData.managerId !== undefined) updateData.managerId = departmentData.managerId;
    
    // Handle parentDepartmentId specially - if it's null or empty string, remove it from the document
    if (departmentData.parentDepartmentId !== undefined) {
      if (departmentData.parentDepartmentId) {
        updateData.parentDepartmentId = departmentData.parentDepartmentId;
      } else {
        // Use FieldValue.delete() to remove the field if it's null or empty
        // Since we can't import FieldValue directly here, we'll handle this case differently
        // by not including it in the update, and then doing a separate update to remove it if needed
        const hasEmptyParent = departmentData.parentDepartmentId === null || 
                              departmentData.parentDepartmentId === "";
        
        if (hasEmptyParent) {
          // We'll do the update without the parentDepartmentId first
          await updateDoc(departmentRef, updateData);
          
          // Then remove the parentDepartmentId field if it exists
          const currentDept = await this.getDepartment(departmentId);
          if (currentDept && 'parentDepartmentId' in currentDept) {
            // Use a separate update to remove the field
            await updateDoc(departmentRef, {
              parentDepartmentId: deleteField()
            });
          }
          
          return; // We've already done the update
        }
      }
    }
    
    // Do the normal update with all the fields
    await updateDoc(departmentRef, updateData);
  },

  // Delete a department
  async deleteDepartment(departmentId: string): Promise<void> {
    const departmentRef = doc(db, DEPARTMENTS_COLLECTION, departmentId);
    await deleteDoc(departmentRef);
  },

  // Get all departments
  async getAllDepartments(): Promise<Department[]> {
    const departmentsRef = collection(db, DEPARTMENTS_COLLECTION);
    const departmentsSnap = await getDocs(departmentsRef);
    
    return departmentsSnap.docs.map(doc => doc.data() as Department);
  },

  // Get departments by manager
  async getDepartmentsByManager(managerId: string): Promise<Department[]> {
    const departmentsRef = collection(db, DEPARTMENTS_COLLECTION);
    const q = query(departmentsRef, where("managerId", "==", managerId));
    const departmentsSnap = await getDocs(q);
    
    return departmentsSnap.docs.map(doc => doc.data() as Department);
  },

  // Get department hierarchy
  async getDepartmentHierarchy(): Promise<Department[]> {
    const departments = await this.getAllDepartments();
    
    // Find root departments (no parent)
    const rootDepartments = departments.filter(dept => !dept.parentDepartmentId);
    
    // Build hierarchy
    const buildHierarchy = (parentId: string | null): Department[] => {
      return departments
        .filter(dept => dept.parentDepartmentId === parentId)
        .map(dept => ({
          ...dept,
          children: buildHierarchy(dept.id)
        }));
    };
    
    return rootDepartments.map(dept => ({
      ...dept,
      children: buildHierarchy(dept.id)
    }));
  }
};

// Helper function to delete a field
function deleteField() {
  return {
    __type__: 'deleteField'
  };
}