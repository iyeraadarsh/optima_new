
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Save, Plus, GitBranch, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { WorkflowConfig } from "@/types/admin";
import { useRouter } from "next/router";

export default function WorkflowsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Check if user has admin privileges
  const isAdmin = userProfile?.role === "super_admin" || 
                  userProfile?.role === "admin" || 
                  userProfile?.role === "director" || 
                  userProfile?.role === "leader";

  useEffect(() => {
    // If user is not admin, redirect to dashboard
    if (userProfile && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        const allWorkflows = await adminService.getWorkflowConfigs();
        setWorkflows(allWorkflows);
      } catch (error) {
        console.error("Error fetching workflows:", error);
        setError("Failed to load workflow configurations");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [userProfile, isAdmin, router]);

  const handleToggleWorkflow = async (workflowId: string, enabled: boolean) => {
    setSaving(workflowId);
    setError("");

    try {
      await adminService.toggleWorkflowStatus(
        workflowId, 
        enabled, 
        userProfile?.id || "system"
      );
      
      // Update local state
      setWorkflows(workflows.map(workflow => 
        workflow.id === workflowId 
          ? { ...workflow, enabled } 
          : workflow
      ));
    } catch (error) {
      console.error("Error toggling workflow status:", error);
      setError("Failed to update workflow status");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Workflow Configuration | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Workflow Configuration</h1>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Workflow
          </Button>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>System Workflows</CardTitle>
            <CardDescription>
              Configure workflows for various business processes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.length > 0 ? (
                  workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell className="font-medium">{workflow.displayName}</TableCell>
                      <TableCell>{workflow.description}</TableCell>
                      <TableCell>{workflow.module}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          workflow.enabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
                        }`}>
                          {workflow.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Switch 
                            checked={workflow.enabled}
                            onCheckedChange={(checked) => handleToggleWorkflow(workflow.id, checked)}
                            disabled={saving === workflow.id}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleWorkflow(workflow.id, !workflow.enabled)}
                            disabled={saving === workflow.id}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {workflow.enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No workflows found. Click "Add Workflow" to create one.
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
