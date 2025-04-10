import React, { useState, useEffect } from "react";
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

export default function AddDepartmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("no-manager");
  const [parentDepartmentId, setParentDepartmentId] = useState("no-parent");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all departments for parent selection
        const allDepartments = await departmentService.getAllDepartments();
        setDepartments(allDepartments);
        
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate form
    if (!name.trim()) {
      setError("Department name is required");
      return;
    }
    
    setSaving(true);

    try {
      // Create department data object
      const departmentData = {
        name: name.trim(),
        description: description.trim() || undefined,
        managerId: managerId !== "no-manager" ? managerId : null,
        parentDepartmentId: parentDepartmentId !== "no-parent" ? parentDepartmentId : null
      };
      
      // Create department in Firestore
      const departmentId = await departmentService.createDepartment(departmentData);
      
      toast({
        title: "Department added",
        description: "The department has been added successfully.",
      });
      
      // Redirect to department details page
      router.push(`/hr/departments/${departmentId}`);
    } catch (error: any) {
      console.error("Error adding department:", error);
      setError(`Failed to add department: ${error.message || "Please try again."}`);
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

  return (
    <>
      <Head>
        <title>Add Department | HR Management</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/hr/departments">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Add Department</h1>
          </div>
          <Button type="submit" form="department-form" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Department"}
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
                Enter the details for the new department
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