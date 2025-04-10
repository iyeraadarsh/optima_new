import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { 
  ArrowLeft, 
  Building2, 
  User as UserIcon, 
  Calendar, 
  Users, 
  Edit, 
  Trash, 
  Building 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { departmentService } from "@/services/departmentService";
import { userService } from "@/services/userService";
import { Department, User as UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function DepartmentDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [department, setDepartment] = useState<Department | null>(null);
  const [manager, setManager] = useState<UserType | null>(null);
  const [parentDepartment, setParentDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [childDepartments, setChildDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDepartmentDetails = async () => {
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
        
        // Fetch manager if exists
        if (departmentData.managerId) {
          const managerData = await userService.getUserProfile(departmentData.managerId);
          setManager(managerData);
        }
        
        // Fetch parent department if exists
        if (departmentData.parentDepartmentId) {
          const parentData = await departmentService.getDepartment(departmentData.parentDepartmentId);
          setParentDepartment(parentData);
        }
        
        // Fetch employees in this department
        const departmentEmployees = await userService.getUsersByDepartment(id as string);
        setEmployees(departmentEmployees);
        
        // Fetch child departments
        const allDepartments = await departmentService.getAllDepartments();
        const children = allDepartments.filter(dept => dept.parentDepartmentId === id);
        setChildDepartments(children);
        
      } catch (error) {
        console.error("Error fetching department details:", error);
        setError("Failed to load department details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentDetails();
  }, [id]);

  const handleDeleteDepartment = async () => {
    if (!department) return;
    
    // Check if department has employees
    if (employees.length > 0) {
      toast({
        title: "Cannot delete department",
        description: "This department has employees assigned to it. Please reassign them before deleting.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if department has child departments
    if (childDepartments.length > 0) {
      toast({
        title: "Cannot delete department",
        description: "This department has sub-departments. Please delete or reassign them first.",
        variant: "destructive"
      });
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
      try {
        await departmentService.deleteDepartment(department.id);
        toast({
          title: "Department deleted",
          description: "The department has been successfully deleted."
        });
        router.push("/hr/departments");
      } catch (error) {
        console.error("Error deleting department:", error);
        toast({
          title: "Error",
          description: "Failed to delete department. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading department details...</p>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error || "Department not found"}</p>
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
        <title>{department.name} | Department Details</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/hr/departments">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/hr/departments/edit/${department.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Department
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDeleteDepartment}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Department Information</CardTitle>
              <CardDescription>Details about the department</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Department Name</h3>
                  <p className="mt-1 text-base font-medium">{department.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Manager</h3>
                  <p className="mt-1 text-base font-medium">
                    {manager ? (
                      <Link href={`/hr/employees/${manager.id}`} className="text-blue-600 hover:underline">
                        {manager.name}
                      </Link>
                    ) : (
                      "No manager assigned"
                    )}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Parent Department</h3>
                  <p className="mt-1 text-base font-medium">
                    {parentDepartment ? (
                      <Link href={`/hr/departments/${parentDepartment.id}`} className="text-blue-600 hover:underline">
                        {parentDepartment.name}
                      </Link>
                    ) : (
                      "None (Top-level department)"
                    )}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Created</h3>
                  <p className="mt-1 text-base font-medium">
                    {department.createdAt ? format(new Date(department.createdAt), "PPP") : "Unknown"}
                  </p>
                </div>
              </div>
              
              {department.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</h3>
                  <p className="mt-1 text-base">{department.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                <Users className="h-8 w-8 text-blue-500 mr-4" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Employees</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                <Building className="h-8 w-8 text-green-500 mr-4" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sub-departments</p>
                  <p className="text-2xl font-bold">{childDepartments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {childDepartments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sub-departments</CardTitle>
              <CardDescription>Departments that report to this department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {childDepartments.map((childDept) => (
                      <TableRow key={childDept.id}>
                        <TableCell>
                          <div className="font-medium">{childDept.name}</div>
                        </TableCell>
                        <TableCell>
                          {childDept.managerId ? "Assigned" : "None"}
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/hr/departments/${childDept.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Department Employees</CardTitle>
            <CardDescription>Employees assigned to this department</CardDescription>
          </CardHeader>
          <CardContent>
            {employees.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-slate-500" />
                            </div>
                            <div className="font-medium">{employee.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.jobDetails?.title || "-"}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/hr/employees/${employee.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No employees assigned to this department yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}