import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Plus, 
  Home, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { workFromHomeService } from "@/services/workFromHomeService";
import { useAuth } from "@/contexts/AuthContext";
import { WorkFromHomeRequest } from "@/types";
import { userService } from "@/services/userService";

export default function WorkFromHomePage() {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('my-requests');
  const [loading, setLoading] = useState(true);
  const [wfhRequests, setWfhRequests] = useState<WorkFromHomeRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<WorkFromHomeRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all users for displaying names
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
        
        if (currentUser) {
          try {
            // Fetch user's WFH requests
            const requests = await workFromHomeService.getWorkFromHomeRequests({ userId: currentUser.uid });
            console.log('Fetched WFH requests:', requests);
            setWfhRequests(requests);
          } catch (error) {
            console.error('Error fetching WFH requests:', error);
          }
          
          // Fetch pending approvals if user is a manager
          if (userProfile?.role === 'manager' || userProfile?.role === 'admin' || 
              userProfile?.role === 'super_admin' || userProfile?.role === 'department_manager') {
            try {
              const approvals = await workFromHomeService.getWorkFromHomeRequests({ status: 'pending' });
              console.log('Fetched pending WFH approvals:', approvals);
              setPendingApprovals(approvals);
            } catch (error) {
              console.error('Error fetching pending WFH approvals:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching WFH data:', error);
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

  const handleApproveRequest = async (request: WorkFromHomeRequest) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Update request status
      await workFromHomeService.approveWorkFromHomeRequest(request.id, currentUser.uid);
      
      // Update UI
      const updatedRequests = pendingApprovals.map(req => {
        if (req.id === request.id) {
          return {
            ...req,
            status: 'approved' as 'pending' | 'approved' | 'rejected' | 'cancelled',
            approverId: currentUser.uid,
            approvedAt: Date.now()
          };
        }
        return req;
      });
      
      setPendingApprovals(updatedRequests as WorkFromHomeRequest[]);
      
      // Show success message
      alert('Request approved successfully!');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (request: WorkFromHomeRequest) => {
    if (!currentUser) return;
    
    // Prompt for rejection reason
    const reason = prompt('Please provide a reason for rejecting this request:');
    if (!reason) return;
    
    try {
      setLoading(true);
      
      // Update request status
      await workFromHomeService.rejectWorkFromHomeRequest(request.id, currentUser.uid, reason);
      
      // Update UI
      const updatedRequests = pendingApprovals.map(req => {
        if (req.id === request.id) {
          return {
            ...req,
            status: 'rejected' as 'pending' | 'approved' | 'rejected' | 'cancelled',
            approverId: currentUser.uid,
            rejectedAt: Date.now(),
            rejectionReason: reason
          };
        }
        return req;
      });
      
      setPendingApprovals(updatedRequests as WorkFromHomeRequest[]);
      
      // Show success message
      alert('Request rejected successfully!');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Head>
        <title>Work From Home | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Work From Home</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage work from home requests and approvals
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/hr/leave">
                Back to Leave Management
              </Link>
            </Button>
            <Button asChild>
              <Link href="/hr/leave/work-from-home/request">
                <Plus className="h-4 w-4 mr-2" />
                New WFH Request
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="my-requests" onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value='my-requests'>My Requests</TabsTrigger>
            {(userProfile?.role === 'manager' || userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'department_manager') && (
              <TabsTrigger value='pending-approvals'>Pending Approvals</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="my-requests" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Work From Home Requests</h2>
            </div>
            
            <Card>
              <CardContent className="py-6">
                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Loading work from home requests...</p>
                  </div>
                ) : wfhRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      You don't have any work from home requests yet
                    </p>
                    <Button asChild>
                      <Link href="/hr/leave/work-from-home/request">
                        <Plus className="h-4 w-4 mr-2" />
                        New Work From Home Request
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wfhRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start space-x-4">
                          <div 
                            className="w-2 h-full min-h-[50px] rounded-full bg-blue-500"
                          />
                          <div>
                            <div className="font-medium">Work From Home</div>
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
                            <Link href={`/hr/leave/work-from-home/${request.id}`}>
                              Details <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending-approvals" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pending Work From Home Approvals</h2>
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
                      No pending work from home requests to approve
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((request) => {
                      const user = users.find(u => u.id === request.userId);
                      
                      return (
                        <div 
                          key={request.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-start space-x-4">
                            <div 
                              className="w-2 h-full min-h-[50px] rounded-full bg-blue-500"
                            />
                            <div>
                              <div className="font-medium">{user?.name || request.userName || "Employee"}</div>
                              <div className="text-sm">Work From Home</div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(request.startDate), "PPP")} - {format(new Date(request.endDate), "PPP")}
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
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-500 border-red-200 hover:bg-red-50"
                                onClick={() => handleRejectRequest(request)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveRequest(request)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/hr/leave/work-from-home/${request.id}`}>
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}