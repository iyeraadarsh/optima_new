
import React, { useState, useEffect, useCallback } from "react";
import { 
  PlusCircle, 
  Trash, 
  Edit, 
  Save, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PauseCircle,
  Target,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DevelopmentGoal, DevelopmentActivity } from "@/types/skills";
import { developmentService } from "@/services/developmentService";
import { useToast } from "@/hooks/use-toast";

interface DevelopmentPlanSectionProps {
  userId: string;
}

export default function DevelopmentPlanSection({ userId }: DevelopmentPlanSectionProps) {
  const { toast } = useToast();
  const [goals, setGoals] = useState<DevelopmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DevelopmentGoal | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalStatus, setGoalStatus] = useState<"not_started" | "in_progress" | "completed" | "on_hold">("not_started");
  const [targetDate, setTargetDate] = useState("");
  const [goalCategory, setGoalCategory] = useState("");
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalNotes, setGoalNotes] = useState("");
  
  // Activity state
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<DevelopmentGoal | null>(null);
  const [activities, setActivities] = useState<DevelopmentActivity[]>([]);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [activityStatus, setActivityStatus] = useState<"planned" | "completed" | "cancelled">("planned");
  const [activityDuration, setActivityDuration] = useState<number | undefined>(undefined);
  const [activityNotes, setActivityNotes] = useState("");
  const [editingActivity, setEditingActivity] = useState<DevelopmentActivity | null>(null);
  
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const userGoals = await developmentService.getUserGoals(userId);
      setGoals(userGoals);
    } catch (error) {
      console.error("Error fetching development goals:", error);
      toast({
        title: "Error",
        description: "Failed to load development goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);
  
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);
  
  const handleAddGoal = () => {
    setEditingGoal(null);
    setGoalTitle("");
    setGoalDescription("");
    setGoalStatus("not_started");
    setTargetDate("");
    setGoalCategory("");
    setGoalProgress(0);
    setGoalNotes("");
    setShowGoalDialog(true);
  };
  
  const handleEditGoal = (goal: DevelopmentGoal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalDescription(goal.description);
    setGoalStatus(goal.status);
    setTargetDate(goal.targetDate || "");
    setGoalCategory(goal.category || "");
    setGoalProgress(goal.progress || 0);
    setGoalNotes(goal.notes || "");
    setShowGoalDialog(true);
  };
  
  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm("Are you sure you want to delete this development goal?")) {
      try {
        await developmentService.deleteGoal(goalId);
        setGoals(goals.filter(goal => goal.id !== goalId));
        toast({
          title: "Success",
          description: "Development goal deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting development goal:", error);
        toast({
          title: "Error",
          description: "Failed to delete development goal. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) {
      toast({
        title: "Error",
        description: "Goal title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!goalDescription.trim()) {
      toast({
        title: "Error",
        description: "Goal description is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (editingGoal) {
        // Update existing goal
        const updateData: Partial<DevelopmentGoal> = {
          title: goalTitle,
          description: goalDescription,
          status: goalStatus,
          progress: goalProgress
        };
        
        // Only add optional fields if they have values
        if (targetDate) updateData.targetDate = targetDate;
        if (goalCategory) updateData.category = goalCategory;
        if (goalNotes) updateData.notes = goalNotes;
        
        await developmentService.updateGoal(editingGoal.id, updateData);
        
        // Update goal in the list
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === editingGoal.id 
              ? { 
                  ...goal, 
                  title: goalTitle,
                  description: goalDescription,
                  status: goalStatus,
                  targetDate: targetDate || undefined,
                  category: goalCategory || undefined,
                  progress: goalProgress,
                  notes: goalNotes || undefined,
                  updatedAt: Date.now()
                } 
              : goal
          )
        );
        
        toast({
          title: "Success",
          description: "Development goal updated successfully",
        });
      } else {
        // Create new goal with required fields
        const newGoalData = {
          userId,
          title: goalTitle,
          description: goalDescription,
          status: goalStatus,
          progress: goalProgress
        };
        
        // Create a new object for optional fields
        const optionalFields: Record<string, any> = {};
        
        // Only add optional fields if they have values
        if (targetDate) optionalFields.targetDate = targetDate;
        if (goalCategory) optionalFields.category = goalCategory;
        if (goalNotes) optionalFields.notes = goalNotes;
        
        // Combine required and optional fields
        const goalData = { ...newGoalData, ...optionalFields };
        
        console.log("Creating goal with data:", goalData);
        
        const newGoalId = await developmentService.createGoal(goalData);
        console.log("New goal created with ID:", newGoalId);
        
        // Add the new goal to the state
        const newGoal: DevelopmentGoal = {
          id: newGoalId,
          ...newGoalData,
          ...optionalFields,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        setGoals(prevGoals => [newGoal, ...prevGoals]);
        
        toast({
          title: "Success",
          description: "Development goal added successfully",
        });
      }
      
      // Close dialog
      setShowGoalDialog(false);
    } catch (error) {
      console.error("Error saving development goal:", error);
      toast({
        title: "Error",
        description: "Failed to save development goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleViewActivities = async (goal: DevelopmentGoal) => {
    try {
      setSelectedGoal(goal);
      const goalActivities = await developmentService.getGoalActivities(goal.id);
      setActivities(goalActivities);
      setShowActivityDialog(true);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast({
        title: "Error",
        description: "Failed to load activities. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddActivity = () => {
    setEditingActivity(null);
    setActivityTitle("");
    setActivityDescription("");
    setActivityDate("");
    setActivityStatus("planned");
    setActivityDuration(undefined);
    setActivityNotes("");
  };
  
  const handleEditActivity = (activity: DevelopmentActivity) => {
    setEditingActivity(activity);
    setActivityTitle(activity.title);
    setActivityDescription(activity.description || "");
    setActivityDate(activity.date);
    setActivityStatus(activity.status);
    setActivityDuration(activity.duration);
    setActivityNotes(activity.notes || "");
  };
  
  const handleDeleteActivity = async (activityId: string) => {
    if (!selectedGoal) return;
    
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        await developmentService.deleteActivity(activityId);
        setActivities(activities.filter(activity => activity.id !== activityId));
        toast({
          title: "Success",
          description: "Activity deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting activity:", error);
        toast({
          title: "Error",
          description: "Failed to delete activity. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleSaveActivity = async () => {
    if (!selectedGoal) return;
    
    try {
      if (!activityTitle.trim()) {
        toast({
          title: "Error",
          description: "Activity title is required",
          variant: "destructive",
        });
        return;
      }
      
      if (!activityDate) {
        toast({
          title: "Error",
          description: "Activity date is required",
          variant: "destructive",
        });
        return;
      }
      
      if (editingActivity) {
        // Update existing activity
        const updateData: Partial<DevelopmentActivity> = {
          title: activityTitle,
          date: activityDate,
          status: activityStatus
        };
        
        if (activityDescription) updateData.description = activityDescription;
        if (activityDuration !== undefined) updateData.duration = activityDuration;
        if (activityNotes) updateData.notes = activityNotes;
        
        await developmentService.updateActivity(editingActivity.id, updateData);
        
        // Update activity in the list
        setActivities(activities.map(activity => 
          activity.id === editingActivity.id 
            ? { 
                ...activity, 
                title: activityTitle,
                description: activityDescription || undefined,
                date: activityDate,
                status: activityStatus,
                duration: activityDuration,
                notes: activityNotes || undefined,
                updatedAt: Date.now()
              } 
            : activity
        ));
        
        toast({
          title: "Success",
          description: "Activity updated successfully",
        });
      } else {
        // Create new activity
        const activityData = {
          goalId: selectedGoal.id,
          userId,
          title: activityTitle,
          date: activityDate,
          status: activityStatus
        };
        
        // Add optional fields only if they have values
        const optionalFields: Record<string, any> = {};
        if (activityDescription) optionalFields.description = activityDescription;
        if (activityDuration !== undefined) optionalFields.duration = activityDuration;
        if (activityNotes) optionalFields.notes = activityNotes;
        
        // Combine required and optional fields
        const newActivityData = { ...activityData, ...optionalFields };
        
        const newActivityId = await developmentService.createActivity(newActivityData);
        
        // Add the new activity to the state
        const newActivity: DevelopmentActivity = {
          id: newActivityId,
          ...activityData,
          ...optionalFields,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        setActivities([newActivity, ...activities]);
        
        toast({
          title: "Success",
          description: "Activity added successfully",
        });
      }
      
      // Reset form
      handleAddActivity();
    } catch (error) {
      console.error("Error saving activity:", error);
      toast({
        title: "Error",
        description: "Failed to save activity. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return <Clock className="h-4 w-4 text-slate-500" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "on_hold":
        return <PauseCircle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "not_started":
        return "outline";
      case "in_progress":
        return "secondary";
      case "completed":
        return "default";
      case "on_hold":
        return "destructive";
      default:
        return "outline";
    }
  };
  
  const formatStatus = (status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };
  
  const filteredGoals = goals.filter(goal => {
    if (activeTab === "all") return true;
    return goal.status === activeTab;
  });
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Development Plan</h2>
        <Button onClick={handleAddGoal} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Goals</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="not_started">Not Started</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {filteredGoals.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-slate-50 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {activeTab === "all" 
              ? "You haven't added any development goals yet." 
              : `You don't have any ${formatStatus(activeTab).toLowerCase()} goals.`}
          </p>
          <Button onClick={handleAddGoal} variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Your First Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(goal.status)} className="ml-2">
                      <span className="flex items-center">
                        {getStatusIcon(goal.status)}
                        <span className="ml-1">{formatStatus(goal.status)}</span>
                      </span>
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleEditGoal(goal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600" 
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {goal.category && (
                  <Badge variant="outline" className="text-xs">
                    {goal.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {goal.description}
                </p>
                
                {goal.progress !== undefined && (
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                )}
                
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {goal.targetDate && (
                    <div className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created: {new Date(goal.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleViewActivities(goal)}
                >
                  View Activities
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Development Goal" : "Add New Development Goal"}</DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? "Update your development goal details" 
                : "Add a new development goal to your plan"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goalTitle">Goal Title</Label>
              <Input
                id="goalTitle"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g., Learn React Hooks, Improve Presentation Skills"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goalDescription">Description</Label>
              <Textarea
                id="goalDescription"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="Describe what you want to achieve with this goal"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalStatus">Status</Label>
                <Select 
                  value={goalStatus} 
                  onValueChange={(value: "not_started" | "in_progress" | "completed" | "on_hold") => setGoalStatus(value)}
                >
                  <SelectTrigger id="goalStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalCategory">Category (Optional)</Label>
                <Input
                  id="goalCategory"
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  placeholder="e.g., Technical, Soft Skills, Leadership"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goalProgress">Progress (%)</Label>
                <Input
                  id="goalProgress"
                  type="number"
                  min="0"
                  max="100"
                  value={goalProgress}
                  onChange={(e) => setGoalProgress(parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goalNotes">Notes (Optional)</Label>
              <Textarea
                id="goalNotes"
                value={goalNotes}
                onChange={(e) => setGoalNotes(e.target.value)}
                placeholder="Any additional notes or resources for this goal"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoal} disabled={submitting}>
              <Save className="h-4 w-4 mr-2" />
              {submitting ? "Saving..." : (editingGoal ? "Update Goal" : "Add Goal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Activities Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Activities for {selectedGoal?.title}</DialogTitle>
            <DialogDescription>
              Track activities related to this development goal
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Add New Activity</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="activityTitle" className="text-xs">Activity Title</Label>
                    <Input
                      id="activityTitle"
                      value={activityTitle}
                      onChange={(e) => setActivityTitle(e.target.value)}
                      placeholder="e.g., Online Course, Workshop"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="activityDate" className="text-xs">Date</Label>
                    <Input
                      id="activityDate"
                      type="date"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="activityStatus" className="text-xs">Status</Label>
                    <Select 
                      value={activityStatus} 
                      onValueChange={(value: "planned" | "completed" | "cancelled") => setActivityStatus(value)}
                    >
                      <SelectTrigger className="mt-1" id="activityStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="activityDuration" className="text-xs">Duration (minutes)</Label>
                    <Input
                      id="activityDuration"
                      type="number"
                      min="0"
                      value={activityDuration === undefined ? "" : activityDuration}
                      onChange={(e) => setActivityDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="e.g., 60"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="activityDescription" className="text-xs">Description</Label>
                  <Textarea
                    id="activityDescription"
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    placeholder="Describe this activity"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex justify-end">
                  {editingActivity ? (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleAddActivity}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveActivity}>
                        Update Activity
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={handleSaveActivity}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Activity
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Activity History</h3>
              {activities.length === 0 ? (
                <div className="text-center py-6 border rounded-md">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No activities recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            <Badge 
                              variant={activity.status === "completed" ? "default" : 
                                      activity.status === "cancelled" ? "destructive" : "outline"} 
                              className="ml-2 text-xs"
                            >
                              {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(activity.date).toLocaleDateString()}
                            {activity.duration && ` • ${activity.duration} minutes`}
                          </p>
                          {activity.description && (
                            <p className="text-sm mt-2">{activity.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0" 
                            onClick={() => handleEditActivity(activity)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600" 
                            onClick={() => handleDeleteActivity(activity.id)}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowActivityDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
