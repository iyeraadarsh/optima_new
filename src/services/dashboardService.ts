import { db } from "@/lib/firebase";
import { DashboardMetric } from "@/types";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getCountFromServer
} from "firebase/firestore";

export const dashboardService = {
  // Get total users count
  async getTotalUsersCount(): Promise<number> {
    const usersRef = collection(db, "users");
    const snapshot = await getCountFromServer(usersRef);
    return snapshot.data().count;
  },

  // Get active employees count
  async getActiveEmployeesCount(): Promise<number> {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef, 
      where("role", "in", ["employee", "manager"]),
      where("lastActive", ">=", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  // Get open tickets count
  async getOpenTicketsCount(): Promise<number> {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("status", "==", "open"));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  // Get documents count
  async getDocumentsCount(): Promise<number> {
    const docsRef = collection(db, "documents");
    const snapshot = await getCountFromServer(docsRef);
    return snapshot.data().count;
  },

  // Get assets count
  async getAssetsCount(): Promise<number> {
    const assetsRef = collection(db, "assets");
    const snapshot = await getCountFromServer(assetsRef);
    return snapshot.data().count;
  },

  // Get active projects count
  async getActiveProjectsCount(): Promise<number> {
    const projectsRef = collection(db, "projects");
    const q = query(projectsRef, where("status", "==", "active"));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  // Get all dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetric[]> {
    try {
      const totalUsers = await this.getTotalUsersCount();
      const activeEmployees = await this.getActiveEmployeesCount();
      const openTickets = await this.getOpenTicketsCount();
      const documents = await this.getDocumentsCount();
      const assets = await this.getAssetsCount();
      const activeProjects = await this.getActiveProjectsCount();

      return [
        {
          id: "1",
          title: "Total Users",
          value: totalUsers,
          change: 12, // This would need to be calculated based on historical data
          trend: "up",
          icon: "Users",
          color: "blue",
        },
        {
          id: "2",
          title: "Active Employees",
          value: activeEmployees,
          change: 5,
          trend: "up",
          icon: "Briefcase",
          color: "green",
        },
        {
          id: "3",
          title: "Open Tickets",
          value: openTickets,
          change: 8,
          trend: "down",
          icon: "TicketCheck",
          color: "amber",
        },
        {
          id: "4",
          title: "Documents",
          value: documents,
          change: 24,
          trend: "up",
          icon: "FileText",
          color: "indigo",
        },
        {
          id: "5",
          title: "Assets",
          value: assets,
          trend: "neutral",
          icon: "Laptop",
          color: "purple",
        },
        {
          id: "6",
          title: "Active Projects",
          value: activeProjects,
          change: 3,
          trend: "up",
          icon: "FolderKanban",
          color: "rose",
        },
      ];
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      throw error;
    }
  },

  // Get recent activities
  async getRecentActivities(limitCount: number = 5): Promise<any[]> {
    const activitiesRef = collection(db, "activities");
    const q = query(activitiesRef, orderBy("timestamp", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get system status
  async getSystemStatus(): Promise<any[]> {
    const statusRef = collection(db, "systemStatus");
    const snapshot = await getDocs(statusRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};