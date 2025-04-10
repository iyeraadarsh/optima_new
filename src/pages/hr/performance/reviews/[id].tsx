import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Star, 
  Check, 
  Download, 
  Send, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash,
  Edit,
  Plus,
  ArrowUpDown,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Save,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { MainLayout } from "@/components/layout/MainLayout";
import { performanceService } from "@/services/performanceService";
import { useAuth } from "@/contexts/AuthContext";
import { PerformanceReview, Goal } from "@/types/performance";

export default function ReviewDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<PerformanceReview | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Self-assessment form
  const [selfRating, setSelfRating] = useState(0);
  const [selfComments, setSelfComments] = useState("");
  
  // Manager review form
  const [managerRating, setManagerRating] = useState(0);
  const [managerComments, setManagerComments] = useState("");
  
  // Edit mode states
  const [editingManagerReview, setEditingManagerReview] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // Performance settings
  const [settings, setSettings] = useState<any>(null);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Status change
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<'draft' | 'self_review' | 'manager_review' | 'completed'>('draft');

  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== "string") return;
      
      try {
        setLoading(true);
        
        // Fetch review details
        const reviewData = await performanceService.getPerformanceReview(id);
        if (reviewData) {
          setReview(reviewData);
          setNewStatus(reviewData.status);
          
          // Pre-populate form data if available
          if (reviewData.selfRating) setSelfRating(reviewData.selfRating);
          if (reviewData.selfComments) setSelfComments(reviewData.selfComments);
          if (reviewData.managerRating) setManagerRating(reviewData.managerRating);
          if (reviewData.managerComments) setManagerComments(reviewData.managerComments);
          
          // Set selected goals
          if (reviewData.goals) {
            setSelectedGoals(reviewData.goals);
          }
          
          // Fetch associated goals
          if (reviewData.goals && reviewData.goals.length > 0) {
            const goalsPromises = reviewData.goals.map(goalId => 
              performanceService.getGoal(goalId)
            );
            
            const goalsData = await Promise.all(goalsPromises);
            setGoals(goalsData.filter(goal => goal !== null) as Goal[]);
          }
        }
        
        // Fetch performance settings
        const settingsData = await performanceService.getPerformanceSettings();
        setSettings(settingsData);
        
        // Fetch available goals for editing
        if (reviewData && currentUser) {
          // Fetch employee goals
          const employeeGoals = await performanceService.getGoals({
            employeeId: reviewData.employeeId,
            year: reviewData.year
          });
          
          // Fetch manager goals
          const managerGoals = await performanceService.getGoals({
            employeeId: currentUser.uid,
            year: reviewData.year
          });
          
          // Combine and label goals
          const allGoals = [...employeeGoals, ...managerGoals];
          const labeledGoals = allGoals.map(goal => ({
            ...goal,
            title: goal.employeeId === currentUser.uid 
              ? `[Manager Goal] ${goal.title}` 
              : goal.title
          }));
          
          setAvailableGoals(labeledGoals);
        }
        
      } catch (error) {
        console.error("Error fetching review details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, currentUser]);

  const handleSubmitSelfAssessment = async () => {
    if (!currentUser || !review) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.submitSelfReview(
        review.id,
        selfRating,
        selfComments
      );
      
      // Refresh review data
      const updatedReview = await performanceService.getPerformanceReview(review.id);
      setReview(updatedReview);
      
      alert("Self-assessment submitted successfully!");
    } catch (error) {
      console.error("Error submitting self-assessment:", error);
      alert("Error submitting self-assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSelfAssessment = async () => {
    if (!currentUser || !review) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.updatePerformanceReview(review.id, {
        selfRating,
        selfComments
      });
      
      // Refresh review data
      const updatedReview = await performanceService.getPerformanceReview(review.id);
      setReview(updatedReview);
      
      alert('Self-assessment saved successfully!');
    } catch (error) {
      console.error('Error saving self-assessment:', error);
      alert('Error saving self-assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearSelfAssessment = async () => {
    if (!currentUser || !review) return;
    
    if (window.confirm('Are you sure you want to clear your self assessment? This will reset your rating and comments.')) {
      try {
        setSubmitting(true);
        
        // Reset local state
        setSelfRating(0);
        setSelfComments('');
        
        // If the review already has self assessment data, clear it in the database
        if (review.selfRating || review.selfComments) {
          await performanceService.updatePerformanceReview(review.id, {
            selfRating: null,
            selfComments: ''
          });
          
          // Refresh review data
          const updatedReview = await performanceService.getPerformanceReview(review.id);
          setReview(updatedReview);
        }
        
        alert('Self assessment cleared successfully!');
      } catch (error) {
        console.error('Error clearing self assessment:', error);
        alert('Error clearing self assessment. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleClearManagerReview = async () => {
    if (!currentUser || !review || !isManager) return;
    
    if (window.confirm('Are you sure you want to clear the manager review? This will reset the rating and comments.')) {
      try {
        setSubmitting(true);
        
        // Reset local state
        setManagerRating(0);
        setManagerComments('');
        
        // If the review already has manager assessment data, clear it in the database
        if (review.managerRating || review.managerComments) {
          await performanceService.updatePerformanceReview(review.id, {
            managerRating: null,
            managerComments: ''
          });
          
          // Refresh review data
          const updatedReview = await performanceService.getPerformanceReview(review.id);
          setReview(updatedReview);
        }
        
        alert('Manager review cleared successfully!');
      } catch (error) {
        console.error('Error clearing manager review:', error);
        alert('Error clearing manager review. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleCompleteManagerReview = async () => {
    if (!currentUser || !review) return;
    
    // Check if the review status is 'manager_review'
    if (review.status !== 'manager_review') {
      alert('You can only complete the manager review when the status is "Manager Review".');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await performanceService.completeManagerReview(
        review.id,
        managerRating,
        managerComments
      );
      
      // Refresh review data
      const updatedReview = await performanceService.getPerformanceReview(review.id);
      setReview(updatedReview);
      
      alert('Manager review completed successfully!');
    } catch (error) {
      console.error('Error completing manager review:', error);
      alert('Error completing manager review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateManagerReview = async () => {
    if (!currentUser || !review) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.updatePerformanceReview(review.id, {
        managerRating,
        managerComments
      });
      
      // Refresh review data
      const updatedReview = await performanceService.getPerformanceReview(review.id);
      setReview(updatedReview);
      
      setEditingManagerReview(false);
      alert("Manager review updated successfully!");
    } catch (error) {
      console.error("Error updating manager review:", error);
      alert("Error updating manager review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleUpdateGoals = async () => {
    if (!currentUser || !review) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.updatePerformanceReview(review.id, {
        goals: selectedGoals
      });
      
      // Refresh review data
      const updatedReview = await performanceService.getPerformanceReview(review.id);
      setReview(updatedReview);
      
      // Refresh goals
      if (selectedGoals.length > 0) {
        const goalsPromises = selectedGoals.map(goalId => 
          performanceService.getGoal(goalId)
        );
        
        const goalsData = await Promise.all(goalsPromises);
        setGoals(goalsData.filter(goal => goal !== null) as Goal[]);
      } else {
        setGoals([]);
      }
      
      setEditingGoals(false);
      alert("Goals updated successfully!");
    } catch (error) {
      console.error("Error updating goals:", error);
      alert("Error updating goals. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      } else {
        return [...prev, goalId];
      }
    });
  };
  
  const handleDeleteReview = async () => {
    if (!currentUser || !review) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.deletePerformanceReview(review.id);
      
      alert("Performance review deleted successfully!");
      router.push('/hr/performance?refresh=true');
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Error deleting review. Please try again.");
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!currentUser || !review) return;
    
    try {
      setSubmitting(true);
      
      await performanceService.changeReviewStatus(review.id, newStatus);
      
      // Refresh review data
      const updatedReview = await performanceService.getPerformanceReview(review.id);
      setReview(updatedReview);
      
      setShowStatusChangeDialog(false);
      alert(`Review status changed to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error("Error changing review status:", error);
      alert("Error changing review status. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReview = () => {
    if (!review) return;
    
    // Create a text representation of the review
    let content = `PERFORMANCE REVIEW\n`;
    content += `====================\n\n`;
    content += `Employee: ${review.employeeName}\n`;
    content += `Manager: ${review.managerName}\n`;
    content += `Year: ${review.year}\n`;
    content += `Status: ${review.status}\n\n`;
    
    content += `GOALS\n`;
    content += `====================\n`;
    goals.forEach((goal, index) => {
      content += `${index + 1}. ${goal.title}\n`;
      content += `   Description: ${goal.description}\n`;
      content += `   Status: ${goal.status}\n\n`;
    });
    
    if (review.selfRating) {
      content += `SELF ASSESSMENT\n`;
      content += `====================\n`;
      content += `Rating: ${review.selfRating}/5\n`;
      content += `Comments: ${review.selfComments || "None"}\n\n`;
    }
    
    if (review.managerRating) {
      content += `MANAGER ASSESSMENT\n`;
      content += `====================\n`;
      content += `Rating: ${review.managerRating}/5\n`;
      content += `Comments: ${review.managerComments || "None"}\n\n`;
    }
    
    // Create a download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance_review_${review.year}_${review.employeeName.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "manager_review":
        return <Badge className="bg-blue-500">Manager Review</Badge>;
      case "self_review":
        return <Badge className="bg-yellow-500">Self Review</Badge>;
      case "draft":
      default:
        return <Badge className="bg-slate-500">Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Loading review details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!review) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Review not found</p>
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

  const isEmployee = currentUser?.uid === review.employeeId;
  const isManager = currentUser?.uid === review.managerId || 
                    userProfile?.role === 'admin' || 
                    userProfile?.role === 'super_admin';
  const canSubmitSelfReview = isEmployee && review.status === "self_review";
  const canCompleteManagerReview = isManager && review.status === "manager_review";
  
  // Allow editing at any stage for managers
  const canEditManagerReview = isManager;
  const canEditGoals = isManager;
  
  // Allow changing status for managers
  const canChangeStatus = isManager;

  return (
    <MainLayout>
      <Head>
        <title>Performance Review | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{review.year} Performance Review</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(review.status)}
              <p className="text-gray-500 dark:text-gray-400">
                Employee: {review.employeeName}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/hr/performance">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Performance
              </Link>
            </Button>
            {isManager && (
              <Button asChild variant="outline">
                <Link href="/hr/performance/reviews/add">
                  <Plus className="h-4 w-4 mr-2" />
                  New Review
                </Link>
              </Button>
            )}
            {canChangeStatus && (
              <Button 
                variant="outline" 
                onClick={() => setShowStatusChangeDialog(true)}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Change Status
              </Button>
            )}
            {isManager && (
              <Button 
                variant="outline" 
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            {review.status === "completed" && (
              <Button onClick={handleDownloadReview}>
                <Download className="h-4 w-4 mr-2" />
                Download Review
              </Button>
            )}
          </div>
        </div>
        
        {/* Status Change Dialog */}
        <Dialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Review Status</DialogTitle>
              <DialogDescription>
                Move this review to a different stage in the review process.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Current Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(review.status)}
                    <span>{review.status.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">New Status</h3>
                  <Select 
                    value={newStatus} 
                    onValueChange={(value) => setNewStatus(value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="self_review">Self Review</SelectItem>
                      <SelectItem value="manager_review">Manager Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Important Note</p>
                      <p className="text-sm text-yellow-700">
                        Changing the review status may affect the review process. Make sure you understand the implications before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusChangeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleChangeStatus}
                disabled={submitting || newStatus === review.status}
              >
                {submitting ? "Changing..." : "Change Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Performance Review</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this performance review? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteReview}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {(isEmployee || isManager) && (
                  <TabsTrigger value="self-assessment">Self Assessment</TabsTrigger>
                )}
                {isManager && (
                  <TabsTrigger value="manager-review">Manager Review</TabsTrigger>
                )}
                <TabsTrigger value="goals">Goals</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Overview</CardTitle>
                    <CardDescription>
                      Summary of the performance review
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Review Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Employee:</span>
                            <span>{review.employeeName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Manager:</span>
                            <span>{review.managerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Year:</span>
                            <span>{review.year}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span>{getStatusBadge(review.status)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Created:</span>
                            <span>{format(new Date(review.createdAt), "PPP")}</span>
                          </div>
                          {review.submittedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Self-Assessment Submitted:</span>
                              <span>{format(new Date(review.submittedAt), "PPP")}</span>
                            </div>
                          )}
                          {review.completedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Completed:</span>
                              <span>{format(new Date(review.completedAt), "PPP")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Ratings</h3>
                        {review.selfRating ? (
                          <div className="mb-4">
                            <div className="text-sm text-gray-500 mb-1">Self Rating:</div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-5 w-5 ${i < review.selfRating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                                />
                              ))}
                              <span className="ml-2 font-medium">{review.selfRating}/5</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <div className="text-sm text-gray-500">Self Rating: Not submitted yet</div>
                          </div>
                        )}
                        
                        {review.managerRating ? (
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Manager Rating:</div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-5 w-5 ${i < review.managerRating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                                />
                              ))}
                              <span className="ml-2 font-medium">{review.managerRating}/5</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-500">Manager Rating: Not submitted yet</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {review.selfComments && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Self Assessment Comments</h3>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          {review.selfComments}
                        </p>
                      </div>
                    )}
                    
                    {review.managerComments && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Manager Comments</h3>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          {review.managerComments}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="flex flex-wrap gap-2 justify-end">
                  {canSubmitSelfReview && (
                    <Button 
                      onClick={() => setActiveTab("self-assessment")}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Complete Self Assessment
                    </Button>
                  )}
                  
                  {canCompleteManagerReview && (
                    <Button 
                      onClick={() => setActiveTab("manager-review")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Manager Review
                    </Button>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="self-assessment" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Self Assessment</CardTitle>
                    <CardDescription>
                      Evaluate your own performance for the review period
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className='flex justify-between items-center'>
                        <h3 className='text-sm font-medium mb-2'>Self Rating</h3>
                        {(isEmployee || isManager) && (
                          <Button 
                            variant='outline' 
                            size='sm'
                            onClick={handleClearSelfAssessment}
                            disabled={submitting || (selfRating === 0 && !selfComments.trim())}
                          >
                            <RefreshCw className='h-4 w-4 mr-1' />
                            Clear Rating
                          </Button>
                        )}
                      </div>
                      <p className='text-sm text-gray-500 mb-2'>
                        Rate your overall performance during this review period
                      </p>
                      <div className='flex items-center gap-1'>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type='button'
                            onClick={() => setSelfRating(rating)}
                            className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              selfRating >= rating ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                            disabled={(review.status !== 'self_review' && !isManager) || (!isEmployee && !isManager)}
                          >
                            <Star className={`h-8 w-8 ${selfRating >= rating ? 'fill-yellow-500' : ''}`} />
                          </button>
                        ))}
                        <span className='ml-2 text-lg font-medium'>{selfRating}/5</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className='text-sm font-medium mb-2'>Self Assessment Comments</h3>
                      <p className='text-sm text-gray-500 mb-2'>
                        Provide detailed comments about your performance, achievements, and areas for improvement
                      </p>
                      <Textarea
                        placeholder='Enter your self-assessment comments here...'
                        value={selfComments}
                        onChange={(e) => setSelfComments(e.target.value)}
                        rows={8}
                        disabled={(review.status !== 'self_review' && !isManager) || (!isEmployee && !isManager)}
                      />
                    </div>
                    
                    {/* Always show save button for employees in self_review status */}
                    {(isEmployee || isManager) && (
                      <div className='flex justify-end gap-2'>
                        <Button 
                          variant='outline'
                          onClick={handleSaveSelfAssessment} 
                          disabled={submitting || (selfRating === 0 && !selfComments.trim())}
                        >
                          <Save className='h-4 w-4 mr-2' />
                          {submitting ? 'Saving...' : 'Save Self Assessment'}
                        </Button>
                        
                        {/* Only show submit button for employees in self_review status */}
                        {review.status === 'self_review' && isEmployee && (
                          <Button 
                            onClick={handleSubmitSelfAssessment} 
                            disabled={submitting || selfRating === 0 || !selfComments.trim()}
                          >
                            <Send className='h-4 w-4 mr-2' />
                            {submitting ? 'Submitting...' : 'Submit Self Assessment'}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Show submitted self assessment for non-managers when not in self_review status */}
                    {review.status !== 'self_review' && review.selfComments && !isManager && (
                      <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-md'>
                        <h3 className='text-sm font-medium mb-2'>Submitted Self Assessment</h3>
                        <div className='flex items-center mb-2'>
                          <div className='text-sm text-gray-500 mr-2'>Rating:</div>
                          <div className='flex'>
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.selfRating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className='ml-2 text-sm'>{review.selfRating}/5</span>
                        </div>
                        <div className='text-sm text-gray-500 mb-1'>Comments:</div>
                        <p className='text-sm whitespace-pre-line'>
                          {review.selfComments}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value='manager-review' className='space-y-6 mt-4'>
                <Card>
                  <CardHeader>
                    <CardTitle>Manager Review</CardTitle>
                    <CardDescription>
                      Provide feedback and evaluation for the employee
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {review.status === 'self_review' && !isManager && (
                      <div className='bg-yellow-50 border border-yellow-200 p-4 rounded-md'>
                        <div className='flex items-center gap-2 text-yellow-700'>
                          <AlertCircle className='h-5 w-5' />
                          <p className='font-medium'>Waiting for Self Assessment</p>
                        </div>
                        <p className='text-sm text-yellow-600 mt-1'>
                          The employee needs to complete their self-assessment before you can provide your review.
                        </p>
                      </div>
                    )}
                    
                    {(review.status === 'manager_review' || review.status === 'completed' || isManager) && (
                      <>
                        {review.selfRating && (
                          <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-md mb-6'>
                            <h3 className='text-sm font-medium mb-2'>Employee's Self Assessment</h3>
                            <div className='flex items-center mb-2'>
                              <div className='text-sm text-gray-500 mr-2'>Self Rating:</div>
                              <div className='flex'>
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.selfRating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <span className='ml-2 text-sm'>{review.selfRating}/5</span>
                            </div>
                            <div className='text-sm text-gray-500 mb-1'>Comments:</div>
                            <p className='text-sm whitespace-pre-line'>
                              {review.selfComments}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <div className='flex justify-between items-center'>
                            <h3 className='text-sm font-medium mb-2'>Manager Rating</h3>
                            {isManager && (
                              <Button 
                                variant='outline' 
                                size='sm'
                                onClick={handleClearManagerReview}
                                disabled={submitting || (managerRating === 0 && !managerComments.trim())}
                              >
                                <RefreshCw className='h-4 w-4 mr-1' />
                                Clear Rating
                              </Button>
                            )}
                          </div>
                          <p className='text-sm text-gray-500 mb-2'>
                            Rate the employee's overall performance during this review period
                          </p>
                          <div className='flex items-center gap-1'>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type='button'
                                onClick={() => setManagerRating(rating)}
                                className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  managerRating >= rating ? 'text-yellow-500' : 'text-gray-300'
                                }`}
                                disabled={!isManager}
                              >
                                <Star className={`h-8 w-8 ${managerRating >= rating ? 'fill-yellow-500' : ''}`} />
                              </button>
                            ))}
                            <span className='ml-2 text-lg font-medium'>{managerRating}/5</span>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className='text-sm font-medium mb-2'>Manager Comments</h3>
                          <p className='text-sm text-gray-500 mb-2'>
                            Provide detailed feedback on the employee's performance, strengths, and areas for improvement
                          </p>
                          <Textarea
                            placeholder='Enter your manager review comments here...'
                            value={managerComments}
                            onChange={(e) => setManagerComments(e.target.value)}
                            rows={8}
                            disabled={!isManager}
                          />
                        </div>
                        
                        {review.status === 'manager_review' && isManager && (
                          <div className='flex justify-end gap-2'>
                            <Button 
                              variant='outline'
                              onClick={handleUpdateManagerReview}
                              disabled={submitting || (managerRating === 0 && !managerComments.trim())}
                            >
                              <Save className='h-4 w-4 mr-2' />
                              {submitting ? 'Saving...' : 'Save Draft'}
                            </Button>
                            <Button 
                              onClick={handleCompleteManagerReview} 
                              disabled={submitting || managerRating === 0 || !managerComments.trim()}
                            >
                              <CheckCircle className='h-4 w-4 mr-2' />
                              {submitting ? 'Submitting...' : 'Complete Review'}
                            </Button>
                          </div>
                        )}
                        
                        {/* Allow managers to update manager review at any stage */}
                        {isManager && review.status !== 'manager_review' && (
                          <div className='flex justify-end'>
                            <Button 
                              onClick={handleUpdateManagerReview}
                              disabled={submitting || managerRating === 0 || !managerComments.trim()}
                            >
                              {submitting ? 'Updating...' : 'Update Manager Review'}
                            </Button>
                          </div>
                        )}
                        
                        {review.status === 'completed' && review.managerComments && !isManager && (
                          <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-md mt-4'>
                            <h3 className='text-sm font-medium mb-2'>Submitted Manager Review</h3>
                            <div className='flex items-center mb-2'>
                              <div className='text-sm text-gray-500 mr-2'>Rating:</div>
                              <div className='flex'>
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.managerRating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <span className='ml-2 text-sm'>{review.managerRating}/5</span>
                            </div>
                            <div className='text-sm text-gray-500 mb-1'>Comments:</div>
                            <p className='text-sm whitespace-pre-line'>
                              {review.managerComments}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="goals" className="space-y-6 mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Goals Included in Review</CardTitle>
                      <CardDescription>
                        Performance goals being evaluated in this review
                      </CardDescription>
                    </div>
                    {canEditGoals && !editingGoals && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingGoals(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Goals
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {editingGoals ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                          Select the goals to include in this performance review:
                        </p>
                        
                        {availableGoals.length === 0 ? (
                          <div className="text-center py-4 border rounded-md">
                            <p className="text-gray-500">No goals found for this employee and year</p>
                            <Button asChild className="mt-2" size="sm">
                              <Link href="/hr/performance/goals/add">
                                Add a Goal
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {availableGoals.map((goal) => (
                              <div key={goal.id} className="flex items-start space-x-2 border p-3 rounded-md">
                                <input
                                  type="checkbox"
                                  id={`goal-${goal.id}`}
                                  checked={selectedGoals.includes(goal.id)}
                                  onChange={() => handleGoalToggle(goal.id)}
                                  className="mt-1"
                                />
                                <div>
                                  <label
                                    htmlFor={`goal-${goal.id}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {goal.title}
                                  </label>
                                  <p className="text-sm text-gray-500">
                                    {goal.description.length > 100
                                      ? `${goal.description.substring(0, 100)}...`
                                      : goal.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingGoals(false)}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleUpdateGoals}
                            disabled={submitting}
                          >
                            {submitting ? "Saving..." : "Save Goals"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {goals.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-gray-500">No goals found for this review</p>
                            {canEditGoals && (
                              <Button 
                                onClick={() => setEditingGoals(true)} 
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Goals
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {goals.map((goal) => (
                              <div key={goal.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium">{goal.title}</h3>
                                  <Badge
                                    className={`
                                      ${goal.status === "completed" ? "bg-green-500" : 
                                        goal.status === "approved" ? "bg-blue-500" : 
                                        goal.status === "submitted" ? "bg-yellow-500" : 
                                        "bg-gray-500"}
                                    `}
                                  >
                                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">
                                  {goal.description.length > 200 
                                    ? `${goal.description.substring(0, 200)}...` 
                                    : goal.description}
                                </p>
                                <div className="mt-2">
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={`/hr/performance/goals/${goal.id}`}>
                                      View Goal Details
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Review Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Current Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(review.status)}
                    <span className="text-gray-700 dark:text-gray-300">
                      {review.status === "self_review" 
                        ? "Waiting for Self Assessment" 
                        : review.status === "manager_review" 
                        ? "Waiting for Manager Review" 
                        : review.status === "completed"
                        ? "Review Completed"
                        : "Draft"}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Review Process</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      {review.status === "draft" 
                        ? <AlertCircle className="h-5 w-5 text-yellow-500" />
                        : review.status === "self_review" || review.status === "manager_review" || review.status === "completed"
                        ? <CheckCircle className="h-5 w-5 text-green-500" /> 
                        : <Circle className="h-5 w-5 text-gray-300" />}
                      <span className={review.status === "draft" ? "font-medium" : "text-gray-500"}>
                        Draft
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {review.status === "self_review" 
                        ? <AlertCircle className="h-5 w-5 text-yellow-500" /> 
                        : review.status === "manager_review" || review.status === "completed" 
                        ? <CheckCircle className="h-5 w-5 text-green-500" /> 
                        : <Circle className="h-5 w-5 text-gray-300" />}
                      <span className={review.status === "self_review" ? "font-medium" : "text-gray-500"}>
                        Self Assessment
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {review.status === "manager_review" 
                        ? <AlertCircle className="h-5 w-5 text-yellow-500" /> 
                        : review.status === "completed" 
                        ? <CheckCircle className="h-5 w-5 text-green-500" /> 
                        : <Circle className="h-5 w-5 text-gray-300" />}
                      <span className={review.status === "manager_review" ? "font-medium" : "text-gray-500"}>
                        Manager Review
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {review.status === "completed" 
                        ? <CheckCircle className="h-5 w-5 text-green-500" /> 
                        : <Circle className="h-5 w-5 text-gray-300" />}
                      <span className={review.status === "completed" ? "font-medium" : "text-gray-500"}>
                        Review Completed
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Review Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Employee:</span>
                      <span>{review.employeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Manager:</span>
                      <span>{review.managerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Year:</span>
                      <span>{review.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Goals:</span>
                      <span>{goals.length}</span>
                    </div>
                  </div>
                </div>
                
                {canChangeStatus && (
                  <div className="pt-4">
                    <Button 
                      onClick={() => setShowStatusChangeDialog(true)} 
                      className="w-full"
                      variant="outline"
                    >
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Change Review Status
                    </Button>
                  </div>
                )}
                
                {review.status === "completed" && (
                  <div className="pt-2">
                    <Button onClick={handleDownloadReview} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Review
                    </Button>
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

function Circle({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  );
}