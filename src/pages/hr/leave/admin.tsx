import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { 
  Plus, 
  Edit, 
  Trash, 
  Settings, 
  Calendar, 
  CircleDot,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { leaveService } from "@/services/leaveService";
import { LeaveType, LeavePolicy } from "@/types";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/ui/use-toast";
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
} from '@/components/ui/alert-dialog';

export default function LeaveAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leave-types");
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);
  const [isAddPolicyDialogOpen, setIsAddPolicyDialogOpen] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState<Partial<LeaveType>>({
    name: "",
    description: "",
    color: "#4CAF50",
    requiresApproval: true,
    paid: true,
    maxDaysPerYear: 20,
    carryOver: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch leave types
        const types = await leaveService.getLeaveTypes();
        setLeaveTypes(types);
        
        // Fetch leave policies
        const policies = await leaveService.getLeavePolicies();
        setLeavePolicies(policies);
      } catch (error) {
        console.error("Error fetching leave admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAddLeaveType = async () => {
    try {
      setSubmitting(true);
      
      if (!newLeaveType.name || !newLeaveType.description) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }
      
      await leaveService.createLeaveType(newLeaveType);
      
      // Refresh leave types
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
      
      // Reset form and close dialog
      setNewLeaveType({
        name: "",
        description: "",
        color: "#4CAF50",
        requiresApproval: true,
        paid: true,
        maxDaysPerYear: 20,
        carryOver: false
      });
      
      toast({
        title: "Success",
        description: "Leave type created successfully",
        variant: "default"
      });
      
      setIsAddTypeDialogOpen(false);
    } catch (error) {
      console.error("Error adding leave type:", error);
      toast({
        title: "Error",
        description: "Failed to create leave type. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLeaveType = (id: string) => {
    setLeaveTypeToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteLeaveType = async () => {
    if (!leaveTypeToDelete) return;
    
    try {
      setSubmitting(true);
      await leaveService.deleteLeaveType(leaveTypeToDelete);
      
      // Refresh leave types
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
      
      toast({
        title: 'Success',
        description: 'Leave type deleted successfully',
        variant: 'default'
      });
      
      setIsDeleteDialogOpen(false);
      setLeaveTypeToDelete(null);
    } catch (error) {
      console.error('Error deleting leave type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete leave type. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <Head>
        <title>Leave Administration | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Leave Administration</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Configure leave types, policies, and settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/hr/leave">
                Back to Leave Dashboard
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="leave-types" onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
            <TabsTrigger value="leave-policies">Leave Policies</TabsTrigger>
            <TabsTrigger value="year-end-processing">Year-End Processing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leave-types" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Leave Types</h2>
              <Button onClick={() => setIsAddTypeDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Leave Type
              </Button>
            </div>
            
            <Card>
              <CardContent className="py-6">
                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Loading leave types...</p>
                  </div>
                ) : leaveTypes.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No leave types defined yet
                    </p>
                    <Button onClick={() => setIsAddTypeDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Leave Type
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3">Name</th>
                          <th className="text-left py-3">Description</th>
                          <th className="text-center py-3">Days/Year</th>
                          <th className="text-center py-3">Paid</th>
                          <th className="text-center py-3">Approval</th>
                          <th className="text-center py-3">Carry Over</th>
                          <th className="text-right py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveTypes.map((type) => (
                          <tr key={type.id} className="border-b">
                            <td className="py-3">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: type.color }}
                                />
                                {type.name}
                              </div>
                            </td>
                            <td className="py-3">{type.description}</td>
                            <td className="text-center py-3">{type.maxDaysPerYear || "N/A"}</td>
                            <td className="text-center py-3">
                              {type.paid ? (
                                <span className="text-green-500">Yes</span>
                              ) : (
                                <span className="text-red-500">No</span>
                              )}
                            </td>
                            <td className="text-center py-3">
                              {type.requiresApproval ? (
                                <span className="text-blue-500">Required</span>
                              ) : (
                                <span>Not Required</span>
                              )}
                            </td>
                            <td className="text-center py-3">
                              {type.carryOver ? (
                                <span className="text-green-500">
                                  Yes {type.carryOverLimit ? `(Max ${type.carryOverLimit})` : ""}
                                </span>
                              ) : (
                                <span className="text-red-500">No</span>
                              )}
                            </td>
                            <td className='text-right py-3'>
                              <div className='flex justify-end space-x-2'>
                                <Button 
                                  variant='ghost' 
                                  size='sm'
                                  asChild
                                >
                                  <Link href={`/hr/leave/type/${type.id}`}>
                                    <Edit className='h-4 w-4' />
                                  </Link>
                                </Button>
                                <Button 
                                  variant='ghost' 
                                  size='sm' 
                                  className='text-red-500'
                                  onClick={() => handleDeleteLeaveType(type.id)}
                                >
                                  <Trash className='h-4 w-4' />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Add Leave Type Dialog */}
            <Dialog open={isAddTypeDialogOpen} onOpenChange={setIsAddTypeDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Leave Type</DialogTitle>
                  <DialogDescription>
                    Create a new leave type for employees to request
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newLeaveType.name}
                      onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={newLeaveType.description}
                      onChange={(e) => setNewLeaveType({ ...newLeaveType, description: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="color" className="text-right">
                      Color
                    </Label>
                    <div className="flex col-span-3 space-x-2">
                      <Input
                        id="color"
                        type="color"
                        value={newLeaveType.color}
                        onChange={(e) => setNewLeaveType({ ...newLeaveType, color: e.target.value })}
                        className="w-12"
                      />
                      <Input
                        value={newLeaveType.color}
                        onChange={(e) => setNewLeaveType({ ...newLeaveType, color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="maxDays" className="text-right">
                      Days per Year
                    </Label>
                    <Input
                      id="maxDays"
                      type="number"
                      value={newLeaveType.maxDaysPerYear}
                      onChange={(e) => setNewLeaveType({ ...newLeaveType, maxDaysPerYear: parseInt(e.target.value) })}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Paid Leave</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch
                        checked={newLeaveType.paid}
                        onCheckedChange={(checked) => setNewLeaveType({ ...newLeaveType, paid: checked })}
                      />
                      <Label>{newLeaveType.paid ? "Yes" : "No"}</Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Requires Approval</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch
                        checked={newLeaveType.requiresApproval}
                        onCheckedChange={(checked) => setNewLeaveType({ ...newLeaveType, requiresApproval: checked })}
                      />
                      <Label>{newLeaveType.requiresApproval ? "Yes" : "No"}</Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Carry Over</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch
                        checked={newLeaveType.carryOver}
                        onCheckedChange={(checked) => setNewLeaveType({ ...newLeaveType, carryOver: checked })}
                      />
                      <Label>{newLeaveType.carryOver ? "Yes" : "No"}</Label>
                    </div>
                  </div>
                  
                  {newLeaveType.carryOver && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="carryOverLimit" className="text-right">
                        Carry Over Limit
                      </Label>
                      <Input
                        id="carryOverLimit"
                        type="number"
                        value={newLeaveType.carryOverLimit || ""}
                        onChange={(e) => setNewLeaveType({ ...newLeaveType, carryOverLimit: parseInt(e.target.value) })}
                        className="col-span-3"
                        placeholder="No limit if empty"
                      />
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddTypeDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddLeaveType}
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Leave Type'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the leave type
                    and may affect existing leave balances and requests.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={confirmDeleteLeaveType}
                    className='bg-red-600 hover:bg-red-700'
                    disabled={submitting}
                  >
                    {submitting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
          
          <TabsContent value="leave-policies" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Leave Policies</h2>
              <Button onClick={() => setIsAddPolicyDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Policy
              </Button>
            </div>
            
            <Card>
              <CardContent className="py-6">
                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Loading leave policies...</p>
                  </div>
                ) : leavePolicies.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No leave policies defined yet
                    </p>
                    <Button onClick={() => setIsAddPolicyDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Policy
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leavePolicies.map((policy) => (
                      <Card key={policy.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle>{policy.name}</CardTitle>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CardDescription>{policy.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium mb-2">Policy Settings</h3>
                              <ul className="space-y-1 text-sm">
                                <li className="flex justify-between">
                                  <span className="text-gray-500">Minimum Service:</span>
                                  <span>{policy.minimumServiceDays} days</span>
                                </li>
                                <li className="flex justify-between">
                                  <span className="text-gray-500">Notice Required:</span>
                                  <span>{policy.noticeRequired} days</span>
                                </li>
                                <li className="flex justify-between">
                                  <span className="text-gray-500">Max Consecutive Days:</span>
                                  <span>{policy.maxConsecutiveDays || "No limit"}</span>
                                </li>
                                <li className="flex justify-between">
                                  <span className="text-gray-500">Working Days:</span>
                                  <span>
                                    {policy.workingDays.map(day => {
                                      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                                      return days[day];
                                    }).join(", ")}
                                  </span>
                                </li>
                              </ul>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium mb-2">Leave Types</h3>
                              <div className="space-y-1">
                                {policy.defaultLeaveTypes.map(typeId => {
                                  const leaveType = leaveTypes.find(lt => lt.id === typeId);
                                  return leaveType ? (
                                    <div key={typeId} className="flex items-center">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-2" 
                                        style={{ backgroundColor: leaveType.color }}
                                      />
                                      <span>{leaveType.name}</span>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="year-end-processing" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Year-End Processing</h2>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Year-End Leave Balance Processing</CardTitle>
                <CardDescription>
                  Manage leave balance carry-over and reset for the new year
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800 mb-1">Year-End Processing</h3>
                    <p className="text-sm text-amber-700">
                      Year-end processing will calculate carry-over balances based on leave type settings and reset annual leave 
                      entitlements for the new year. This process should be run once at the end of each calendar year.
                    </p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-4">Current Year Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Current Year</div>
                      <div className="text-2xl font-bold">{new Date().getFullYear()}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Employees with Balance</div>
                      <div className="text-2xl font-bold">24</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Leave Types</div>
                      <div className="text-2xl font-bold">{leaveTypes.length}</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-4">Carry-Over Preview</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Leave Type</th>
                        <th className="text-right py-2">Total Remaining</th>
                        <th className="text-right py-2">Eligible for Carry-Over</th>
                        <th className="text-right py-2">Carry-Over Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveTypes.map((type) => (
                        <tr key={type.id} className="border-b">
                          <td className="py-2">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: type.color }}
                              />
                              {type.name}
                            </div>
                          </td>
                          <td className="text-right py-2">
                            {Math.floor(Math.random() * 100)} days
                          </td>
                          <td className="text-right py-2">
                            {type.carryOver ? "Yes" : "No"}
                          </td>
                          <td className="text-right py-2">
                            {type.carryOver 
                              ? `${Math.floor(Math.random() * 50)} days` 
                              : "0 days"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-4">Year-End Processing Options</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox id="resetBalances" />
                      <div>
                        <Label htmlFor="resetBalances" className="font-medium">Reset Annual Leave Balances</Label>
                        <p className="text-sm text-gray-500">
                          Reset all annual leave entitlements for the new year based on leave type settings
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox id="processCarryOver" defaultChecked />
                      <div>
                        <Label htmlFor="processCarryOver" className="font-medium">Process Carry-Over Balances</Label>
                        <p className="text-sm text-gray-500">
                          Calculate and apply carry-over balances based on leave type settings
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox id="generateReport" defaultChecked />
                      <div>
                        <Label htmlFor="generateReport" className="font-medium">Generate Year-End Report</Label>
                        <p className="text-sm text-gray-500">
                          Create a detailed report of all leave balances and carry-over calculations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Current Balances
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline">Preview Processing</Button>
                    <Button>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Run Year-End Processing
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}