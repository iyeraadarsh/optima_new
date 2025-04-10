import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash, 
  AlertTriangle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MainLayout } from "@/components/layout/MainLayout";
import { leaveService } from "@/services/leaveService";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { LeaveRequest, LeaveType, User } from "@/types";
import Link from "next/link";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function LeaveRequestDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userProfile } = useAuth();
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType | null>(null);
  const [requestUser, setRequestUser] = useState<User | null>(null);
  const [approver, setApprover] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Check if current user is the owner of the request
  const isOwner = leaveRequest && currentUser && leaveRequest.userId === currentUser.uid;
  
  // Check if current user can approve/reject the request
  const canApprove = userProfile && (
    userProfile.role === 'manager' || 
    userProfile.role === 'department_manager' || 
    userProfile.role === 'admin' || 
    userProfile.role === 'super_admin'
  );
  
  // Check if the request is in a state that can be edited or deleted
  const canEdit = isOwner && leaveRequest && leaveRequest.status === 'pending';
  const canDelete = isOwner && leaveRequest && (leaveRequest.status === 'pending' || leaveRequest.status === 'rejected');
  
  // Check if the request can be approved or rejected
  const canApproveReject = canApprove && leaveRequest && leaveRequest.status === 'pending';

  // Helper function to safely format dates
  const formatDate = (timestamp: number | undefined | null, formatString: string = "PPP") => {
    if (!timestamp) return "Unknown";
    
    try {
      // Make sure timestamp is a valid number
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.error("Invalid date timestamp:", timestamp);
        return "Unknown";
      }
      return format(date, formatString);
    } catch (error) {
      console.error("Invalid date format:", error, timestamp);
      return "Unknown";
    }
  };

  useEffect(() => {
    const fetchLeaveRequest = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch leave request
        const request = await leaveService.getLeaveRequest(id as string);
        
        if (request) {
          setLeaveRequest(request);
          
          // Fetch leave type
          const type = await leaveService.getLeaveType(request.leaveTypeId);
          setLeaveType(type);
          
          // Fetch user who made the request
          const user = await userService.getUserProfile(request.userId);
          setRequestUser(user);
          
          // Fetch approver if exists
          if (request.approverId) {
            const approverUser = await userService.getUserProfile(request.approverId);
            setApprover(approverUser);
          }
        } else {
          alert("Leave request not found");
          router.push("/hr/leave");
        }
      } catch (error) {
        console.error("Error fetching leave request:", error);
        alert("Error loading leave request details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaveRequest();
  }, [id, router]);

  const handleApprove = async () => {
    if (!leaveRequest || !currentUser) return;
    
    try {
      setProcessing(true);
      
      // Approve the leave request
      await leaveService.approveLeaveRequest(leaveRequest.id, currentUser.uid);
      
      // Update the leave balance
      // Get the user's leave balance for this leave type
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
      
      // Refresh the leave request
      const updatedRequest = await leaveService.getLeaveRequest(leaveRequest.id);
      setLeaveRequest(updatedRequest);
      
      alert("Leave request approved successfully");
    } catch (error) {
      console.error("Error approving leave request:", error);
      alert("Error approving leave request");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!leaveRequest || !currentUser || !rejectionReason) return;
    
    try {
      setProcessing(true);
      
      // Reject the leave request
      await leaveService.rejectLeaveRequest(leaveRequest.id, currentUser.uid, rejectionReason);
      
      // Update the leave balance
      // Get the user's leave balance for this leave type
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
      
      // Refresh the leave request
      const updatedRequest = await leaveService.getLeaveRequest(leaveRequest.id);
      setLeaveRequest(updatedRequest);
      
      // Close the dialog
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      
      alert("Leave request rejected successfully");
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      alert("Error rejecting leave request");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!leaveRequest) return;
    
    try {
      setProcessing(true);
      
      // If the request is pending, update the leave balance
      if (leaveRequest.status === 'pending') {
        // Get the user's leave balance for this leave type
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
      }
      
      // Delete the leave request
      await leaveService.deleteLeaveRequest(leaveRequest.id);
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
      
      // Redirect back to leave dashboard
      router.push("/hr/leave");
      
      alert("Leave request deleted successfully");
    } catch (error) {
      console.error("Error deleting leave request:", error);
      alert("Error deleting leave request");
    } finally {
      setProcessing(false);
    }
  };

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

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading leave request details...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Head>
        <title>Leave Request Details | HR Module</title>
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
            <h1 className="text-3xl font-bold">Leave Request Details</h1>
            <p className="text-gray-500 dark:text-gray-400">
              View and manage leave request information
            </p>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button asChild>
                <Link href={`/hr/leave/edit/${leaveRequest?.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Request
                </Link>
              </Button>
            )}
            
            {canDelete && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Request
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the leave request.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={processing}
                    >
                      {processing ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Leave Request</CardTitle>
                    <CardDescription>
                      Submitted by {requestUser?.name || "Unknown"} on {
                        leaveRequest?.createdAt 
                          ? formatDate(leaveRequest.createdAt, "PPP 'at' p") 
                          : "Unknown date"
                      }
                    </CardDescription>
                  </div>
                  <div>
                    {leaveRequest && getStatusBadge(leaveRequest.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Leave Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Leave Type:</span>
                        <span className="font-medium flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: leaveType?.color || "#888" }}
                          />
                          {leaveType?.name || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">
                          {leaveRequest?.totalDays} {leaveRequest?.totalDays === 1 ? "day" : "days"}
                          {leaveRequest?.halfDay && " (Half day)"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Start Date:</span>
                        <span className="font-medium">
                          {formatDate(leaveRequest?.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">End Date:</span>
                        <span className="font-medium">
                          {formatDate(leaveRequest?.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Status Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className="font-medium">
                          {leaveRequest && leaveRequest.status.charAt(0).toUpperCase() + leaveRequest.status.slice(1)}
                        </span>
                      </div>
                      
                      {leaveRequest?.status === 'approved' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Approved By:</span>
                            <span className="font-medium">{approver?.name || "Unknown"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Approved On:</span>
                            <span className="font-medium">
                              {formatDate(leaveRequest.approvedAt)}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {leaveRequest?.status === 'rejected' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Rejected By:</span>
                            <span className="font-medium">{approver?.name || "Unknown"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Rejected On:</span>
                            <span className="font-medium">
                              {formatDate(leaveRequest.rejectedAt)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Reason for Leave</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    {leaveRequest?.reason || "No reason provided"}
                  </div>
                </div>
                
                {leaveRequest?.status === 'rejected' && leaveRequest.rejectionReason && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-red-500">Rejection Reason</h3>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                      {leaveRequest.rejectionReason}
                    </div>
                  </div>
                )}
                
                {leaveRequest?.attachmentUrl && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Attachment</h3>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <a 
                        href={leaveRequest.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View Attachment
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
              
              {canApproveReject && (
                <CardFooter className="flex justify-end space-x-2 pt-6">
                  <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    <Button 
                      variant="outline" 
                      className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setIsRejectDialogOpen(true)}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Leave Request</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for rejecting this leave request.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="rejectionReason">Rejection Reason</Label>
                        <Textarea
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Please provide a reason for rejection"
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsRejectDialogOpen(false)}
                          disabled={processing}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleReject}
                          disabled={processing || !rejectionReason}
                        >
                          {processing ? "Rejecting..." : "Reject Request"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processing ? "Approving..." : "Approve"}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Employee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium">{requestUser?.name || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-medium">{requestUser?.department || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Position:</span>
                    <span className="font-medium">{requestUser?.position || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">{requestUser?.email || "Unknown"}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex">
                      <div className="mr-3 flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Request Submitted</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(leaveRequest?.createdAt, "PPP 'at' p")}
                        </p>
                      </div>
                    </div>
                    
                    {leaveRequest?.status !== 'pending' && (
                      <div className="flex">
                        <div className="mr-3 flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${
                            leaveRequest?.status === 'approved' 
                              ? 'bg-green-500' 
                              : leaveRequest?.status === 'rejected'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                          }`}></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {leaveRequest?.status === 'approved' 
                              ? 'Request Approved' 
                              : leaveRequest?.status === 'rejected'
                                ? 'Request Rejected'
                                : 'Request Cancelled'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {leaveRequest?.status === 'approved' 
                              ? formatDate(leaveRequest.approvedAt, "PPP 'at' p")
                              : leaveRequest?.status === 'rejected' 
                                ? formatDate(leaveRequest.rejectedAt, "PPP 'at' p")
                                : leaveRequest?.status === 'cancelled' 
                                  ? formatDate(leaveRequest.cancelledAt, "PPP 'at' p")
                                  : "Unknown date"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {leaveRequest?.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800 mb-1">Pending Approval</h3>
                      <p className="text-sm text-yellow-700">
                        This leave request is waiting for approval from a manager.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}