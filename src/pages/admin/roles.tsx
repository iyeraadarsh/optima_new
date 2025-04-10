
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { 
  Plus, 
  Save, 
  Trash, 
  Edit, 
  ArrowLeft, 
  Shield, 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import { permissionService } from "@/services/permissionService";
import { rbacService } from "@/services/rbacService";
import { Role, Permission, ModuleNames, AccessLevels } from "@/types/rbac";
import { useToast } from "@/hooks/use-toast";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const { toast } = useToast();
  
  // New role form
  const [showNewRoleDialog, setShowNewRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleLevel, setRoleLevel] = useState(10);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [activePermissionTab, setActivePermissionTab] = useState("all");
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch roles
        const allRoles = await rbacService.getAllRoles();
        setRoles(allRoles);
        setFilteredRoles(allRoles);
        
        // Fetch permissions
        const allPermissions = await permissionService.getAllPermissions();
        setPermissions(allPermissions);

        // Group permissions by module
        const groupedPermissions: Record<string, Permission[]> = {};
        allPermissions.forEach(permission => {
          if (!groupedPermissions[permission.module]) {
            groupedPermissions[permission.module] = [];
          }
          groupedPermissions[permission.module].push(permission);
        });
        setPermissionsByModule(groupedPermissions);

        // Initialize default RBAC if no roles or permissions exist
        if (allRoles.length === 0 || allPermissions.length === 0) {
          await rbacService.initializeDefaultRbac();
          
          // Fetch again after initialization
          const updatedRoles = await rbacService.getAllRoles();
          setRoles(updatedRoles);
          setFilteredRoles(updatedRoles);
          
          const updatedPermissions = await permissionService.getAllPermissions();
          setPermissions(updatedPermissions);
          
          toast({
            title: 'Default roles initialized',
            description: 'Default roles and permissions have been created.',
          });
        }
      } catch (error) {
        console.error('Error fetching RBAC data:', error);
        setError('Failed to load roles and permissions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRoles(roles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = roles.filter(
        role => 
          role.name.toLowerCase().includes(query) || 
          role.description.toLowerCase().includes(query)
      );
      setFilteredRoles(filtered);
    }
  }, [searchQuery, roles]);

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setRoleLevel(role.level);
    setSelectedPermissions(role.permissions);
    setShowNewRoleDialog(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm("Are you sure you want to delete this role? This may affect users with this role assigned.")) {
      try {
        await rbacService.deleteRole(roleId);
        setRoles(roles.filter(role => role.id !== roleId));
        setFilteredRoles(filteredRoles.filter(role => role.id !== roleId));
        toast({
          title: 'Role deleted',
          description: 'The role has been deleted successfully.',
        });
      } catch (error) {
        console.error("Error deleting role:", error);
        setError("Failed to delete role. Please try again.");
      }
    }
  };

  const handleSaveRole = async () => {
    try {
      if (!roleName.trim()) {
        setError('Role name is required');
        return;
      }
      
      const roleData: Role = {
        id: editingRole?.id || `role_${Date.now()}`,
        name: roleName,
        description: roleDescription,
        level: roleLevel,
        permissions: selectedPermissions,
        createdAt: editingRole?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await rbacService.saveRole(roleData);
      
      if (editingRole) {
        // Update existing role in the list
        setRoles(roles.map(role => role.id === roleData.id ? roleData : role));
        setFilteredRoles(filteredRoles.map(role => role.id === roleData.id ? roleData : role));
        toast({
          title: 'Role updated',
          description: `The role '${roleData.name}' has been updated successfully.`,
        });
      } else {
        // Add new role to the list
        setRoles([...roles, roleData]);
        setFilteredRoles([...filteredRoles, roleData]);
        toast({
          title: 'Role created',
          description: `The role '${roleData.name}' has been created successfully.`,
        });
      }
      
      // Reset form and close dialog
      resetForm();
      setShowNewRoleDialog(false);
    } catch (error) {
      console.error("Error saving role:", error);
      setError("Failed to save role. Please try again.");
    }
  };

  const resetForm = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setRoleLevel(10);
    setSelectedPermissions([]);
    setActivePermissionTab("all");
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
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

  const getLevelName = (level: number): string => {
    if (level >= AccessLevels.SYSTEM_ADMIN) return "System Admin";
    if (level >= AccessLevels.ADMIN) return "Admin";
    if (level >= AccessLevels.DIRECTOR) return "Director";
    if (level >= AccessLevels.LEADER) return "Leader";
    if (level >= AccessLevels.DEPARTMENT_MANAGER) return "Department Manager";
    if (level >= AccessLevels.MANAGER) return "Manager";
    if (level >= AccessLevels.SUPERVISOR) return "Supervisor";
    if (level >= AccessLevels.EMPLOYEE) return "Employee";
    if (level >= AccessLevels.USER) return "User";
    return "Guest";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading roles and permissions...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Head>
        <title>Role Management | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Create and manage roles with specific permissions
              </p>
            </div>
          </div>
          <Dialog open={showNewRoleDialog} onOpenChange={setShowNewRoleDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
                <DialogDescription>
                  {editingRole 
                    ? "Update the details and permissions for this role" 
                    : "Define a new role with specific permissions"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g., Department Manager"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleLevel">Access Level</Label>
                    <Input
                      id="roleLevel"
                      type="number"
                      min="0"
                      max="100"
                      value={roleLevel}
                      onChange={(e) => setRoleLevel(parseInt(e.target.value))}
                      required
                    />
                    <p className="text-xs text-slate-500">
                      Higher number = more authority (0-100). Current level: {getLevelName(roleLevel)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleDescription">Description</Label>
                  <Input
                    id="roleDescription"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Describe the purpose of this role"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <Tabs defaultValue="all" value={activePermissionTab} onValueChange={setActivePermissionTab}>
                    <TabsList className="w-full flex overflow-x-auto">
                      <TabsTrigger value="all" className="flex-shrink-0">All</TabsTrigger>
                      {Object.keys(permissionsByModule).map(module => (
                        <TabsTrigger key={module} value={module} className="flex-shrink-0">
                          {getModuleDisplayName(module)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <TabsContent value="all">
                      <div className="border rounded-md h-64 overflow-y-auto">
                        <div className="divide-y">
                          {permissions.length > 0 ? (
                            permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center justify-between p-3">
                                <div className="flex-1 mr-4">
                                  <p className="font-medium">{permission.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{getModuleDisplayName(permission.module)}</Badge>
                                    {permission.actions.map(action => (
                                      <Badge key={action} variant="secondary" className="text-xs capitalize">{action}</Badge>
                                    ))}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">{permission.description}</p>
                                </div>
                                <Switch
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-500">
                              No permissions defined. System will initialize default permissions.
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                      <TabsContent key={module} value={module}>
                        <div className="border rounded-md h-64 overflow-y-auto">
                          <div className="divide-y">
                            {modulePermissions.map((permission) => (
                              <div key={permission.id} className="flex items-center justify-between p-3">
                                <div className="flex-1 mr-4">
                                  <p className="font-medium">{permission.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {permission.actions.map(action => (
                                      <Badge key={action} variant="secondary" className="text-xs capitalize">{action}</Badge>
                                    ))}
                                    {permission.resource && (
                                      <Badge variant="outline" className="text-xs">Resource: {permission.resource}</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">{permission.description}</p>
                                </div>
                                <Switch
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewRoleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRole}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>System Roles</CardTitle>
                <CardDescription>
                  Manage roles and their associated permissions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Search roles..."
                    className="pl-8 w-full sm:w-auto"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => {
                      // Get permission details for this role
                      const rolePermissionDetails = permissions.filter(
                        permission => role.permissions.includes(permission.id)
                      );
                      
                      // Group permissions by module
                      const permissionsByModule: Record<string, number> = {};
                      rolePermissionDetails.forEach(permission => {
                        permissionsByModule[permission.module] = 
                          (permissionsByModule[permission.module] || 0) + 1;
                      });
                      
                      return (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <UserCog className="h-4 w-4 text-slate-400" />
                              <span>{role.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{role.description}</TableCell>
                          <TableCell>
                            <Badge variant={role.level >= 70 ? "default" : "secondary"}>
                              {getLevelName(role.level)} ({role.level})
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(permissionsByModule).map(([module, count]) => (
                                <Badge key={module} variant="outline" className="text-xs">
                                  {getModuleDisplayName(module)}: {count}
                                </Badge>
                              ))}
                              {role.permissions.length === 0 && (
                                <span className="text-slate-500 text-sm">No permissions</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600"
                                onClick={() => handleDeleteRole(role.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {searchQuery ? 'No roles found matching your search.' : 'No roles defined yet. Create your first role to get started.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
