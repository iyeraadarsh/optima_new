import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Save, Power, Users, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { rbacService } from "@/services/rbacService";
import { userService } from "@/services/userService";
import { ModuleConfig, RoleModuleAccess, UserModuleAccess } from "@/types/admin";
import { Role } from "@/types/rbac";
import { User } from "@/types";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

export default function ModulesPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roleModuleAccess, setRoleModuleAccess] = useState<RoleModuleAccess[]>([]);
  const [userModuleAccess, setUserModuleAccess] = useState<UserModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("system");
  const { toast } = useToast();
  
  // Role module access dialog
  const [showRoleModuleDialog, setShowRoleModuleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleModuleSettings, setRoleModuleSettings] = useState<{[key: string]: boolean}>({});
  
  // User module access dialog
  const [showUserModuleDialog, setShowUserModuleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModuleSettings, setUserModuleSettings] = useState<{[key: string]: boolean}>({});

  // Check if user has admin privileges
  const isAdmin = userProfile?.role === "super_admin" || 
                  userProfile?.role === "admin" || 
                  userProfile?.role === "director" || 
                  userProfile?.role === "leader" ||
                  userProfile?.role === "department_manager";

  useEffect(() => {
    // If user is not admin, redirect to dashboard
    if (userProfile && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch modules
        const allModules = await adminService.getModuleConfigs();
        setModules(allModules);
        
        // Fetch roles
        const allRoles = await rbacService.getAllRoles();
        setRoles(allRoles);
        
        // Fetch users
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
        
        // Fetch role-module access settings
        try {
          const roleModuleAccessData = await adminService.getRoleModuleAccess();
          setRoleModuleAccess(roleModuleAccessData);
        } catch (error) {
          console.warn('Role-module access data not found, initializing empty array', error);
          setRoleModuleAccess([]);
        }
        
        // Fetch user-module access settings
        try {
          const userModuleAccessData = await adminService.getUserModuleAccess();
          setUserModuleAccess(userModuleAccessData);
        } catch (error) {
          console.warn('User-module access data not found, initializing empty array', error);
          setUserModuleAccess([]);
        }
        
      } catch (error) {
        console.error("Error fetching module management data:", error);
        setError("Failed to load module configurations");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile, isAdmin, router]);

  // System-wide module toggle
  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    setSaving(moduleId);
    setError("");

    try {
      await adminService.toggleModuleStatus(
        moduleId, 
        enabled, 
        userProfile?.id || "system"
      );
      
      // Update local state
      setModules(modules.map(module => 
        module.id === moduleId 
          ? { ...module, enabled } 
          : module
      ));
    } catch (error) {
      console.error("Error toggling module status:", error);
      setError("Failed to update module status");
    } finally {
      setSaving(null);
    }
  };

  // Open role module access dialog
  const handleConfigureRoleAccess = (role: Role) => {
    setSelectedRole(role);
    
    // Initialize settings based on existing role-module access
    const initialSettings: {[key: string]: boolean} = {};
    modules.forEach(module => {
      // Check if there's an existing setting for this role and module
      const existingSetting = roleModuleAccess.find(
        access => access.roleId === role.id && access.moduleId === module.id
      );
      
      // Default to module's system-wide setting if no role-specific setting exists
      initialSettings[module.id] = existingSetting ? existingSetting.access : module.enabled;
    });
    
    setRoleModuleSettings(initialSettings);
    setShowRoleModuleDialog(true);
  };

  // Save role module access settings
  const handleSaveRoleModuleAccess = async () => {
    if (!selectedRole) return;
    
    setSaving(selectedRole.id);
    setError("");
    
    try {
      // For each module, create or update role-module access
      const updatedAccess: RoleModuleAccess[] = [];
      
      for (const [moduleId, access] of Object.entries(roleModuleSettings)) {
        const accessId = `role_module_${selectedRole.id}_${moduleId}`;
        
        const accessData = {
          id: accessId,
          roleId: selectedRole.id,
          moduleId,
          access,
          updatedAt: new Date().toISOString(),
          updatedBy: userProfile?.id || "system"
        };
        
        // Save to Firebase
        await adminService.saveRoleModuleAccess(accessData);
        
        updatedAccess.push(accessData);
      }
      
      // Update local state
      setRoleModuleAccess(prev => {
        // Remove existing entries for this role
        const filtered = prev.filter(access => access.roleId !== selectedRole.id);
        // Add new entries
        return [...filtered, ...updatedAccess];
      });
      
      toast({
        title: 'Access settings saved',
        description: `Module access for role '${selectedRole.name}' has been updated.`,
      });
      
      setShowRoleModuleDialog(false);
    } catch (error) {
      console.error("Error saving role module access:", error);
      setError("Failed to save role module access settings");
    } finally {
      setSaving(null);
    }
  };

  // Open user module access dialog
  const handleConfigureUserAccess = (user: User) => {
    setSelectedUser(user);
    
    // Initialize settings based on existing user-module access
    const initialSettings: {[key: string]: boolean} = {};
    modules.forEach(module => {
      // Check if there's an existing setting for this user and module
      const existingSetting = userModuleAccess.find(
        access => access.userId === user.id && access.moduleId === module.id
      );
      
      // Default to module's system-wide setting if no user-specific setting exists
      initialSettings[module.id] = existingSetting ? existingSetting.access : module.enabled;
    });
    
    setUserModuleSettings(initialSettings);
    setShowUserModuleDialog(true);
  };

  // Save user module access settings
  const handleSaveUserModuleAccess = async () => {
    if (!selectedUser) return;
    
    setSaving(selectedUser.id);
    setError("");
    
    try {
      // For each module, create or update user-module access
      const updatedAccess: UserModuleAccess[] = [];
      
      for (const [moduleId, access] of Object.entries(userModuleSettings)) {
        const accessId = `user_module_${selectedUser.id}_${moduleId}`;
        
        const accessData = {
          id: accessId,
          userId: selectedUser.id,
          moduleId,
          access,
          updatedAt: new Date().toISOString(),
          updatedBy: userProfile?.id || "system"
        };
        
        // Save to Firebase
        await adminService.saveUserModuleAccess(accessData);
        
        updatedAccess.push(accessData);
      }
      
      // Update local state
      setUserModuleAccess(prev => {
        // Remove existing entries for this user
        const filtered = prev.filter(access => access.userId !== selectedUser.id);
        // Add new entries
        return [...filtered, ...updatedAccess];
      });
      
      toast({
        title: 'Access settings saved',
        description: `Module access for user '${selectedUser.name}' has been updated.`,
      });
      
      setShowUserModuleDialog(false);
    } catch (error) {
      console.error("Error saving user module access:", error);
      setError("Failed to save user module access settings");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Module Management | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Module Management</h1>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="system">System Modules</TabsTrigger>
            <TabsTrigger value="roles">Role Access</TabsTrigger>
            <TabsTrigger value="users">User Access</TabsTrigger>
          </TabsList>
          
          {/* System-wide Module Settings */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Modules</CardTitle>
                <CardDescription>
                  Enable or disable system modules and features globally
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.length > 0 ? (
                      modules.map((module) => (
                        <TableRow key={module.id}>
                          <TableCell className="font-medium">{module.displayName}</TableCell>
                          <TableCell>{module.description}</TableCell>
                          <TableCell>{module.version}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              module.enabled 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
                            }`}>
                              {module.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Switch 
                                checked={module.enabled}
                                onCheckedChange={(checked) => handleToggleModule(module.id, checked)}
                                disabled={saving === module.id}
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleToggleModule(module.id, !module.enabled)}
                                disabled={saving === module.id}
                              >
                                <Power className="h-4 w-4 mr-2" />
                                {module.enabled ? 'Disable' : 'Enable'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No modules found. Please initialize the system configuration.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Role-based Module Access */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Role-based Module Access</CardTitle>
                <CardDescription>
                  Configure which modules are accessible for each role
                </CardDescription>
              </CardHeader>
              <CardContent>
                {roles.length === 0 ? (
                  <div className='text-center py-8'>
                    <p className='text-slate-500 dark:text-slate-400 mb-4'>
                      No roles found. Please create roles first.
                    </p>
                    <Button asChild>
                      <Link href='/users/roles'>
                        Go to Role Management
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Modules</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => {
                        // Count enabled modules for this role
                        const roleModules = roleModuleAccess.filter(
                          access => access.roleId === role.id && access.access
                        );
                        
                        return (
                          <TableRow key={role.id}>
                            <TableCell className='font-medium'>{role.name}</TableCell>
                            <TableCell>{role.description}</TableCell>
                            <TableCell>{role.level}</TableCell>
                            <TableCell>
                              {roleModules.length > 0 ? (
                                <span className='text-sm'>
                                  {roleModules.length} enabled
                                </span>
                              ) : (
                                <span className='text-sm text-slate-500'>
                                  Using system defaults
                                </span>
                              )}
                            </TableCell>
                            <TableCell className='text-right'>
                              <Button 
                                variant='outline' 
                                size='sm'
                                onClick={() => handleConfigureRoleAccess(role)}
                              >
                                <Users className='h-4 w-4 mr-2' />
                                Configure Access
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User-based Module Access */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User-based Module Access</CardTitle>
                <CardDescription>
                  Configure module access for individual users (overrides role-based settings)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className='text-center py-8'>
                    <p className='text-slate-500 dark:text-slate-400 mb-4'>
                      No users found. Please create users first.
                    </p>
                    <Button asChild>
                      <Link href='/users'>
                        Go to User Management
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Custom Access</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        // Count custom module settings for this user
                        const userModules = userModuleAccess.filter(
                          access => access.userId === user.id
                        );
                        
                        return (
                          <TableRow key={user.id}>
                            <TableCell className='font-medium'>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className='capitalize'>{user.role}</TableCell>
                            <TableCell>
                              {userModules.length > 0 ? (
                                <span className='text-sm'>
                                  {userModules.length} custom settings
                                </span>
                              ) : (
                                <span className='text-sm text-slate-500'>
                                  Using role defaults
                                </span>
                              )}
                            </TableCell>
                            <TableCell className='text-right'>
                              <Button 
                                variant='outline' 
                                size='sm'
                                onClick={() => handleConfigureUserAccess(user)}
                              >
                                <UserCog className='h-4 w-4 mr-2' />
                                Configure Access
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Role Module Access Dialog */}
      <Dialog open={showRoleModuleDialog} onOpenChange={setShowRoleModuleDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configure Module Access for {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Enable or disable access to specific modules for this role
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {modules.map((module) => (
                <div key={module.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <h4 className="font-medium">{module.displayName}</h4>
                    <p className="text-sm text-slate-500">{module.description}</p>
                  </div>
                  <Switch 
                    checked={roleModuleSettings[module.id] || false}
                    onCheckedChange={(checked) => 
                      setRoleModuleSettings({...roleModuleSettings, [module.id]: checked})
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoleModuleAccess} disabled={saving === selectedRole?.id}>
              <Save className="mr-2 h-4 w-4" />
              {saving === selectedRole?.id ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Module Access Dialog */}
      <Dialog open={showUserModuleDialog} onOpenChange={setShowUserModuleDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configure Module Access for {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Enable or disable access to specific modules for this user (overrides role-based settings)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {modules.map((module) => (
                <div key={module.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <h4 className="font-medium">{module.displayName}</h4>
                    <p className="text-sm text-slate-500">{module.description}</p>
                  </div>
                  <Switch 
                    checked={userModuleSettings[module.id] || false}
                    onCheckedChange={(checked) => 
                      setUserModuleSettings({...userModuleSettings, [module.id]: checked})
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUserModuleAccess} disabled={saving === selectedUser?.id}>
              <Save className="mr-2 h-4 w-4" />
              {saving === selectedUser?.id ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}