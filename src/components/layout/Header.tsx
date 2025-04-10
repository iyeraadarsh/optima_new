import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, Bell, Search, User, Settings, HelpCircle, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { notificationService } from '@/services/notificationService';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { currentUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Log authentication state to help debug
    console.log("Auth state in Header:", { currentUser, userProfile });
    
    if (currentUser) {
      // Fetch notifications for the current user
      const fetchNotifications = async () => {
        try {
          const userNotifications = await notificationService.getUserNotifications(currentUser.uid);
          setNotifications(userNotifications);
          
          const count = await notificationService.getUnreadCount(currentUser.uid);
          setUnreadCount(count);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };
      
      fetchNotifications();
    }
  }, [currentUser, userProfile]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onOpenSidebar} className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/" className="flex items-center">
              <span className="ml-2 text-xl font-bold text-slate-900 dark:text-white">EnterpriseOS</span>
            </Link>
          </div>

          <div className="hidden md:flex md:grow mx-4 lg:mx-8">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full bg-slate-100 dark:bg-slate-700 pl-8 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`py-2 px-3 text-sm border-b last:border-b-0 ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-slate-500 dark:text-slate-400">{notification.message}</div>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 px-3 text-sm">No new notifications</div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center">
                    <Link href="/notifications" className="w-full text-center">View all</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Help Center</DropdownMenuItem>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Support Ticket</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {currentUser && userProfile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex h-8 w-8 items-center justify-center rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile.avatar || ''} alt={userProfile.name} />
                      <AvatarFallback>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}