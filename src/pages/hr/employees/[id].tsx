import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Calendar, 
  Clock, 
  Users, 
  Edit,
  FileText,
  GraduationCap,
  Award,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { employeeService } from "@/services/employeeService";
import { departmentService } from "@/services/departmentService";
import { positionService } from "@/services/positionService";
import { User, Department, Position } from "@/types";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [employee, setEmployee] = useState<User | null>(null);
  const [manager, setManager] = useState<User | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [directReports, setDirectReports] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        
        // Fetch related data
        const [
          departmentData,
          positionData,
          directReportsData
        ] = await Promise.all([
          employeeData.department ? departmentService.getDepartment(employeeData.department) : null,
          employeeData.position ? positionService.getPosition(employeeData.position) : null,
          employeeService.getDirectReports(id as string)
        ]);
        
        setDepartment(departmentData);
        setPosition(positionData);
        setDirectReports(directReportsData);
        
        // Fetch manager data if available
        if (employeeData.reportingManager) {
          const managerData = await employeeService.getEmployeeById(employeeData.reportingManager);
          setManager(managerData);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Employee Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          {error || "The employee you're looking for doesn't exist or has been deleted."}
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
        <title>{employee.name} | Employee Profile</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/hr/employees">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Employee Profile</h1>
          </div>
          <Button asChild>
            <Link href={`/hr/employees/edit/${employee.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage 
                    src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=random&size=96`} 
                    alt={employee.name} 
                  />
                  <AvatarFallback className="text-2xl">{employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  {employee.jobDetails?.title || position?.name || "No Position"}
                </p>
                <Badge className="mt-2" variant={employee.status === 'active' ? 'default' : 'secondary'}>
                  {employee.status || 'Active'}
                </Badge>
                
                <Separator className="my-4" />
                
                <div className="w-full space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-slate-400" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                  {employee.phoneNumber && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-slate-400" />
                      <span className="text-sm">{employee.phoneNumber}</span>
                    </div>
                  )}
                  {department && (
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-slate-400" />
                      <span className="text-sm">{department.name}</span>
                    </div>
                  )}
                  {employee.jobDetails?.employmentType && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-slate-400" />
                      <span className="text-sm capitalize">{employee.jobDetails.employmentType} Employee</span>
                    </div>
                  )}
                  {employee.jobDetails?.hireDate && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                      <span className="text-sm">Hired: {new Date(employee.jobDetails.hireDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Employee Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-slate-400" />
                          Job Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2">
                            <span className="text-slate-500">Position:</span>
                            <span>{employee.jobDetails?.title || position?.name || "Not specified"}</span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-slate-500">Department:</span>
                            <span>{department?.name || "Not assigned"}</span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-slate-500">Employment Type:</span>
                            <span className="capitalize">{employee.jobDetails?.employmentType || "Not specified"}</span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-slate-500">Hire Date:</span>
                            <span>{employee.jobDetails?.hireDate ? new Date(employee.jobDetails.hireDate).toLocaleDateString() : "Not specified"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-slate-400" />
                          Reporting Structure
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2">
                            <span className="text-slate-500">Reports To:</span>
                            <span>
                              {manager ? (
                                <Link href={`/hr/employees/${manager.id}`} className="text-blue-600 hover:underline">
                                  {manager.name}
                                </Link>
                              ) : "None"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-slate-500">Direct Reports:</span>
                            <span>{directReports.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6 text-slate-500">
                      No recent activity to display
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Full Name:</span>
                          <span>{employee.name}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Email:</span>
                          <span>{employee.email}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Phone:</span>
                          <span>{employee.phoneNumber || "Not provided"}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Address:</span>
                          <span>Not provided</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Employment Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Employee ID:</span>
                          <span>{employee.id.substring(0, 8)}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Status:</span>
                          <span className="capitalize">{employee.status || "Active"}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Hire Date:</span>
                          <span>{employee.jobDetails?.hireDate ? new Date(employee.jobDetails.hireDate).toLocaleDateString() : "Not specified"}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Employment Type:</span>
                          <span className="capitalize">{employee.jobDetails?.employmentType || "Not specified"}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Department:</span>
                          <span>{department?.name || "Not assigned"}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Position:</span>
                          <span>{employee.jobDetails?.title || position?.name || "Not specified"}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-slate-500">Reports To:</span>
                          <span>
                            {manager ? (
                              <Link href={`/hr/employees/${manager.id}`} className="text-blue-600 hover:underline">
                                {manager.name}
                              </Link>
                            ) : "None"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="team" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reporting Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-3">Reports To</h3>
                        {manager ? (
                          <div className="flex items-center p-3 border rounded-md">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage 
                                src={manager.avatar || `https://ui-avatars.com/api/?name=${manager.name}&background=random`} 
                                alt={manager.name} 
                              />
                              <AvatarFallback>{manager.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link href={`/hr/employees/${manager.id}`} className="font-medium hover:underline">
                                {manager.name}
                              </Link>
                              <p className="text-sm text-slate-500">{manager.jobDetails?.title || "No Position"}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 p-3 border rounded-md">
                            No manager assigned
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">Direct Reports ({directReports.length})</h3>
                        {directReports.length > 0 ? (
                          <div className="space-y-2">
                            {directReports.map(report => (
                              <div key={report.id} className="flex items-center p-3 border rounded-md">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarImage 
                                    src={report.avatar || `https://ui-avatars.com/api/?name=${report.name}&background=random`} 
                                    alt={report.name} 
                                  />
                                  <AvatarFallback>{report.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link href={`/hr/employees/${report.id}`} className="font-medium hover:underline">
                                    {report.name}
                                  </Link>
                                  <p className="text-sm text-slate-500">{report.jobDetails?.title || "No Position"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-500 p-3 border rounded-md">
                            No direct reports
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Department Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {department ? (
                      <div className="text-center py-6 text-slate-500">
                        <p>View all members in the {department.name} department</p>
                        <Button asChild className="mt-4" variant="outline">
                          <Link href={`/hr/departments/${department.id}`}>
                            View Department
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500">
                        No department assigned
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}