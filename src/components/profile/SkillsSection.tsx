import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Trash, 
  Edit, 
  Save, 
  X, 
  Star, 
  StarHalf, 
  Calendar, 
  Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skill } from "@/types/skills";
import { skillsService } from "@/services/skillsService";
import { useToast } from "@/hooks/use-toast";

interface SkillsSectionProps {
  userId: string;
}

export default function SkillsSection({ userId }: SkillsSectionProps) {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  
  // Form state
  const [skillName, setSkillName] = useState("");
  const [proficiency, setProficiency] = useState<"beginner" | "intermediate" | "advanced" | "expert">("intermediate");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | undefined>(undefined);
  const [lastUsed, setLastUsed] = useState("");
  const [description, setDescription] = useState("");
  
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const userSkills = await skillsService.getUserSkills(userId);
        setSkills(userSkills);
      } catch (error) {
        console.error("Error fetching skills:", error);
        toast({
          title: "Error",
          description: "Failed to load skills. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSkills();
  }, [userId, toast]);
  
  const handleAddSkill = () => {
    setEditingSkill(null);
    setSkillName("");
    setProficiency("intermediate");
    setYearsOfExperience(undefined);
    setLastUsed("");
    setDescription("");
    setShowSkillDialog(true);
  };
  
  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillName(skill.name);
    setProficiency(skill.proficiency);
    setYearsOfExperience(skill.yearsOfExperience);
    setLastUsed(skill.lastUsed || "");
    setDescription(skill.description || "");
    setShowSkillDialog(true);
  };
  
  const handleDeleteSkill = async (skillId: string) => {
    if (window.confirm("Are you sure you want to delete this skill?")) {
      try {
        await skillsService.deleteSkill(skillId);
        setSkills(skills.filter(skill => skill.id !== skillId));
        toast({
          title: "Success",
          description: "Skill deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting skill:", error);
        toast({
          title: "Error",
          description: "Failed to delete skill. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleSaveSkill = async () => {
    try {
      if (!skillName.trim()) {
        toast({
          title: 'Error',
          description: 'Skill name is required',
          variant: 'destructive',
        });
        return;
      }
      
      if (editingSkill) {
        // Update existing skill
        await skillsService.updateSkill(editingSkill.id, {
          name: skillName,
          proficiency,
          yearsOfExperience,
          lastUsed: lastUsed || undefined,
          description: description || undefined,
        });
        
        // Update skill in the list
        setSkills(skills.map(skill => 
          skill.id === editingSkill.id 
            ? { 
                ...skill, 
                name: skillName,
                proficiency,
                yearsOfExperience,
                lastUsed: lastUsed || undefined,
                description: description || undefined,
                updatedAt: Date.now()
              } 
            : skill
        ));
        
        toast({
          title: 'Success',
          description: 'Skill updated successfully',
        });
        
        // Close dialog
        setShowSkillDialog(false);
      } else {
        // Create new skill
        try {
          const newSkillData = {
            userId,
            name: skillName,
            proficiency,
            yearsOfExperience,
            lastUsed: lastUsed || undefined,
            description: description || undefined,
            endorsements: 0
          };
          
          console.log('Creating skill with data:', newSkillData);
          
          const newSkillId = await skillsService.createSkill(newSkillData);
          
          console.log('New skill created with ID:', newSkillId);
          
          // Add new skill to the list
          const newSkill: Skill = {
            id: newSkillId,
            userId,
            name: skillName,
            proficiency,
            yearsOfExperience,
            lastUsed: lastUsed || undefined,
            description: description || undefined,
            endorsements: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          setSkills([...skills, newSkill]);
          
          toast({
            title: 'Success',
            description: 'Skill added successfully',
          });
          
          // Close dialog
          setShowSkillDialog(false);
        } catch (error) {
          console.error('Error in createSkill:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error saving skill:', error);
      toast({
        title: 'Error',
        description: 'Failed to save skill. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const renderProficiencyStars = (proficiency: string) => {
    switch (proficiency) {
      case "beginner":
        return (
          <div className="flex text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 text-gray-300" />
            <Star className="h-4 w-4 text-gray-300" />
            <Star className="h-4 w-4 text-gray-300" />
          </div>
        );
      case "intermediate":
        return (
          <div className="flex text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 text-gray-300" />
            <Star className="h-4 w-4 text-gray-300" />
          </div>
        );
      case "advanced":
        return (
          <div className="flex text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 text-gray-300" />
          </div>
        );
      case "expert":
        return (
          <div className="flex text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
          </div>
        );
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Skills & Expertise</h2>
        <Button onClick={handleAddSkill} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </div>
      
      {skills.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-slate-50 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            You haven't added any skills yet.
          </p>
          <Button onClick={handleAddSkill} variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Your First Skill
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <Card key={skill.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{skill.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleEditSkill(skill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600" 
                      onClick={() => handleDeleteSkill(skill.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize">
                    {skill.proficiency}
                  </Badge>
                  {renderProficiencyStars(skill.proficiency)}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {skill.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {skill.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {skill.yearsOfExperience && (
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'year' : 'years'} of experience
                    </div>
                  )}
                  {skill.lastUsed && (
                    <div className="flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Last used: {new Date(skill.lastUsed).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSkill ? "Edit Skill" : "Add New Skill"}</DialogTitle>
            <DialogDescription>
              {editingSkill 
                ? "Update your skill details" 
                : "Add a new skill to your profile"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skillName">Skill Name</Label>
              <Input
                id="skillName"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g., JavaScript, Project Management, Data Analysis"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="proficiency">Proficiency Level</Label>
              <Select value={proficiency} onValueChange={(value: "beginner" | "intermediate" | "advanced" | "expert") => setProficiency(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select proficiency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  max="50"
                  value={yearsOfExperience === undefined ? "" : yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g., 3"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastUsed">Last Used</Label>
                <Input
                  id="lastUsed"
                  type="date"
                  value={lastUsed}
                  onChange={(e) => setLastUsed(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your experience with this skill"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSkill}>
              <Save className="h-4 w-4 mr-2" />
              {editingSkill ? "Update Skill" : "Add Skill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}