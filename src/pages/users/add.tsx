import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Save, User as UserIcon, Mail, Briefcase, Building, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userService } from "@/services/userService";
import { departmentService } from "@/services/departmentService";
import { authService } from "@/services/authService";
import { positionService } from '@/services/positionService';
import type { Department, User, Position } from "@/types";

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [reportingManager, setReportingManager] = useState('');

  // Basic info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User['role']>("user");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  
  // Job details
  const [jobTitle, setJobTitle] = useState("");
  const [employmentType, setEmploymentType] = useState<"full-time" | "part-time" | "contract" | "intern">("full-time");
  const [hireDate, setHireDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allDepartments, users, allPositions] = await Promise.all([
          departmentService.getAllDepartments(),
          userService.getAllUsers(),
          positionService.getActivePositions()
        ]);
        
        setDepartments(allDepartments);
        setAllUsers(users);
        setPositions(allPositions);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Prepare user data with only defined values
      const userData: Partial<User> = {
        name,
        email,
        role,
        status: "active"
      };
      
      // Only add fields with values
      if (phone) userData.phoneNumber = phone;
      if (department) userData.department = department;
      // Only add position if it's not the special 'no_position' value
      if (position && position !== 'no_position') userData.position = position;
      if (reportingManager && reportingManager !== 'none') userData.reportingManager = reportingManager;
      
      // Add job details if any are provided
      if (jobTitle || hireDate || department) {
        userData.jobDetails = {};
        if (jobTitle) userData.jobDetails.title = jobTitle;
        if (department) userData.jobDetails.department = department;
        if (employmentType) userData.jobDetails.employmentType = employmentType;
        if (hireDate) userData.jobDetails.hireDate = hireDate;
      }
      
      // Register user with Firebase Auth
      await authService.register(email, password, userData);

      router.push("/users");
    } catch (error: any) {
      console.error("Error creating user:", error);
      setError(error.message || "An error occurred while creating the user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add User | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
          </div>
          <Button type="submit" form="user-form" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save User'}
          </Button>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form id="user-form" onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="job">Job Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                  <CardDescription>
                    Enter the basic information for the new user
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
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Set initial password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={role} onValueChange={(value: User['role']) => setRole(value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Administrator</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="leader">Leader</SelectItem>
                          <SelectItem value="department_manager">Department Manager</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="user">User</SelectItem>
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
                    Enter employment information and reporting structure
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
                          <SelectValue placeholder='Select position' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='no_position'>No Specific Position</SelectItem>
                          {positions.map((pos) => (
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
                        onValueChange={(value: "full-time" | "part-time" | "contract" | "intern") => setEmploymentType(value)}
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
                      <Input
                        id="hireDate"
                        type="date"
                        value={hireDate}
                        onChange={(e) => setHireDate(e.target.value)}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='reportingManager'>Reporting Manager</Label>
                      <Select value={reportingManager} onValueChange={setReportingManager}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select reporting manager' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>No Manager</SelectItem>
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