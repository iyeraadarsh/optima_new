import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { 
  FileText, 
  ArrowLeft, 
  User, 
  Calendar, 
  Check,
  Plus,
  ChevronRight,
  X,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MainLayout } from "@/components/layout/MainLayout";
import { performanceService } from "@/services/performanceService";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { Goal } from "@/types/performance";

export default function AddPerformanceReviewPage() {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentYear] = useState(new Date().getFullYear());
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    year: currentYear,
    reviewType: 'annual',
    goals: [] as string[]
  });
  const [formErrors, setFormErrors] = useState<{
    employeeId?: string;
    goals?: string;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch employees
        const users = await userService.getAllUsers();
        // Filter out current user and admins
        const employeesList = users.filter(user => 
          user.id !== currentUser.uid && 
          user.role !== "super_admin" &&
          (userProfile?.role === "admin" || userProfile?.role === "super_admin" || 
           (userProfile?.role === "manager" && user.reportingManager === currentUser.uid))
        );
        
        setEmployees(employeesList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, userProfile]);

  // Fetch employee goals when employee is selected
  useEffect(() => {
    const fetchEmployeeGoals = async () => {
      if (!formData.employeeId || !currentUser) {
        setAvailableGoals([]);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch all goals for the selected employee and year
        const employeeGoals = await performanceService.getGoals({
          employeeId: formData.employeeId,
          year: formData.year
        });
        
        // Fetch manager's goals for the same year
        const managerGoals = await performanceService.getGoals({
          employeeId: currentUser.uid,
          year: formData.year
        });
        
        // Combine both sets of goals
        const allGoals = [...employeeGoals, ...managerGoals];
        
        // Add a label to distinguish employee vs manager goals
        const labeledGoals = allGoals.map(goal => ({
          ...goal,
          title: goal.employeeId === currentUser.uid 
            ? `[Manager Goal] ${goal.title}` 
            : goal.title
        }));
        
        setAvailableGoals(labeledGoals);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeGoals();
  }, [formData.employeeId, formData.year, currentUser]);

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error for this field if any
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [field]: undefined
      });
    }
    
    // If employee changed, update employee name and clear selected goals
    if (field === 'employeeId') {
      const selectedEmployee = employees.find(emp => emp.id === value);
      setFormData(prev => ({
        ...prev,
        employeeId: value,
        employeeName: selectedEmployee?.name || '',
        goals: [] // Reset goals when employee changes
      }));
      setSelectedGoals([]);
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
    
    // Clear goals error if any
    if (formErrors.goals) {
      setFormErrors({
        ...formErrors,
        goals: undefined
      });
    }
  };

  const validateForm = () => {
    const errors: {
      employeeId?: string;
    } = {};
    
    if (!formData.employeeId) {
      errors.employeeId = 'Please select an employee';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Create review
      const review = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        managerId: currentUser.uid,
        managerName: userProfile?.name || "Manager",
        year: formData.year,
        status: "draft" as "draft" | "self_review" | "manager_review" | "completed",
        goals: selectedGoals
      };
      
      try {
        const reviewId = await performanceService.createPerformanceReview(review);
        
        // Show success message
        alert(`Performance review created successfully!`);
        
        // Redirect to reviews list with refresh parameter
        router.push('/hr/performance?refresh=true');
      } catch (error: any) {
        console.error('Error creating review:', error);
        alert(`Error creating review: ${error.message || 'Please try again.'}`);
      }
    } catch (error: any) {
      console.error('Error in form submission:', error);
      alert(`Error: ${error.message || 'An unexpected error occurred. Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <Head>
        <title>Start Performance Review | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Start Performance Review</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Initiate a new performance review process
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/hr/performance">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Performance
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Review Details</CardTitle>
                <CardDescription>
                  Set up the performance review details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="employee">Employee</Label>
                      <Select
                        value={formData.employeeId}
                        onValueChange={(value) => handleInputChange("employeeId", value)}
                        disabled={userProfile?.role !== "admin" && userProfile?.role !== "super_admin"}
                      >
                        <SelectTrigger id="employee">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name} - {employee.role.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.employeeId && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.employeeId}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="year">Review Year</Label>
                      <Select
                        value={formData.year.toString()}
                        onValueChange={(value) => handleInputChange("year", parseInt(value))}
                      >
                        <SelectTrigger id="year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(3)].map((_, i) => {
                            const year = currentYear - 1 + i;
                            return (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="reviewType">Review Type</Label>
                      <Select
                        value={formData.reviewType}
                        onValueChange={(value) => handleInputChange("reviewType", value)}
                      >
                        <SelectTrigger id="reviewType">
                          <SelectValue placeholder="Select review type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="annual">Annual Review</SelectItem>
                          <SelectItem value="mid-year">Mid-Year Review</SelectItem>
                          <SelectItem value="quarterly">Quarterly Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Select Goals to Include</Label>
                      <p className="text-xs text-gray-500 mb-2">
                        Choose the goals that will be evaluated in this review
                      </p>
                      
                      {loading ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500">Loading goals...</p>
                        </div>
                      ) : availableGoals.length === 0 ? (
                        <div className="text-center py-4 border rounded-md">
                          <p className="text-gray-500">No goals found for this employee and year</p>
                          <Button asChild className="mt-2" size="sm">
                            <Link href="/hr/performance/goals/add">
                              Add a Goal
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          {availableGoals.map((goal) => (
                            <div key={goal.id} className="flex items-start space-x-2 border p-3 rounded-md">
                              <Checkbox
                                id={`goal-${goal.id}`}
                                checked={selectedGoals.includes(goal.id)}
                                onCheckedChange={() => handleGoalToggle(goal.id)}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={`goal-${goal.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                      
                      {formErrors.goals && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.goals}</p>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className='flex justify-between'>
                <Button
                  variant='outline'
                  onClick={() => router.push('/hr/performance')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Start Review Process'}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Review Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Review Steps</h3>
                  <ol className="space-y-3 list-decimal list-inside text-sm">
                    <li className="flex items-start">
                      <div className="ml-2">
                        <span className="font-medium">Self Assessment</span>
                        <p className="text-gray-500">Employee completes self-evaluation</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="ml-2">
                        <span className="font-medium">Manager Review</span>
                        <p className="text-gray-500">Manager evaluates performance and provides feedback</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="ml-2">
                        <span className="font-medium">Review Meeting</span>
                        <p className="text-gray-500">Discussion of feedback and future goals</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="ml-2">
                        <span className="font-medium">Finalization</span>
                        <p className="text-gray-500">Review is completed and documented</p>
                      </div>
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Tips for Effective Reviews</h3>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li>Focus on specific examples and behaviors</li>
                    <li>Provide balanced feedback (strengths and areas for improvement)</li>
                    <li>Set clear expectations for future performance</li>
                    <li>Discuss development opportunities</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}