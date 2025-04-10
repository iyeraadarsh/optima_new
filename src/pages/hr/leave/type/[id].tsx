import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { 
  Save, 
  Trash, 
  ArrowLeft, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { MainLayout } from "@/components/layout/MainLayout";
import { leaveService } from "@/services/leaveService";
import { useToast } from "@/components/ui/use-toast";
import { LeaveType } from "@/types";
import Link from "next/link";

export default function LeaveTypeDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [leaveType, setLeaveType] = useState<LeaveType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LeaveType>>({
    name: "",
    description: "",
    color: "#4CAF50",
    requiresApproval: true,
    paid: true,
    maxDaysPerYear: 20,
    carryOver: false,
    carryOverLimit: 5
  });

  useEffect(() => {
    const fetchLeaveType = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const fetchedLeaveType = await leaveService.getLeaveType(id as string);
        
        if (fetchedLeaveType) {
          setLeaveType(fetchedLeaveType);
          setFormData({
            name: fetchedLeaveType.name,
            description: fetchedLeaveType.description,
            color: fetchedLeaveType.color,
            requiresApproval: fetchedLeaveType.requiresApproval,
            paid: fetchedLeaveType.paid,
            maxDaysPerYear: fetchedLeaveType.maxDaysPerYear,
            carryOver: fetchedLeaveType.carryOver,
            carryOverLimit: fetchedLeaveType.carryOverLimit
          });
        } else {
          toast({
            title: "Error",
            description: "Leave type not found",
            variant: "destructive"
          });
          router.push("/hr/leave/admin");
        }
      } catch (error) {
        console.error("Error fetching leave type:", error);
        toast({
          title: "Error",
          description: "Failed to load leave type details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveType();
  }, [id, router, toast]);

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSave = async () => {
    if (!id || !formData.name || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // Convert to proper format for Firestore
      const updateData = {
        ...formData,
        maxDaysPerYear: formData.maxDaysPerYear ? Number(formData.maxDaysPerYear) : undefined,
        carryOverLimit: formData.carryOverLimit ? Number(formData.carryOverLimit) : undefined
      };
      
      await leaveService.updateLeaveType(id as string, updateData);
      
      toast({
        title: "Success",
        description: "Leave type updated successfully",
        variant: "default"
      });
      
      // Refresh the data
      const updatedLeaveType = await leaveService.getLeaveType(id as string);
      if (updatedLeaveType) {
        setLeaveType(updatedLeaveType);
      }
      
      // Navigate back to admin page
      router.push("/hr/leave/admin");
    } catch (error) {
      console.error("Error updating leave type:", error);
      toast({
        title: "Error",
        description: "Failed to update leave type",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setDeleting(true);
      await leaveService.deleteLeaveType(id as string);
      
      toast({
        title: "Success",
        description: "Leave type deleted successfully",
        variant: "default"
      });
      
      router.push("/hr/leave/admin");
    } catch (error) {
      console.error("Error deleting leave type:", error);
      toast({
        title: "Error",
        description: "Failed to delete leave type",
        variant: "destructive"
      });
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <Head>
        <title>{loading ? "Loading..." : `${leaveType?.name} | Leave Type Details`}</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button asChild variant="outline" className="mb-2">
              <Link href="/hr/leave/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leave Administration
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{loading ? "Loading..." : leaveType?.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              View and edit leave type details
            </p>
          </div>
          <div className="flex gap-2">
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loading || deleting}>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Leave Type
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the leave type
                    and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button 
              onClick={handleSave}
              disabled={loading || saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
        
        {loading ? (
          <Card>
            <CardContent className="py-10">
              <div className="flex justify-center">
                <div className="h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
              </div>
              <p className="text-center mt-4 text-gray-500">Loading leave type details...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Leave Type Details</CardTitle>
                  <CardDescription>
                    Edit the details of this leave type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
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
                        value={formData.color}
                        onChange={(e) => handleInputChange("color", e.target.value)}
                        className="w-12"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => handleInputChange("color", e.target.value)}
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
                      value={formData.maxDaysPerYear}
                      onChange={(e) => handleInputChange("maxDaysPerYear", parseInt(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Paid Leave</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch
                        checked={formData.paid}
                        onCheckedChange={(checked) => handleInputChange("paid", checked)}
                      />
                      <Label>{formData.paid ? "Yes" : "No"}</Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Requires Approval</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch
                        checked={formData.requiresApproval}
                        onCheckedChange={(checked) => handleInputChange("requiresApproval", checked)}
                      />
                      <Label>{formData.requiresApproval ? "Yes" : "No"}</Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Carry Over</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch
                        checked={formData.carryOver}
                        onCheckedChange={(checked) => handleInputChange("carryOver", checked)}
                      />
                      <Label>{formData.carryOver ? "Yes" : "No"}</Label>
                    </div>
                  </div>
                  
                  {formData.carryOver && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="carryOverLimit" className="text-right">
                        Carry Over Limit
                      </Label>
                      <Input
                        id="carryOverLimit"
                        type="number"
                        value={formData.carryOverLimit || ""}
                        onChange={(e) => handleInputChange("carryOverLimit", parseInt(e.target.value))}
                        className="col-span-3"
                        placeholder="No limit if empty"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/hr/leave/admin")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Leave Type Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="w-full h-12 rounded-md" 
                    style={{ backgroundColor: formData.color }}
                  ></div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Days per Year:</span>
                      <span className="font-medium">{formData.maxDaysPerYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paid:</span>
                      <span className="font-medium">{formData.paid ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Requires Approval:</span>
                      <span className="font-medium">{formData.requiresApproval ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Carry Over:</span>
                      <span className="font-medium">
                        {formData.carryOver 
                          ? `Yes (Max ${formData.carryOverLimit || "Unlimited"})` 
                          : "No"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-2">Created</h3>
                    <p className="text-sm text-gray-500">
                      {leaveType?.createdAt 
                        ? format(new Date(leaveType.createdAt), "PPP 'at' p") 
                        : "Unknown"}
                    </p>
                    
                    <h3 className="text-sm font-medium mb-2 mt-4">Last Updated</h3>
                    <p className="text-sm text-gray-500">
                      {leaveType?.updatedAt 
                        ? format(new Date(leaveType.updatedAt), "PPP 'at' p") 
                        : "Unknown"}
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start mt-6">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800 mb-1">Warning</h3>
                      <p className="text-sm text-amber-700">
                        Changes to leave types may affect existing leave balances and requests.
                        Be careful when modifying settings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}