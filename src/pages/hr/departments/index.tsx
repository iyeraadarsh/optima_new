import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Eye, 
  Users, 
  Building2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { departmentService } from "@/services/departmentService";
import { userService } from "@/services/userService";
import { Department, User } from "@/types";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Record<string, User>>({});
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all departments
        const allDepartments = await departmentService.getAllDepartments();
        setDepartments(allDepartments);
        setFilteredDepartments(allDepartments);
        
        // Fetch managers for each department
        const managerIds = allDepartments.map(dept => dept.managerId).filter(Boolean);
        // Convert to array before spreading to avoid Set iteration error
        const uniqueManagerIds = Array.from(new Set(managerIds));
        
        const managersMap: Record<string, User> = {};
        const employeeCountsMap: Record<string, number> = {};
        
        // Fetch managers in parallel
        await Promise.all(
          uniqueManagerIds.map(async (managerId) => {
            if (managerId) {
              const manager = await userService.getUserProfile(managerId);
              if (manager) {
                managersMap[managerId] = manager;
              }
            }
          })
        );
        
        // Fetch employee counts for each department
        await Promise.all(
          allDepartments.map(async (dept) => {
            const employees = await userService.getUsersByDepartment(dept.id);
            employeeCountsMap[dept.id] = employees.length;
          })
        );
        
        setManagers(managersMap);
        setEmployeeCounts(employeeCountsMap);
        
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDepartments(departments);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = departments.filter(
        dept => 
          dept.name.toLowerCase().includes(query) || 
          (dept.description && dept.description.toLowerCase().includes(query)) ||
          (dept.managerId && managers[dept.managerId] && managers[dept.managerId].name.toLowerCase().includes(query))
      );
      setFilteredDepartments(filtered);
    }
  }, [searchQuery, departments, managers]);

  const handleDeleteDepartment = async (departmentId: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentService.deleteDepartment(departmentId);
        setDepartments(prevDepartments => prevDepartments.filter(dept => dept.id !== departmentId));
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };

  // Function to get parent department name
  const getParentDepartmentName = (parentId: string | undefined): string => {
    if (!parentId) return '-';
    const parent = departments.find(dept => dept.id === parentId);
    return parent ? parent.name : '-';
  };

  return (
    <>
      <Head>
        <title>Departments | HR Management</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/hr">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          </div>
          <Button asChild>
            <Link href="/hr/departments/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department Directory</CardTitle>
            <CardDescription>View and manage all departments in the organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search departments..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400">Loading departments...</p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Parent Department</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.length > 0 ? (
                      filteredDepartments.map((department) => (
                        <TableRow key={department.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-slate-500" />
                              </div>
                              <div>
                                <div className="font-medium">{department.name}</div>
                                {department.description && (
                                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[250px]">
                                    {department.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {department.managerId && managers[department.managerId] ? (
                              <Link href={`/hr/employees/${department.managerId}`} className="text-blue-600 hover:underline">
                                {managers[department.managerId].name}
                              </Link>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {department.parentDepartmentId ? (
                              <Link href={`/hr/departments/${department.parentDepartmentId}`} className="text-blue-600 hover:underline">
                                {getParentDepartmentName(department.parentDepartmentId)}
                              </Link>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-slate-400" />
                              {employeeCounts[department.id] || 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/hr/departments/${department.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/hr/departments/edit/${department.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteDepartment(department.id)}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          {searchQuery 
                            ? 'No departments found matching your search criteria.' 
                            : 'No departments found. Add departments to get started.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}