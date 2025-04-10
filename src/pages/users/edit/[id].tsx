import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Save, User, Mail, Briefcase, Building, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { userService } from "@/services/userService";
import { departmentService } from "@/services/departmentService";
import { rbacService } from "@/services/rbacService";
import { positionService } from '@/services/positionService';
import { Department, Position } from '@/types';
import { Role, Permission } from '@/types/rbac';
import { User as AppUser } from '@/types';

export default function EditUserPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<AppUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [reportingManager, setReportingManager] = useState('none');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin' | 'director' | 'leader' | 'department_manager' | 'manager' | 'employee' | 'user'>('user');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending' | 'suspended'>('active');
  const [jobTitle, setJobTitle] = useState('');
  const [employmentType, setEmploymentType] = useState<'full-time' | 'part-time' | 'contract' | 'intern'>('full-time');
  const [hireDate, setHireDate] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          setLoading(true);
          
          // Fetch all users for manager selection
          const [users, allDepartments, allRoles, allPermissions, allPositions] = await Promise.all([
            userService.getAllUsers(),
            departmentService.getAllDepartments(),
            rbacService.getAllRoles(),
            rbacService.getAllPermissions(),
            positionService.getAllPositions()
          ]);
          
          // Filter out users with valid IDs
          const validUsers = users.filter(user => user.id && user.id.trim() !== "" && user.id !== id);
          setAllUsers(validUsers);
          
          // Filter out departments with valid IDs
          const validDepartments = allDepartments.filter(dept => dept.id && dept.id.trim() !== "");
          setDepartments(validDepartments);
          
          // Filter out roles with valid IDs
          const validRoles = allRoles.filter(role => role.id && role.id.trim() !== "");
          setRoles(validRoles);
          
          // Filter out permissions with valid IDs
          const validPermissions = allPermissions.filter(perm => perm.id && perm.id.trim() !== "");
          setPermissions(validPermissions);
          
          // Filter out positions with valid IDs
          const validPositions = allPositions.filter(pos => pos.id && pos.id.trim() !== "");
          setPositions(validPositions);
          
          // Fetch user data
          const userData = await userService.getUserProfile(id as string);
          if (userData) {
            setUser(userData);
            setName(userData.name);
            setEmail(userData.email);
            setRole(userData.role);
            setDepartment(userData.department || '');
            setPosition(userData.position || '');
            setPhone(userData.phoneNumber || '');
            setStatus(userData.status || 'active');
            setReportingManager(userData.reportingManager || 'none');
            
            if (userData.jobDetails) {
              setJobTitle(userData.jobDetails.title || '');
              setEmploymentType(userData.jobDetails.employmentType || 'full-time');
              setHireDate(userData.jobDetails.hireDate || '');
            }
          }
          
          // Fetch user permissions
          const userPermissions = await rbacService.getUserPermissions(id as string);
          if (userPermissions) {
            setSelectedRoleId(userPermissions.roleId || '');
            setSelectedPermissions(userPermissions.customPermissions || []);
          }
          
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load user data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!id) return;
      
      // Update user profile with reporting manager
      await userService.updateUserProfile(id as string, {
        name,
        email,
        role,
        department: department || undefined,
        position: position || undefined,
        phoneNumber: phone,
        status,
        reportingManager: reportingManager === "none" ? undefined : reportingManager,
        jobDetails: {
          title: jobTitle,
          department: department || undefined,
          employmentType,
          hireDate
        }
      });
      
      // Update user permissions
      if (selectedRoleId) {
        await rbacService.setUserPermissions({
          userId: id as string,
          roleId: selectedRoleId,
          customPermissions: selectedPermissions,
          updatedAt: new Date().toISOString(),
          updatedBy: "system" // Ideally this would be the current admin user
        });
      }
      
      router.push("/users");
    } catch (error: any) {
      console.error("Error updating user:", error);
      setError("An error occurred while updating the user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          The user you're looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  // Filter positions based on department
  const filteredPositions = positions.filter(pos => 
    pos.id && pos.id.trim() !== "" && 
    (!department || pos.departmentId === department || !pos.departmentId)
  );

  return (
    <>
      <Head>
        <title>Edit User | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit User: {user?.name}</h1>
          </div>
          <Button type="submit" form="user-form" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form id="user-form" onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="job">Job Details</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                  <CardDescription>
                    Edit the basic information for this user
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
                      <Select value={role} onValueChange={(value: any) => setRole(value)} required>
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
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={(value: any) => setStatus(value)} required>
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
                        <Select value={department || "no-department"} onValueChange={setDepartment}>
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
                    
                    <div className='space-y-2'>
                      <Label htmlFor='position'>Position</Label>
                      <Select value={position || "no-position"} onValueChange={setPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select position' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-position">No Specific Position</SelectItem>
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
                          <SelectItem value="none">No Manager</SelectItem>
                          {allUsers
                            .filter(u => u.id !== id) // Prevent self-selection
                            .map((user) => (
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
            
            <TabsContent value="permissions" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Permissions</CardTitle>
                  <CardDescription>
                    Manage role and specific permissions for this user
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userRole">Assigned Role</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Select value={selectedRoleId || "no-role"} onValueChange={setSelectedRoleId}>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-role">No Specific Role</SelectItem>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name} (Level {role.level})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        The role determines the base set of permissions for this user
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Additional Permissions</h3>
                    <p className="text-sm text-slate-500">
                      Grant specific permissions beyond the user's role
                    </p>
                    
                    <div className="border rounded-md divide-y">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between p-4">
                          <div>
                            <h4 className="font-medium">{permission.name}</h4>
                            <p className="text-sm text-slate-500">{permission.description}</p>
                            <div className="text-xs text-slate-400 mt-1">
                              Module: {permission.module} | Actions: {permission.actions.join(", ")}
                            </div>
                          </div>
                          <Switch
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                        </div>
                      ))}
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