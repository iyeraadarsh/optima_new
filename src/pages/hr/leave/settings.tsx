import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  Settings, 
  ArrowLeft, 
  Save, 
  RefreshCw,
  Calendar,
  Clock,
  Users,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import { leaveService } from "@/services/leaveService";
import { useAuth } from "@/contexts/AuthContext";

export default function LeaveSettingsPage() {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [generalSettings, setGeneralSettings] = useState({
    approvalRequired: true,
    allowHalfDay: true,
    maxConsecutiveDays: 14,
    minNoticeWorkDays: 3,
    allowNegativeBalance: false,
    allowWorkFromHome: true,
    workFromHomeApprovalRequired: true
  });
  const [newLeaveType, setNewLeaveType] = useState({
    name: "",
    description: "",
    color: "#4f46e5",
    defaultDays: 20,
    carryOver: true,
    maxCarryOverDays: 5,
    paid: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // Fetch leave types
        const types = await leaveService.getLeaveTypes();
        setLeaveTypes(types);
        
        // Fetch general settings
        const settings = await leaveService.getLeaveSettings();
        if (settings) {
          setGeneralSettings({
            approvalRequired: settings.approvalRequired !== undefined ? settings.approvalRequired : true,
            allowHalfDay: settings.allowHalfDay !== undefined ? settings.allowHalfDay : true,
            maxConsecutiveDays: settings.maxConsecutiveDays || 14,
            minNoticeWorkDays: settings.minNoticeWorkDays || 3,
            allowNegativeBalance: settings.allowNegativeBalance !== undefined ? settings.allowNegativeBalance : false,
            allowWorkFromHome: settings.allowWorkFromHome !== undefined ? settings.allowWorkFromHome : true,
            workFromHomeApprovalRequired: settings.workFromHomeApprovalRequired !== undefined ? settings.workFromHomeApprovalRequired : true
          });
        }
      } catch (error) {
        console.error("Error fetching leave settings:", error);
        alert("Error loading settings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleGeneralSettingChange = (field: string, value: any) => {
    setGeneralSettings({
      ...generalSettings,
      [field]: value
    });
  };

  const handleNewLeaveTypeChange = (field: string, value: any) => {
    setNewLeaveType({
      ...newLeaveType,
      [field]: value
    });
  };

  const handleSaveGeneralSettings = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      
      // Check if user has admin permissions
      if (userProfile?.role !== "admin" && userProfile?.role !== "super_admin") {
        alert("You don't have permission to modify these settings.");
        return;
      }
      
      await leaveService.updateLeaveSettings(generalSettings);
      
      alert("Leave settings updated successfully!");
    } catch (error) {
      console.error("Error saving leave settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLeaveType = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      
      // Check if user has admin permissions
      if (userProfile?.role !== "admin" && userProfile?.role !== "super_admin") {
        alert("You don't have permission to add leave types.");
        return;
      }
      
      // Validate
      if (!newLeaveType.name.trim()) {
        alert("Leave type name is required.");
        return;
      }
      
      await leaveService.createLeaveType(newLeaveType);
      
      // Refresh leave types
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
      
      // Reset form
      setNewLeaveType({
        name: "",
        description: "",
        color: "#4f46e5",
        defaultDays: 20,
        carryOver: true,
        maxCarryOverDays: 5,
        paid: true
      });
      
      alert("Leave type added successfully!");
    } catch (error) {
      console.error("Error adding leave type:", error);
      alert("Error adding leave type. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLeaveType = async (id: string) => {
    if (!currentUser) return;
    
    try {
      // Check if user has admin permissions
      if (userProfile?.role !== "admin" && userProfile?.role !== "super_admin") {
        alert("You don't have permission to delete leave types.");
        return;
      }
      
      // Confirm deletion
      if (!confirm("Are you sure you want to delete this leave type? This action cannot be undone.")) {
        return;
      }
      
      await leaveService.deleteLeaveType(id);
      
      // Refresh leave types
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
      
      alert("Leave type deleted successfully!");
    } catch (error) {
      console.error("Error deleting leave type:", error);
      alert("Error deleting leave type. Please try again.");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Check if user has admin permissions
  const hasAdminAccess = userProfile?.role === "admin" || userProfile?.role === "super_admin";
  
  if (!hasAdminAccess) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">You don't have permission to access this page.</p>
            <Button asChild className="mt-4">
              <Link href="/hr/leave">
                Back to Leave Management
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Head>
        <title>Leave Settings | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Leave Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Configure leave management settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/hr/leave">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leave Management
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="general" onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
            <TabsTrigger value="work-from-home">Work From Home</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>General Leave Settings</CardTitle>
                <CardDescription>
                  Configure how leave management works in your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="approvalRequired">Require Approval</Label>
                      <p className="text-xs text-gray-500">
                        Require manager approval for leave requests
                      </p>
                    </div>
                    <Switch
                      id="approvalRequired"
                      checked={generalSettings.approvalRequired}
                      onCheckedChange={(checked) => handleGeneralSettingChange("approvalRequired", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowHalfDay">Allow Half-Day Requests</Label>
                      <p className="text-xs text-gray-500">
                        Allow employees to request half-day leave
                      </p>
                    </div>
                    <Switch
                      id="allowHalfDay"
                      checked={generalSettings.allowHalfDay}
                      onCheckedChange={(checked) => handleGeneralSettingChange("allowHalfDay", checked)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxConsecutiveDays">Maximum Consecutive Days</Label>
                    <Input
                      id="maxConsecutiveDays"
                      type="number"
                      min="1"
                      max="365"
                      value={generalSettings.maxConsecutiveDays}
                      onChange={(e) => handleGeneralSettingChange("maxConsecutiveDays", parseInt(e.target.value))}
                      className="w-full md:w-1/3 mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum number of consecutive days an employee can take leave
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="minNoticeWorkDays">Minimum Notice (Work Days)</Label>
                    <Input
                      id="minNoticeWorkDays"
                      type="number"
                      min="0"
                      max="90"
                      value={generalSettings.minNoticeWorkDays}
                      onChange={(e) => handleGeneralSettingChange("minNoticeWorkDays", parseInt(e.target.value))}
                      className="w-full md:w-1/3 mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum number of work days notice required for leave requests
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowNegativeBalance">Allow Negative Balance</Label>
                      <p className="text-xs text-gray-500">
                        Allow employees to have a negative leave balance
                      </p>
                    </div>
                    <Switch
                      id="allowNegativeBalance"
                      checked={generalSettings.allowNegativeBalance}
                      onCheckedChange={(checked) => handleGeneralSettingChange("allowNegativeBalance", checked)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveGeneralSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="leave-types" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Types</CardTitle>
                <CardDescription>
                  Manage the types of leave available in your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Current Leave Types</h3>
                  
                  {leaveTypes.length === 0 ? (
                    <p className="text-gray-500">No leave types defined yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {leaveTypes.map((type) => (
                        <div key={type.id} className="border rounded-lg p-4 relative">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: type.color || "#4f46e5" }}
                            />
                            <h4 className="font-medium">{type.name}</h4>
                          </div>
                          
                          <p className="text-sm text-gray-500 mb-2">
                            {type.description || "No description"}
                          </p>
                          
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span>Default Days:</span>
                              <span>{type.defaultDays || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Carry Over:</span>
                              <span>{type.carryOver ? "Yes" : "No"}</span>
                            </div>
                            {type.carryOver && (
                              <div className="flex justify-between">
                                <span>Max Carry Over:</span>
                                <span>{type.maxCarryOverDays || 0} days</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Paid:</span>
                              <span>{type.paid ? "Yes" : "No"}</span>
                            </div>
                          </div>
                          
                          <div className="absolute top-2 right-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteLeaveType(type.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-6 border-t mt-6">
                    <h3 className="text-lg font-medium mb-4">Add New Leave Type</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={newLeaveType.name}
                          onChange={(e) => handleNewLeaveTypeChange("name", e.target.value)}
                          placeholder="e.g., Annual Leave, Sick Leave"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={newLeaveType.description}
                          onChange={(e) => handleNewLeaveTypeChange("description", e.target.value)}
                          placeholder="Brief description of this leave type"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="color">Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="color"
                            value={newLeaveType.color}
                            onChange={(e) => handleNewLeaveTypeChange("color", e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <span className="text-sm text-gray-500">
                            Choose a color for this leave type
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="defaultDays">Default Days Per Year</Label>
                        <Input
                          id="defaultDays"
                          type="number"
                          min="0"
                          max="365"
                          value={newLeaveType.defaultDays}
                          onChange={(e) => handleNewLeaveTypeChange("defaultDays", parseInt(e.target.value))}
                          className="w-full md:w-1/3"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="carryOver">Allow Carry Over</Label>
                          <p className="text-xs text-gray-500">
                            Allow unused days to carry over to next year
                          </p>
                        </div>
                        <Switch
                          id="carryOver"
                          checked={newLeaveType.carryOver}
                          onCheckedChange={(checked) => handleNewLeaveTypeChange("carryOver", checked)}
                        />
                      </div>
                      
                      {newLeaveType.carryOver && (
                        <div>
                          <Label htmlFor="maxCarryOverDays">Maximum Carry Over Days</Label>
                          <Input
                            id="maxCarryOverDays"
                            type="number"
                            min="0"
                            max="365"
                            value={newLeaveType.maxCarryOverDays}
                            onChange={(e) => handleNewLeaveTypeChange("maxCarryOverDays", parseInt(e.target.value))}
                            className="w-full md:w-1/3"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="paid">Paid Leave</Label>
                          <p className="text-xs text-gray-500">
                            Is this a paid leave type?
                          </p>
                        </div>
                        <Switch
                          id="paid"
                          checked={newLeaveType.paid}
                          onCheckedChange={(checked) => handleNewLeaveTypeChange("paid", checked)}
                        />
                      </div>
                      
                      <div className="pt-4">
                        <Button onClick={handleAddLeaveType} disabled={saving}>
                          {saving ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Leave Type
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="work-from-home" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Work From Home Settings</CardTitle>
                <CardDescription>
                  Configure work from home policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowWorkFromHome">Allow Work From Home</Label>
                      <p className="text-xs text-gray-500">
                        Enable work from home functionality
                      </p>
                    </div>
                    <Switch
                      id="allowWorkFromHome"
                      checked={generalSettings.allowWorkFromHome}
                      onCheckedChange={(checked) => handleGeneralSettingChange("allowWorkFromHome", checked)}
                    />
                  </div>
                  
                  {generalSettings.allowWorkFromHome && (
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="workFromHomeApprovalRequired">Require Approval</Label>
                        <p className="text-xs text-gray-500">
                          Require manager approval for work from home requests
                        </p>
                      </div>
                      <Switch
                        id="workFromHomeApprovalRequired"
                        checked={generalSettings.workFromHomeApprovalRequired}
                        onCheckedChange={(checked) => handleGeneralSettingChange("workFromHomeApprovalRequired", checked)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveGeneralSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}