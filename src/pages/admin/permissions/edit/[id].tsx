
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { 
  Save, 
  ArrowLeft, 
  Trash, 
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MainLayout } from "@/components/layout/MainLayout";
import { permissionService } from "@/services/permissionService";
import { Permission, ModuleNames, ActionTypes } from "@/types/rbac";
import { useToast } from "@/hooks/use-toast";

export default function EditPermissionPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState<string>(ModuleNames.ADMIN);
  const [actions, setActions] = useState<string[]>([]);
  const [resource, setResource] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Available actions for checkboxes
  const availableActions = [
    { id: ActionTypes.READ, label: "Read" },
    { id: ActionTypes.CREATE, label: "Create" },
    { id: ActionTypes.UPDATE, label: "Update" },
    { id: ActionTypes.DELETE, label: "Delete" },
    { id: ActionTypes.APPROVE, label: "Approve" },
    { id: ActionTypes.ASSIGN, label: "Assign" },
    { id: ActionTypes.EXPORT, label: "Export" },
    { id: ActionTypes.IMPORT, label: "Import" },
    { id: ActionTypes.MANAGE, label: "Manage" }
  ];

  // Available modules for select
  const availableModules = [
    { id: ModuleNames.ADMIN, label: "Administration" },
    { id: ModuleNames.USERS, label: "User Management" },
    { id: ModuleNames.HR, label: "HR Management" },
    { id: ModuleNames.DASHBOARD, label: "Dashboard" },
    { id: ModuleNames.DOCUMENTS, label: "Document Management" },
    { id: ModuleNames.ASSETS, label: "Asset Management" },
    { id: ModuleNames.PROJECTS, label: "Project Management" },
    { id: ModuleNames.TIMESHEET, label: "Timesheet" },
    { id: ModuleNames.INVOICING, label: "Invoicing" },
    { id: ModuleNames.TIME_TRACKING, label: "Time Tracking" },
    { id: ModuleNames.NOTIFICATIONS, label: "Notifications" },
    { id: ModuleNames.CRM, label: "CRM" },
    { id: ModuleNames.HELPDESK, label: "Help Desk" }
  ];

  useEffect(() => {
    const fetchPermission = async () => {
      if (id && typeof id === 'string') {
        try {
          setLoading(true);
          const permissionData = await permissionService.getPermission(id);
          
          if (permissionData) {
            setPermission(permissionData);
            // Initialize form with permission data
            setName(permissionData.name);
            setDescription(permissionData.description);
            setModule(permissionData.module);
            setActions(permissionData.actions);
            setResource(permissionData.resource || "");
          } else {
            setError("Permission not found");
            toast({
              title: "Error",
              description: "Permission not found",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error fetching permission:", error);
          setError("Failed to load permission details");
          toast({
            title: "Error",
            description: "Failed to load permission details",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPermission();
  }, [id, toast]);

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        setError("Permission name is required");
        return;
      }

      if (actions.length === 0) {
        setError("At least one action must be selected");
        return;
      }

      setSaving(true);
      setError("");

      if (permission && id) {
        const updatedPermission: Partial<Permission> = {
          name,
          description,
          module,
          actions,
          ...(resource ? { resource } : {})
        };

        await permissionService.updatePermission(id as string, updatedPermission);
        
        toast({
          title: "Success",
          description: "Permission updated successfully",
        });
        
        router.push("/admin/permissions");
      }
    } catch (error) {
      console.error("Error saving permission:", error);
      setError("Failed to save permission");
      toast({
        title: "Error",
        description: "Failed to save permission",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (id) {
        await permissionService.deletePermission(id as string);
        toast({
          title: "Success",
          description: "Permission deleted successfully",
        });
        router.push("/admin/permissions");
      }
    } catch (error) {
      console.error("Error deleting permission:", error);
      setError("Failed to delete permission");
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive"
      });
    }
  };

  const toggleAction = (actionId: string) => {
    setActions(prev => 
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading permission details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!permission && !loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Permission Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            The permission you are looking for does not exist or has been deleted.
          </p>
          <Button asChild>
            <Link href="/admin/permissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Permissions
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Head>
        <title>Edit Permission | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/permissions">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Permission</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Modify permission details and access controls
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the permission
                    and may affect any roles that use it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Permission Details</CardTitle>
                <CardDescription>
                  Basic information about this permission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Permission Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Manage Users"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this permission allows"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module">Module</Label>
                  <Select value={module} onValueChange={setModule}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModules.map((mod) => (
                        <SelectItem key={mod.id} value={mod.id}>
                          {mod.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500">
                    The system module this permission applies to
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource">Resource (Optional)</Label>
                  <Input
                    id="resource"
                    value={resource}
                    onChange={(e) => setResource(e.target.value)}
                    placeholder="e.g., department, project, document"
                  />
                  <p className="text-sm text-slate-500">
                    Specific resource this permission applies to (leave empty for all resources)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  What actions does this permission allow?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableActions.map((action) => (
                    <div key={action.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`action-${action.id}`}
                        checked={actions.includes(action.id)}
                        onCheckedChange={() => toggleAction(action.id)}
                      />
                      <Label htmlFor={`action-${action.id}`} className="font-normal">
                        {action.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setActions([])}>
                  <X className="mr-2 h-3 w-3" />
                  Clear All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActions(availableActions.map(a => a.id))}
                >
                  <Check className="mr-2 h-3 w-3" />
                  Select All
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permission ID</CardTitle>
                <CardDescription>
                  System identifier for this permission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
                  <code className="text-sm break-all">{id}</code>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  This ID is used internally by the system and cannot be changed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
