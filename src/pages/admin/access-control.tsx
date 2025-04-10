
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { 
  Shield, 
  Users, 
  UserCog, 
  Lock, 
  ArrowRight, 
  Info,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AccessControlPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Check if user has admin privileges
  const isAdmin = userProfile?.role === "super_admin" || 
                  userProfile?.role === "admin" || 
                  userProfile?.role === "director";

  const accessControlModules = [
    {
      title: "Role Management",
      description: "Create and configure user roles with specific permissions",
      icon: <UserCog className="h-5 w-5" />,
      href: "/admin/roles",
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      tooltip: "Define roles like Admin, Manager, or Employee with specific access levels"
    },
    {
      title: "Permission Management",
      description: "Configure system permissions and access controls",
      icon: <Lock className="h-5 w-5" />,
      href: "/admin/permissions",
      color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
      tooltip: "Create and manage individual permissions that can be assigned to roles"
    },
    {
      title: "User Assignment",
      description: "Assign roles and permissions to users",
      icon: <Users className="h-5 w-5" />,
      href: "/users",
      color: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      tooltip: "Assign users to roles and manage individual user permissions"
    }
  ];

  return (
    <MainLayout>
      <Head>
        <title>Access Control | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage roles, permissions, and user access to system features
          </p>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Access Control System</CardTitle>
                <CardDescription>
                  The access control system allows you to manage who can access what in your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border p-4 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">How Access Control Works</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Our system uses role-based access control (RBAC) with three main components:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
                        <li><strong>Permissions</strong>: Individual access rights to perform specific actions</li>
                        <li><strong>Roles</strong>: Collections of permissions that can be assigned to users</li>
                        <li><strong>Users</strong>: Assigned roles that determine what they can access</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accessControlModules.map((module) => (
                <TooltipProvider key={module.title}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-md ${module.color}`}>
                          {module.icon}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{module.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <CardTitle className="text-lg mt-2">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={module.href} className="flex items-center justify-center">
                          Manage
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </TooltipProvider>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
                <CardDescription>
                  Create and manage roles with specific permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Roles are collections of permissions that define what actions users can perform in the system.
                  Each user is assigned a role that determines their access level.
                </p>
                <div className="flex justify-center">
                  <Button asChild size="lg">
                    <Link href="/admin/roles">
                      Manage Roles
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permission Management</CardTitle>
                <CardDescription>
                  Configure system permissions and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Permissions define specific actions that can be performed on system resources.
                  They are grouped into roles and assigned to users to control access.
                </p>
                <div className="flex justify-center">
                  <Button asChild size="lg">
                    <Link href="/admin/permissions">
                      Manage Permissions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
