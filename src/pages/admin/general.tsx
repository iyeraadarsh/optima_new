
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { SystemConfig } from "@/types/admin";
import { useRouter } from "next/router";

export default function GeneralSettingsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [generalConfigs, setGeneralConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Form state
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [configName, setConfigName] = useState("");
  const [configValue, setConfigValue] = useState<any>("");
  const [configDescription, setConfigDescription] = useState("");
  const [configType, setConfigType] = useState<"string" | "number" | "boolean" | "object" | "array">("string");

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

    const fetchGeneralConfigs = async () => {
      try {
        setLoading(true);
        const allConfigs = await adminService.getSystemConfigs();
        // Filter only general category configs
        const generalCategoryConfigs = allConfigs.filter(config => config.category === "general");
        setGeneralConfigs(generalCategoryConfigs);
      } catch (error) {
        console.error("Error fetching general configs:", error);
        setError("Failed to load general configurations");
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralConfigs();
  }, [userProfile, isAdmin, router]);

  const handleEditConfig = (config: SystemConfig) => {
    setEditingConfig(config);
    setConfigName(config.name);
    setConfigValue(config.value);
    setConfigDescription(config.description);
    setConfigType(config.type);
    setShowAddDialog(true);
  };

  const handleAddConfig = () => {
    setEditingConfig(null);
    setConfigName("");
    setConfigValue("");
    setConfigDescription("");
    setConfigType("string");
    setShowAddDialog(true);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setError("");

    try {
      // Validate form
      if (!configName || configValue === undefined || configValue === "") {
        setError("Name and value are required");
        setSaving(false);
        return;
      }

      // Convert value based on type
      let parsedValue = configValue;
      if (configType === "number") {
        parsedValue = Number(configValue);
        if (isNaN(parsedValue)) {
          setError("Invalid number value");
          setSaving(false);
          return;
        }
      } else if (configType === "boolean") {
        parsedValue = configValue === "true";
      } else if (configType === "object" || configType === "array") {
        try {
          parsedValue = JSON.parse(configValue);
        } catch (e) {
          setError(`Invalid ${configType} format`);
          setSaving(false);
          return;
        }
      }

      const configData: SystemConfig = {
        id: editingConfig?.id || `config_general_${Date.now()}`,
        name: configName,
        value: parsedValue,
        description: configDescription,
        type: configType,
        category: "general", // Always general for this page
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.id || "system"
      };

      await adminService.saveSystemConfig(configData);

      // Update local state
      if (editingConfig) {
        setGeneralConfigs(configs => configs.map(c => c.id === configData.id ? configData : c));
      } else {
        setGeneralConfigs(configs => [...configs, configData]);
      }

      setShowAddDialog(false);
    } catch (error) {
      console.error("Error saving config:", error);
      setError("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading general settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>General Settings | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
          </div>
          <Button onClick={handleAddConfig}>
            <Plus className="mr-2 h-4 w-4" />
            Add Setting
          </Button>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure general system settings like company name, system name, and other global parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generalConfigs.length > 0 ? (
                  generalConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>
                        {typeof config.value === "object" 
                          ? JSON.stringify(config.value) 
                          : String(config.value)}
                      </TableCell>
                      <TableCell>{config.description}</TableCell>
                      <TableCell>{config.type}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditConfig(config)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No general settings found. Click "Add Setting" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingConfig ? "Edit Setting" : "Add Setting"}</DialogTitle>
            <DialogDescription>
              {editingConfig 
                ? "Update the general setting" 
                : "Create a new general setting"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="configName">Setting Name</Label>
                <Input
                  id="configName"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="e.g., company_name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="configType">Type</Label>
                <Select value={configType} onValueChange={(value: any) => setConfigType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="configValue">Value</Label>
              {configType === "boolean" ? (
                <Select 
                  value={String(configValue)} 
                  onValueChange={(value) => setConfigValue(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              ) : configType === "object" || configType === "array" ? (
                <Textarea
                  id="configValue"
                  value={typeof configValue === "object" ? JSON.stringify(configValue, null, 2) : configValue}
                  onChange={(e) => setConfigValue(e.target.value)}
                  placeholder={`Enter ${configType} as JSON`}
                  className="font-mono"
                  rows={5}
                />
              ) : (
                <Input
                  id="configValue"
                  type={configType === "number" ? "number" : "text"}
                  value={configValue}
                  onChange={(e) => setConfigValue(e.target.value)}
                  placeholder={`Enter ${configType} value`}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="configDescription">Description</Label>
              <Textarea
                id="configDescription"
                value={configDescription}
                onChange={(e) => setConfigDescription(e.target.value)}
                placeholder="Describe the purpose of this setting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Setting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
