import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  Shield, 
  Users, 
  Cog,
  Lock,
  UserCog,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Check if user has admin privileges
  const isAdmin = userProfile?.role === "super_admin" || 
                  userProfile?.role === "admin" || 
                  userProfile?.role === "director";

  useEffect(() => {
    // If user is not admin, redirect to dashboard
    if (userProfile && !isAdmin) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  }, [userProfile, isAdmin, router]);

  const adminModules = [
    {
      title: "Access Control",
      description: "Manage roles and permissions for system users",
      href: "/admin/access-control",
      icon: <Shield className="h-6 w-6" />,
      primary: true
    },
    {
      title: "User Management",
      description: "Manage users and their account settings",
      href: "/users",
      icon: <Users className="h-6 w-6" />,
      primary: true
    },
    {
      title: "Role Management",
      description: "Create and configure user roles with specific permissions",
      href: "/admin/roles",
      icon: <UserCog className="h-6 w-6" />,
      primary: true
    },
    {
      title: "Permission Management",
      description: "Configure system permissions and access controls",
      href: "/admin/permissions",
      icon: <Lock className="h-6 w-6" />,
      primary: true
    },
    {
      title: "System Settings",
      description: "Configure general system settings and preferences",
      href: "/admin/system-config",
      icon: <Cog className="h-6 w-6" />,
      primary: false
    },
    {
      title: "Leave Management",
      description: "Configure leave types and approval settings",
      href: "/hr/leave/settings",
      icon: <Calendar className="h-6 w-6" />,
      primary: false
    }
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Head>
        <title>Admin Settings | Enterprise Management System</title>
      </Head>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Configure and manage system-wide settings and user access
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminModules
            .filter(module => module.primary)
            .map((module) => (
              <Card key={module.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-600 dark:text-blue-400">
                      {module.icon}
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                  </div>
                  <CardDescription className="mt-2">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="default" className="w-full">
                    <Link href={module.href}>
                      Manage
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Additional Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminModules
              .filter(module => !module.primary)
              .map((module) => (
                <Card key={module.title} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400">
                        {module.icon}
                      </div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{module.description}</p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={module.href}>
                        Configure
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}