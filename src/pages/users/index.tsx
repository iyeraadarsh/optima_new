import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash, 
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
import { userService } from "@/services/userService";
import { departmentService } from "@/services/departmentService";
import { positionService } from "@/services/positionService";
import { User, Department, Position } from "@/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allUsers, allDepartments, allPositions] = await Promise.all([
          userService.getAllUsers(),
          departmentService.getAllDepartments(),
          positionService.getAllPositions()
        ]);
        
        setUsers(allUsers);
        setFilteredUsers(allUsers);
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
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query) ||
          (user.department && user.department.toLowerCase().includes(query)) ||
          user.role.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setFilteredUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
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
        <title>User Management | Enterprise Management System</title>
      </Head>

      <div className='container mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>User Management</h1>
            <p className='text-slate-500 dark:text-slate-400'>
              Manage users, roles, and permissions
            </p>
          </div>
          <Button asChild className='w-full sm:w-auto'>
            <Link href='/users/add'>
              <UserPlus className='mr-2 h-4 w-4' />
              Add User
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>View and manage all users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col sm:flex-row items-center gap-4 mb-6'>
              <div className='relative w-full sm:max-w-xs'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400' />
                <Input
                  type='search'
                  placeholder='Search users...'
                  className='w-full pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant='outline' size='icon' className='flex-shrink-0'>
                <Filter className='h-4 w-4' />
              </Button>
            </div>

            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-center'>
                  <div className='h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4'></div>
                  <p className='text-slate-500 dark:text-slate-400'>Loading users...</p>
                </div>
              </div>
            ) : (
              <div className='rounded-md border overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='whitespace-nowrap'>User</TableHead>
                      <TableHead className='whitespace-nowrap'>Role</TableHead>
                      <TableHead className='whitespace-nowrap'>Department</TableHead>
                      <TableHead className='whitespace-nowrap'>Status</TableHead>
                      <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-8 w-8 flex-shrink-0'>
                                <AvatarImage 
                                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                                  alt={user.name} 
                                />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className='min-w-0 max-w-[200px]'>
                                <div className='font-medium truncate'>{user.name}</div>
                                <div className='text-sm text-slate-500 dark:text-slate-400 truncate'>{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='capitalize whitespace-nowrap'>{user.role || '-'}</TableCell>
                          <TableCell className='whitespace-nowrap'>{getDepartmentName(user.department)}</TableCell>
                          <TableCell>
                            <Badge variant={user.lastActive && new Date(user.lastActive).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 ? 'default' : 'secondary'}>
                              {user.lastActive && new Date(user.lastActive).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='h-8 w-8'>
                                  <MoreHorizontal className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuItem asChild>
                                  <Link href={`/users/edit/${user.id}`} className='flex items-center'>
                                    <Edit className='mr-2 h-4 w-4' />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className='text-red-600'
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash className='mr-2 h-4 w-4' />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className='text-center py-8'>
                          {searchQuery ? 'No users found matching your search.' : 'No users found.'}
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