
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Target, 
  ArrowLeft, 
  Check, 
  X, 
  Edit, 
  Clock, 
  Send, 
  Download, 
  Upload, 
  Paperclip,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import { performanceService } from "@/services/performanceService";
import { useAuth } from "@/contexts/AuthContext";
import { Goal, GoalComment } from "@/types/performance";
import { userService } from "@/services/userService";

export default function GoalDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [comments, setComments] = useState<GoalComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    keyMetrics: [""]
  });
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== "string") return;
      
      try {
        setLoading(true);
        
        // Fetch goal details
        const goalData = await performanceService.getGoal(id);
        if (goalData) {
          setGoal(goalData);
          setEditData({
            title: goalData.title,
            description: goalData.description,
            keyMetrics: [...goalData.keyMetrics]
          });
          
          // Calculate progress based on status
          updateProgressBasedOnStatus(goalData.status);
        }
        
        // Fetch comments
        const goalComments = await performanceService.getGoalComments(id);
        setComments(goalComments);
        
        // Fetch users for displaying names
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error("Error fetching goal details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Function to update progress based on status
  const updateProgressBasedOnStatus = (status: string) => {
    switch(status) {
      case "completed":
        setProgress(100);
        break;
      case "approved":
        setProgress(50);
        break;
      case "submitted":
        setProgress(25);
        break;
      case "rejected":
      case "draft":
      default:
        setProgress(10);
        break;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setCommentFiles([...commentFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...commentFiles];
    updatedFiles.splice(index, 1);
    setCommentFiles(updatedFiles);
  };

  const handleAddComment = async () => {
    if (!currentUser || !goal || !newComment.trim()) return;
    
    try {
      setSubmitting(true);
      
      // Create a more complete comment object
      const comment: Partial<GoalComment> = {
        goalId: goal.id,
        userId: currentUser.uid,
        userName: userProfile?.name || 'User',
        userRole: userProfile?.role || 'employee',
        comment: newComment
      };
      
      console.log('Submitting comment:', comment);
      
      // Add more detailed error handling
      try {
        await performanceService.addGoalComment(comment, commentFiles);
        
        // Refresh comments
        const updatedComments = await performanceService.getGoalComments(goal.id);
        setComments(updatedComments);
        
        // Clear form
        setNewComment('');
        setCommentFiles([]);
        
        // Show success message only after successful operation
        alert('Comment added successfully!');
      } catch (commentError) {
        console.error('Detailed error adding comment:', commentError);
        alert(`Error adding comment: ${commentError instanceof Error ? commentError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error in handleAddComment:', error);
      alert(`Error adding comment. Please try again. ${error instanceof Error ? error.message : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveGoal = async () => {
    if (!currentUser || !goal) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.approveGoal(
        goal.id, 
        currentUser.uid,
        userProfile?.name || "Manager"
      );
      
      // Add approval comment
      const comment: Partial<GoalComment> = {
        goalId: goal.id,
        userId: currentUser.uid,
        userName: userProfile?.name || "Manager",
        userRole: userProfile?.role || "manager",
        comment: "Goal approved."
      };
      
      await performanceService.addGoalComment(comment);
      
      // Refresh goal and comments
      const updatedGoal = await performanceService.getGoal(goal.id);
      if (updatedGoal) {
        setGoal(updatedGoal);
        updateProgressBasedOnStatus(updatedGoal.status);
      }
      
      const updatedComments = await performanceService.getGoalComments(goal.id);
      setComments(updatedComments);
      
      // Show success message only after successful operation
      alert("Goal has been approved successfully.");
    } catch (error) {
      console.error("Error approving goal:", error);
      alert("Error approving goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectGoal = async () => {
    if (!currentUser || !goal) return;
    
    try {
      setSubmitting(true);
      
      // Update goal status to draft
      await performanceService.updateGoal(goal.id, {
        status: "draft"
      });
      
      // Add rejection comment
      const rejectionReason = prompt("Please provide a reason for rejecting this goal:");
      if (rejectionReason) {
        const comment: Partial<GoalComment> = {
          goalId: goal.id,
          userId: currentUser.uid,
          userName: userProfile?.name || "Manager",
          userRole: userProfile?.role || "manager",
          comment: `Goal rejected: ${rejectionReason}`
        };
        
        await performanceService.addGoalComment(comment);
      }
      
      // Refresh goal and comments
      const updatedGoal = await performanceService.getGoal(goal.id);
      if (updatedGoal) {
        setGoal(updatedGoal);
        updateProgressBasedOnStatus(updatedGoal.status);
      }
      
      const updatedComments = await performanceService.getGoalComments(goal.id);
      setComments(updatedComments);
      
      // Show success message
      alert("Goal has been rejected and returned to draft status.");
    } catch (error) {
      console.error("Error rejecting goal:", error);
      alert("Error rejecting goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteGoal = async () => {
    if (!currentUser || !goal) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.completeGoal(goal.id);
      
      // Add completion comment
      const comment: Partial<GoalComment> = {
        goalId: goal.id,
        userId: currentUser.uid,
        userName: userProfile?.name || "User",
        userRole: userProfile?.role || "employee",
        comment: "Goal marked as completed."
      };
      
      await performanceService.addGoalComment(comment);
      
      // Refresh goal and comments
      const updatedGoal = await performanceService.getGoal(goal.id);
      if (updatedGoal) {
        setGoal(updatedGoal);
        updateProgressBasedOnStatus(updatedGoal.status);
      }
      
      const updatedComments = await performanceService.getGoalComments(goal.id);
      setComments(updatedComments);
    } catch (error) {
      console.error("Error completing goal:", error);
      alert("Error completing goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGoal = async () => {
    if (!currentUser || !goal) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.submitGoal(goal.id);
      
      // Add submission comment
      const comment: Partial<GoalComment> = {
        goalId: goal.id,
        userId: currentUser.uid,
        userName: userProfile?.name || "User",
        userRole: userProfile?.role || "employee",
        comment: "Goal submitted for approval."
      };
      
      await performanceService.addGoalComment(comment);
      
      // Refresh goal and comments
      const updatedGoal = await performanceService.getGoal(goal.id);
      if (updatedGoal) {
        setGoal(updatedGoal);
        updateProgressBasedOnStatus(updatedGoal.status);
      }
      
      const updatedComments = await performanceService.getGoalComments(goal.id);
      setComments(updatedComments);
    } catch (error) {
      console.error("Error submitting goal:", error);
      alert("Error submitting goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!currentUser || !goal) return;
    
    try {
      setSubmitting(true);
      
      // Filter out empty metrics
      const validMetrics = editData.keyMetrics.filter(metric => metric.trim() !== "");
      
      await performanceService.updateGoal(goal.id, {
        title: editData.title,
        description: editData.description,
        keyMetrics: validMetrics
      });
      
      // Add update comment
      const comment: Partial<GoalComment> = {
        goalId: goal.id,
        userId: currentUser.uid,
        userName: userProfile?.name || "User",
        userRole: userProfile?.role || "employee",
        comment: "Goal details updated."
      };
      
      await performanceService.addGoalComment(comment);
      
      // Refresh goal and comments
      const updatedGoal = await performanceService.getGoal(goal.id);
      setGoal(updatedGoal);
      
      const updatedComments = await performanceService.getGoalComments(goal.id);
      setComments(updatedComments);
      
      setEditMode(false);
    } catch (error) {
      console.error("Error updating goal:", error);
      alert("Error updating goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMetricChange = (index: number, value: string) => {
    const updatedMetrics = [...editData.keyMetrics];
    updatedMetrics[index] = value;
    
    setEditData({
      ...editData,
      keyMetrics: updatedMetrics
    });
  };

  const addMetric = () => {
    setEditData({
      ...editData,
      keyMetrics: [...editData.keyMetrics, ""]
    });
  };

  const removeMetric = (index: number) => {
    const updatedMetrics = [...editData.keyMetrics];
    updatedMetrics.splice(index, 1);
    
    setEditData({
      ...editData,
      keyMetrics: updatedMetrics.length > 0 ? updatedMetrics : [""]
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "archived":
        return <Badge className="bg-gray-500">Archived</Badge>;
      case "submitted":
        return <Badge className="bg-yellow-500">Submitted</Badge>;
      case "draft":
      default:
        return <Badge className="bg-slate-500">Draft</Badge>;
    }
  };

  const handleDeleteGoal = async () => {
    if (!currentUser || !goal) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.deleteGoal(goal.id);
      
      alert("Goal deleted successfully!");
      router.push('/hr/performance?refresh=true');
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("Error deleting goal. Please try again.");
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Loading goal details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!goal) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Goal not found</p>
            <Button asChild className="mt-4">
              <Link href="/hr/performance">
                Back to Performance Management
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isOwner = currentUser?.uid === goal.employeeId;
  const isApprover = currentUser?.uid === goal.approverId || 
                    userProfile?.role === 'manager' || 
                    userProfile?.role === 'admin' || 
                    userProfile?.role === 'super_admin' || 
                    userProfile?.role === 'department_manager';
  const canEdit = isOwner && (goal.status === "draft" || goal.status === "rejected");
  const canSubmit = isOwner && goal.status === "draft";
  const canApprove = isApprover && goal.status === "submitted";
  const canComplete = isOwner && goal.status === "approved";

  return (
    <MainLayout>
      <Head>
        <title>Goal Details | Performance Management</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{goal.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(goal.status)}
              <p className="text-gray-500 dark:text-gray-400">
                Year: {goal.year}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/hr/performance">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Goals
              </Link>
            </Button>
            {canEdit && !editMode && (
              <Button onClick={() => setEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Goal
              </Button>
            )}
            {isOwner && (
              <Button 
                variant="outline" 
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
        
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
              <p className="mb-6">Are you sure you want to delete this goal? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteGoal}
                  disabled={submitting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {submitting ? "Deleting..." : "Delete Goal"}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs defaultValue="details" onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="details">Goal Details</TabsTrigger>
                <TabsTrigger value="updates">Updates & Comments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Goal Information</CardTitle>
                    <CardDescription>
                      Details and progress of this goal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {editMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Goal Title</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={editData.title}
                            onChange={(e) => setEditData({...editData, title: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Goal Description</label>
                          <Textarea
                            value={editData.description}
                            onChange={(e) => setEditData({...editData, description: e.target.value})}
                            rows={5}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Key Metrics / Success Criteria</label>
                          {editData.keyMetrics.map((metric, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                className="w-full p-2 border rounded-md"
                                value={metric}
                                onChange={(e) => handleMetricChange(index, e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeMetric(index)}
                                disabled={editData.keyMetrics.length === 1}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMetric}
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Another Metric
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1">Description</h3>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {goal.description}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Key Metrics / Success Criteria</h3>
                          <ul className="list-disc pl-5 space-y-1">
                            {goal.keyMetrics.map((metric, index) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300">
                                {metric}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-1">Progress</h3>
                          <Progress value={progress} className="h-2 mb-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Draft</span>
                            <span>Submitted</span>
                            <span>Approved</span>
                            <span>Completed</span>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-1">Timeline</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Created:</span>
                              <span>{format(new Date(goal.createdAt), "PPP")}</span>
                            </div>
                            {goal.approvedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Approved:</span>
                                <span>{format(new Date(goal.approvedAt), "PPP")}</span>
                              </div>
                            )}
                            {goal.completedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Completed:</span>
                                <span>{format(new Date(goal.completedAt), "PPP")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  {editMode && (
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditMode(false)} disabled={submitting}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateGoal} disabled={submitting}>
                        Save Changes
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                
                <div className="flex flex-wrap gap-2 justify-end">
                  {canSubmit && (
                    <Button onClick={handleSubmitGoal} disabled={submitting}>
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Approval
                    </Button>
                  )}
                  
                  {canApprove && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={handleRejectGoal}
                        disabled={submitting}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleApproveGoal}
                        disabled={submitting}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                  
                  {canComplete && (
                    <Button onClick={handleCompleteGoal} disabled={submitting}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="updates" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Updates & Comments</CardTitle>
                    <CardDescription>
                      Track progress and communicate about this goal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                          No comments or updates yet
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {comments.map((comment) => {
                            const user = users.find(u => u.id === comment.userId);
                            const isSystem = comment.comment.startsWith("Goal ");
                            
                            return (
                              <div key={comment.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium">
                                      {user?.name || comment.userName || "User"}
                                    </div>
                                    <Badge variant="outline">
                                      {comment.userRole.replace("_", " ")}
                                    </Badge>
                                    {isSystem && (
                                      <Badge className="bg-blue-500">System</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {format(new Date(comment.createdAt), "PPP p")}
                                  </div>
                                </div>
                                
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line mb-2">
                                  {comment.comment}
                                </p>
                                
                                {comment.attachments && comment.attachments.length > 0 && (
                                  <div className="mt-2">
                                    <h4 className="text-sm font-medium mb-1">Attachments:</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {comment.attachments.map((attachment, index) => (
                                        <a
                                          key={index}
                                          href={attachment}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                                        >
                                          <Paperclip className="h-3 w-3" />
                                          Attachment {index + 1}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Add Comment</h3>
                      <Textarea
                        placeholder="Add an update or comment about this goal..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                      
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById("file-upload")?.click()}
                          >
                            <Paperclip className="h-4 w-4 mr-1" />
                            Attach Files
                          </Button>
                          <input
                            id="file-upload"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <span className="text-xs text-gray-500">
                            Attach relevant documents or screenshots
                          </span>
                        </div>
                        
                        {commentFiles.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Selected files:</p>
                            {commentFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                  <Paperclip className="h-3 w-3" />
                                  <span>{file.name}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <Button 
                          onClick={handleAddComment} 
                          disabled={submitting || !newComment.trim()}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Goal Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(goal.status)}
                    <span className="text-gray-700 dark:text-gray-300">
                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Timeline</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>Created: {format(new Date(goal.createdAt), "PPP")}</span>
                    </div>
                    {goal.approvedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Approved: {format(new Date(goal.approvedAt), "PPP")}</span>
                      </div>
                    )}
                    {goal.completedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Completed: {format(new Date(goal.completedAt), "PPP")}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {goal.approverId && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Approver</h3>
                    <div className="text-sm">
                      {goal.approverName || "Manager"}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Activity</h3>
                  <div className="text-sm text-gray-500">
                    {comments.length} {comments.length === 1 ? "comment" : "comments"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated: {format(new Date(goal.updatedAt), "PPP")}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">SMART Goal Guidelines</h3>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p><span className="font-medium">S</span>pecific: Clearly defined</p>
                    <p><span className="font-medium">M</span>easurable: Quantifiable</p>
                    <p><span className="font-medium">A</span>chievable: Realistic</p>
                    <p><span className="font-medium">R</span>elevant: Aligned with objectives</p>
                    <p><span className="font-medium">T</span>ime-bound: Has a deadline</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
