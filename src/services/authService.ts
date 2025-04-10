import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  User as FirebaseUser,
  sendEmailVerification,
  ActionCodeSettings,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { userService } from '@/services/userService';
import { User } from '@/types';
import { collection, getDocs, doc, setDoc, query, limit, getDoc } from 'firebase/firestore';

// Set persistence to LOCAL when the module is imported
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase auth persistence set to LOCAL');
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

export const authService = {
  // Register a new user
  async register(email: string, password: string, userData: Partial<User>): Promise<FirebaseUser> {
    try {
      console.log('Starting registration in authService...');
      
      // Check if this is the first user in the system
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, limit(1));
      const usersSnapshot = await getDocs(usersQuery);
      const isFirstUser = usersSnapshot.empty;
      console.log('Is first user?', isFirstUser);
      
      // Create the user in Firebase Auth with persistence
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created in Firebase Auth:', user.uid);
      
      // Determine the role based on whether this is the first user
      const role = isFirstUser ? 'super_admin' : userData.role || 'user';
      
      // Create user profile in Firestore
      const userProfile: Partial<User> = {
        id: user.uid,
        name: userData.name || '',
        email: user.email || email,
        role: role as User['role'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      // Try direct creation first
      try {
        console.log('Creating user document directly in Firestore...');
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, userProfile);
        console.log('User created directly in Firestore');
      } catch (directError) {
        console.error('Error with direct Firestore creation:', directError);
        
        // Try userService as fallback
        try {
          console.log('Attempting to create user via userService...');
          await userService.createUser(user.uid, userProfile);
          console.log('User created via userService');
        } catch (serviceError) {
          console.error('Error creating user via userService:', serviceError);
          throw serviceError;
        }
      }
      
      // Update display name if provided
      if (userData.name) {
        await updateProfile(user, {
          displayName: userData.name
        });
        console.log('User display name updated');
      }
      
      // Send email verification
      try {
        await sendEmailVerification(user);
        console.log('Verification email sent');
      } catch (verifyError) {
        console.error('Error sending verification email:', verifyError);
        // Continue even if this fails
      }
      
      return user;
    } catch (error) {
      console.error('Registration error in authService:', error);
      throw error;
    }
  },

  // Login user
  async login(email: string, password: string): Promise<FirebaseUser> {
    try {
      console.log(`Attempting to login user: ${email}`);
      
      // Set persistence to LOCAL before signing in
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log(`User logged in successfully: ${user.uid}`);
      
      // Update last active timestamp
      try {
        await userService.updateLastActive(user.uid);
      } catch (error) {
        console.error('Error updating last active timestamp:', error);
        // Continue even if this fails
      }
      
      return user;
    } catch (error: any) {
      console.error(`Login error for ${email}:`, error);
      
      // Check if user exists but credentials are wrong
      try {
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', email));
        if (userDoc.exists()) {
          console.log('User exists in Firestore but login failed');
        }
      } catch (checkError) {
        console.error('Error checking user existence:', checkError);
      }
      
      throw error;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      console.log('User logged out successfully');
      
      // Force redirect to login page after logout
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    try {
      console.log(`Sending password reset email to: ${email}`);
      
      // Define action code settings for better UX
      const actionCodeSettings: ActionCodeSettings = {
        url: window.location.origin + '/auth/login',
        handleCodeInApp: false
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      console.error(`Reset password error for ${email}:`, error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(user: FirebaseUser, displayName: string): Promise<void> {
    try {
      await updateProfile(user, { displayName });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Update user email
  async updateUserEmail(user: FirebaseUser, newEmail: string): Promise<void> {
    try {
      await updateEmail(user, newEmail);
      
      // Update email in Firestore as well
      await userService.updateUserProfile(user.uid, { email: newEmail });
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  },

  // Update user password
  async updateUserPassword(user: FirebaseUser, newPassword: string): Promise<void> {
    try {
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
  
  // Check if a user exists by email
  async checkUserExists(email: string): Promise<boolean> {
    try {
      // Query Firestore for users with this email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(1));
      const querySnapshot = await getDocs(q);
      
      let userExists = false;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email === email) {
          userExists = true;
        }
      });
      
      return userExists;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  },
  
  // Subscribe to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
};