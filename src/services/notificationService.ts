import { db } from "@/lib/firebase";
import { Notification } from "@/types";
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
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch
} from "firebase/firestore";

const NOTIFICATIONS_COLLECTION = "notifications";

export const notificationService = {
  // Create a new notification
  async createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<string> {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const newNotificationRef = doc(notificationsRef);
    
    const newNotification = {
      ...notification,
      id: newNotificationRef.id,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    await setDoc(newNotificationRef, newNotification);
    
    return newNotificationRef.id;
  },

  // Get a notification by ID
  async getNotification(notificationId: string): Promise<Notification | null> {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const notificationSnap = await getDoc(notificationRef);
    
    if (notificationSnap.exists()) {
      return notificationSnap.data() as Notification;
    }
    
    return null;
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  },

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
  },

  // Get all notifications for a user
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const notificationsSnap = await getDocs(q);
    
    return notificationsSnap.docs.map(doc => doc.data() as Notification);
  },

  // Get unread notifications count for a user
  async getUnreadCount(userId: string): Promise<number> {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef, 
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const notificationsSnap = await getDocs(q);
    
    return notificationsSnap.size;
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef, 
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const notificationsSnap = await getDocs(q);
    
    const batch = writeBatch(db);
    
    notificationsSnap.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
  }
};