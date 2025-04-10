import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash, Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { positionService } from "@/services/positionService";
import { departmentService } from "@/services/departmentService";
import { useAuth } from "@/contexts/AuthContext";
import { Position, Department } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function PositionsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Position form
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionName, setPositionName] = useState("");
  const [positionDescription, setPositionDescription] = useState("");
  const [positionDepartment, setPositionDepartment] = useState("");
  const [positionLevel, setPositionLevel] = useState(1);
  const [positionActive, setPositionActive] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch positions
        const allPositions = await positionService.getAllPositions();
        setPositions(allPositions);
        
        // Fetch departments for the dropdown
        const allDepartments = await departmentService.getAllDepartments();
        setDepartments(allDepartments);
      } catch (error) {
        console.error('Error fetching positions data:', error);
        setError('Failed to load positions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setPositionName(position.name);
    setPositionDescription(position.description || "");
    setPositionDepartment(position.departmentId || "");
    setPositionLevel(position.level || 1);
    setPositionActive(position.isActive);
    setShowPositionDialog(true);
  };

  const handleDeletePosition = async (positionId: string) => {
    if (window.confirm("Are you sure you want to delete this position? This may affect users with this position assigned.")) {
      try {
        await positionService.deletePosition(positionId);
        setPositions(positions.filter(position => position.id !== positionId));
        toast({
          title: 'Position deleted',
          description: 'The position has been deleted successfully.',
        });
      } catch (error) {
        console.error("Error deleting position:", error);
        setError("Failed to delete position. Please try again.");
      }
    }
  };

  const handleSavePosition = async () => {
    try {
      if (!positionName.trim()) {
        setError('Position name is required');
        return;
      }
      
      const positionData: Omit<Position, "id" | "createdAt" | "updatedAt"> = {
        name: positionName,
        description: positionDescription,
        departmentId: positionDepartment || undefined,
        level: positionLevel,
        isActive: positionActive,
        createdBy: userProfile?.id
      };
      
      if (editingPosition) {
        // Update existing position
        await positionService.updatePosition(editingPosition.id, positionData);
        
        // Update position in the list
        setPositions(positions.map(position => 
          position.id === editingPosition.id 
            ? { ...editingPosition, ...positionData, updatedAt: new Date().toISOString() } 
            : position
        ));
        
        toast({
          title: 'Position updated',
          description: `The position '${positionName}' has been updated successfully.`,
        });
      } else {
        // Create new position
        const newPositionId = await positionService.createPosition(positionData);
        
        // Add new position to the list
        const newPosition: Position = {
          id: newPositionId,
          ...positionData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setPositions([...positions, newPosition]);
        
        toast({
          title: 'Position created',
          description: `The position '${positionName}' has been created successfully.`,
        });
      }
      
      // Reset form and close dialog
      resetForm();
      setShowPositionDialog(false);
    } catch (error) {
      console.error("Error saving position:", error);
      setError("Failed to save position. Please try again.");
    }
  };

  const handleToggleStatus = async (positionId: string, isActive: boolean) => {
    try {
      await positionService.togglePositionStatus(positionId, isActive);
      
      // Update position in the list
      setPositions(positions.map(position => 
        position.id === positionId 
          ? { ...position, isActive, updatedAt: new Date().toISOString() } 
          : position
      ));
      
      toast({
        title: `Position ${isActive ? 'activated' : 'deactivated'}`,
        description: `The position has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error("Error toggling position status:", error);
      setError("Failed to update position status. Please try again.");
    }
  };

  const resetForm = () => {
    setEditingPosition(null);
    setPositionName("");
    setPositionDescription("");
    setPositionDepartment("");
    setPositionLevel(1);
    setPositionActive(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading positions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Position Management | Enterprise Management System</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/users/roles">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Position Management</h1>
          </div>
          <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Position
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingPosition ? "Edit Position" : "Create New Position"}</DialogTitle>
                <DialogDescription>
                  {editingPosition 
                    ? "Update the details for this position" 
                    : "Define a new position for your organization"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="positionName">Position Name</Label>
                    <Input
                      id="positionName"
                      value={positionName}
                      onChange={(e) => setPositionName(e.target.value)}
                      placeholder="e.g., Software Engineer"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="positionDescription">Description</Label>
                    <Textarea
                      id="positionDescription"
                      value={positionDescription}
                      onChange={(e) => setPositionDescription(e.target.value)}
                      placeholder="Describe the responsibilities and requirements for this position"
                      rows={3}
                    />
                  </div>
                  
                  <div className='space-y-2'>
                    <Label htmlFor='positionDepartment'>Department (Optional)</Label>
                    <Select value={positionDepartment} onValueChange={setPositionDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select department' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='none'>No Specific Department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="positionLevel">Position Level</Label>
                      <Input
                        id="positionLevel"
                        type="number"
                        min="1"
                        max="10"
                        value={positionLevel}
                        onChange={(e) => setPositionLevel(parseInt(e.target.value))}
                      />
                      <p className="text-xs text-slate-500">
                        Higher number = more senior (1-10)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="positionActive"
                      checked={positionActive}
                      onCheckedChange={setPositionActive}
                    />
                    <Label htmlFor="positionActive">Active</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPositionDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePosition}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingPosition ? "Update Position" : "Create Position"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Positions</CardTitle>
            <CardDescription>
              Manage job positions that can be assigned to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.length > 0 ? (
                  positions.map((position) => {
                    // Find department name if departmentId exists
                    const department = departments.find(d => d.id === position.departmentId);
                    
                    return (
                      <TableRow key={position.id}>
                        <TableCell className="font-medium">{position.name}</TableCell>
                        <TableCell>{position.description || "—"}</TableCell>
                        <TableCell>{department?.name || "—"}</TableCell>
                        <TableCell>{position.level || 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              position.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
                            }`}>
                              {position.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleStatus(position.id, !position.isActive)}
                            >
                              {position.isActive ? (
                                <X className="h-4 w-4 mr-1" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              {position.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditPosition(position)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => handleDeletePosition(position.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No positions defined yet. Create your first position to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}