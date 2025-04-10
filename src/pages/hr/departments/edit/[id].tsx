import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Save, Building2, User as UserIcon, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { departmentService } from "@/services/departmentService";
import { userService } from "@/services/userService";
import { Department, User } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function EditDepartmentPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("no-manager");
  const [parentDepartmentId, setParentDepartmentId] = useState("no-parent");

  // Helper function to check if a department is a child of another
  const isChildDepartment = useCallback((departments: Department[], departmentId: string, parentId: string): boolean => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return false;
    if (department.parentDepartmentId === parentId) return true;
    if (department.parentDepartmentId) {
      return isChildDepartment(departments, department.parentDepartmentId, parentId);
    }
    return false;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch department details
        const departmentData = await departmentService.getDepartment(id as string);
        if (!departmentData) {
          setError("Department not found");
          return;
        }
        
        setDepartment(departmentData);
        
        // Set form fields
        setName(departmentData.name);
        setDescription(departmentData.description || "");
        setManagerId(departmentData.managerId || "no-manager");
        setParentDepartmentId(departmentData.parentDepartmentId || "no-parent");
        
        // Fetch all departments for parent selection
        const allDepartments = await departmentService.getAllDepartments();
        // Filter out the current department and its children to prevent circular references
        const filteredDepartments = allDepartments.filter(dept => 
          dept.id !== id && 
          !isChildDepartment(allDepartments, dept.id, id as string)
        );
        setDepartments(filteredDepartments);
        
        // Fetch all users who can be managers (filtering by role)
        const allUsers = await userService.getAllUsers();
        const potentialManagers = allUsers.filter(user => 
          ["manager", "department_manager", "leader", "director"].includes(user.role || "")
        );
        setManagers(potentialManagers);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isChildDepartment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!department) return;
    
    setError("");
    
    // Validate form
    if (!name.trim()) {
      setError("Department name is required");
      return;
    }
    
    setSaving(true);

    try {
      // Create update data object
      const updateData: Partial<Department> = {
        name: name.trim(),
        description: description.trim() || undefined,
        managerId: managerId !== "no-manager" ? managerId : null,
        parentDepartmentId: parentDepartmentId !== "no-parent" ? parentDepartmentId : null
      };
      
      // Update department in Firestore
      await departmentService.updateDepartment(department.id, updateData);
      
      toast({
        title: "Department updated",
        description: "The department has been updated successfully.",
      });
      
      // Redirect to department details page
      router.push(`/hr/departments/${department.id}`);
    } catch (error: any) {
      console.error("Error updating department:", error);
      setError(`Failed to update department: ${error.message || "Please try again."}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error && !department) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
        <Button asChild>
          <Link href="/hr/departments">
            Return to Departments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Department | HR Management</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/hr/departments/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Department</h1>
          </div>
          <Button type="submit" form="department-form" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form id="department-form" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Department Information</CardTitle>
              <CardDescription>
                Update the details for this department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Department Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      placeholder="Engineering"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Textarea
                      id="description"
                      placeholder="Department responsibilities and purpose..."
                      className="pl-10 min-h-[100px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manager">Department Manager</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Select value={managerId} onValueChange={setManagerId}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-manager">No Manager</SelectItem>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name} - {manager.jobDetails?.title || manager.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parentDepartment">Parent Department</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Select value={parentDepartmentId} onValueChange={setParentDepartmentId}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select parent department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-parent">No Parent (Top-level Department)</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
