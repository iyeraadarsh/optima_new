import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Download,
  Home,
  Laptop,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { leaveService } from "@/services/leaveService";
import { useAuth } from "@/contexts/AuthContext";
import { LeaveRequest, LeaveType } from "@/types";

export default function LeaveManagementPage() {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('my-leaves');
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<LeaveRequest[]>([]);
  const [processingAction, setProcessingAction] = useState<{id: string, action: 'approve' | 'reject'} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch leave types first
        const types = await leaveService.getLeaveTypes();
        console.log('Fetched leave types:', types);
        setLeaveTypes(types);
        
        if (currentUser) {
          try {
            // Fetch user's leave requests - make sure we're getting all requests for the current user
            console.log('Fetching leave requests for user:', currentUser.uid);
            const requests = await leaveService.getLeaveRequests({ userId: currentUser.uid });
            console.log('Fetched leave requests:', requests);
            setLeaveRequests(requests);
          } catch (error) {
            console.error('Error fetching leave requests:', error);
          }
          
          try {
            // Fetch user's leave balances
            const currentYear = new Date().getFullYear();
            const balances = await leaveService.getUserLeaveBalances(currentUser.uid, currentYear);
            console.log('Fetched leave balances:', balances);
            
            // Ensure we have no duplicates by using a Map with leaveTypeId as key
            const balanceMap = new Map();
            balances.forEach(balance => {
              if (!balanceMap.has(balance.leaveTypeId)) {
                balanceMap.set(balance.leaveTypeId, balance);
              }
            });
            
            // Convert map back to array
            const uniqueBalances = Array.from(balanceMap.values());
            setLeaveBalances(uniqueBalances);
          } catch (error) {
            console.error('Error fetching leave balances:', error);
          }
          
          // Fetch pending approvals if user is a manager
          if (userProfile?.role === 'manager' || userProfile?.role === 'admin' || 
              userProfile?.role === 'super_admin' || userProfile?.role === 'department_manager') {
            try {
              const approvals = await leaveService.getLeaveRequests({ status: 'pending' });
              console.log('Fetched pending approvals:', approvals);
              setPendingApprovals(approvals);
            } catch (error) {
              console.error('Error fetching pending approvals:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching leave data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, userProfile]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!currentUser || !userProfile) return;
    
    try {
      setProcessingAction({ id: requestId, action: 'approve' });
      console.log(`Attempting to approve request ${requestId} by user ${currentUser.uid}`);
      
      // Approve the leave request
      await leaveService.approveLeaveRequest(requestId, currentUser.uid);
      
      // Update the local state
      setPendingApprovals(prevApprovals => 
        prevApprovals.filter(approval => approval.id !== requestId)
      );
      
      // If this is the current user's request, update leaveRequests as well
      setLeaveRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === requestId 
            ? { ...request, status: 'approved', approverId: currentUser.uid, approvedAt: Date.now() } 
            : request
        )
      );
      
      // Refresh leave balances
      try {
        const currentYear = new Date().getFullYear();
        const balances = await leaveService.getUserLeaveBalances(currentUser.uid, currentYear);
        
        // Ensure we have no duplicates
        const balanceMap = new Map();
        balances.forEach(balance => {
          if (!balanceMap.has(balance.leaveTypeId)) {
            balanceMap.set(balance.leaveTypeId, balance);
          }
        });
        
        // Convert map back to array
        const uniqueBalances = Array.from(balanceMap.values());
        setLeaveBalances(uniqueBalances);
      } catch (error) {
        console.error('Error refreshing leave balances:', error);
      }
      
      // Show success message
      alert('Leave request approved successfully!');
      
    } catch (error) {
      console.error('Error approving leave request:', error);
      alert('Failed to approve leave request. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!currentUser || !userProfile) return;
    
    try {
      setProcessingAction({ id: requestId, action: 'reject' });
      
      // Get the request details first to ensure it exists
      const request = pendingApprovals.find(req => req.id === requestId);
      if (!request) {
        console.error('Request not found in pendingApprovals');
        throw new Error('Request not found');
      }
      
      // For simplicity, we'll use a basic prompt for rejection reason
      const reason = prompt('Please provide a reason for rejecting this request:');
      if (reason === null) {
        // User cancelled the prompt
        setProcessingAction(null);
        return;
      }
      
      // Reject the leave request
      await leaveService.rejectLeaveRequest(requestId, currentUser.uid, reason);
      
      // Update the local state
      setPendingApprovals(prevApprovals => 
        prevApprovals.filter(approval => approval.id !== requestId)
      );
      
      // If this is the current user's request, update leaveRequests as well
      setLeaveRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === requestId 
            ? { 
                ...request, 
                status: 'rejected', 
                approverId: currentUser.uid, 
                rejectedAt: Date.now(),
                rejectionReason: reason 
              } 
            : request
        )
      );
      
      // Show success message
      alert('Leave request rejected successfully!');
      
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      alert('Failed to reject leave request. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <MainLayout>
      <Head>
        <title>Leave Management | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-3xl font-bold'>Leave Management</h1>
            <p className='text-gray-500 dark:text-gray-400'>
              Manage leave requests, balances, and approvals
            </p>
          </div>
          <div className='flex gap-2'>
            <Button asChild variant='outline'>
              <Link href='/hr'>
                Back to HR
              </Link>
            </Button>
            <Button asChild variant='outline'>
              <Link href='/hr/leave/work-from-home'>
                <Laptop className='h-4 w-4 mr-2' />
                Work From Home
              </Link>
            </Button>
            <Button asChild>
              <Link href='/hr/leave/request'>
                <Plus className='h-4 w-4 mr-2' />
                New Leave Request
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue='my-leaves' onValueChange={setActiveTab} className='w-full'>
          <TabsList>
            <TabsTrigger value='my-leaves'>My Leaves</TabsTrigger>
            <TabsTrigger value='leave-balances'>Leave Balances</TabsTrigger>
            {(userProfile?.role === 'manager' || userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'department_manager') && (
              <TabsTrigger value='pending-approvals'>Pending Approvals</TabsTrigger>
            )}
            <TabsTrigger value='leave-calendar'>Leave Calendar</TabsTrigger>
            <TabsTrigger value='work-from-home'>Work From Home</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-leaves" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Leave Requests</h2>
              <Button asChild variant="outline">
                <Link href="/hr/leave/history">
                  View Full History
                </Link>
              </Button>
            </div>
            
            <Card>
              <CardContent className="py-6">
                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Loading leave requests...</p>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      You don't have any leave requests yet
                    </p>
                    <Button asChild>
                      <Link href="/hr/leave/request">
                        <Plus className="h-4 w-4 mr-2" />
                        New Leave Request
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveRequests.slice(0, 5).map((request) => {
                      const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
                      
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
                              <div className="font-medium">{leaveType?.name || "Leave"}</div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(request.startDate), "PPP")} - {format(new Date(request.endDate), "PPP")}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.totalDays} {request.totalDays === 1 ? "day" : "days"}
                              </div>
                              {request.reason && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Reason: {request.reason}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(request.status)}
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/hr/leave/${request.id}`}>
                                Details <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {leaveRequests.length > 5 && (
                      <div className="text-center mt-4">
                        <Button asChild variant="outline">
                          <Link href="/hr/leave/history">
                            View All Requests
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leave-balances" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Leave Balances</h2>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            
            <Card>
              <CardContent className="py-6">
                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Loading leave balances...</p>
                  </div>
                ) : leaveBalances.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">
                      No leave balances found for the current year
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3">Leave Type</th>
                          <th className="text-center py-3">Entitled</th>
                          <th className="text-center py-3">Used</th>
                          <th className="text-center py-3">Pending</th>
                          <th className="text-center py-3">Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveBalances.map((balance) => {
                          const leaveType = leaveTypes.find(lt => lt.id === balance.leaveTypeId);
                          
                          return (
                            <tr key={balance.id} className="border-b">
                              <td className="py-3">
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-2" 
                                    style={{ backgroundColor: leaveType?.color || "#888" }}
                                  />
                                  {leaveType?.name || "Unknown"}
                                </div>
                              </td>
                              <td className="text-center py-3">{balance.entitledDays}</td>
                              <td className="text-center py-3">{balance.usedDays}</td>
                              <td className="text-center py-3">{balance.pendingDays}</td>
                              <td className="text-center py-3 font-medium">{balance.remainingDays}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending-approvals" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pending Approvals</h2>
              <Button asChild variant="outline">
                <Link href="/hr/leave/approvals">
                  View All Approvals
                </Link>
              </Button>
            </div>
            
            <Card>
              <CardContent className="py-6">
                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Loading pending approvals...</p>
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">
                      No pending leave requests to approve
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.slice(0, 5).map((request) => {
                      const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
                      
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
                              <div className="font-medium">{request.userName || "Employee"}</div>
                              <div className="text-sm">{leaveType?.name || "Leave"}</div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(request.startDate), "PPP")} - {format(new Date(request.endDate), "PPP")}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.totalDays} {request.totalDays === 1 ? "day" : "days"}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleRejectRequest(request.id)}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveRequest(request.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/hr/leave/${request.id}`}>
                                Details <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {pendingApprovals.length > 5 && (
                      <div className="text-center mt-4">
                        <Button asChild variant="outline">
                          <Link href="/hr/leave/approvals">
                            View All Pending Approvals
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leave-calendar" className="space-y-4 mt-4">
            <h2 className="text-xl font-semibold">Leave Calendar</h2>
            <Card>
              <CardContent className="py-6">
                <div className="text-center mb-6">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    View the team's leave schedule in a calendar format
                  </p>
                  <Button asChild>
                    <Link href="/hr/leave/calendar">
                      Open Full Calendar View
                    </Link>
                  </Button>
                </div>
                
                <div className="border rounded-md p-4 mt-6">
                  <h3 className="font-medium mb-4">Upcoming Leave (Next 30 Days)</h3>
                  {loading ? (
                    <p className="text-center py-4">Loading upcoming leave...</p>
                  ) : (
                    <div className="space-y-2">
                      {leaveRequests
                        .filter(request => 
                          request.status === "approved" && 
                          request.startDate >= Date.now() && 
                          request.startDate <= Date.now() + 30 * 24 * 60 * 60 * 1000
                        )
                        .sort((a, b) => a.startDate - b.startDate)
                        .slice(0, 5)
                        .map(request => {
                          const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
                          const userName = request.userName || "Employee";
                          
                          return (
                            <div 
                              key={request.id} 
                              className="flex items-center justify-between p-2 border-l-4 rounded bg-gray-50 dark:bg-gray-800"
                              style={{ borderLeftColor: leaveType?.color || "#888" }}
                            >
                              <div>
                                <div className="font-medium">{userName}</div>
                                <div className="text-sm text-gray-500">
                                  {format(new Date(request.startDate), "MMM d")} - {format(new Date(request.endDate), "MMM d, yyyy")}
                                </div>
                              </div>
                              <div>
                                <span 
                                  className="text-sm px-2 py-1 rounded-full"
                                  style={{ 
                                    backgroundColor: `${leaveType?.color}20`, 
                                    color: leaveType?.color 
                                  }}
                                >
                                  {leaveType?.name}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {leaveRequests.filter(request => 
                          request.status === "approved" && 
                          request.startDate >= Date.now() && 
                          request.startDate <= Date.now() + 30 * 24 * 60 * 60 * 1000
                        ).length === 0 && (
                          <p className="text-center py-4 text-gray-500">No upcoming leave in the next 30 days</p>
                        )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work-from-home" className="space-y-4 mt-4">
            <div className='flex justify-between items-center'>
              <h2 className='text-xl font-semibold'>Work From Home</h2>
              <Button asChild>
                <Link href='/hr/leave/work-from-home'>
                  <Laptop className='h-4 w-4 mr-2' />
                  Go to Work From Home Dashboard
                </Link>
              </Button>
            </div>
            
            <Card>
              <CardContent className='py-6'>
                <div className='text-center py-6'>
                  <Laptop className='h-16 w-16 mx-auto text-blue-500 mb-4' />
                  <h3 className='text-lg font-medium mb-2'>Work From Home Management</h3>
                  <p className='text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto'>
                    Request and manage work from home arrangements with our dedicated WFH module.
                  </p>
                  <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                    <Button asChild>
                      <Link href='/hr/leave/work-from-home/request'>
                        <Plus className='h-4 w-4 mr-2' />
                        New WFH Request
                      </Link>
                    </Button>
                    <Button asChild variant='outline'>
                      <Link href='/hr/leave/work-from-home'>
                        View My WFH Requests
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <div className='border-t pt-6 mt-6'>
                  <h4 className='font-medium mb-4'>WFH Features:</h4>
                  <ul className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <li className='flex items-start'>
                      <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0' />
                      <span>Submit work from home requests</span>
                    </li>
                    <li className='flex items-start'>
                      <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0' />
                      <span>Track request status</span>
                    </li>
                    <li className='flex items-start'>
                      <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0' />
                      <span>Approve/reject requests (managers)</span>
                    </li>
                    <li className='flex items-start'>
                      <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0' />
                      <span>View detailed WFH history</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}