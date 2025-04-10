
import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Plus, 
  Target, 
  Star, 
  FileText, 
  Calendar, 
  Download,
  ChevronRight,
  Search,
  Filter,
  Settings,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { performanceService } from "@/services/performanceService";
import { userService } from "@/services/userService"; // Added import for userService
import { useAuth } from "@/contexts/AuthContext";
import { Goal, PerformanceReview } from "@/types/performance";
import { useRouter } from "next/router";

export default function PerformanceManagementPage() {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('goals');
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Goal[]>([]);
  const [performanceSettings, setPerformanceSettings] = useState<any>(null);

  // Create a fetchData function that can be called to refresh the data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch performance settings
      const settings = await performanceService.getPerformanceSettings();
      setPerformanceSettings(settings);
      
      if (currentUser) {
        console.log('Fetching goals for user:', currentUser.uid, 'year:', selectedYear);
        
        // Fetch goals for the selected year
        const userGoals = await performanceService.getGoals({
          employeeId: currentUser.uid,
          year: selectedYear
        });
        console.log('Fetched goals:', userGoals);
        setGoals(userGoals);
        
        // Fetch performance reviews - both as employee and as manager
        let allReviews = [];
        
        // Fetch reviews where user is the employee
        const employeeReviews = await performanceService.getPerformanceReviews({
          employeeId: currentUser.uid,
          year: selectedYear
        });
        
        // Fetch reviews where user is the manager
        const managerReviews = await performanceService.getPerformanceReviews({
          managerId: currentUser.uid,
          year: selectedYear
        });
        
        // Combine both sets of reviews
        allReviews = [...employeeReviews, ...managerReviews];
        console.log('Fetched reviews:', allReviews);
        setReviews(allReviews);
        
        // Fetch pending approvals if user is a manager
        if (userProfile?.role === 'manager' || userProfile?.role === 'admin' || 
            userProfile?.role === 'super_admin' || userProfile?.role === 'department_manager') {
          try {
            // Only fetch goals with 'submitted' status
            const pendingGoals = await performanceService.getGoals({
              status: 'submitted'
            });
            
            // Add employee name to each goal for better display
            const enhancedPendingGoals = await Promise.all(
              pendingGoals.map(async (goal) => {
                try {
                  const employee = await userService.getUserProfile(goal.employeeId);
                  return {
                    ...goal,
                    employeeName: employee?.name || 'Unknown Employee'
                  };
                } catch (error) {
                  console.error('Error fetching employee details:', error);
                  return {
                    ...goal,
                    employeeName: 'Unknown Employee'
                  };
                }
              })
            );
            
            console.log('Fetched pending approvals:', enhancedPendingGoals);
            setPendingApprovals(enhancedPendingGoals);
          } catch (error) {
            console.error('Error fetching pending approvals:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, userProfile, selectedYear]);

  // Effect to fetch data when component mounts or dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect to check for query parameters from redirects
  useEffect(() => {
    // Check if we're coming from a redirect with a refresh parameter
    if (router.query.refresh === 'true') {
      fetchData();
      // Remove the query parameter to prevent unnecessary refreshes
      router.replace('/hr/performance', undefined, { shallow: true });
    }
  }, [router.query.refresh, fetchData, router]);

  const handleRefresh = () => {
    fetchData();
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

  const getReviewStatusBadge = (status: string) => {
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

  const isManager = userProfile?.role === 'manager' || 
                    userProfile?.role === 'admin' || 
                    userProfile?.role === 'super_admin' || 
                    userProfile?.role === 'department_manager';

  return (
    <MainLayout>
      <Head>
        <title>Performance Management | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Performance Management</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Set goals, track progress, and complete performance reviews
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/hr">
                Back to HR
              </Link>
            </Button>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline" size="icon" title="Refresh data">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="goals" onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
            {(userProfile?.role === 'manager' || userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'department_manager') && (
              <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
            )}
            {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
              <TabsTrigger value="settings">Settings</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="goals" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Goals ({selectedYear})</h2>
              <Button asChild>
                <Link href="/hr/performance/goals/add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Goal
                </Link>
              </Button>
            </div>
            
            <Card>
              <CardContent className="py-6">
                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Loading goals...</p>
                  </div>
                ) : goals.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      You don't have any goals set for {selectedYear}
                    </p>
                    <Button asChild>
                      <Link href="/hr/performance/goals/add">
                        <Plus className="h-4 w-4 mr-2" />
                        Set Your First Goal
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div 
                        key={goal.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start space-x-4">
                          <div 
                            className="w-2 h-full min-h-[50px] rounded-full bg-blue-500"
                          />
                          <div>
                            <div className="font-medium">{goal.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {goal.description.length > 100 
                                ? `${goal.description.substring(0, 100)}...` 
                                : goal.description}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {goal.keyMetrics.slice(0, 2).map((metric, index) => (
                                <span 
                                  key={index}
                                  className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full"
                                >
                                  {metric}
                                </span>
                              ))}
                              {goal.keyMetrics.length > 2 && (
                                <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                                  +{goal.keyMetrics.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {getStatusBadge(goal.status)}
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/hr/performance/goals/${goal.id}`}>
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
          
          <TabsContent value="reviews" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Performance Reviews ({selectedYear})</h2>
              {isManager && (
                <Button asChild>
                  <Link href="/hr/performance/reviews/add">
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Review
                  </Link>
                </Button>
              )}
            </div>
            
            <Card>
              <CardContent className="py-6">
                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No performance reviews found for {selectedYear}
                    </p>
                    {isManager && (
                      <Button asChild>
                        <Link href="/hr/performance/reviews/add">
                          <Plus className="h-4 w-4 mr-2" />
                          Start Review Process
                        </Link>
                      </Button>
                    )}
                    {!isManager && (
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Performance reviews are typically initiated by your manager or HR
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div 
                        key={review.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start space-x-4">
                          <div 
                            className="w-2 h-full min-h-[50px] rounded-full bg-purple-500"
                          />
                          <div>
                            <div className="font-medium">
                              {review.year} Performance Review
                            </div>
                            <div className="text-sm text-gray-500">
                              Employee: {review.employeeName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Manager: {review.managerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Created: {format(new Date(review.createdAt), "PPP")}
                            </div>
                            {review.status === "completed" && (
                              <div className="flex items-center mt-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < (review.managerRating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                                    />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm font-medium">
                                  {review.managerRating}/5
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {getReviewStatusBadge(review.status)}
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/hr/performance/reviews/${review.id}`}>
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
          
          <TabsContent value="approvals" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pending Approvals</h2>
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
                      No pending approvals at this time
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((goal) => (
                      <div 
                        key={goal.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start space-x-4">
                          <div 
                            className="w-2 h-full min-h-[50px] rounded-full bg-yellow-500"
                          />
                          <div>
                            <div className="font-medium">{goal.title}</div>
                            <div className="text-sm text-gray-500">
                              Employee: {goal.employeeName} {/* Updated to show employee name */}
                            </div>
                            <div className="text-sm text-gray-500">
                              Year: {goal.year}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {goal.description.length > 100 
                                ? `${goal.description.substring(0, 100)}...` 
                                : goal.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className="bg-yellow-500">Pending Approval</Badge>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/hr/performance/goals/${goal.id}`}>
                              Review <ChevronRight className="h-4 w-4 ml-1" />
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
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Performance Settings</h2>
            </div>
            
            <Card>
              <CardContent className="py-6">
                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">General Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="font-medium">Review Cycle</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {performanceSettings?.reviewCycle === 'annual' ? 'Annual' : 
                             performanceSettings?.reviewCycle === 'biannual' ? 'Bi-Annual' : 
                             performanceSettings?.reviewCycle === 'quarterly' ? 'Quarterly' : 'Not set'}
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="font-medium">Rating Scale</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {performanceSettings?.ratingScale || 5}-point scale
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="font-medium">Self Rating</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {performanceSettings?.enableSelfRating ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="font-medium">Goal Approval</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {performanceSettings?.goalApprovalRequired ? 'Required' : 'Not Required'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button asChild>
                        <Link href="/hr/performance/settings">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Settings
                        </Link>
                      </Button>
                    </div>
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
