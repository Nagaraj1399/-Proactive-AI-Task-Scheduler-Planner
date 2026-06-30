import { Task, Habit, CalendarEvent } from '../types';

export const defaultTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Finalize Q3 Marketing Strategy',
    description: 'Structure target demographics, ad budget split, and email campaigns for Q3 launch.',
    category: 'Work',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), // 5 hours from now
    estimatedDuration: 90,
    priorityLevel: 'high',
    priorityScore: 92,
    priorityReasoning: 'This strategy is the master roadmap for the entire Q3 launch, due by end of day to trigger the budget allocation.',
    status: 'pending',
    steps: [
      { id: 'step-1-1', title: 'Audit Q2 campaign ROI spreadsheet', duration: 30, completed: true },
      { id: 'step-1-2', title: 'Draft budget allocation across social and PPC channels', duration: 30, completed: false },
      { id: 'step-1-3', title: 'Write brief narrative summary for leadership team', duration: 30, completed: false }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'task-2',
    title: 'Renew Professional Certification',
    description: 'Complete the mandatory renewal assessment quiz and pay the credentialing fee.',
    category: 'Urgent',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(), // ~1 day from now
    estimatedDuration: 45,
    priorityLevel: 'high',
    priorityScore: 84,
    priorityReasoning: 'Certification expires tomorrow night. Failure to renew triggers a 30-day grace period penalty.',
    status: 'pending',
    steps: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'task-3',
    title: 'Prep for Dentistry Checkup',
    description: 'Retrieve dental record charts, confirm appointments, and complete the health status intake form.',
    category: 'Health',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 2 days from now
    estimatedDuration: 30,
    priorityLevel: 'medium',
    priorityScore: 55,
    priorityReasoning: 'Regular dental health check. High value for personal well-being, but has a low immediate penalty if deferred.',
    status: 'pending',
    steps: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-4',
    title: 'Review Family Home Insurance Policies',
    description: 'Compare renewal quotes with three different providers to see if there is a better rate.',
    category: 'Finance',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(), // 5 days from now
    estimatedDuration: 60,
    priorityLevel: 'low',
    priorityScore: 32,
    priorityReasoning: 'Policy is active for another 2 months. Great for cost-savings, but low immediate urgency.',
    status: 'pending',
    steps: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-5',
    title: 'Weekly Grocery Purchase',
    description: 'Buy fresh vegetables, milk, chicken breast, and household cleaning supplies.',
    category: 'Personal',
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // Overdue by 2 hours
    estimatedDuration: 40,
    priorityLevel: 'medium',
    priorityScore: 68,
    priorityReasoning: 'Overdue by 2 hours. Triggering passive delay, though non-critical, this impacts evening meal prep.',
    status: 'overdue',
    steps: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: 'task-6',
    title: 'Update Team Sprint Backlog',
    description: 'Move cards to completed, assign owners, and add next cycle estimates.',
    category: 'Work',
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Completed yesterday
    estimatedDuration: 30,
    priorityLevel: 'medium',
    priorityScore: 60,
    priorityReasoning: 'Completed before the morning standup yesterday.',
    status: 'completed',
    steps: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
  }
];

export const defaultHabits: Habit[] = [
  {
    id: 'habit-1',
    name: 'Mindful Breathing',
    description: 'A 5-minute deep breathing block during the afternoon slump to clear the mind.',
    frequency: 'daily',
    streak: 5,
    lastCompletedDate: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString().split('T')[0], // completed yesterday
    history: [
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString().split('T')[0],
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0],
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0]
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
  },
  {
    id: 'habit-2',
    name: 'Hydration Target',
    description: 'Drink at least 3 liters of water throughout the day.',
    frequency: 'daily',
    streak: 12,
    lastCompletedDate: new Date().toISOString().split('T')[0], // completed today!
    history: Array.from({ length: 12 }).map((_, i) => 
      new Date(Date.now() - 1000 * 60 * 60 * 24 * i).toISOString().split('T')[0]
    ),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString()
  }
];

export const defaultCalendarEvents: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Daily Team Sync Standup',
    start: (() => {
      const d = new Date();
      d.setHours(10, 0, 0, 0);
      return d.toISOString();
    })(),
    end: (() => {
      const d = new Date();
      d.setHours(10, 30, 0, 0);
      return d.toISOString();
    })(),
    isAllDay: false,
    type: 'work'
  },
  {
    id: 'cal-2',
    title: 'Project Alpha Review Session',
    start: (() => {
      const d = new Date();
      d.setHours(13, 0, 0, 0);
      return d.toISOString();
    })(),
    end: (() => {
      const d = new Date();
      d.setHours(14, 0, 0, 0);
      return d.toISOString();
    })(),
    isAllDay: false,
    type: 'work'
  },
  {
    id: 'cal-3',
    title: 'Weekly Gym Training',
    start: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1); // Tomorrow
      d.setHours(18, 0, 0, 0);
      return d.toISOString();
    })(),
    end: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1); // Tomorrow
      d.setHours(19, 0, 0, 0);
      return d.toISOString();
    })(),
    isAllDay: false,
    type: 'personal'
  }
];
