
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ZoomIn, ZoomOut, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { departmentService } from "@/services/departmentService";
import { userService } from "@/services/userService";
import { Department, User } from "@/types";
import { OrganizationChart } from "@/components/hr/OrganizationChart";
import { DepartmentTree } from "@/components/hr/DepartmentTree";

export default function OrgChartPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [managers, setManagers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewType, setViewType] = useState<"hierarchy" | "department">("hierarchy");
  const [rootDepartment, setRootDepartment] = useState<string>("all");
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch departments and employees
        const [allDepartments, allEmployees] = await Promise.all([
          departmentService.getAllDepartments(),
          userService.getAllUsers()
        ]);
        
        setDepartments(allDepartments);
        setEmployees(allEmployees);
        
        // Create a map of managers
        const managersMap: Record<string, User> = {};
        allEmployees.forEach(employee => {
          managersMap[employee.id] = employee;
        });
        
        setManagers(managersMap);
        
      } catch (error) {
        console.error("Error fetching organization data:", error);
        setError("Failed to load organization data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleZoomIn = () => {
    if (zoom < 150) {
      setZoom(zoom + 10);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 50) {
      setZoom(zoom - 10);
    }
  };

  const handleReset = () => {
    setZoom(100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading organization chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Error Loading Data</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          {error}
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Organization Chart | HR Management</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/hr">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Organization Chart</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{zoom}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Organization Structure</CardTitle>
                <CardDescription>
                  Visualize your organization's reporting structure and departments
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={viewType} onValueChange={(value: "hierarchy" | "department") => setViewType(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="View Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hierarchy">Reporting Hierarchy</SelectItem>
                    <SelectItem value="department">Department Structure</SelectItem>
                  </SelectContent>
                </Select>
                
                {viewType === "department" && (
                  <Select value={rootDepartment} onValueChange={setRootDepartment}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 overflow-auto min-h-[500px]" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
              {viewType === "hierarchy" ? (
                <OrganizationChart employees={employees} managers={managers} />
              ) : (
                <DepartmentTree 
                  departments={departments} 
                  rootDepartmentId={rootDepartment === "all" ? undefined : rootDepartment} 
                  managers={managers}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
