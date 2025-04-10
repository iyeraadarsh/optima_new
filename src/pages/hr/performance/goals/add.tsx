import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { 
  Target, 
  Plus, 
  Trash, 
  Save, 
  ArrowLeft,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { performanceService } from "@/services/performanceService";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";

export default function AddGoalPage() {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [currentYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    keyMetrics: [""],
    year: currentYear,
    approverId: ""
  });
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    keyMetrics?: string;
    approverId?: string;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch managers
        try {
          const users = await userService.getAllUsers();
          const managersData = users.filter(user => 
            user.role === "manager" || 
            user.role === "department_manager" || 
            user.role === "admin" || 
            user.role === "super_admin"
          );
          setManagers(managersData);
          
          // If user has a reporting manager, pre-select it
          if (userProfile?.reportingManager) {
            setFormData(prev => ({
              ...prev,
              approverId: userProfile.reportingManager || ""
            }));
          }
        } catch (error) {
          console.error("Error fetching managers:", error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, userProfile]);

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
  };

  const handleMetricChange = (index: number, value: string) => {
    const updatedMetrics = [...formData.keyMetrics];
    updatedMetrics[index] = value;
    
    setFormData({
      ...formData,
      keyMetrics: updatedMetrics
    });
    
    // Clear error for metrics if any
    if (formErrors.keyMetrics) {
      setFormErrors({
        ...formErrors,
        keyMetrics: undefined
      });
    }
  };

  const addMetric = () => {
    setFormData({
      ...formData,
      keyMetrics: [...formData.keyMetrics, ""]
    });
  };

  const removeMetric = (index: number) => {
    const updatedMetrics = [...formData.keyMetrics];
    updatedMetrics.splice(index, 1);
    
    setFormData({
      ...formData,
      keyMetrics: updatedMetrics.length > 0 ? updatedMetrics : [""]
    });
  };

  const validateForm = () => {
    const errors: {
      title?: string;
      description?: string;
      keyMetrics?: string;
      approverId?: string;
    } = {};
    
    if (!formData.title.trim()) {
      errors.title = "Goal title is required";
    }
    
    if (!formData.description.trim()) {
      errors.description = "Goal description is required";
    }
    
    // Check if at least one key metric is provided
    const validMetrics = formData.keyMetrics.filter(metric => metric.trim() !== "");
    if (validMetrics.length === 0) {
      errors.keyMetrics = "At least one key metric is required";
    }
    
    if (!formData.approverId) {
      errors.approverId = "Please select an approver";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = true) => {
    e.preventDefault();
    
    if (!isDraft && !validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Filter out empty metrics
      const validMetrics = formData.keyMetrics.filter(metric => metric.trim() !== '');
      
      if (validMetrics.length === 0 && !isDraft) {
        setFormErrors({
          ...formErrors,
          keyMetrics: 'At least one key metric is required'
        });
        return;
      }
      
      // Create goal with proper typed status
      const goalStatus = isDraft ? 'draft' : 'submitted';
      
      // Create goal
      const goal = {
        employeeId: currentUser.uid,
        title: formData.title.trim(),
        description: formData.description.trim(),
        keyMetrics: validMetrics,
        year: formData.year,
        approverId: formData.approverId,
        status: goalStatus as 'draft' | 'submitted'
      };
      
      try {
        const goalId = await performanceService.createGoal(goal);
        
        // Show success message
        alert(`Goal ${isDraft ? 'saved as draft' : 'submitted for approval'} successfully!`);
        
        // Redirect to goals list with refresh parameter
        router.push('/hr/performance?refresh=true');
      } catch (error: any) {
        console.error('Error creating goal:', error);
        alert(`Error creating goal: ${error.message || 'Please try again.'}`);
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
        <title>Add New Goal | Performance Management</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Add New Goal</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Create a new SMART goal for {currentYear}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/hr/performance">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Goals
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Goal Details</CardTitle>
                <CardDescription>
                  Define your goal using the SMART framework: Specific, Measurable, Achievable, Relevant, Time-bound
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Goal Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter a clear, concise title for your goal"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                      />
                      {formErrors.title && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Goal Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your goal in detail, including what you want to achieve and why it's important"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={5}
                      />
                      {formErrors.description && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Key Metrics / Success Criteria</Label>
                      <p className="text-xs text-gray-500 mb-2">
                        Define how you will measure success for this goal
                      </p>
                      
                      {formData.keyMetrics.map((metric, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            placeholder={`Metric ${index + 1}, e.g., "Increase sales by 10%"`}
                            value={metric}
                            onChange={(e) => handleMetricChange(index, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeMetric(index)}
                            disabled={formData.keyMetrics.length === 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {formErrors.keyMetrics && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.keyMetrics}</p>
                      )}
                      
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
                    
                    <div>
                      <Label htmlFor="year">Year</Label>
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
                      <Label htmlFor="approver">Approver</Label>
                      <Select
                        value={formData.approverId}
                        onValueChange={(value) => handleInputChange("approverId", value)}
                      >
                        <SelectTrigger id="approver">
                          <SelectValue placeholder="Select an approver" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name} - {manager.role.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.approverId && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.approverId}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Select who should approve this goal
                      </p>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => router.push("/hr/performance")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={submitting}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={submitting}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Submit for Approval
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>SMART Goal Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Specific</h3>
                  <p className="text-sm text-gray-500">
                    Clearly define what you want to accomplish. Be precise about what, why, and how.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Measurable</h3>
                  <p className="text-sm text-gray-500">
                    Include specific metrics to track progress and know when you've achieved the goal.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Achievable</h3>
                  <p className="text-sm text-gray-500">
                    Ensure the goal is realistic and attainable given your resources and constraints.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Relevant</h3>
                  <p className="text-sm text-gray-500">
                    The goal should align with broader objectives and have a clear business value.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Time-bound</h3>
                  <p className="text-sm text-gray-500">
                    Set a clear timeline with deadlines for completion and milestones.
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Example Key Metrics</h3>
                  <ul className="text-sm text-gray-500 space-y-1 list-disc pl-5">
                    <li>Increase customer satisfaction score from 85% to 90% by Q4</li>
                    <li>Reduce project delivery time by 15% within 6 months</li>
                    <li>Complete certification with a score of at least 85%</li>
                    <li>Implement new process resulting in 10% cost reduction</li>
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