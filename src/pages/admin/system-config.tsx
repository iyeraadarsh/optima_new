
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Save, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { SystemConfig } from "@/types/admin";

export default function SystemConfigPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");
  
  // Form state
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [configName, setConfigName] = useState("");
  const [configValue, setConfigValue] = useState<any>("");
  const [configDescription, setConfigDescription] = useState("");
  const [configType, setConfigType] = useState<"string" | "number" | "boolean" | "object" | "array">("string");
  const [configCategory, setConfigCategory] = useState<"general" | "security" | "modules" | "workflows" | "notifications" | "appearance">("general");

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

    const fetchConfigs = async () => {
      try {
        setLoading(true);
        const allConfigs = await adminService.getSystemConfigs();
        setConfigs(allConfigs);
      } catch (error) {
        console.error("Error fetching system configs:", error);
        setError("Failed to load system configurations");
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [userProfile, isAdmin, router]);

  const handleEditConfig = (config: SystemConfig) => {
    setEditingConfig(config);
    setConfigName(config.name);
    setConfigValue(config.value);
    setConfigDescription(config.description);
    setConfigType(config.type);
    setConfigCategory(config.category);
    setShowAddDialog(true);
  };

  const handleAddConfig = () => {
    setEditingConfig(null);
    setConfigName("");
    setConfigValue("");
    setConfigDescription("");
    setConfigType("string");
    setConfigCategory(activeCategory as any);
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
        id: editingConfig?.id || `config_${Date.now()}`,
        name: configName,
        value: parsedValue,
        description: configDescription,
        type: configType,
        category: configCategory,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.id || "system"
      };

      await adminService.saveSystemConfig(configData);

      // Update local state
      if (editingConfig) {
        setConfigs(configs.map(c => c.id === configData.id ? configData : c));
      } else {
        setConfigs([...configs, configData]);
      }

      setShowAddDialog(false);
    } catch (error) {
      console.error("Error saving config:", error);
      setError("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const filteredConfigs = configs.filter(config => config.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>System Configuration | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
          </div>
          <Button onClick={handleAddConfig}>
            <Plus className="mr-2 h-4 w-4" />
            Add Configuration
          </Button>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {["general", "security", "modules", "workflows", "notifications", "appearance"].map((category) => (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{category} Settings</CardTitle>
                  <CardDescription>
                    Configure {category} system settings
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
                      {filteredConfigs.length > 0 ? (
                        filteredConfigs.map((config) => (
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
                            No {category} configurations found. Click "Add Configuration" to create one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingConfig ? "Edit Configuration" : "Add Configuration"}</DialogTitle>
            <DialogDescription>
              {editingConfig 
                ? "Update the configuration settings" 
                : "Create a new system configuration"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="configName">Name</Label>
                <Input
                  id="configName"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="e.g., session_timeout"
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
                placeholder="Describe the purpose of this configuration"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="configCategory">Category</Label>
              <Select value={configCategory} onValueChange={(value: any) => setConfigCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="modules">Modules</SelectItem>
                  <SelectItem value="workflows">Workflows</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="appearance">Appearance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
