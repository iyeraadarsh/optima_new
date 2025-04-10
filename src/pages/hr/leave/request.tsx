import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MainLayout } from '@/components/layout/MainLayout';
import { leaveService } from "@/services/leaveService";
import { useAuth } from "@/contexts/AuthContext";
import { LeaveType } from "@/types";
import Link from 'next/link';

export default function LeaveRequestPage() {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [approvers, setApprovers] = useState<any[]>([]); // Added state for approvers
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    approverId: '',
    startDate: new Date(),
    endDate: new Date(),
    halfDay: false,
    reason: '',
    attachmentUrl: ''
  });
  const [formErrors, setFormErrors] = useState<{
    leaveTypeId?: string;
    dates?: string;
    reason?: string;
  }>({});
  const [calculatedDays, setCalculatedDays] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch leave types
        const types = await leaveService.getLeaveTypes();
        setLeaveTypes(types);
        
        if (currentUser) {
          // Fetch user's leave balances
          const currentYear = new Date().getFullYear();
          const balances = await leaveService.getUserLeaveBalances(currentUser.uid, currentYear);
          setLeaveBalances(balances);
          
          // Initialize leave balances if none exist
          if (balances.length === 0 && types.length > 0) {
            // Create default balances for each leave type
            for (const leaveType of types) {
              if (leaveType.maxDaysPerYear) {
                await leaveService.initializeLeaveBalance(
                  currentUser.uid,
                  leaveType.id,
                  currentYear,
                  leaveType.maxDaysPerYear
                );
              }
            }
            
            // Fetch the newly created balances
            const newBalances = await leaveService.getUserLeaveBalances(currentUser.uid, currentYear);
            setLeaveBalances(newBalances);
          } else {
            setLeaveBalances(balances);
          }

          // Fetch approvers
          try {
            const fetchedApprovers = await leaveService.getApprovers(currentUser.uid);
            setApprovers(fetchedApprovers);
          } catch (error) {
            console.error('Error fetching approvers:', error);
            // Set default approvers if there's an error
            setApprovers([{ id: 'default', name: 'Default Approver', role: 'manager' }]);
          }
        }
      } catch (error) {
        console.error('Error fetching leave data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    // Calculate total days
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start <= end) {
        // Simple calculation (not accounting for weekends/holidays)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        setCalculatedDays(formData.halfDay ? diffDays - 0.5 : diffDays);
      } else {
        setCalculatedDays(0);
      }
    }
  }, [formData.startDate, formData.endDate, formData.halfDay]);

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error for this field if any
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [field]: undefined
      });
    }
  };

  const validateForm = () => {
    const errors: {
      leaveTypeId?: string;
      dates?: string;
      reason?: string;
    } = {};
    
    if (!formData.leaveTypeId) {
      errors.leaveTypeId = "Please select a leave type";
    }
    
    if (!formData.startDate || !formData.endDate) {
      errors.dates = "Please select both start and end dates";
    } else if (formData.startDate > formData.endDate) {
      errors.dates = "End date cannot be before start date";
    }
    
    // Check if selected leave type requires a reason
    const selectedLeaveType = leaveTypes.find(lt => lt.id === formData.leaveTypeId);
    if (selectedLeaveType && selectedLeaveType.requiresApproval && !formData.reason) {
      errors.reason = "Please provide a reason for your leave request";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Create leave request
      const leaveRequest = {
        userId: currentUser.uid,
        userName: userProfile?.name || '',
        leaveTypeId: formData.leaveTypeId,
        approverId: formData.approverId,
        startDate: formData.startDate.getTime(),
        endDate: formData.endDate.getTime(),
        totalDays: calculatedDays,
        halfDay: formData.halfDay,
        reason: formData.reason,
        status: 'pending' as 'pending' | 'approved' | 'rejected' | 'cancelled',
        attachmentUrl: formData.attachmentUrl
      };
      
      try {
        const requestId = await leaveService.createLeaveRequest(leaveRequest);
        
        // Show success message
        alert(`Leave request submitted successfully!`);
        
        // Redirect to leave management
        router.push('/hr/leave');
      } catch (error: any) {
        console.error('Error creating leave request:', error);
        alert(`Error submitting leave request: ${error.message || 'Please try again.'}`);
      }
    } catch (error: any) {
      console.error('Error in form submission:', error);
      alert(`Error: ${error.message || 'An unexpected error occurred. Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveBalance = (leaveTypeId: string) => {
    const balance = leaveBalances.find(b => b.leaveTypeId === leaveTypeId);
    // Initialize with a default value if no balance is found
    return balance ? balance.remainingDays : (
      leaveTypes.find(lt => lt.id === leaveTypeId)?.maxDaysPerYear || 0
    );
  };

  return (
    <MainLayout>
      <Head>
        <title>Request Leave | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Request Leave</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Submit a new leave request
            </p>
          </div>
          <div className='flex gap-2'>
            <Button asChild variant='outline'>
              <Link href='/hr/leave'>
                Back to Leave Dashboard
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Leave Request Form</CardTitle>
                <CardDescription>
                  Fill out the form below to submit your leave request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='leaveType'>Leave Type</Label>
                      <Select
                        value={formData.leaveTypeId}
                        onValueChange={(value) => handleInputChange('leaveTypeId', value)}
                      >
                        <SelectTrigger id='leaveType' className='w-full'>
                          <SelectValue placeholder='Select leave type' />
                        </SelectTrigger>
                        <SelectContent>
                          {leaveTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className='flex items-center'>
                                <div 
                                  className='w-3 h-3 rounded-full mr-2' 
                                  style={{ backgroundColor: type.color }}
                                />
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.leaveTypeId && (
                        <p className='text-sm text-red-500 mt-1'>{formErrors.leaveTypeId}</p>
                      )}
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='startDate'>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              className='w-full justify-start text-left font-normal'
                            >
                              <CalendarIcon className='mr-2 h-4 w-4' />
                              {formData.startDate ? (
                                format(formData.startDate, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0'>
                            <Calendar
                              mode='single'
                              selected={formData.startDate}
                              onSelect={(date) => handleInputChange('startDate', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <Label htmlFor='endDate'>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              className='w-full justify-start text-left font-normal'
                            >
                              <CalendarIcon className='mr-2 h-4 w-4' />
                              {formData.endDate ? (
                                format(formData.endDate, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0'>
                            <Calendar
                              mode='single'
                              selected={formData.endDate}
                              onSelect={(date) => handleInputChange('endDate', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {formErrors.dates && (
                      <p className='text-sm text-red-500'>{formErrors.dates}</p>
                    )}
                    
                    <div className='flex items-center space-x-2'>
                      <Switch
                        id='halfDay'
                        checked={formData.halfDay}
                        onCheckedChange={(checked) => handleInputChange('halfDay', checked)}
                      />
                      <Label htmlFor='halfDay'>Half day on last day</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor='approver'>Approver</Label>
                      <Select
                        onValueChange={(value) => handleInputChange('approverId', value)}
                      >
                        <SelectTrigger id='approver' className='w-full'>
                          <SelectValue placeholder='Select approver' />
                        </SelectTrigger>
                        <SelectContent>
                          {approvers.length > 0 ? (
                            approvers.map((approver) => (
                              <SelectItem key={approver.id} value={approver.id}>
                                {approver.name} - {approver.role.replace('_', ' ')}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value='default'>Default Approver</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className='text-xs text-gray-500 mt-1'>
                        Select who should approve this leave request
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor='reason'>Reason for Leave</Label>
                      <Textarea
                        id='reason'
                        placeholder='Please provide a reason for your leave request'
                        value={formData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        rows={4}
                      />
                      {formErrors.reason && (
                        <p className='text-sm text-red-500 mt-1'>{formErrors.reason}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor='attachment'>Attachment (Optional)</Label>
                      <Input
                        id='attachment'
                        type='file'
                        onChange={(e) => {
                          // In a real app, you would upload the file and get a URL
                          // For now, we'll just store the file name
                          if (e.target.files && e.target.files[0]) {
                            handleInputChange("attachmentUrl", e.target.files[0].name);
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload any supporting documents (e.g., medical certificate)
                      </p>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/hr/leave")}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Leave Request"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Leave Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Request Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Leave Type:</span>
                      <span className="font-medium">
                        {formData.leaveTypeId ? (
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ 
                                backgroundColor: leaveTypes.find(lt => lt.id === formData.leaveTypeId)?.color || "#888" 
                              }}
                            />
                            {leaveTypes.find(lt => lt.id === formData.leaveTypeId)?.name || "Not selected"}
                          </div>
                        ) : (
                          "Not selected"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">{calculatedDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start Date:</span>
                      <span className="font-medium">
                        {formData.startDate ? format(formData.startDate, "PPP") : "Not selected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">End Date:</span>
                      <span className="font-medium">
                        {formData.endDate ? format(formData.endDate, "PPP") : "Not selected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Half Day:</span>
                      <span className="font-medium">{formData.halfDay ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
                
                {formData.leaveTypeId && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Leave Balance</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Available:</span>
                        <span className="font-medium">{getLeaveBalance(formData.leaveTypeId)} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Requested:</span>
                        <span className="font-medium">{calculatedDays} days</span>
                      </div>
                      <div className="flex justify-between border-t mt-2 pt-2">
                        <span className="text-gray-500">Remaining:</span>
                        <span className="font-medium">
                          {Math.max(0, getLeaveBalance(formData.leaveTypeId) - calculatedDays)} days
                        </span>
                      </div>
                    </div>
                    
                    {getLeaveBalance(formData.leaveTypeId) < calculatedDays && (
                      <Alert className="mt-4 bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertTitle className="text-red-500">Insufficient Leave Balance</AlertTitle>
                        <AlertDescription className="text-red-500">
                          You don't have enough leave days available for this request.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Approval Process</h3>
                  <p className="text-sm text-gray-500">
                    Your leave request will be sent to your manager for approval. 
                    You will be notified once it has been reviewed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}