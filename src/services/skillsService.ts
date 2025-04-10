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
import { Skill } from "@/types/skills";

const SKILLS_COLLECTION = "skills";

export const skillsService = {
  /**
   * Create a new skill
   */
  async createSkill(skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('skillsService.createSkill called with:', skill);
      
      // Create a reference to a new document with auto-generated ID
      const skillRef = doc(collection(db, SKILLS_COLLECTION));
      const timestamp = Date.now();
      
      // Create a clean skill object without undefined values
      const cleanSkill: any = {
        userId: skill.userId,
        name: skill.name,
        proficiency: skill.proficiency,
        createdAt: timestamp,
        updatedAt: timestamp,
        id: skillRef.id
      };
      
      // Only add optional fields if they have values and are not undefined
      if (skill.yearsOfExperience !== undefined) {
        cleanSkill.yearsOfExperience = skill.yearsOfExperience;
      }
      
      if (skill.lastUsed && skill.lastUsed !== undefined) {
        cleanSkill.lastUsed = skill.lastUsed;
      }
      
      if (skill.description && skill.description !== undefined) {
        cleanSkill.description = skill.description;
      }
      
      if (skill.endorsements !== undefined) {
        cleanSkill.endorsements = skill.endorsements;
      }
      
      console.log('Saving clean skill object:', cleanSkill);
      
      // Save the document to Firestore
      await setDoc(skillRef, cleanSkill);
      return skillRef.id;
    } catch (error) {
      console.error('Error creating skill:', error);
      throw error;
    }
  },
  
  /**
   * Get all skills for a user
   */
  async getUserSkills(userId: string): Promise<Skill[]> {
    try {
      const skillsRef = collection(db, SKILLS_COLLECTION);
      const q = query(
        skillsRef,
        where("userId", "==", userId),
        orderBy("name", "asc")
      );
      
      const skillsSnapshot = await getDocs(q);
      
      return skillsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now()
        } as Skill;
      });
    } catch (error) {
      console.error("Error getting user skills:", error);
      throw error;
    }
  },
  
  /**
   * Get a skill by ID
   */
  async getSkill(id: string): Promise<Skill | null> {
    try {
      const skillRef = doc(db, SKILLS_COLLECTION, id);
      const skillSnapshot = await getDoc(skillRef);
      
      if (!skillSnapshot.exists()) {
        return null;
      }
      
      const data = skillSnapshot.data();
      return {
        ...data,
        id: skillSnapshot.id,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now()
      } as Skill;
    } catch (error) {
      console.error("Error getting skill:", error);
      throw error;
    }
  },
  
  /**
   * Update a skill
   */
  async updateSkill(id: string, skill: Partial<Skill>): Promise<void> {
    try {
      const skillRef = doc(db, SKILLS_COLLECTION, id);
      
      // Create a clean update object without undefined values
      const updateData: any = {
        updatedAt: Date.now()
      };
      
      // Only add fields that are defined
      if (skill.name !== undefined) updateData.name = skill.name;
      if (skill.proficiency !== undefined) updateData.proficiency = skill.proficiency;
      if (skill.yearsOfExperience !== undefined) updateData.yearsOfExperience = skill.yearsOfExperience;
      if (skill.lastUsed !== undefined) updateData.lastUsed = skill.lastUsed;
      if (skill.description !== undefined) updateData.description = skill.description;
      if (skill.endorsements !== undefined) updateData.endorsements = skill.endorsements;
      
      await updateDoc(skillRef, updateData);
    } catch (error) {
      console.error("Error updating skill:", error);
      throw error;
    }
  },
  
  /**
   * Delete a skill
   */
  async deleteSkill(id: string): Promise<void> {
    try {
      const skillRef = doc(db, SKILLS_COLLECTION, id);
      await deleteDoc(skillRef);
    } catch (error) {
      console.error("Error deleting skill:", error);
      throw error;
    }
  }
};