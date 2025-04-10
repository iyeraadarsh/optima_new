import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash, Edit, Check, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { departmentService } from "@/services/departmentService";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { Department, User } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function DepartmentsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Department form
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [departmentManager, setDepartmentManager] = useState('');
  const [parentDepartment, setParentDepartment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch departments
        const allDepartments = await departmentService.getAllDepartments();
        setDepartments(allDepartments);
        
        // Fetch managers (users who can manage departments)
        const allUsers = await userService.getAllUsers();
        const potentialManagers = allUsers.filter(user => 
          ["super_admin", "admin", "director", "leader", "department_manager", "manager"].includes(user.role)
        );
        setManagers(potentialManagers);
      } catch (error) {
        console.error('Error fetching departments data:', error);
        setError('Failed to load departments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name);
    setDepartmentDescription(department.description || '');
    // Fix the TypeScript error by handling null values properly
    setDepartmentManager(department.managerId || '');
    setParentDepartment(department.parentDepartmentId || '');
    setShowDepartmentDialog(true);
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (window.confirm("Are you sure you want to delete this department? This may affect users and positions assigned to this department.")) {
      try {
        await departmentService.deleteDepartment(departmentId);
        setDepartments(departments.filter(department => department.id !== departmentId));
        toast({
          title: 'Department deleted',
          description: 'The department has been deleted successfully.',
        });
      } catch (error) {
        console.error("Error deleting department:", error);
        setError("Failed to delete department. Please try again.");
      }
    }
  };

  const handleSaveDepartment = async () => {
    try {
      if (!departmentName.trim()) {
        setError('Department name is required');
        return;
      }
      
      if (!departmentManager) {
        setError('Department manager is required');
        return;
      }
      
      const departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'> = {
        name: departmentName,
        description: departmentDescription,
        managerId: departmentManager,
        parentDepartmentId: parentDepartment && parentDepartment !== 'none' ? parentDepartment : undefined
      };
      
      if (editingDepartment) {
        // Update existing department
        await departmentService.updateDepartment(editingDepartment.id, departmentData);
        
        // Update department in the list
        setDepartments(departments.map(department => 
          department.id === editingDepartment.id 
            ? { ...editingDepartment, ...departmentData, updatedAt: new Date().toISOString() } 
            : department
        ));
        
        toast({
          title: 'Department updated',
          description: `The department '${departmentName}' has been updated successfully.`,
        });
      } else {
        // Create new department
        const newDepartmentId = await departmentService.createDepartment(departmentData);
        
        // Add new department to the list
        const newDepartment: Department = {
          id: newDepartmentId,
          ...departmentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setDepartments([...departments, newDepartment]);
        
        toast({
          title: 'Department created',
          description: `The department '${departmentName}' has been created successfully.`,
        });
      }
      
      // Reset form and close dialog
      resetForm();
      setShowDepartmentDialog(false);
    } catch (error) {
      console.error('Error saving department:', error);
      setError('Failed to save department. Please try again.');
    }
  };

  const resetForm = () => {
    setEditingDepartment(null);
    setDepartmentName('');
    setDepartmentDescription('');
    setDepartmentManager('');
    setParentDepartment('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Department Management | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Department Management</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/users/positions">
                Manage Positions
              </Link>
            </Button>
            <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Department
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingDepartment ? "Edit Department" : "Create New Department"}</DialogTitle>
                  <DialogDescription>
                    {editingDepartment 
                      ? "Update the details for this department" 
                      : "Define a new department for your organization"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="departmentName">Department Name</Label>
                      <Input
                        id="departmentName"
                        value={departmentName}
                        onChange={(e) => setDepartmentName(e.target.value)}
                        placeholder="e.g., Engineering"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="departmentDescription">Description</Label>
                      <Textarea
                        id="departmentDescription"
                        value={departmentDescription}
                        onChange={(e) => setDepartmentDescription(e.target.value)}
                        placeholder="Describe the purpose and responsibilities of this department"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="departmentManager">Department Manager</Label>
                      <Select value={departmentManager} onValueChange={setDepartmentManager} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name} - {manager.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className='space-y-2'>
                      <Label htmlFor='parentDepartment'>Parent Department (Optional)</Label>
                      <Select 
                        value={parentDepartment} 
                        onValueChange={(value) => setParentDepartment(value === 'none' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select parent department' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>No Parent Department</SelectItem>
                          {departments
                            .filter(dept => dept.id !== editingDepartment?.id) // Prevent circular reference
                            .map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className='text-xs text-slate-500'>
                        Optional: Select a parent department if this is a sub-department
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDepartmentDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDepartment}>
                    <Save className="mr-2 h-4 w-4" />
                    {editingDepartment ? "Update Department" : "Create Department"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>
              Manage organizational departments and their reporting structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Parent Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.length > 0 ? (
                  departments.map((department) => {
                    // Find manager name
                    const manager = managers.find(m => m.id === department.managerId);
                    
                    // Find parent department name if parentDepartmentId exists
                    const parentDept = departments.find(d => d.id === department.parentDepartmentId);
                    
                    return (
                      <TableRow key={department.id}>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell>{department.description || "—"}</TableCell>
                        <TableCell>{manager?.name || "—"}</TableCell>
                        <TableCell>{parentDept?.name || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditDepartment(department)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => handleDeleteDepartment(department.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No departments defined yet. Create your first department to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}