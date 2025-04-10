
import { NextApiRequest, NextApiResponse } from 'next';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { adminAuth, adminStorage } from '@/lib/firebase-admin';
import { ref, listAll, deleteObject } from 'firebase/storage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get Firebase Admin Auth instance
    const auth = adminAuth();

    // 1. Delete all documents from Firestore collections
    const collections = [
      'users',
      'userPermissions',
      'roles',
      'permissions',
      'departments',
      'positions',
      'activities',
      'notifications',
      'moduleConfig',
      'systemConfig',
      'workflowConfig',
      'securityConfig',
      'roleModuleAccess',
      'userModuleAccess'
    ];
    
    // Delete all documents from each collection
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      // Delete each document
      const deletePromises = snapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      console.log(`Cleared collection: ${collectionName}`);
    }

    // 2. Delete all Firebase Auth users
    try {
      // List all users
      const listUsersResult = await auth.listUsers();
      
      // Delete each user
      const deletePromises = listUsersResult.users.map(user => 
        auth.deleteUser(user.uid)
      );
      
      await Promise.all(deletePromises);
      console.log('Successfully deleted all Firebase Auth users');
    } catch (error) {
      console.error('Error deleting Firebase Auth users:', error);
      return res.status(500).json({ 
        message: 'Error deleting Firebase Auth users', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 3. Delete all files from Firebase Storage
    try {
      const storageRef = ref(storage);
      const listResult = await listAll(storageRef);
      
      // Delete all files
      const deleteFilePromises = listResult.items.map(item => 
        deleteObject(item)
      );
      
      // Delete all files in subdirectories
      const deleteSubdirPromises = listResult.prefixes.map(async prefix => {
        const subListResult = await listAll(prefix);
        return Promise.all(subListResult.items.map(item => deleteObject(item)));
      });
      
      await Promise.all([...deleteFilePromises, ...deleteSubdirPromises]);
      console.log('Successfully deleted all storage files');
    } catch (error) {
      console.error('Error deleting storage files:', error);
      return res.status(500).json({ 
        message: 'Error deleting storage files', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return res.status(200).json({ 
      message: 'All data cleared successfully',
      collectionsCleared: collections,
      authCleared: true,
      storageCleared: true
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return res.status(500).json({ 
      message: 'Error clearing data', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
