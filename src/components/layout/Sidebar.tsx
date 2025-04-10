
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { PermissionGate } from "@/components/ui/permission-gate";
import { PermissionRequest } from "@/types/rbac";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  LifeBuoy, 
  FileText, 
  Laptop, 
  FolderKanban, 
  Clock, 
  Receipt, 
  Timer, 
  Bell, 
  UserSquare, 
  Settings,
  Shield,
  Building,
  Calendar
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  permission?: PermissionRequest;
  requirePermission?: boolean;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { ModuleNames, ActionTypes } = usePermission();
  const pathname = router.pathname;

  // Default permission for items without a specific permission
  const defaultPermission: PermissionRequest = {
    module: ModuleNames.USERS,
    action: ActionTypes.READ
  };

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      requirePermission: false
    },
    {
      title: "User Management",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
      permission: {
        module: ModuleNames.USERS,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "HR Management",
      href: "/hr",
      icon: <Briefcase className="h-5 w-5" />,
      permission: {
        module: ModuleNames.HR,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "Help Desk",
      href: "/helpdesk",
      icon: <LifeBuoy className="h-5 w-5" />,
      permission: {
        module: ModuleNames.HELPDESK,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "Document Management",
      href: "/documents",
      icon: <FileText className="h-5 w-5" />,
      permission: {
        module: ModuleNames.DOCUMENTS,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "Asset Management",
      href: "/assets",
      icon: <Laptop className="h-5 w-5" />,
      permission: {
        module: ModuleNames.ASSETS,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "Project Management",
      href: "/projects",
      icon: <FolderKanban className="h-5 w-5" />,
      permission: {
        module: ModuleNames.PROJECTS,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "Timesheet",
      href: "/timesheet",
      icon: <Clock className="h-5 w-5" />,
      permission: {
        module: ModuleNames.TIMESHEET,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "Invoicing",
      href: "/invoicing",
      icon: <Receipt className="h-5 w-5" />,
      permission: {
        module: ModuleNames.INVOICING,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "Time Tracking",
      href: "/time-tracking",
      icon: <Timer className="h-5 w-5" />,
      permission: {
        module: ModuleNames.TIME_TRACKING,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "Notifications",
      href: "/notifications",
      icon: <Bell className="h-5 w-5" />,
      permission: {
        module: ModuleNames.NOTIFICATIONS,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "CRM",
      href: "/crm",
      icon: <UserSquare className="h-5 w-5" />,
      permission: {
        module: ModuleNames.CRM,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
    {
      title: "Admin Settings",
      href: "/admin",
      icon: <Settings className="h-5 w-5" />,
      permission: {
        module: ModuleNames.ADMIN,
        action: ActionTypes.READ
      },
      requirePermission: true
    },
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ease-in-out md:translate-x-0 md:z-30",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
          <Link href="/" className="flex items-center">
            <span className="ml-2 text-xl font-bold text-slate-900 dark:text-white">EnterpriseOS</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="px-2 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                item.requirePermission ? (
                  <PermissionGate 
                    key={item.href} 
                    permission={item.permission || defaultPermission}
                    renderNothing={true}
                  >
                    <li>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          router.pathname === item.href || router.pathname.startsWith(`${item.href}/`)
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                        )}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.title}
                      </Link>
                    </li>
                  </PermissionGate>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        router.pathname === item.href || router.pathname.startsWith(`${item.href}/`)
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      )}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.title}
                    </Link>
                  </li>
                )
              ))}
            </ul>
          </nav>

          {/* Admin Menu - Only show for admin users */}
          {userProfile?.role === "super_admin" && (
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Administration
              </h2>
              <div className="space-y-1">
                <Button
                  variant={pathname.startsWith('/admin') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href='/admin'>
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Settings
                  </Link>
                </Button>
                <Button
                  variant={pathname.startsWith('/users/roles') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href='/users/roles'>
                    <Shield className="mr-2 h-4 w-4" />
                    Role Management
                  </Link>
                </Button>
                <Button
                  variant={pathname.startsWith('/users/departments') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href='/users/departments'>
                    <Building className="mr-2 h-4 w-4" />
                    Departments
                  </Link>
                </Button>
                <Button
                  variant={pathname.startsWith('/users/positions') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href='/users/positions'>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Positions
                  </Link>
                </Button>
                <Button
                  variant={pathname.startsWith('/users') && !pathname.startsWith('/users/roles') && !pathname.startsWith('/users/departments') && !pathname.startsWith('/users/positions') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href='/users'>
                    <Users className="mr-2 h-4 w-4" />
                    User Management
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}
