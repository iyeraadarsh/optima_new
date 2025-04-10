
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  Download, 
  ChevronRight,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { leaveService } from "@/services/leaveService";
import { useAuth } from "@/contexts/AuthContext";
import { LeaveRequest, LeaveType } from "@/types";

export default function LeaveHistoryPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  
  // Generate year options (current year and 2 previous years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    currentYear.toString(),
    (currentYear - 1).toString(),
    (currentYear - 2).toString()
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch leave types
        const types = await leaveService.getLeaveTypes();
        setLeaveTypes(types);
        
        // Fetch all user's leave requests
        const requests = await leaveService.getLeaveRequests({ userId: currentUser.uid });
        setLeaveRequests(requests);
        setFilteredRequests(requests);
      } catch (error) {
        console.error("Error fetching leave history:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    // Apply filters
    let filtered = [...leaveRequests];
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    // Filter by leave type
    if (typeFilter !== "all") {
      filtered = filtered.filter(request => request.leaveTypeId === typeFilter);
    }
    
    // Filter by year
    if (yearFilter) {
      const year = parseInt(yearFilter);
      filtered = filtered.filter(request => {
        const requestYear = new Date(request.startDate).getFullYear();
        return requestYear === year;
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request => {
        const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
        return (
          leaveType?.name.toLowerCase().includes(term) ||
          request.reason?.toLowerCase().includes(term) ||
          format(new Date(request.startDate), "PPP").toLowerCase().includes(term)
        );
      });
    }
    
    setFilteredRequests(filtered);
  }, [leaveRequests, statusFilter, typeFilter, yearFilter, searchTerm, leaveTypes]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const handleExport = () => {
    // In a real app, this would generate a CSV or PDF file
    alert("Export functionality would generate a report of your leave history");
  };

  return (
    <MainLayout>
      <Head>
        <title>Leave History | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button asChild variant="outline" className="mb-2">
              <Link href="/hr/leave">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leave Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Leave History</h1>
            <p className="text-gray-500 dark:text-gray-400">
              View and manage all your leave requests
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button asChild>
              <Link href="/hr/leave/calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </Link>
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter your leave requests by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search leave requests..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Leave Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Year</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>
              Showing {filteredRequests.length} leave requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10">
                <div className="h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading leave requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No leave requests found matching your filters
                </p>
                <Button asChild>
                  <Link href="/hr/leave/request">
                    Create New Leave Request
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
                  
                  return (
                    <div 
                      key={request.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start space-x-4">
                        <div 
                          className="w-2 h-full min-h-[50px] rounded-full" 
                          style={{ backgroundColor: leaveType?.color || "#888" }}
                        />
                        <div>
                          <div className="font-medium">{leaveType?.name || "Leave"}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(request.startDate), "PPP")} - {format(new Date(request.endDate), "PPP")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.totalDays} {request.totalDays === 1 ? "day" : "days"}
                          </div>
                          {request.reason && (
                            <div className="text-sm text-gray-500 mt-1">
                              Reason: {request.reason.length > 50 
                                ? `${request.reason.substring(0, 50)}...` 
                                : request.reason}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(request.status)}
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/hr/leave/${request.id}`}>
                            Details <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
