import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  Download, 
  ChevronRight,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { leaveService } from "@/services/leaveService";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { LeaveRequest, LeaveType, User } from "@/types";

export default function LeaveApprovalsPage() {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  // Check if user has permission to view this page
  const canApprove = userProfile && (
    userProfile.role === 'manager' || 
    userProfile.role === 'department_manager' || 
    userProfile.role === 'admin' || 
    userProfile.role === 'super_admin'
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !canApprove) return;
      
      try {
        setLoading(true);
        
        // Fetch leave types
        const types = await leaveService.getLeaveTypes();
        setLeaveTypes(types);
        
        // Fetch all users
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
        
        // Extract unique departments
        const depts = Array.from(new Set(allUsers.map(u => u.department).filter(Boolean)));
        setDepartments(depts as string[]);
        
        // Fetch leave requests based on status filter
        const requests = await leaveService.getLeaveRequests({ status: statusFilter });
        
        // Enrich leave requests with user data
        const enrichedRequests = await Promise.all(
          requests.map(async (request) => {
            const user = allUsers.find(u => u.id === request.userId);
            return {
              ...request,
              userName: user?.name || "Unknown",
              userDepartment: user?.department || "Unknown"
            };
          })
        );
        
        setLeaveRequests(enrichedRequests);
        setFilteredRequests(enrichedRequests);
      } catch (error) {
        console.error("Error fetching leave approvals:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, canApprove, statusFilter]);

  useEffect(() => {
    // Apply filters
    let filtered = [...leaveRequests];
    
    // Filter by leave type
    if (typeFilter !== "all") {
      filtered = filtered.filter(request => request.leaveTypeId === typeFilter);
    }
    
    // Filter by department
    if (departmentFilter !== "all") {
      filtered = filtered.filter(request => {
        const user = users.find(u => u.id === request.userId);
        return user?.department === departmentFilter;
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request => {
        const user = users.find(u => u.id === request.userId);
        const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
        return (
          user?.name.toLowerCase().includes(term) ||
          user?.department?.toLowerCase().includes(term) ||
          leaveType?.name.toLowerCase().includes(term) ||
          request.reason?.toLowerCase().includes(term)
        );
      });
    }
    
    setFilteredRequests(filtered);
  }, [leaveRequests, typeFilter, departmentFilter, searchTerm, users, leaveTypes]);

  const handleApprove = async (leaveRequestId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessing(leaveRequestId);
      
      // Get the leave request details
      const leaveRequest = await leaveService.getLeaveRequest(leaveRequestId);
      
      if (!leaveRequest) {
        throw new Error('Leave request not found');
      }
      
      // Approve the leave request
      await leaveService.approveLeaveRequest(leaveRequestId, currentUser.uid);
      
      // Update the leave balance
      const currentYear = new Date(leaveRequest.startDate).getFullYear();
      const userBalances = await leaveService.getUserLeaveBalances(leaveRequest.userId, currentYear);
      const balance = userBalances.find(b => b.leaveTypeId === leaveRequest.leaveTypeId);
      
      if (balance) {
        // Move days from pending to used
        await leaveService.updateLeaveBalance(balance.id, {
          pendingDays: Math.max(0, balance.pendingDays - leaveRequest.totalDays),
          usedDays: balance.usedDays + leaveRequest.totalDays,
          updatedAt: Date.now()
        });
      }
      
      // Refresh the leave requests
      const updatedRequests = leaveRequests.filter(req => req.id !== leaveRequestId);
      setLeaveRequests(updatedRequests);
      setFilteredRequests(updatedRequests);
      
      alert("Leave request approved successfully");
    } catch (error) {
      console.error("Error approving leave request:", error);
      alert("Error approving leave request");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (leaveRequestId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessing(leaveRequestId);
      
      // Get the leave request details
      const leaveRequest = await leaveService.getLeaveRequest(leaveRequestId);
      
      if (!leaveRequest) {
        throw new Error('Leave request not found');
      }
      
      // Ask for rejection reason
      const reason = prompt("Please provide a reason for rejecting this leave request:");
      if (reason === null) {
        setProcessing(null);
        return; // User cancelled
      }
      
      // Reject the leave request
      await leaveService.rejectLeaveRequest(leaveRequestId, currentUser.uid, reason);
      
      // Update the leave balance
      const currentYear = new Date(leaveRequest.startDate).getFullYear();
      const userBalances = await leaveService.getUserLeaveBalances(leaveRequest.userId, currentYear);
      const balance = userBalances.find(b => b.leaveTypeId === leaveRequest.leaveTypeId);
      
      if (balance) {
        // Remove days from pending
        await leaveService.updateLeaveBalance(balance.id, {
          pendingDays: Math.max(0, balance.pendingDays - leaveRequest.totalDays),
          updatedAt: Date.now()
        });
      }
      
      // Refresh the leave requests
      const updatedRequests = leaveRequests.filter(req => req.id !== leaveRequestId);
      setLeaveRequests(updatedRequests);
      setFilteredRequests(updatedRequests);
      
      alert("Leave request rejected successfully");
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      alert("Error rejecting leave request");
    } finally {
      setProcessing(null);
    }
  };

  const handleExport = () => {
    // In a real app, this would generate a CSV or PDF file
    alert("Export functionality would generate a report of leave requests");
  };

  // Redirect if user doesn't have permission
  if (!canApprove) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-gray-500 mb-4">You don't have permission to view this page.</p>
              <Button asChild>
                <Link href="/hr/leave">
                  Back to Leave Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Head>
        <title>Leave Approvals | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button asChild variant="outline" className="mb-2">
              <Link href="/hr/leave">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leave Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Leave Approvals</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage and approve leave requests from your team
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter leave requests by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search by name or reason..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Leave Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Department</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>
              Showing {filteredRequests.length} leave requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10">
                <div className="h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading leave requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No leave requests found matching your filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
                  const user = users.find(u => u.id === request.userId);
                  
                  return (
                    <div 
                      key={request.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start space-x-4">
                        <div 
                          className="w-2 h-full min-h-[50px] rounded-full" 
                          style={{ backgroundColor: leaveType?.color || "#888" }}
                        />
                        <div>
                          <div className="font-medium">{user?.name || "Unknown"}</div>
                          <div className="text-sm">{user?.department || "Unknown"}</div>
                          <div className="text-sm">
                            {leaveType?.name || "Leave"}: {format(new Date(request.startDate), "MMM d")} - {format(new Date(request.endDate), "MMM d, yyyy")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.totalDays} {request.totalDays === 1 ? "day" : "days"}
                          </div>
                          {request.reason && (
                            <div className="text-sm text-gray-500 mt-1">
                              Reason: {request.reason.length > 50 
                                ? `${request.reason.substring(0, 50)}...` 
                                : request.reason}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {statusFilter === 'pending' ? (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => handleReject(request.id)}
                              disabled={processing === request.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(request.id)}
                              disabled={processing === request.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        ) : (
                          <Badge className={
                            request.status === 'approved' 
                              ? 'bg-green-500' 
                              : request.status === 'rejected' 
                                ? 'bg-red-500' 
                                : 'bg-gray-500'
                          }>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        )}
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/hr/leave/${request.id}`}>
                            Details <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}