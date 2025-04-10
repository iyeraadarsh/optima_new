export interface Skill {
  id: string;
  userId: string;
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  lastUsed?: string; // Date string
  description?: string;
  endorsements?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SkillCategory {
  id: string;
  name: string;
  description?: string;
  skills: string[]; // Skill IDs
}

export interface DevelopmentGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  targetDate?: string; // Date string
  completedDate?: string; // Date string
  category?: string;
  relatedSkills?: string[]; // Skill IDs
  progress: number; // 0-100
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DevelopmentActivity {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  date: string; // Date string
  duration?: number; // Minutes
  status: 'planned' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}