import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Eye, 
  UserPlus 
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { employeeService } from "@/services/employeeService";
import { departmentService } from "@/services/departmentService";
import { positionService } from "@/services/positionService";
import { User, Department, Position } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allEmployees, allDepartments, allPositions] = await Promise.all([
          employeeService.getAllEmployees(),
          departmentService.getAllDepartments(),
          positionService.getAllPositions()
        ]);
        
        setEmployees(allEmployees);
        setFilteredEmployees(allEmployees);
        setDepartments(allDepartments);
        setPositions(allPositions);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...employees];
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(employee => employee.department === departmentFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        employee => 
          employee.name.toLowerCase().includes(query) || 
          employee.email.toLowerCase().includes(query) ||
          (employee.jobDetails?.title && employee.jobDetails.title.toLowerCase().includes(query))
      );
    }
    
    setFilteredEmployees(filtered);
  }, [searchQuery, departmentFilter, employees]);

  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.deleteEmployee(employeeId);
        setEmployees(prevEmployees => prevEmployees.filter(emp => emp.id !== employeeId));
        setFilteredEmployees(prevEmployees => prevEmployees.filter(emp => emp.id !== employeeId));
        
        toast({
          title: "Employee deleted",
          description: "The employee has been deleted successfully.",
        });
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast({
          title: "Error",
          description: "Failed to delete employee. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Function to get department name from department ID
  const getDepartmentName = (departmentId: string | undefined): string => {
    if (!departmentId) return '-';
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : '-';
  };

  // Function to get position name from position ID
  const getPositionName = (positionId: string | undefined): string => {
    if (!positionId) return '-';
    const position = positions.find(pos => pos.id === positionId);
    return position ? position.name : '-';
  };

  return (
    <>
      <Head>
        <title>Employees | HR Management</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/hr">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          </div>
          <Button asChild>
            <Link href="/hr/employees/add">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>View and manage all employees in the organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search employees..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400">Loading employees...</p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=random`} 
                                  alt={employee.name} 
                                />
                                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{employee.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.jobDetails?.title || getPositionName(employee.position) || '-'}</TableCell>
                          <TableCell>{getDepartmentName(employee.department)}</TableCell>
                          <TableCell>
                            <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                              {employee.status || 'Active'}
                            </Badge>
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
                                  <Link href={`/hr/employees/${employee.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/hr/employees/edit/${employee.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteEmployee(employee.id)}
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
                          {searchQuery || departmentFilter !== 'all' 
                            ? 'No employees found matching your search criteria.' 
                            : 'No employees found. Add employees to get started.'}
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