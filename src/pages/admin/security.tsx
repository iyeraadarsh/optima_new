
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { SecurityConfig } from "@/types/admin";
import { useRouter } from "next/router";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [securityConfigs, setSecurityConfigs] = useState<SecurityConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState("authentication");
  
  // Form state
  const [editingConfig, setEditingConfig] = useState<SecurityConfig | null>(null);
  const [configName, setConfigName] = useState("");
  const [configValue, setConfigValue] = useState<any>("");
  const [configDescription, setConfigDescription] = useState("");
  const [configCategory, setConfigCategory] = useState<"authentication" | "authorization" | "data" | "network">("authentication");

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

    const fetchSecurityConfigs = async () => {
      try {
        setLoading(true);
        const configs = await adminService.getSecurityConfigs();
        setSecurityConfigs(configs);
      } catch (error) {
        console.error("Error fetching security configs:", error);
        setError("Failed to load security configurations");
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityConfigs();
  }, [userProfile, isAdmin, router]);

  const handleEditConfig = (config: SecurityConfig) => {
    setEditingConfig(config);
    setConfigName(config.name);
    setConfigValue(config.value);
    setConfigDescription(config.description);
    setConfigCategory(config.category);
    setShowAddDialog(true);
  };

  const handleAddConfig = () => {
    setEditingConfig(null);
    setConfigName("");
    setConfigValue("");
    setConfigDescription("");
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

      const configData: SecurityConfig = {
        id: editingConfig?.id || `security_${Date.now()}`,
        name: configName,
        value: configValue,
        description: configDescription,
        category: configCategory,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.id || "system"
      };

      await adminService.saveSecurityConfig(configData);

      // Update local state
      if (editingConfig) {
        setSecurityConfigs(configs => configs.map(c => c.id === configData.id ? configData : c));
      } else {
        setSecurityConfigs(configs => [...configs, configData]);
      }

      setShowAddDialog(false);
    } catch (error) {
      console.error("Error saving security config:", error);
      setError("Failed to save security configuration");
    } finally {
      setSaving(false);
    }
  };

  const filteredConfigs = securityConfigs.filter(config => config.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading security configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Security Settings | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
          </div>
          <Button onClick={handleAddConfig}>
            <Plus className="mr-2 h-4 w-4" />
            Add Security Setting
          </Button>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="authorization">Authorization</TabsTrigger>
            <TabsTrigger value="data">Data Security</TabsTrigger>
            <TabsTrigger value="network">Network Security</TabsTrigger>
          </TabsList>

          {["authentication", "authorization", "data", "network"].map((category) => (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{category} Security</CardTitle>
                  <CardDescription>
                    Configure {category} security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Description</TableHead>
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
                          <TableCell colSpan={4} className="text-center py-8">
                            No {category} security configurations found. Click "Add Security Setting" to create one.
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
            <DialogTitle>{editingConfig ? "Edit Security Setting" : "Add Security Setting"}</DialogTitle>
            <DialogDescription>
              {editingConfig 
                ? "Update the security configuration" 
                : "Create a new security setting"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="configName">Setting Name</Label>
              <Input
                id="configName"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="e.g., password_policy"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="configValue">Value</Label>
              <Input
                id="configValue"
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                placeholder="Enter value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="configDescription">Description</Label>
              <Textarea
                id="configDescription"
                value={configDescription}
                onChange={(e) => setConfigDescription(e.target.value)}
                placeholder="Describe the purpose of this security setting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="configCategory">Category</Label>
              <Select value={configCategory} onValueChange={(value: any) => setConfigCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="authorization">Authorization</SelectItem>
                  <SelectItem value="data">Data Security</SelectItem>
                  <SelectItem value="network">Network Security</SelectItem>
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
              {saving ? "Saving..." : "Save Setting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
