
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ArrowLeft, AlertCircle } from "lucide-react";
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
import { LeaveType, LeaveRequest } from "@/types";
import Link from 'next/link';

export default function EditLeaveRequestPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [originalTotalDays, setOriginalTotalDays] = useState(0);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
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
      if (!id || !currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch leave request
        const request = await leaveService.getLeaveRequest(id as string);
        
        if (!request) {
          alert("Leave request not found");
          router.push("/hr/leave");
          return;
        }
        
        // Check if user is the owner of the request
        if (request.userId !== currentUser.uid) {
          alert("You don't have permission to edit this leave request");
          router.push("/hr/leave");
          return;
        }
        
        // Check if request is in a state that can be edited
        if (request.status !== 'pending') {
          alert("Only pending leave requests can be edited");
          router.push(`/hr/leave/${id}`);
          return;
        }
        
        setLeaveRequest(request);
        setOriginalTotalDays(request.totalDays);
        
        // Set form data
        setFormData({
          leaveTypeId: request.leaveTypeId,
          startDate: new Date(request.startDate),
          endDate: new Date(request.endDate),
          halfDay: request.halfDay || false,
          reason: request.reason || '',
          attachmentUrl: request.attachmentUrl || ''
        });
        
        // Fetch leave types
        const types = await leaveService.getLeaveTypes();
        setLeaveTypes(types);
        
        // Fetch user's leave balances
        const currentYear = new Date().getFullYear();
        const balances = await leaveService.getUserLeaveBalances(currentUser.uid, currentYear);
        setLeaveBalances(balances);
      } catch (error) {
        console.error('Error fetching leave data:', error);
        alert("Error loading leave request data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, currentUser, router]);

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
    
    if (!validateForm() || !leaveRequest) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Update leave request
      const updatedRequest = {
        leaveTypeId: formData.leaveTypeId,
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
        totalDays: calculatedDays,
        halfDay: formData.halfDay,
        reason: formData.reason,
        attachmentUrl: formData.attachmentUrl,
        status: 'pending' as const
      };
      
      await leaveService.updateLeaveRequest(leaveRequest.id, updatedRequest);
      
      // Update leave balance if the leave type or total days changed
      if (leaveRequest.leaveTypeId !== formData.leaveTypeId || originalTotalDays !== calculatedDays) {
        const currentYear = new Date().getFullYear();
        
        // If leave type changed, update both old and new leave type balances
        if (leaveRequest.leaveTypeId !== formData.leaveTypeId) {
          // Update old leave type balance
          const oldBalance = leaveBalances.find(b => b.leaveTypeId === leaveRequest.leaveTypeId);
          if (oldBalance) {
            await leaveService.updateLeaveBalance(oldBalance.id, {
              pendingDays: Math.max(0, oldBalance.pendingDays - originalTotalDays),
              updatedAt: Date.now()
            });
          }
          
          // Update new leave type balance
          const newBalance = leaveBalances.find(b => b.leaveTypeId === formData.leaveTypeId);
          if (newBalance) {
            await leaveService.updateLeaveBalance(newBalance.id, {
              pendingDays: newBalance.pendingDays + calculatedDays,
              updatedAt: Date.now()
            });
          }
        } 
        // If only total days changed, update the current leave type balance
        else if (originalTotalDays !== calculatedDays) {
          const balance = leaveBalances.find(b => b.leaveTypeId === formData.leaveTypeId);
          if (balance) {
            const pendingDaysDiff = calculatedDays - originalTotalDays;
            await leaveService.updateLeaveBalance(balance.id, {
              pendingDays: Math.max(0, balance.pendingDays + pendingDaysDiff),
              updatedAt: Date.now()
            });
          }
        }
      }
      
      // Show success message
      alert('Leave request updated successfully!');
      
      // Redirect to leave request details
      router.push(`/hr/leave/${leaveRequest.id}`);
    } catch (error) {
      console.error('Error updating leave request:', error);
      alert('Error updating leave request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveBalance = (leaveTypeId: string) => {
    const balance = leaveBalances.find(b => b.leaveTypeId === leaveTypeId);
    
    // If this is the same leave type as the original request, add back the original days
    // to the available balance for accurate calculation
    let adjustedBalance = balance ? balance.remainingDays : 0;
    if (leaveTypeId === leaveRequest?.leaveTypeId) {
      adjustedBalance += originalTotalDays;
    }
    
    return adjustedBalance || (
      leaveTypes.find(lt => lt.id === leaveTypeId)?.maxDaysPerYear || 0
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading leave request data...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Head>
        <title>Edit Leave Request | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button asChild variant="outline" className="mb-2">
              <Link href={`/hr/leave/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leave Request
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Edit Leave Request</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Update your pending leave request
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Leave Request</CardTitle>
                <CardDescription>
                  Update the details of your leave request
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
                      {formData.attachmentUrl && (
                        <p className="text-xs text-gray-500 mt-1">
                          Current attachment: {formData.attachmentUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/hr/leave/${id}`)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                >
                  {submitting ? "Updating..." : "Update Leave Request"}
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
                  <h3 className="text-sm font-medium mb-2">Note</h3>
                  <p className="text-sm text-gray-500">
                    Updating this leave request will reset its approval status to pending.
                    It will need to be approved again by your manager.
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
