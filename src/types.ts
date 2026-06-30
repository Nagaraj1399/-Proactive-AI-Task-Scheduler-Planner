export type PriorityLevel = 'high' | 'medium' | 'low';

export interface TaskStep {
  id: string;
  title: string;
  duration: number; // in minutes
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string; // e.g., Work, Personal, Health, Finance, Urgent
  dueDate: string; // ISO string or date string
  estimatedDuration: number; // in minutes
  priorityLevel: PriorityLevel;
  priorityScore: number; // 0 to 100
  priorityReasoning: string;
  status: 'pending' | 'completed' | 'overdue';
  steps: TaskStep[];
  scheduledStart?: string; // ISO timestamp
  scheduledEnd?: string; // ISO timestamp
  createdAt: string;
  completedAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  history: string[]; // List of completed dates YYYY-MM-DD
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  isAllDay: boolean;
  type: 'work' | 'personal' | 'task' | 'habit';
  associatedId?: string; // Task or Habit ID if synced
}

export interface AgentInsight {
  id: string;
  agentType: 'prioritizer' | 'scheduler' | 'reminder' | 'coach';
  message: string;
  level: 'info' | 'warning' | 'success';
  timestamp: string;
}

export interface SmartNudge {
  id: string;
  triggerType: 'time' | 'location' | 'workload';
  triggerValue: string; // e.g., "near Bank", "18:00", "5 pending tasks"
  message: string;
  actionText: string;
  associatedTaskId?: string;
  timestamp: string;
  active: boolean;
}

export interface UserStats {
  completionRate: number; // percentage
  tasksCompleted: number;
  onTimeCompletionRate: number; // percentage
  streakCount: number; // current daily completion streak
  focusScore: number; // computed overall productivity index
}
