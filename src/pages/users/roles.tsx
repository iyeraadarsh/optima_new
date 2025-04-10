import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { rbacService } from "@/services/rbacService";
import { Role, Permission, AccessLevels } from "@/types/rbac";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();
  
  // New role form
  const [showNewRoleDialog, setShowNewRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleLevel, setRoleLevel] = useState(10);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [updatingRoles, setUpdatingRoles] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch roles
        const allRoles = await rbacService.getAllRoles();
        setRoles(allRoles);
        
        // Fetch permissions
        const allPermissions = await rbacService.getAllPermissions();
        setPermissions(allPermissions);

        // Initialize default RBAC if no roles or permissions exist
        if (allRoles.length === 0 || allPermissions.length === 0) {
          await rbacService.initializeDefaultRbac();
          
          // Fetch again after initialization
          const updatedRoles = await rbacService.getAllRoles();
          setRoles(updatedRoles);
          
          const updatedPermissions = await rbacService.getAllPermissions();
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
        toast({
          title: 'Role updated',
          description: `The role '${roleData.name}' has been updated successfully.`,
        });
      } else {
        // Add new role to the list
        setRoles([...roles, roleData]);
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
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleUpdateRoles = async () => {
    try {
      setUpdatingRoles(true);
      setError("");
      
      // Call the API to update roles
      const response = await fetch('/api/update-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update roles');
      }
      
      // Fetch updated roles
      const updatedRoles = await rbacService.getAllRoles();
      setRoles(updatedRoles);
      
      toast({
        title: 'Roles updated',
        description: 'Additional roles have been added to the system.',
      });
    } catch (error) {
      console.error('Error updating roles:', error);
      setError('Failed to update roles. Please try again.');
    } finally {
      setUpdatingRoles(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading roles and permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Role Management | Enterprise Management System</title>
      </Head>

      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='icon' asChild>
              <Link href='/users'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <h1 className='text-3xl font-bold tracking-tight'>Role Management</h1>
          </div>
          <div className='flex space-x-2'>
            <Button variant='outline' asChild>
              <Link href='/users/departments'>
                Manage Departments
              </Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href='/users/positions'>
                Manage Positions
              </Link>
            </Button>
            <Dialog open={showNewRoleDialog} onOpenChange={setShowNewRoleDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add New Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
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
                        Higher number = more authority (0-100)
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
                    <div className="border rounded-md h-64 overflow-y-auto">
                      <div className="divide-y">
                        {permissions.length > 0 ? (
                          permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center justify-between p-3">
                              <div>
                                <p className="font-medium">{permission.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{permission.module}</Badge>
                                  {permission.actions.map(action => (
                                    <Badge key={action} variant="secondary" className="text-xs">{action}</Badge>
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
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>System Roles</CardTitle>
            <CardDescription>
              Manage roles and their associated permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {roles.length > 0 ? (
                  roles.map((role) => {
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
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>{role.level}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(permissionsByModule).map(([module, count]) => (
                              <Badge key={module} variant="outline" className="text-xs">
                                {module}: {count}
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
                      No roles defined yet. Create your first role to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}