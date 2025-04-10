import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Save, User, Mail, Briefcase, Building, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { departmentService } from "@/services/departmentService";
import { positionService } from "@/services/positionService";
import { Department, Position, User as UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import SkillsSection from "@/components/profile/SkillsSection";
import DevelopmentPlanSection from "@/components/profile/DevelopmentPlanSection";

// Define UserProfile type locally
interface UserProfile extends UserType {
  // Additional properties specific to profile page
}

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("no-department");
  const [position, setPosition] = useState("no-position");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [employmentType, setEmploymentType] = useState<"full-time" | "part-time" | "contract" | "intern">("full-time");
  const [hireDate, setHireDate] = useState("");
  const [reportingManager, setReportingManager] = useState("none");

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;
      
      try {
        setLoading(true);
        
        // Fetch departments
        const allDepartments = await departmentService.getAllDepartments();
        // Filter out departments with invalid IDs
        const validDepartments = allDepartments.filter(dept => dept.id && dept.id.trim() !== "");
        setDepartments(validDepartments);
        
        // Fetch positions
        const allPositions = await positionService.getAllPositions();
        // Filter out positions with invalid IDs
        const validPositions = allPositions.filter(pos => pos.id && pos.id.trim() !== "");
        setPositions(validPositions);
        
        // Fetch all users for reporting manager selection
        const users = await userService.getAllUsers();
        // Filter out users with invalid IDs
        const validUsers = users.filter(user => user.id && user.id.trim() !== "" && user.id !== userProfile.id);
        setAllUsers(validUsers);
        
        // Set form values from user profile
        setName(userProfile.name);
        setEmail(userProfile.email);
        setDepartment(userProfile.department || "no-department");
        setPosition(userProfile.position || "no-position");
        setPhone(userProfile.phoneNumber || "");
        setReportingManager(userProfile.reportingManager || "none"); // Use "none" for no manager
        
        if (userProfile.jobDetails) {
          setJobTitle(userProfile.jobDetails.title || "");
          setEmploymentType(userProfile.jobDetails.employmentType || "full-time");
          setHireDate(userProfile.jobDetails.hireDate || "");
        }
        
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setError("Failed to load profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!userProfile) return;
      
      // Create a clean update object
      const updateData: Partial<UserProfile> = {
        name,
        email
      };
      
      // Only add fields with values
      if (phone) updateData.phoneNumber = phone;
      
      // Handle department
      if (department === "no-department") {
        updateData.department = ""; // Empty string will be converted to null in the service
      } else if (department) {
        updateData.department = department;
      }
      
      // Handle position
      if (position === "no-position") {
        updateData.position = ""; // Empty string will be converted to null in the service
      } else if (position) {
        updateData.position = position;
      }
      
      // Handle reporting manager
      if (reportingManager === "none") {
        updateData.reportingManager = ""; // Empty string will be converted to null in the service
      } else if (reportingManager) {
        updateData.reportingManager = reportingManager;
      }
      
      // Handle job details
      updateData.jobDetails = {};
      if (jobTitle) updateData.jobDetails.title = jobTitle;
      if (department && department !== "no-department") updateData.jobDetails.department = department;
      updateData.jobDetails.employmentType = employmentType;
      if (hireDate) updateData.jobDetails.hireDate = hireDate;
      
      // Update user profile
      await userService.updateUserProfile(userProfile.id, updateData);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError("An error occurred while updating your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Not Authenticated</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Please log in to access your profile.
        </p>
        <Button onClick={() => router.push("/auth/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  // Filter out positions with valid IDs
  const filteredPositions = positions.filter(pos => 
    pos.id && pos.id.trim() !== "" && 
    (!department || department === "no-department" || pos.departmentId === department || !pos.departmentId)
  );

  return (
    <>
      <Head>
        <title>My Profile | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <Button type="submit" form="profile-form" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form id="profile-form" onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="job">Job Details</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="development">Development Plan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal information
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
                          disabled={true} // Email should not be editable directly
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Email address cannot be changed directly for security reasons.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={userProfile.role}
                        disabled
                        className="bg-slate-50"
                      />
                      <p className="text-xs text-slate-500">
                        Your role can only be changed by an administrator.
                      </p>
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
                    Update your employment information
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
            
            <TabsContent value="skills" className="space-y-4 mt-4">
              {userProfile && <SkillsSection userId={userProfile.id} />}
            </TabsContent>
            
            <TabsContent value="development" className="space-y-4 mt-4">
              {userProfile && <DevelopmentPlanSection userId={userProfile.id} />}
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </>
  );
}