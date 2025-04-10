import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { 
  Users, 
  Building2, 
  Network, 
  Search, 
  Filter, 
  Plus,
  Calendar,
  Settings,
  Laptop,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { employeeService } from "@/services/employeeService";
import { departmentService } from "@/services/departmentService";
import { PermissionGate } from "@/components/ui/permission-gate";
import { ModuleNames, ActionTypes } from "@/types/rbac";

export default function HRManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    employees: 0,
    departments: 0,
    teams: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // Fetch employees count
        const employees = await employeeService.getAllEmployees();
        
        // Fetch departments count
        const departments = await departmentService.getAllDepartments();
        
        // Calculate teams (departments with a parent department)
        const teams = departments.filter(dept => dept.parentDepartmentId).length;
        
        setMetrics({
          employees: employees.length,
          departments: departments.length,
          teams: teams
        });
      } catch (error) {
        console.error('Error fetching HR metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'overview') {
      fetchMetrics();
    }
  }, [activeTab]);

  return (
    <PermissionGate
      permission={{
        module: ModuleNames.HR,
        action: ActionTypes.READ
      }}
      fallback={
        <div className="container mx-auto py-8">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      }
    >
      <Head>
        <title>HR Management | Enterprise Management System</title>
      </Head>

      <div className='container mx-auto space-y-6 px-4 sm:px-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>HR Management</h1>
            <p className='text-slate-500 dark:text-slate-400'>
              Manage employees, departments, and organization structure
            </p>
          </div>
        </div>

        <Tabs defaultValue='overview' onValueChange={setActiveTab} className='w-full'>
          <div className='overflow-x-auto pb-2'>
            <TabsList className='grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-2'>
              <TabsTrigger value='overview' className='px-2 sm:px-4'>Overview</TabsTrigger>
              <TabsTrigger value='employees' className='px-2 sm:px-4'>Employees</TabsTrigger>
              <TabsTrigger value='departments' className='px-2 sm:px-4'>Departments & Teams</TabsTrigger>
              <TabsTrigger value='leave' className='px-2 sm:px-4'>Leave Management</TabsTrigger>
              <TabsTrigger value='performance' className='px-2 sm:px-4'>Performance</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value='overview' className='space-y-4 mt-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-lg font-medium flex items-center'>
                    <Users className='h-5 w-5 mr-2 text-blue-500 flex-shrink-0' />
                    <span className='truncate'>Employee Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-slate-500 mb-4'>
                    Manage employee profiles, personal information, and employment details.
                  </p>
                  <Button asChild variant='outline' className='w-full'>
                    <Link href='/hr/employees'>
                      View Employees
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-lg font-medium flex items-center'>
                    <Building2 className='h-5 w-5 mr-2 text-green-500 flex-shrink-0' />
                    <span className='truncate'>Departments & Teams</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-slate-500 mb-4'>
                    Manage departments, teams, and organizational structure.
                  </p>
                  <Button asChild variant='outline' className='w-full'>
                    <Link href='/hr/departments'>
                      View Departments
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-lg font-medium flex items-center'>
                    <Network className='h-5 w-5 mr-2 text-purple-500 flex-shrink-0' />
                    <span className='truncate'>Organization Chart</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-slate-500 mb-4'>
                    View and explore the organizational structure and reporting relationships.
                  </p>
                  <Button asChild variant='outline' className='w-full'>
                    <Link href='/hr/org-chart'>
                      View Org Chart
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>HR Management Overview</CardTitle>
                <CardDescription>
                  Key metrics and information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                  <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                    <div className='text-sm font-medium text-slate-500 dark:text-slate-400'>
                      Total Employees
                    </div>
                    <div className='text-3xl font-bold mt-1'>{loading ? '...' : metrics.employees}</div>
                  </div>
                  <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                    <div className='text-sm font-medium text-slate-500 dark:text-slate-400'>
                      Departments
                    </div>
                    <div className='text-3xl font-bold mt-1'>{loading ? '...' : metrics.departments}</div>
                  </div>
                  <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                    <div className='text-sm font-medium text-slate-500 dark:text-slate-400'>
                      Teams
                    </div>
                    <div className='text-3xl font-bold mt-1'>{loading ? '...' : metrics.teams}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value='employees' className='space-y-4 mt-4'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='relative w-full sm:max-w-xs'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400' />
                <Input
                  type='search'
                  placeholder='Search employees...'
                  className='w-full pl-8'
                />
              </div>
              <div className='flex gap-2 w-full sm:w-auto'>
                <Button variant='outline' size='icon' className='flex-shrink-0'>
                  <Filter className='h-4 w-4' />
                </Button>
                <Button asChild className='w-full sm:w-auto'>
                  <Link href='/hr/employees/add'>
                    <Plus className='h-4 w-4 mr-2' />
                    Add Employee
                  </Link>
                </Button>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Employees</CardTitle>
                <CardDescription>
                  Manage employee information and profiles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-center py-10'>
                  <p className='text-slate-500 dark:text-slate-400'>
                    Click 'View Employees' to see the full employee list
                  </p>
                  <Button asChild className='mt-4 w-full sm:w-auto'>
                    <Link href='/hr/employees'>
                      View Employees
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value='departments' className='space-y-4 mt-4'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='relative w-full sm:max-w-xs'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400' />
                <Input
                  type='search'
                  placeholder='Search departments...'
                  className='w-full pl-8'
                />
              </div>
              <div className='flex gap-2 w-full sm:w-auto'>
                <Button variant='outline' size='icon' className='flex-shrink-0'>
                  <Filter className='h-4 w-4' />
                </Button>
                <Button asChild className='w-full sm:w-auto'>
                  <Link href='/hr/departments/add'>
                    <Plus className='h-4 w-4 mr-2' />
                    Add Department
                  </Link>
                </Button>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Departments & Teams</CardTitle>
                <CardDescription>
                  Manage departments, teams, and organizational structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-center py-10'>
                  <p className='text-slate-500 dark:text-slate-400'>
                    Click 'View Departments' to see the full department list
                  </p>
                  <Button asChild className='mt-4 w-full sm:w-auto'>
                    <Link href='/hr/departments'>
                      View Departments
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='leave' className='space-y-4 mt-4'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='relative w-full sm:max-w-xs'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400' />
                <Input
                  type='search'
                  placeholder='Search leave requests...'
                  className='w-full pl-8'
                />
              </div>
              <div className='flex flex-wrap gap-2 w-full sm:w-auto justify-end'>
                <Button variant='outline' size='icon' className='flex-shrink-0'>
                  <Filter className='h-4 w-4' />
                </Button>
                <Button asChild variant='outline' className='flex-grow sm:flex-grow-0'>
                  <Link href='/hr/leave/work-from-home/request'>
                    <Laptop className='h-4 w-4 mr-2' />
                    <span className='whitespace-nowrap'>New WFH Request</span>
                  </Link>
                </Button>
                <Button asChild className='flex-grow sm:flex-grow-0'>
                  <Link href='/hr/leave/request'>
                    <Plus className='h-4 w-4 mr-2' />
                    <span className='whitespace-nowrap'>New Leave Request</span>
                  </Link>
                </Button>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Leave Management</CardTitle>
                <CardDescription>
                  Manage leave requests, balances, and approvals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg font-medium flex items-center'>
                        <Calendar className='h-5 w-5 mr-2 text-blue-500 flex-shrink-0' />
                        <span className='truncate'>Leave Dashboard</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-slate-500 mb-4'>
                        View and manage leave requests, balances, and approvals.
                      </p>
                      <Button asChild variant='outline' className='w-full'>
                        <Link href='/hr/leave'>
                          Go to Leave Dashboard
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg font-medium flex items-center'>
                        <Plus className='h-5 w-5 mr-2 text-green-500 flex-shrink-0' />
                        <span className='truncate'>Request Leave</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-slate-500 mb-4'>
                        Submit a new leave request for approval.
                      </p>
                      <Button asChild variant='outline' className='w-full'>
                        <Link href='/hr/leave/request'>
                          New Leave Request
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg font-medium flex items-center'>
                        <Laptop className='h-5 w-5 mr-2 text-purple-500 flex-shrink-0' />
                        <span className='truncate'>Work From Home</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-slate-500 mb-4'>
                        Submit and manage work from home requests.
                      </p>
                      <Button asChild variant='outline' className='w-full'>
                        <Link href='/hr/leave/work-from-home'>
                          WFH Dashboard
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className='text-center'>
                  <Button asChild className='mt-4 w-full sm:w-auto'>
                    <Link href='/hr/leave'>
                      View All Leave Management Options
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='performance' className='space-y-4 mt-4'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='relative w-full sm:max-w-xs'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400' />
                <Input
                  type='search'
                  placeholder='Search performance data...'
                  className='w-full pl-8'
                />
              </div>
              <div className='flex gap-2 w-full sm:w-auto'>
                <Button variant='outline' size='icon' className='flex-shrink-0'>
                  <Filter className='h-4 w-4' />
                </Button>
                <Button asChild className='w-full sm:w-auto'>
                  <Link href='/hr/performance/goals/add'>
                    <Plus className='h-4 w-4 mr-2' />
                    Add New Goal
                  </Link>
                </Button>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Performance Management</CardTitle>
                <CardDescription>
                  Set goals, track progress, and complete performance reviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg font-medium flex items-center'>
                        <Target className='h-5 w-5 mr-2 text-blue-500 flex-shrink-0' />
                        <span className='truncate'>Goal Management</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-slate-500 mb-4'>
                        Set SMART goals, track progress, and manage key metrics.
                      </p>
                      <Button asChild variant='outline' className='w-full'>
                        <Link href='/hr/performance'>
                          View Goals
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg font-medium flex items-center'>
                        <Settings className='h-5 w-5 mr-2 text-yellow-500 flex-shrink-0' />
                        <span className='truncate'>Performance Reviews</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-slate-500 mb-4'>
                        Complete self-assessments and manager reviews.
                      </p>
                      <Button asChild variant='outline' className='w-full'>
                        <Link href='/hr/performance'>
                          View Reviews
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg font-medium flex items-center'>
                        <Laptop className='h-5 w-5 mr-2 text-green-500 flex-shrink-0' />
                        <span className='truncate'>Reports & Analytics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-slate-500 mb-4'>
                        View performance reports and analytics.
                      </p>
                      <Button asChild variant='outline' className='w-full'>
                        <Link href='/hr/performance'>
                          View Reports
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className='text-center'>
                  <Button asChild className='mt-4 w-full sm:w-auto'>
                    <Link href='/hr/performance'>
                      Go to Performance Management
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGate>
  );
}