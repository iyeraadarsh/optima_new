
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MainLayout } from '@/components/layout/MainLayout';
import { leaveService } from "@/services/leaveService";
import { userService } from "@/services/userService";
import { LeaveRequest, LeaveType, LeaveCalendarEvent, User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function LeaveCalendar() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<LeaveCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
  
  // Calendar view helpers
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add days from previous and next month to fill the calendar grid
  const startDay = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const endDay = monthEnd.getDay();
  
  // Calculate days to show from previous month (to fill the first row)
  const prevMonthDays = [];
  if (startDay > 0) {
    const prevMonth = subMonths(monthStart, 1);
    const prevMonthEnd = endOfMonth(prevMonth);
    for (let i = startDay - 1; i >= 0; i--) {
      const day = new Date(prevMonthEnd);
      day.setDate(prevMonthEnd.getDate() - i);
      prevMonthDays.push(day);
    }
  }
  
  // Calculate days to show from next month (to fill the last row)
  const nextMonthDays = [];
  if (endDay < 6) {
    const nextMonth = addMonths(monthStart, 1);
    const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    for (let i = 1; i <= 6 - endDay; i++) {
      const day = new Date(nextMonthStart);
      day.setDate(nextMonthStart.getDate() + (i - 1));
      nextMonthDays.push(day);
    }
  }
  
  // Combine all days
  const calendarDays = [...prevMonthDays, ...monthDays, ...nextMonthDays];
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch leave types
        const types = await leaveService.getLeaveTypes();
        setLeaveTypes(types);
        
        // Fetch all users
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
        
        // Extract unique departments
        const depts = Array.from(new Set(allUsers.map(u => u.department).filter(Boolean)));
        setDepartments(depts as string[]);
        
        // Fetch all leave requests
        const allRequests = await leaveService.getLeaveRequests();
        
        // Filter for the current month
        const startTimestamp = monthStart.getTime();
        const endTimestamp = monthEnd.getTime();
        
        const monthRequests = allRequests.filter(req => 
          (req.startDate <= endTimestamp && req.endDate >= startTimestamp)
        );
        
        setLeaveRequests(monthRequests);
        console.log(`Filtered ${monthRequests.length} requests for current month`);
        
        // Convert leave requests to calendar events
        const events: LeaveCalendarEvent[] = [];
        
        for (const request of monthRequests) {
          if (request.status === 'approved' || request.status === 'pending') {
            const leaveType = types.find(t => t.id === request.leaveTypeId);
            const user = allUsers.find(u => u.id === request.userId);
            
            if (leaveType && user) {
              events.push({
                id: request.id,
                title: `${user.name} - ${leaveType.name}`,
                start: new Date(request.startDate),
                end: new Date(request.endDate),
                allDay: true,
                color: leaveType.color,
                userId: request.userId,
                leaveRequestId: request.id
              });
            }
          }
        }
        
        setCalendarEvents(events);
        console.log(`Created ${events.length} calendar events`);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentDate, monthStart, monthEnd]);

  const handlePrevMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
  };

  const handleLeaveTypeChange = (value: string) => {
    setSelectedLeaveType(value);
  };

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => {
      // Filter by department if selected
      if (selectedDepartment !== "all") {
        const eventUser = users.find(u => u.id === event.userId);
        if (!eventUser || eventUser.department !== selectedDepartment) {
          return false;
        }
      }
      
      // Filter by leave type if selected
      if (selectedLeaveType !== "all") {
        const leaveRequest = leaveRequests.find(r => r.id === event.leaveRequestId);
        if (!leaveRequest || leaveRequest.leaveTypeId !== selectedLeaveType) {
          return false;
        }
      }
      
      // Check if the day falls within the event range
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      return day >= eventStart && day <= eventEnd;
    });
  };

  const handleViewLeaveRequest = (id: string) => {
    router.push(`/hr/leave/${id}`);
  };

  // Helper function to safely format status
  const formatStatus = (status: string | undefined): string => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <MainLayout>
      <Head>
        <title>Leave Calendar | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Leave Calendar</h1>
            <p className="text-gray-500 dark:text-gray-400">
              View and manage leave schedules
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/hr/leave")}>
              Back to Leave Dashboard
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Leave Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-medium">
                  {format(currentDate, "MMMM yyyy")}
                </div>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              View and manage employee leave schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Department</label>
                  <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Leave Type</label>
                  <Select value={selectedLeaveType} onValueChange={handleLeaveTypeChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Leave Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Leave Types</SelectItem>
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
              </div>
              <div className="flex items-center">
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                  <span className="text-sm">Approved</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                  <span className="text-sm">Pending</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-medium py-2">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const dayEvents = getEventsForDay(day);
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-[100px] border rounded-md p-1 ${
                      isCurrentMonth 
                        ? "bg-white dark:bg-slate-800" 
                        : "bg-gray-50 dark:bg-slate-900/50 text-gray-400 dark:text-gray-600"
                    } ${
                      isToday 
                        ? "border-blue-500 dark:border-blue-400" 
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="text-right p-1">
                      <span className={`text-sm ${isToday ? "font-bold" : ""}`}>
                        {format(day, "d")}
                      </span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {dayEvents.length > 0 ? (
                        dayEvents.slice(0, 3).map((event) => {
                          const leaveRequest = leaveRequests.find(r => r.id === event.leaveRequestId);
                          
                          return (
                            <Popover key={event.id}>
                              <PopoverTrigger asChild>
                                <div 
                                  className="text-xs p-1 rounded truncate cursor-pointer"
                                  style={{ 
                                    backgroundColor: `${event.color}20`, 
                                    borderLeft: `3px solid ${event.color}`,
                                    color: event.color
                                  }}
                                >
                                  {event.title.split(" - ")[0]}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-sm">
                                    {format(event.start, "PPP")} - {format(event.end, "PPP")}
                                  </div>
                                  <div className="text-sm">
                                    Status: {formatStatus(leaveRequest?.status)}
                                  </div>
                                  {leaveRequest?.reason && (
                                    <div className="text-sm">
                                      Reason: {leaveRequest.reason}
                                    </div>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewLeaveRequest(event.leaveRequestId)}
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        })
                      ) : null}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-center bg-gray-100 dark:bg-gray-700 p-1 rounded">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
