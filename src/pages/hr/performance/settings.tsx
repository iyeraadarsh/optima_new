import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  Settings, 
  ArrowLeft, 
  Save, 
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MainLayout } from "@/components/layout/MainLayout";
import { performanceService } from "@/services/performanceService";
import { useAuth } from "@/contexts/AuthContext";
import { PerformanceSettings } from "@/types/performance";

export default function PerformanceSettingsPage() {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PerformanceSettings | null>(null);
  const [formData, setFormData] = useState({
    reviewCycle: "annual",
    ratingScale: 5,
    enableSelfRating: true,
    goalApprovalRequired: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const settingsData = await performanceService.getPerformanceSettings();
        
        if (settingsData) {
          setSettings(settingsData);
          setFormData({
            reviewCycle: settingsData.reviewCycle || "annual",
            ratingScale: settingsData.ratingScale || 5,
            enableSelfRating: settingsData.enableSelfRating !== undefined ? settingsData.enableSelfRating : true,
            goalApprovalRequired: settingsData.goalApprovalRequired !== undefined ? settingsData.goalApprovalRequired : true
          });
        }
      } catch (error) {
        console.error("Error fetching performance settings:", error);
        alert("Error loading settings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      
      // Check if user has admin permissions
      if (userProfile?.role !== "admin" && userProfile?.role !== "super_admin") {
        alert("You don't have permission to modify these settings.");
        return;
      }
      
      // Create properly typed settings object
      const settingsToUpdate: Partial<PerformanceSettings> = {
        reviewCycle: formData.reviewCycle as 'annual' | 'biannual' | 'quarterly',
        ratingScale: formData.ratingScale,
        enableSelfRating: formData.enableSelfRating,
        goalApprovalRequired: formData.goalApprovalRequired
      };
      
      await performanceService.updatePerformanceSettings(settingsToUpdate);
      
      alert("Performance settings updated successfully!");
      router.push("/hr/performance?refresh=true");
    } catch (error) {
      console.error("Error saving performance settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Check if user has admin permissions
  const hasAdminAccess = userProfile?.role === "admin" || userProfile?.role === "super_admin";
  
  if (!hasAdminAccess) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">You don't have permission to access this page.</p>
            <Button asChild className="mt-4">
              <Link href="/hr/performance">
                Back to Performance Management
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Head>
        <title>Performance Settings | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Performance Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Configure performance management settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/hr/performance">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Performance
              </Link>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure how performance management works in your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="reviewCycle">Review Cycle</Label>
                <Select
                  value={formData.reviewCycle}
                  onValueChange={(value) => handleInputChange("reviewCycle", value)}
                >
                  <SelectTrigger id="reviewCycle">
                    <SelectValue placeholder="Select review cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="biannual">Bi-Annual</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  How often performance reviews are conducted
                </p>
              </div>
              
              <div>
                <Label htmlFor="ratingScale">Rating Scale</Label>
                <RadioGroup
                  value={formData.ratingScale.toString()}
                  onValueChange={(value) => handleInputChange("ratingScale", parseInt(value))}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="r3" />
                    <Label htmlFor="r3">3-point</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5" id="r5" />
                    <Label htmlFor="r5">5-point</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="r10" />
                    <Label htmlFor="r10">10-point</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-gray-500 mt-1">
                  Scale used for performance ratings
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableSelfRating">Enable Self Rating</Label>
                  <p className="text-xs text-gray-500">
                    Allow employees to rate their own performance
                  </p>
                </div>
                <Switch
                  id="enableSelfRating"
                  checked={formData.enableSelfRating}
                  onCheckedChange={(checked) => handleInputChange("enableSelfRating", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="goalApprovalRequired">Goal Approval Required</Label>
                  <p className="text-xs text-gray-500">
                    Require manager approval for employee goals
                  </p>
                </div>
                <Switch
                  id="goalApprovalRequired"
                  checked={formData.goalApprovalRequired}
                  onCheckedChange={(checked) => handleInputChange("goalApprovalRequired", checked)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}