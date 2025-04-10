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
  Shield,
  Check,
  X
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { permissionService } from "@/services/permissionService";
import { Permission, ModuleNames } from "@/types/rbac";
import { PermissionGate } from "@/components/ui/permission-gate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [availableModules, setAvailableModules] = useState<{id: string, label: string}[]>([]);
  const [initializingPermissions, setInitializingPermissions] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const allPermissions = await permissionService.getAllPermissions();
        setPermissions(allPermissions);
        
        // Extract unique modules from permissions
        const modules = Array.from(new Set(allPermissions.map(p => p.module)));
        const moduleOptions = [
          { id: 'all', label: 'All Modules' },
          ...modules.map(module => ({
            id: module,
            label: getModuleDisplayName(module)
          }))
        ];
        setAvailableModules(moduleOptions);
        
        setFilteredPermissions(allPermissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  useEffect(() => {
    // Filter permissions based on search query and selected module
    let filtered = permissions;
    
    // Filter by module if not 'all'
    if (selectedModule !== 'all') {
      filtered = filtered.filter(permission => permission.module === selectedModule);
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        permission => 
          permission.name.toLowerCase().includes(query) || 
          permission.description.toLowerCase().includes(query) ||
          permission.module.toLowerCase().includes(query)
      );
    }
    
    setFilteredPermissions(filtered);
  }, [searchQuery, selectedModule, permissions]);

  const handleDeletePermission = async (permissionId: string) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await permissionService.deletePermission(permissionId);
        setPermissions(prevPermissions => prevPermissions.filter(permission => permission.id !== permissionId));
        setFilteredPermissions(prevPermissions => prevPermissions.filter(permission => permission.id !== permissionId));
      } catch (error) {
        console.error('Error deleting permission:', error);
      }
    }
  };

  const handleModuleChange = (value: string) => {
    setSelectedModule(value);
  };

  const handleInitializeDefaultPermissions = async () => {
    try {
      setInitializingPermissions(true);
      await permissionService.initializeDefaultPermissions();
      
      // Refresh permissions after initialization
      const allPermissions = await permissionService.getAllPermissions();
      setPermissions(allPermissions);
      setFilteredPermissions(allPermissions);
      
      // Extract unique modules from permissions
      const modules = Array.from(new Set(allPermissions.map(p => p.module)));
      const moduleOptions = [
        { id: 'all', label: 'All Modules' },
        ...modules.map(module => ({
          id: module,
          label: getModuleDisplayName(module)
        }))
      ];
      setAvailableModules(moduleOptions);
      
    } catch (error) {
      console.error('Error initializing default permissions:', error);
    } finally {
      setInitializingPermissions(false);
    }
  };

  const getModuleDisplayName = (moduleKey: string): string => {
    const moduleMap: Record<string, string> = {
      [ModuleNames.USERS]: 'User Management',
      [ModuleNames.HR]: 'HR Management',
      [ModuleNames.HELPDESK]: 'Help Desk',
      [ModuleNames.DOCUMENTS]: 'Document Management',
      [ModuleNames.ASSETS]: 'Asset Management',
      [ModuleNames.PROJECTS]: 'Project Management',
      [ModuleNames.TIMESHEET]: 'Timesheet',
      [ModuleNames.INVOICING]: 'Invoicing',
      [ModuleNames.TIME_TRACKING]: 'Time Tracking',
      [ModuleNames.NOTIFICATIONS]: 'Notifications',
      [ModuleNames.CRM]: 'CRM',
      [ModuleNames.ADMIN]: 'Administration',
      [ModuleNames.DASHBOARD]: 'Dashboard'
    };
    
    return moduleMap[moduleKey] || moduleKey;
  };

  return (
    <MainLayout>
      <Head>
        <title>Permission Management | Enterprise Management System</title>
      </Head>

      <PermissionGate
        permission={{
          module: ModuleNames.ADMIN,
          action: "manage"
        }}
        fallback={
          <div className="container mx-auto py-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You don't have permission to access this page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className='container mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Permission Management</h1>
              <p className='text-slate-500 dark:text-slate-400'>
                Manage system permissions and access controls
              </p>
            </div>
            <div className='flex flex-col sm:flex-row gap-2'>
              <Button 
                variant='outline' 
                onClick={handleInitializeDefaultPermissions}
                disabled={initializingPermissions}
              >
                {initializingPermissions ? (
                  <>
                    <div className='h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin mr-2'></div>
                    Initializing...
                  </>
                ) : (
                  <>
                    <Check className='mr-2 h-4 w-4' />
                    Initialize Default Permissions
                  </>
                )}
              </Button>
              <Button asChild className='w-full sm:w-auto'>
                <Link href='/admin/permissions/add'>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Permission
                </Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>View and manage all system permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col sm:flex-row items-center gap-4 mb-6'>
                <div className='relative w-full sm:max-w-xs'>
                  <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400' />
                  <Input
                    type='search'
                    placeholder='Search permissions...'
                    className='w-full pl-8'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select
                  value={selectedModule}
                  onValueChange={handleModuleChange}
                >
                  <SelectTrigger className='w-full sm:w-[200px]'>
                    <SelectValue placeholder='Filter by module' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='text-center'>
                    <div className='h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4'></div>
                    <p className='text-slate-500 dark:text-slate-400'>Loading permissions...</p>
                  </div>
                </div>
              ) : (
                <div className='rounded-md border overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='whitespace-nowrap'>Permission</TableHead>
                        <TableHead className='whitespace-nowrap'>Module</TableHead>
                        <TableHead className='whitespace-nowrap'>Actions</TableHead>
                        <TableHead className='whitespace-nowrap'>Resource</TableHead>
                        <TableHead className='text-right whitespace-nowrap'>Manage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPermissions.length > 0 ? (
                        filteredPermissions.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell>
                              <div className='min-w-0 max-w-[200px]'>
                                <div className='font-medium truncate'>{permission.name}</div>
                                <div className='text-sm text-slate-500 dark:text-slate-400 truncate'>{permission.description}</div>
                              </div>
                            </TableCell>
                            <TableCell className='whitespace-nowrap'>
                              <Badge variant='outline'>{getModuleDisplayName(permission.module)}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className='flex flex-wrap gap-1'>
                                {permission.actions.map(action => (
                                  <Badge key={action} variant='secondary' className='capitalize'>
                                    {action}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {permission.resource ? (
                                <Badge variant='secondary'>{permission.resource}</Badge>
                              ) : (
                                <span className='text-slate-400 dark:text-slate-500'>All</span>
                              )}
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
                                    <Link href={`/admin/permissions/edit/${permission.id}`} className='flex items-center'>
                                      <Edit className='mr-2 h-4 w-4' />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className='text-red-600'
                                    onClick={() => handleDeletePermission(permission.id)}
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
                            {searchQuery || selectedModule !== 'all' ? 
                              'No permissions found matching your filters.' : 
                              'No permissions found. Click "Initialize Default Permissions" to create the default set.'}
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
      </PermissionGate>
    </MainLayout>
  );
}