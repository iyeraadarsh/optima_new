import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Users, 
  Briefcase, 
  TicketCheck, 
  FileText, 
  Laptop, 
  FolderKanban,
  Download
} from 'lucide-react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService } from '@/services/dashboardService';
import { DashboardMetric } from '@/types';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/ui/permission-gate';
import { ModuleNames, ActionTypes } from '@/types/rbac';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch metrics from Firebase
        const dashboardMetrics = await dashboardService.getDashboardMetrics();
        setMetrics(dashboardMetrics);
        
        // Fetch recent activities
        const recentActivities = await dashboardService.getRecentActivities();
        setActivities(recentActivities);
        
        // Fetch system status
        const status = await dashboardService.getSystemStatus();
        setSystemStatus(status);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to default metrics if Firebase fetch fails
        setMetrics([
          {
            id: '1',
            title: 'Total Users',
            value: '254',
            change: 12,
            trend: 'up',
            icon: 'Users',
            color: 'blue',
          },
          {
            id: '2',
            title: 'Active Employees',
            value: '186',
            change: 5,
            trend: 'up',
            icon: 'Briefcase',
            color: 'green',
          },
          {
            id: '3',
            title: 'Open Tickets',
            value: '42',
            change: 8,
            trend: 'down',
            icon: 'TicketCheck',
            color: 'amber',
          },
          {
            id: '4',
            title: 'Documents',
            value: '1,254',
            change: 24,
            trend: 'up',
            icon: 'FileText',
            color: 'indigo',
          },
          {
            id: '5',
            title: 'Assets',
            value: '872',
            trend: 'neutral',
            icon: 'Laptop',
            color: 'purple',
          },
          {
            id: '6',
            title: 'Active Projects',
            value: '36',
            change: 3,
            trend: 'up',
            icon: 'FolderKanban',
            color: 'rose',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Map icon strings to actual components
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return <Users />;
      case 'Briefcase':
        return <Briefcase />;
      case 'TicketCheck':
        return <TicketCheck />;
      case 'FileText':
        return <FileText />;
      case 'Laptop':
        return <Laptop />;
      case 'FolderKanban':
        return <FolderKanban />;
      default:
        return <Users />;
    }
  };

  // Function to handle exporting dashboard data
  const handleExportData = () => {
    // This would be implemented to export dashboard data
    alert('Dashboard data export functionality would be implemented here');
  };

  return (
    <PermissionGate
      permission={{
        module: ModuleNames.DASHBOARD,
        action: ActionTypes.READ
      }}
      fallback={
        <div className='container mx-auto py-8'>
          <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded'>
            <div className='flex'>
              <div className='ml-3'>
                <p className='text-sm text-yellow-700'>
                  You don't have permission to access the dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <Head>
        <title>Dashboard | Enterprise Management System</title>
      </Head>

      <div className='container mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Dashboard</h1>
            <p className='text-slate-500 dark:text-slate-400'>
              Overview of your enterprise system
            </p>
          </div>
          
          <PermissionGate
            permission={{
              module: ModuleNames.DASHBOARD,
              action: ActionTypes.EXPORT
            }}
          >
            <Button 
              variant='outline' 
              onClick={handleExportData}
              className='w-full sm:w-auto'
            >
              <Download className='h-4 w-4 mr-2' />
              Export Data
            </Button>
          </PermissionGate>
        </div>

        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className='overflow-hidden'>
                <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                  <div className='h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse'></div>
                  <div className='h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse'></div>
                </CardHeader>
                <CardContent>
                  <div className='h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2'></div>
                  <div className='h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse'></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
            {metrics.map((metric) => (
              <DashboardCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                icon={getIconComponent(metric.icon)}
                trend={metric.trend}
                change={metric.change}
                description={`vs. last month`}
              />
            ))}
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6'>
          <Card className='w-full'>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest activities across all modules</CardDescription>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
              {activities.length > 0 ? (
                <div className='space-y-4'>
                  {activities.map((activity) => (
                    <div key={activity.id} className='flex items-start space-x-4 border-b pb-4 last:border-0 last:pb-0'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>{activity.title}</p>
                        <p className='text-sm text-slate-500 dark:text-slate-400 line-clamp-2'>{activity.description}</p>
                        <p className='text-xs text-slate-400 dark:text-slate-500 mt-1'>
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  No recent activities found.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className='w-full'>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current status of all system modules</CardDescription>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
              {systemStatus.length > 0 ? (
                <div className='space-y-4'>
                  {systemStatus.map((status) => (
                    <div key={status.id} className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2 min-w-0'>
                        <div className={`h-3 w-3 rounded-full flex-shrink-0 ${
                          status.status === 'operational' ? 'bg-green-500' : 
                          status.status === 'degraded' ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}></div>
                        <span className='truncate'>{status.name}</span>
                      </div>
                      <span className='text-sm capitalize ml-2 flex-shrink-0'>{status.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  All systems operational.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
}