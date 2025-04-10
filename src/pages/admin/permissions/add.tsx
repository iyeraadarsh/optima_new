import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowLeft, Save, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MainLayout } from "@/components/layout/MainLayout";
import { permissionService } from "@/services/permissionService";
import { Permission, ModuleNames, ActionTypes } from "@/types/rbac";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddPermissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState<string>(ModuleNames.ADMIN);
  const [actions, setActions] = useState<string[]>([ActionTypes.READ]);
  const [resource, setResource] = useState("");

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

  // Resource suggestions based on selected module
  const getResourceSuggestions = (): string[] => {
    switch (module) {
      case ModuleNames.HR:
        return ["employee", "department", "leave", "performance"];
      case ModuleNames.PROJECTS:
        return ["project", "task", "milestone"];
      case ModuleNames.DOCUMENTS:
        return ["document", "folder", "template"];
      case ModuleNames.ASSETS:
        return ["hardware", "software", "furniture"];
      case ModuleNames.HELPDESK:
        return ["ticket", "knowledge_article"];
      case ModuleNames.CRM:
        return ["customer", "lead", "opportunity", "contact"];
      case ModuleNames.ADMIN:
        return ["permission", "role", "config"];
      default:
        return [];
    }
  };

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

      const newPermission: Omit<Permission, "id"> = {
        name,
        description,
        module,
        actions,
        ...(resource ? { resource } : {})
      };

      await permissionService.createPermission(newPermission);
      
      toast({
        title: "Success",
        description: "Permission created successfully",
      });
      
      router.push("/admin/permissions");
    } catch (error) {
      console.error("Error creating permission:", error);
      setError("Failed to create permission");
      toast({
        title: "Error",
        description: "Failed to create permission",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAction = (actionId: string) => {
    setActions(prev => 
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  return (
    <MainLayout>
      <Head>
        <title>Add Permission | Enterprise Management System</title>
      </Head>

      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='icon' asChild>
              <Link href='/admin/permissions'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>Add Permission</h1>
              <p className='text-slate-500 dark:text-slate-400 mt-1'>
                Create a new permission for the system
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className='h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2'></div>
                Saving...
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                Create Permission
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className='p-3 text-sm bg-red-50 text-red-600 rounded-md flex items-center'>
            <AlertTriangle className='h-4 w-4 mr-2' />
            {error}
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='md:col-span-2 space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Permission Details</CardTitle>
                <CardDescription>
                  Basic information about this permission
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Permission Name</Label>
                  <Input
                    id='name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g., Manage Users'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Describe what this permission allows'
                    rows={3}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='module'>Module</Label>
                  <Select value={module} onValueChange={setModule}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a module' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModules.map((mod) => (
                        <SelectItem key={mod.id} value={mod.id}>
                          {mod.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-sm text-slate-500'>
                    The system module this permission applies to
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='resource'>Resource (Optional)</Label>
                  <div className='flex flex-col space-y-2'>
                    <Input
                      id='resource'
                      value={resource}
                      onChange={(e) => setResource(e.target.value)}
                      placeholder='e.g., department, project, document'
                    />
                    {getResourceSuggestions().length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-2'>
                        <span className='text-xs text-slate-500'>Suggestions:</span>
                        {getResourceSuggestions().map(suggestion => (
                          <Button
                            key={suggestion}
                            variant='outline'
                            size='sm'
                            className='h-6 text-xs'
                            onClick={() => setResource(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className='text-sm text-slate-500'>
                    Specific resource this permission applies to (leave empty for all resources)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  What actions does this permission allow?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {availableActions.map((action) => (
                    <div key={action.id} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`action-${action.id}`}
                        checked={actions.includes(action.id)}
                        onCheckedChange={() => toggleAction(action.id)}
                      />
                      <Label htmlFor={`action-${action.id}`} className='font-normal'>
                        {action.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className='border-t pt-4 flex justify-between'>
                <Button variant='outline' size='sm' onClick={() => setActions([])}>
                  <X className='mr-2 h-3 w-3' />
                  Clear All
                </Button>
                <Button 
                  variant='outline' 
                  size='sm'
                  onClick={() => setActions(availableActions.map(a => a.id))}
                >
                  <Check className='mr-2 h-3 w-3' />
                  Select All
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}