import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { systemConfigService } from "@/services/systemConfigService";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title = "Enterprise System" }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { currentUser, userProfile, loading } = useAuth();
  const [superAdminExists, setSuperAdminExists] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // Determine if we should show auth-only UI elements
  const isAuthRoute = router.pathname.startsWith('/auth');
  const isPublicRoute = router.pathname === '/' || isAuthRoute;

  // Check if a super admin exists
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        setCheckingAdmin(true);
        const exists = await systemConfigService.checkSuperAdminExists();
        setSuperAdminExists(exists);
      } catch (error) {
        console.error('Error checking super admin:', error);
        // Default to true in case of error to prevent unauthorized registrations
        setSuperAdminExists(true);
      } finally {
        setCheckingAdmin(false);
      }
    };
    
    checkSuperAdmin();
  }, []);

  // Redirect to login if not authenticated and not on public route
  useEffect(() => {
    if (!loading && !currentUser && !isPublicRoute && !redirecting) {
      console.log('User not authenticated, redirecting to login from MainLayout');
      setRedirecting(true);
      router.push('/auth/login');
    }
  }, [currentUser, loading, isPublicRoute, router, redirecting]);

  // Show loading state while authentication is being determined
  if (loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // For public routes or when not authenticated, show simple layout
  if (!currentUser || isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Head>
          <title>{title} | Enterprise Management System</title>
          <meta name="description" content="Enterprise Management System" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="flex flex-col min-h-screen">
          {!isAuthRoute && (
            <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                    <Link href="/" className="text-xl font-bold text-slate-900 dark:text-white">
                      EnterpriseOS
                    </Link>
                  </div>
                  <div>
                    <Button asChild className="mr-2">
                      <Link href="/auth/login">Login</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/auth/register">Register</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </header>
          )}
          
          <main className="flex-grow p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
          
          <Footer />
        </div>
      </div>
    );
  }

  // Authenticated layout with sidebar
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Head>
        <title>{title} | Enterprise Management System</title>
        <meta name="description" content="Enterprise Management System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />
          
          <main className="flex-grow p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
          
          <Footer />
        </div>
      </div>
    </div>
  );
}