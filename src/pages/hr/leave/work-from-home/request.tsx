import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MainLayout } from '@/components/layout/MainLayout';
import { workFromHomeService } from "@/services/workFromHomeService";
import { useAuth } from "@/contexts/AuthContext";
import Link from 'next/link';

export default function WorkFromHomeRequestPage() {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvers, setApprovers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    startDate: new Date(),
    endDate: new Date(),
    reason: '',
    workDetails: '',
    approverId: ''
  });
  const [formErrors, setFormErrors] = useState<{
    dates?: string;
    reason?: string;
    workDetails?: string;
    approverId?: string;
  }>({});
  const [calculatedDays, setCalculatedDays] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch approvers
        try {
          const fetchedApprovers = await workFromHomeService.getApprovers(currentUser.uid);
          setApprovers(fetchedApprovers);
        } catch (error) {
          console.error('Error fetching approvers:', error);
          // Set default approvers if there's an error
          setApprovers([{ id: 'default', name: 'Default Approver', role: 'manager' }]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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
        
        setCalculatedDays(diffDays);
      } else {
        setCalculatedDays(0);
      }
    }
  }, [formData.startDate, formData.endDate]);

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
      dates?: string;
      reason?: string;
      workDetails?: string;
      approverId?: string;
    } = {};
    
    if (!formData.startDate || !formData.endDate) {
      errors.dates = "Please select both start and end dates";
    } else if (formData.startDate > formData.endDate) {
      errors.dates = "End date cannot be before start date";
    }
    
    if (!formData.reason.trim()) {
      errors.reason = "Please provide a reason for your work from home request";
    }
    
    if (!formData.workDetails.trim()) {
      errors.workDetails = "Please provide details about the work you'll be doing";
    }
    
    if (!formData.approverId) {
      errors.approverId = "Please select an approver";
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
      
      // Create work from home request
      const wfhRequest = {
        userId: currentUser.uid,
        userName: userProfile ? userProfile.name : '',
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
        totalDays: calculatedDays,
        reason: formData.reason,
        workDetails: formData.workDetails,
        approverId: formData.approverId || 'default',
        status: 'pending' as 'pending' | 'approved' | 'rejected' | 'cancelled'
      };
      
      console.log('Submitting work from home request:', wfhRequest);
      const requestId = await workFromHomeService.createWorkFromHomeRequest(wfhRequest);
      console.log('Work from home request created with ID:', requestId);
      
      // Show success message
      alert('Work from home request submitted successfully!');
      
      // Redirect to WFH dashboard
      router.push('/hr/leave/work-from-home');
    } catch (error) {
      console.error('Error submitting work from home request:', error);
      alert('Error submitting work from home request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <Head>
        <title>Request Work From Home | HR Module</title>
      </Head>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Request Work From Home</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Submit a new work from home request
            </p>
          </div>
          <div className='flex gap-2'>
            <Button asChild variant='outline'>
              <Link href='/hr/leave/work-from-home'>
                Back to Work From Home
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Work From Home Request Form</CardTitle>
                <CardDescription>
                  Fill out the form below to submit your work from home request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className='space-y-4'>
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
                    
                    <div>
                      <Label htmlFor='approver'>Approver</Label>
                      <Select
                        value={formData.approverId}
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
                      {formErrors.approverId && (
                        <p className='text-sm text-red-500 mt-1'>{formErrors.approverId}</p>
                      )}
                      <p className='text-xs text-gray-500 mt-1'>
                        Select who should approve this work from home request
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor='reason'>Reason for Work From Home</Label>
                      <Textarea
                        id='reason'
                        placeholder='Please provide a reason for your work from home request'
                        value={formData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        rows={3}
                      />
                      {formErrors.reason && (
                        <p className='text-sm text-red-500 mt-1'>{formErrors.reason}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor='workDetails'>Work Details</Label>
                      <Textarea
                        id='workDetails'
                        placeholder='Please provide details about the work you will be doing'
                        value={formData.workDetails}
                        onChange={(e) => handleInputChange('workDetails', e.target.value)}
                        rows={4}
                      />
                      {formErrors.workDetails && (
                        <p className='text-sm text-red-500 mt-1'>{formErrors.workDetails}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Describe the tasks you'll be working on and how you'll be available for communication
                      </p>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/hr/leave/work-from-home")}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Request Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">Work From Home</span>
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
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Guidelines</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Ensure you have a stable internet connection</li>
                      <li>Be available during regular working hours</li>
                      <li>Attend all scheduled meetings virtually</li>
                      <li>Respond promptly to communications</li>
                      <li>Update your work status regularly</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Approval Process</h3>
                  <p className="text-sm text-gray-500">
                    Your work from home request will be sent to your manager for approval. 
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
