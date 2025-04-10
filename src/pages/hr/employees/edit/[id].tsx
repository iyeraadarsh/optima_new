import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Save, User as UserIcon, Mail, Briefcase, Building, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { employeeService } from "@/services/employeeService";
import { departmentService } from "@/services/departmentService";
import { positionService } from "@/services/positionService";
import { userService } from "@/services/userService";
import { Department, Position, User } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [employee, setEmployee] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("no-department");
  const [position, setPosition] = useState("no-position");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"employee" | "manager" | "department_manager" | "leader" | "director">("employee");
  const [status, setStatus] = useState<"active" | "inactive" | "pending" | "suspended">("active");
  const [jobTitle, setJobTitle] = useState("");
  const [employmentType, setEmploymentType] = useState<"full-time" | "part-time" | "contract" | "intern">("full-time");
  const [hireDate, setHireDate] = useState("");
  const [reportingManager, setReportingManager] = useState("none");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch employee data
        const employeeData = await employeeService.getEmployeeById(id as string);
        if (!employeeData) {
          setError("Employee not found");
          return;
        }
        
        setEmployee(employeeData);
        
        // Fetch departments
        const allDepartments = await departmentService.getAllDepartments();
        setDepartments(allDepartments);
        
        // Fetch positions
        const allPositions = await positionService.getAllPositions();
        setPositions(allPositions);
        
        // Fetch all users for reporting manager selection
        const users = await userService.getAllUsers();
        // Filter out the current employee from the list of potential managers
        const filteredUsers = users.filter(user => user.id !== id);
        setAllUsers(filteredUsers);
        
        // Set form values from employee data
        setName(employeeData.name);
        setEmail(employeeData.email);
        setRole(employeeData.role as any);
        setStatus(employeeData.status || "active");
        setDepartment(employeeData.department || "no-department");
        setPosition(employeeData.position || "no-position");
        setPhone(employeeData.phoneNumber || "");
        setReportingManager(employeeData.reportingManager || "none");
        
        if (employeeData.jobDetails) {
          setJobTitle(employeeData.jobDetails.title || "");
          setEmploymentType(employeeData.jobDetails.employmentType || "full-time");
          setHireDate(employeeData.jobDetails.hireDate || "");
        }
        
      } catch (error) {
        console.error("Error fetching employee data:", error);
        setError("Failed to load employee data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!employee) return;
      
      // Create a clean update object
      const updateData: Partial<User> = {
        name,
        email,
        role: role as User['role'],
        status
      };
      
      // Only add fields with values
      if (phone) updateData.phoneNumber = phone;
      
      // Handle department
      if (department === 'no-department') {
        updateData.department = undefined;
      } else if (department) {
        updateData.department = department;
      }
      
      // Handle position
      if (position === 'no-position') {
        updateData.position = undefined;
      } else if (position) {
        updateData.position = position;
      }
      
      // Handle reporting manager
      if (reportingManager === 'none') {
        updateData.reportingManager = undefined;
      } else if (reportingManager) {
        updateData.reportingManager = reportingManager;
      }
      
      // Handle job details
      updateData.jobDetails = {};
      if (jobTitle) updateData.jobDetails.title = jobTitle;
      if (department && department !== 'no-department') updateData.jobDetails.department = department;
      updateData.jobDetails.employmentType = employmentType;
      if (hireDate) updateData.jobDetails.hireDate = hireDate;
      
      // Update employee
      await employeeService.updateEmployee(employee.id, updateData);
      
      toast({
        title: 'Employee updated',
        description: 'The employee has been updated successfully.',
      });
      
      // Redirect to employee profile
      router.push(`/hr/employees/${employee.id}`);
    } catch (error: any) {
      console.error('Error updating employee:', error);
      setError(`Failed to update employee: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!employee) return;
    
    if (window.confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
      try {
        setSaving(true);
        await employeeService.deleteEmployee(employee.id);
        
        toast({
          title: "Employee deleted",
          description: "The employee has been deleted successfully.",
        });
        
        // Redirect to employees list
        router.push("/hr/employees");
      } catch (error: any) {
        console.error("Error deleting employee:", error);
        setError(`Failed to delete employee: ${error.message || "Please try again."}`);
        setSaving(false);
      }
    }
  };

  // Filter positions based on selected department
  const filteredPositions = positions.filter(pos => 
    department === "no-department" || pos.departmentId === department || !pos.departmentId
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (!employee && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Employee Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          The employee you're looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/hr/employees">Back to Employees</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Employee | HR Management</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/hr/employees/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Employee: {employee?.name}</h1>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={saving}
            >
              Delete Employee
            </Button>
            <Button 
              type="submit" 
              form="employee-form" 
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form id="employee-form" onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="job">Job Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Information</CardTitle>
                  <CardDescription>
                    Edit the basic information for this employee
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="name"
                          placeholder="John Doe"
                          className="pl-10"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@example.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={role} onValueChange={(value: any) => setRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="department_manager">Department Manager</SelectItem>
                          <SelectItem value="leader">Leader</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="phone"
                          placeholder="+1 (555) 123-4567"
                          className="pl-10"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="job" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                  <CardDescription>
                    Edit employment information and reporting structure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="jobTitle"
                          placeholder="Software Engineer"
                          className="pl-10"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Select value={department} onValueChange={setDepartment}>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-department">No Department</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-position">No Position</SelectItem>
                          {filteredPositions.map((pos) => (
                            <SelectItem key={pos.id} value={pos.id}>
                              {pos.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select 
                        value={employmentType} 
                        onValueChange={(value: any) => setEmploymentType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full Time</SelectItem>
                          <SelectItem value="part-time">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="intern">Intern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Hire Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="hireDate"
                          type="date"
                          className="pl-10"
                          value={hireDate}
                          onChange={(e) => setHireDate(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reportingManager">Reporting Manager</Label>
                      <Select value={reportingManager} onValueChange={setReportingManager}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reporting manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Manager</SelectItem>
                          {allUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} - {user.jobDetails?.title || user.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </>
  );
}