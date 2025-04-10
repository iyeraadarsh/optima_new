import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Home, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash, 
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MainLayout } from "@/components/layout/MainLayout";
import { workFromHomeService } from "@/services/workFromHomeService";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { WorkFromHomeRequest, User } from "@/types";
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
import { usePermission } from '@/hooks/usePermission';
import { PermissionGate } from '@/components/ui/permission-gate';

export default function WorkFromHomeDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userProfile } = useAuth();
  const { ModuleNames, ActionTypes } = usePermission();
  const [wfhRequest, setWfhRequest] = useState<WorkFromHomeRequest | null>(null);
  const [requestUser, setRequestUser] = useState<User | null>(null);
  const [approver, setApprover] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Check if current user is the owner of the request
  const isOwner = wfhRequest && currentUser && wfhRequest.userId === currentUser.uid;
  
  // Check if the request is in a state that can be edited or deleted
  const canEdit = isOwner && wfhRequest && wfhRequest.status === 'pending';
  const canDelete = isOwner && wfhRequest && (wfhRequest.status === 'pending' || wfhRequest.status === 'rejected');
  
  // Check if the request can be approved or rejected
  const canApproveReject = wfhRequest && wfhRequest.status === 'pending';

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
    const fetchWfhRequest = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch work from home request
        const request = await workFromHomeService.getWorkFromHomeRequest(id as string);
        
        if (request) {
          setWfhRequest(request);
          
          // Fetch user who made the request
          const user = await userService.getUserProfile(request.userId);
          setRequestUser(user);
          
          // Fetch approver if exists
          if (request.approverId) {
            const approverUser = await userService.getUserProfile(request.approverId);
            setApprover(approverUser);
          }
        } else {
          alert("Work from home request not found");
          router.push("/hr/leave/work-from-home");
        }
      } catch (error) {
        console.error("Error fetching work from home request:", error);
        alert("Error loading work from home request details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWfhRequest();
  }, [id, router]);

  const handleApprove = async () => {
    if (!wfhRequest || !currentUser) return;
    
    try {
      setProcessing(true);
      
      // Approve the work from home request
      await workFromHomeService.approveWorkFromHomeRequest(wfhRequest.id, currentUser.uid);
      
      // Refresh the work from home request
      const updatedRequest = await workFromHomeService.getWorkFromHomeRequest(wfhRequest.id);
      setWfhRequest(updatedRequest);
      
      alert("Work from home request approved successfully");
    } catch (error) {
      console.error("Error approving work from home request:", error);
      alert("Error approving work from home request");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!wfhRequest || !currentUser || !rejectionReason) return;
    
    try {
      setProcessing(true);
      
      // Reject the work from home request
      await workFromHomeService.rejectWorkFromHomeRequest(wfhRequest.id, currentUser.uid, rejectionReason);
      
      // Refresh the work from home request
      const updatedRequest = await workFromHomeService.getWorkFromHomeRequest(wfhRequest.id);
      setWfhRequest(updatedRequest);
      
      // Close the dialog
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      
      alert("Work from home request rejected successfully");
    } catch (error) {
      console.error("Error rejecting work from home request:", error);
      alert("Error rejecting work from home request");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!wfhRequest) return;
    
    try {
      setProcessing(true);
      
      // Delete the work from home request
      await workFromHomeService.deleteWorkFromHomeRequest(wfhRequest.id);
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
      
      // Redirect back to work from home dashboard
      router.push("/hr/leave/work-from-home");
      
      alert("Work from home request deleted successfully");
    } catch (error) {
      console.error("Error deleting work from home request:", error);
      alert("Error deleting work from home request");
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
              <p className="mt-4 text-gray-500">Loading work from home request details...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Head>
        <title>Work From Home Request Details | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button asChild variant="outline" className="mb-2">
              <Link href="/hr/leave/work-from-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Work From Home
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Work From Home Request Details</h1>
            <p className="text-gray-500 dark:text-gray-400">
              View and manage work from home request information
            </p>
          </div>
          <div className="flex gap-2">
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
                      This action cannot be undone. This will permanently delete the work from home request.
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
                    <CardTitle>Work From Home Request</CardTitle>
                    <CardDescription>
                      Submitted by {requestUser?.name || "Unknown"} on {
                        wfhRequest?.createdAt 
                          ? formatDate(wfhRequest.createdAt, "PPP 'at' p") 
                          : "Unknown date"
                      }
                    </CardDescription>
                  </div>
                  <div>
                    {wfhRequest && getStatusBadge(wfhRequest.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Request Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
                          Work From Home
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">
                          {wfhRequest?.totalDays} {wfhRequest?.totalDays === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Start Date:</span>
                        <span className="font-medium">
                          {formatDate(wfhRequest?.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">End Date:</span>
                        <span className="font-medium">
                          {formatDate(wfhRequest?.endDate)}
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
                          {wfhRequest && wfhRequest.status.charAt(0).toUpperCase() + wfhRequest.status.slice(1)}
                        </span>
                      </div>
                      
                      {wfhRequest?.status === 'approved' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Approved By:</span>
                            <span className="font-medium">{approver?.name || "Unknown"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Approved On:</span>
                            <span className="font-medium">
                              {formatDate(wfhRequest.approvedAt)}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {wfhRequest?.status === 'rejected' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Rejected By:</span>
                            <span className="font-medium">{approver?.name || "Unknown"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Rejected On:</span>
                            <span className="font-medium">
                              {formatDate(wfhRequest.rejectedAt)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Reason for Work From Home</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    {wfhRequest?.reason || "No reason provided"}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Work Details</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    {wfhRequest?.workDetails || "No work details provided"}
                  </div>
                </div>
                
                {wfhRequest?.status === 'rejected' && wfhRequest.rejectionReason && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-red-500">Rejection Reason</h3>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                      {wfhRequest.rejectionReason}
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
                        <DialogTitle>Reject Work From Home Request</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for rejecting this work from home request.
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
                          {formatDate(wfhRequest?.createdAt, "PPP 'at' p")}
                        </p>
                      </div>
                    </div>
                    
                    {wfhRequest?.status !== 'pending' && (
                      <div className="flex">
                        <div className="mr-3 flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${
                            wfhRequest?.status === 'approved' 
                              ? 'bg-green-500' 
                              : wfhRequest?.status === 'rejected'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                          }`}></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {wfhRequest?.status === 'approved' 
                              ? 'Request Approved' 
                              : wfhRequest?.status === 'rejected'
                                ? 'Request Rejected'
                                : 'Request Cancelled'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {wfhRequest?.status === 'approved' 
                              ? formatDate(wfhRequest.approvedAt, "PPP 'at' p")
                              : wfhRequest?.status === 'rejected' 
                                ? formatDate(wfhRequest.rejectedAt, "PPP 'at' p")
                                : wfhRequest?.status === 'cancelled' 
                                  ? formatDate(wfhRequest.cancelledAt, "PPP 'at' p")
                                  : "Unknown date"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {wfhRequest?.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800 mb-1">Pending Approval</h3>
                      <p className="text-sm text-yellow-700">
                        This work from home request is waiting for approval from a manager.
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