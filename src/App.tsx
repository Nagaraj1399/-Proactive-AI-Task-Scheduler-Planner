import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ListTodo, 
  Calendar, 
  Bell, 
  Brain, 
  Activity, 
  Flame, 
  Mic, 
  LogOut,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Bot,
  Cpu
} from 'lucide-react';

import { Task, Habit, CalendarEvent, SmartNudge, UserStats } from './types';
import { defaultTasks, defaultHabits, defaultCalendarEvents } from './data/defaultData';
import { initAuth, db, googleSignIn, guestSignIn, logout } from './lib/firebase';
import { User } from 'firebase/auth';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

// Modular Subcomponents
import TaskPrioritizer from './components/TaskPrioritizer';
import SchedulerCalendar from './components/SchedulerCalendar';
import ReminderNudger from './components/ReminderNudger';
import HabitCoach from './components/HabitCoach';
import VoiceAssistant from './components/VoiceAssistant';
import Confetti from './components/Confetti';
import GmailSync from './components/GmailSync';
import WhatsAppSimulator from './components/WhatsAppSimulator';
import TelegramSimulator from './components/TelegramSimulator';
import RoboticFocusHub from './components/RoboticFocusHub';

export default function App() {
  // Global App State
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [events, setEvents] = useState<CalendarEvent[]>(defaultCalendarEvents);
  
  // Cloud Auth & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const syncWithFirestore = async (currentUser: User) => {
    setIsSyncingCloud(true);
    if (currentUser.uid.startsWith('mock-guest-')) {
      setTimeout(() => {
        setIsSyncingCloud(false);
      }, 600);
      return;
    }
    try {
      // 1. Fetch tasks
      const tasksCol = collection(db, 'users', currentUser.uid, 'tasks');
      const tasksSnap = await getDocs(tasksCol);
      if (tasksSnap.empty) {
        for (const t of tasks) {
          await setDoc(doc(db, 'users', currentUser.uid, 'tasks', t.id), t);
        }
      } else {
        const cloudTasks: Task[] = [];
        tasksSnap.forEach(d => {
          cloudTasks.push(d.data() as Task);
        });
        setTasks(cloudTasks);
      }

      // 2. Fetch habits
      const habitsCol = collection(db, 'users', currentUser.uid, 'habits');
      const habitsSnap = await getDocs(habitsCol);
      if (habitsSnap.empty) {
        for (const h of habits) {
          await setDoc(doc(db, 'users', currentUser.uid, 'habits', h.id), h);
        }
      } else {
        const cloudHabits: Habit[] = [];
        habitsSnap.forEach(d => {
          cloudHabits.push(d.data() as Habit);
        });
        setHabits(cloudHabits);
      }

      // 3. Fetch events
      const eventsCol = collection(db, 'users', currentUser.uid, 'events');
      const eventsSnap = await getDocs(eventsCol);
      if (eventsSnap.empty) {
        for (const e of events) {
          await setDoc(doc(db, 'users', currentUser.uid, 'events', e.id), e);
        }
      } else {
        const cloudEvents: CalendarEvent[] = [];
        eventsSnap.forEach(d => {
          cloudEvents.push(d.data() as CalendarEvent);
        });
        setEvents(cloudEvents);
      }
    } catch (err) {
      console.warn('Error during Firestore sync:', err);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        syncWithFirestore(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);
  
  // High-Tech Dynamic Themes
  const [appTheme, setAppTheme] = useState<'cyan' | 'cyberpunk' | 'matrix' | 'amber' | 'futurism' | 'flow' | 'robotic'>(() => {
    const saved = localStorage.getItem('aura-theme');
    return (saved as any) || 'flow';
  });

  // Smart Speech Engine helper
  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = appTheme === 'cyberpunk' ? 1.25 : appTheme === 'matrix' ? 0.9 : appTheme === 'flow' ? 1.2 : appTheme === 'futurism' ? 1.15 : appTheme === 'robotic' ? 0.8 : 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis blocked:", e);
    }
  };

  const changeTheme = (newTheme: 'cyan' | 'cyberpunk' | 'matrix' | 'amber' | 'futurism' | 'flow' | 'robotic') => {
    setAppTheme(newTheme);
    localStorage.setItem('aura-theme', newTheme);
    
    let phrase = "";
    if (newTheme === 'cyberpunk') {
      phrase = "Sub-neural light spectrum recalibrated. Cyberpunk violet and pink neon parameters activated.";
    } else if (newTheme === 'matrix') {
      phrase = "Matrix mainframe engaged. Initializing green code phosphor terminal grids.";
    } else if (newTheme === 'amber') {
      phrase = "Warm fusion solar core online. Amber gold radiation shield active.";
    } else if (newTheme === 'futurism') {
      phrase = "Agentic Futurism protocol engaged. Deep obsidian violet and cybernetic teal sync active.";
    } else if (newTheme === 'flow') {
      phrase = "Neo-Flow cognitive matrix enabled. High-contrast liquid neon profiles active.";
    } else if (newTheme === 'robotic') {
      phrase = "RoboticFocus activated. Engaging metallic cybernetic interface, holographic overlay, and electric blue micro-grids.";
      setActiveTab('robotic');
    } else {
      phrase = "Aura default cyan system profile restored. Space telemetry balanced.";
    }
    speakResponse(phrase);
  };

  // Smart Nudges loaded inside the active Reminder Agent engine
  const [nudges, setNudges] = useState<SmartNudge[]>([
    {
      id: 'nudge-1',
      triggerType: 'location',
      triggerValue: 'Near Bank',
      message: "📍 You're near the bank! Take 2 minutes to settle your overdue billing and verify transaction logs.",
      actionText: "Settle Now",
      associatedTaskId: 'task-2',
      timestamp: new Date().toISOString(),
      active: true
    },
    {
      id: 'nudge-2',
      triggerType: 'time',
      triggerValue: '14:30',
      message: "🕒 Afternoon slump alert. Time to perform your 5-minute Zen Mindful Breathing loop.",
      actionText: "Calm Mind",
      associatedTaskId: 'habit-1',
      timestamp: new Date().toISOString(),
      active: true
    },
    {
      id: 'nudge-3',
      triggerType: 'workload',
      triggerValue: '5 pending tasks',
      message: "⚡ Workload buildup warning. You have 5 pending items today. Click here to auto-optimize scheduling slots.",
      actionText: "Optimize Day",
      timestamp: new Date().toISOString(),
      active: true
    }
  ]);

  // AI Agent Response states
  const [prioritizerInsight, setPrioritizerInsight] = useState('');
  const [schedulerInsight, setSchedulerInsight] = useState('');
  const [coachInsight, setCoachInsight] = useState({
    motivationalMessage: "Welcome back! Your schedule looks stable. To maximize productivity, prioritize high-scoring urgent tasks first.",
    focusScoreTip: "Complete Q3 Marketing Strategy work by 4 PM to lift focus levels.",
    habitRecommendations: [
      "Keep deep hydration active by drinking water every 2 hours.",
      "Sync Google Calendar regularly to coordinate workload windows."
    ]
  });

  // Loading States
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isFetchingCoach, setIsFetchingCoach] = useState(false);

  // Gamification triggers
  const [confettiActive, setConfettiActive] = useState(false);
  
  // Layout views
  const [activeTab, setActiveTab] = useState<'prioritizer' | 'scheduler' | 'reminders' | 'coach' | 'gmail' | 'whatsapp' | 'telegram' | 'robotic'>('prioritizer');
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  
  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Global Deadline Notification Alerts & Alarm System
  const [activeDeadlineAlert, setActiveDeadlineAlert] = useState<Task | null>(null);
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<string[]>([]);

  const playAlertChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      playTone(now, 987.77, 0.15); // B5
      playTone(now + 0.12, 1318.51, 0.25); // E6
    } catch (e) {
      console.warn("AudioContext blocked or failed to load:", e);
    }
  };

  const triggerCustomDeadlineAlert = () => {
    const pendingTask = tasks.find(t => t.status !== 'completed') || {
      id: 'mock-test-task',
      title: 'Review Project Milestone Deliverables',
      description: 'Review slides and financial estimations before submitting to partners.',
      category: 'Work',
      dueDate: new Date(Date.now() + 15 * 60000).toISOString(),
      estimatedDuration: 30,
      priorityLevel: 'high' as const,
      priorityScore: 92,
      priorityReasoning: 'Manual trigger test event',
      status: 'pending' as const,
      steps: [],
      createdAt: new Date().toISOString()
    };

    setActiveDeadlineAlert(pendingTask);
    playAlertChime();
    speakResponse(`Warning alert simulated. Upcoming deadline found for: "${pendingTask.title}".`);
  };

  // Real-time deadline scanning loop
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const upcomingAlert = tasks.find(t => {
        if (t.status === 'completed') return false;
        if (!t.dueDate) return false;
        
        const dueTime = new Date(t.dueDate).getTime();
        const diffMs = dueTime - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        const isUpcoming = diffMinutes > 0 && diffMinutes <= 60;
        return isUpcoming && !notifiedTaskIds.includes(t.id);
      });

      if (upcomingAlert) {
        setActiveDeadlineAlert(upcomingAlert);
        setNotifiedTaskIds(prev => [...prev, upcomingAlert.id]);
        playAlertChime();
        speakResponse(`Alert. Your task "${upcomingAlert.title}" is approaching its scheduled deadline.`);
      }
    }, 12000); // Check every 12 seconds

    return () => clearInterval(checkInterval);
  }, [tasks, notifiedTaskIds]);

  // Compute stats dynamically from task and habit state modifications
  const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
  const totalTasksCount = tasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((tasksCompleted / totalTasksCount) * 100) : 0;
  
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const onTimeCompletionRate = tasksCompleted > 0 ? 90 : 75; // baseline

  const focusScore = Math.min(100, Math.max(10, Math.round(
    (completionRate * 0.4) + (maxStreak * 4) + 40
  )));

  const stats: UserStats = {
    completionRate,
    tasksCompleted,
    onTimeCompletionRate,
    streakCount: maxStreak,
    focusScore
  };

  // Trigger celebration
  const triggerCelebration = () => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 1500);
  };

  // State manipulation handlers
  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (user && !user.uid.startsWith('mock-guest-')) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', updatedTask.id), updatedTask);
      } catch (err) {
        console.warn('Firestore save task warning:', err);
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    const match = tasks.find(t => t.id === id);
    if (match) {
      speakResponse(`Task "${match.title}" deleted.`);
    }
    setTasks(prev => prev.filter(t => t.id !== id));
    if (user && !user.uid.startsWith('mock-guest-')) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
      } catch (err) {
        console.warn('Firestore delete task warning:', err);
      }
    }
  };

  const handleCompleteTask = async (id: string) => {
    let completedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        speakResponse(`Task verified: "${t.title}" is now complete.`);
        completedTask = {
          ...t,
          status: 'completed',
          completedAt: new Date().toISOString()
        };
        return completedTask;
      }
      return t;
    }));
    triggerCelebration();

    if (user && !user.uid.startsWith('mock-guest-') && completedTask) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', id), completedTask);
      } catch (err) {
        console.warn('Firestore complete task warning:', err);
      }
    }
  };

  const handleAddTask = async (newTask: Omit<Task, 'id' | 'createdAt' | 'status' | 'steps' | 'priorityScore' | 'priorityReasoning'>) => {
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
      status: 'pending',
      priorityScore: newTask.priorityLevel === 'high' ? 80 : newTask.priorityLevel === 'medium' ? 50 : 25,
      priorityReasoning: 'Freshly created. Run the Task Prioritizer Agent to compute dynamic urgency ranking.',
      steps: [],
      createdAt: new Date().toISOString()
    };
    speakResponse(`Added priority task: "${task.title}".`);
    setTasks(prev => [task, ...prev]);

    if (user && !user.uid.startsWith('mock-guest-')) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', task.id), task);
      } catch (err) {
        console.warn('Firestore add task warning:', err);
      }
    }
  };

  const handleAddEvent = async (newEvent: Omit<CalendarEvent, 'id'>) => {
    const event: CalendarEvent = {
      ...newEvent,
      id: `evt-${Date.now()}`
    };
    setEvents(prev => [...prev, event]);

    if (user && !user.uid.startsWith('mock-guest-')) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'events', event.id), event);
      } catch (err) {
        console.warn('Firestore add event warning:', err);
      }
    }
  };

  const handleCompleteHabit = async (id: string) => {
    let completedHabit: Habit | null = null;
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const todayStr = new Date().toISOString().split('T')[0];
        const updatedHistory = h.history.includes(todayStr) ? h.history : [...h.history, todayStr];
        speakResponse(`Habit loop completed: "${h.name}". Streak updated to ${h.streak + 1} days.`);
        completedHabit = {
          ...h,
          streak: h.streak + 1,
          lastCompletedDate: todayStr,
          history: updatedHistory
        };
        return completedHabit;
      }
      return h;
    }));
    triggerCelebration();

    if (user && !user.uid.startsWith('mock-guest-') && completedHabit) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'habits', id), completedHabit);
      } catch (err) {
        console.warn('Firestore complete habit warning:', err);
      }
    }
  };

  const handleAddHabit = async (newHabit: Omit<Habit, 'id' | 'streak' | 'history' | 'createdAt'>) => {
    const habit: Habit = {
      ...newHabit,
      id: `habit-${Date.now()}`,
      streak: 0,
      history: [],
      createdAt: new Date().toISOString()
    };
    speakResponse(`Added habit structure: "${habit.name}".`);
    setHabits(prev => [...prev, habit]);

    if (user && !user.uid.startsWith('mock-guest-')) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'habits', habit.id), habit);
      } catch (err) {
        console.warn('Firestore add habit warning:', err);
      }
    }
  };

  const handleTriggerNudge = (nudge: SmartNudge) => {
    // Mark nudge triggered (inactive)
    setNudges(prev => prev.map(n => n.id === nudge.id ? { ...n, active: false } : n));
    speakResponse(`Snoozed smart reminder trigger.`);
    triggerCelebration();
  };

  const saveAllTasksToFirestore = async (updatedTasks: Task[]) => {
    if (!user || user.uid.startsWith('mock-guest-')) return;
    try {
      for (const t of updatedTasks) {
        await setDoc(doc(db, 'users', user.uid, 'tasks', t.id), t);
      }
    } catch (err) {
      console.warn('Firestore bulk save task warning:', err);
    }
  };

  // AI Backend Integrations
  const handleAIPrioritizer = async () => {
    if (tasks.length === 0) {
      setPrioritizerInsight("Add some tasks to get AI priority alignment insights.");
      return;
    }
    setIsPrioritizing(true);
    speakResponse("Prioritizer Agent activated. Recalculating task gravity scores.");
    
    let success = false;
    try {
      const response = await fetch('/api/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, currentTime: currentTime.toISOString() })
      });
      if (response.ok) {
        const data = await response.json();
        
        // Merge prioritized tasks back to state
        const updatedTasks = tasks.map(task => {
          const match = data.tasks.find((t: any) => t.id === task.id);
          if (match) {
            return {
              ...task,
              priorityScore: match.priorityScore,
              priorityLevel: match.priorityLevel,
              priorityReasoning: match.priorityReasoning,
              status: match.priorityScore >= 75 && task.status === 'pending' && new Date(task.dueDate).getTime() < Date.now() ? 'overdue' : task.status
            };
          }
          return task;
        });
        
        setTasks(updatedTasks);
        setPrioritizerInsight(data.agentInsight);
        speakResponse("Priority metrics successfully calculated. Urgent workloads elevated.");
        triggerCelebration();
        await saveAllTasksToFirestore(updatedTasks);
        success = true;
      }
    } catch (error) {
      console.warn('Prioritizer API call failed, using offline fallback:', error);
    }

    if (!success) {
      // Local Heuristic Fallback
      const updatedTasks = tasks.map((task, index) => {
        const hasDueDate = !!task.dueDate;
        const daysLeft = hasDueDate ? (new Date(task.dueDate).getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24) : 999;
        
        let score = 50; // default base score
        if (daysLeft < 0) score = 95; // overdue
        else if (daysLeft <= 1) score = 90; // due today/tomorrow
        else if (daysLeft <= 3) score = 75;
        else if (daysLeft <= 7) score = 55;
        else score = 30;

        // Category adjustments
        if (task.category === 'work') score += 5;
        else if (task.category === 'health') score += 2;

        const finalScore = Math.min(100, Math.max(10, score));
        const level = finalScore >= 75 ? 'high' : finalScore >= 40 ? 'medium' : 'low';

        return {
          ...task,
          priorityScore: finalScore,
          priorityLevel: level as 'high' | 'medium' | 'low',
          priorityReasoning: `Calibrated locally via offline metrics. ${hasDueDate ? `Due in ${daysLeft.toFixed(1)} days` : 'No hard deadline specified'}. Category: ${task.category}.`,
          status: finalScore >= 75 && task.status === 'pending' && daysLeft < 0 ? 'overdue' : task.status
        };
      });

      setTasks(updatedTasks);
      setPrioritizerInsight("Workspace calibrated via offline metrics. Connecting to Aura generative engine for detailed reasoning.");
      speakResponse("Prioritization calibrated offline.");
      await saveAllTasksToFirestore(updatedTasks);
    }
    
    setIsPrioritizing(false);
  };

  const handleAIScheduling = async (targetDate?: Date) => {
    setIsOptimizing(true);
    speakResponse("Optimizer Agent activated. Analyzing free calendar segments.");
    const referenceTime = targetDate ? targetDate : currentTime;
    
    let success = false;
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tasks: tasks.filter(t => t.status !== 'completed'), 
          calendarEvents: events,
          currentTime: referenceTime.toISOString()
        })
      });
      if (response.ok) {
        const data = await response.json();
        
        // Update task schedule dates from AI Scheduler recommendations
        const updatedTasks = tasks.map(task => {
          const match = data.scheduledTasks.find((t: any) => t.id === task.id);
          if (match) {
            return {
              ...task,
              scheduledStart: match.scheduledStart,
              scheduledEnd: match.scheduledEnd
            };
          }
          return task;
        });

        setTasks(updatedTasks);
        setSchedulerInsight(data.schedulerInsight);
        speakResponse("Calendar scheduling slots optimized. Standby to view workspace grids.");
        triggerCelebration();
        setActiveTab('scheduler'); // Flip to calendar tab to view outputs!
        await saveAllTasksToFirestore(updatedTasks);
        success = true;
      }
    } catch (error) {
      console.warn('Scheduler API call failed, using offline fallback:', error);
    }

    if (!success) {
      // Local Heuristic Scheduling fallback
      // Schedule tasks sequentially in open slots starting from tomorrow 9:00 AM
      const sortedPendingTasks = [...tasks]
        .filter(t => t.status !== 'completed')
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

      let currentAllocTime = new Date(referenceTime);
      currentAllocTime.setDate(currentAllocTime.getDate() + 1);
      currentAllocTime.setHours(9, 0, 0, 0); // Start at 9:00 AM tomorrow

      const scheduledList: any[] = [];
      const updatedTasks = tasks.map(task => {
        if (task.status === 'completed') return task;
        
        const isPendingTask = sortedPendingTasks.some(t => t.id === task.id);
        if (isPendingTask) {
          const durationMin = task.estimatedDuration || 60;
          const start = new Date(currentAllocTime);
          const end = new Date(currentAllocTime.getTime() + durationMin * 60 * 1000);
          
          // Advance pointer for next task
          currentAllocTime = new Date(end.getTime() + 30 * 60 * 1000); // 30 min break
          if (currentAllocTime.getHours() >= 18) {
            // Next day if it exceeds 6 PM
            currentAllocTime.setDate(currentAllocTime.getDate() + 1);
            currentAllocTime.setHours(9, 0, 0, 0);
          }

          scheduledList.push({
            id: task.id,
            scheduledStart: start.toISOString(),
            scheduledEnd: end.toISOString()
          });

          return {
            ...task,
            scheduledStart: start.toISOString(),
            scheduledEnd: end.toISOString()
          };
        }
        return task;
      });

      setTasks(updatedTasks);
      setSchedulerInsight("Optimized calendar matrix generated locally. Focus slots allocated starting tomorrow 9:00 AM.");
      speakResponse("Calendar scheduling slots optimized offline.");
      setActiveTab('scheduler');
      await saveAllTasksToFirestore(updatedTasks);
    }

    setIsOptimizing(false);
  };

  const handleFetchCoachInsights = async () => {
    setIsFetchingCoach(true);
    
    let success = false;
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, habits, stats, currentTime: currentTime.toISOString() })
      });
      if (response.ok) {
        const data = await response.json();
        setCoachInsight({
          motivationalMessage: data.motivationalMessage,
          focusScoreTip: data.focusScoreTip,
          habitRecommendations: data.habitRecommendations
        });

        // Append suggested nudges if any are new
        if (data.suggestedNudges && Array.isArray(data.suggestedNudges)) {
          const newNudges = data.suggestedNudges.map((n: any, idx: number) => ({
            id: `coach-nudge-${Date.now()}-${idx}`,
            triggerType: n.triggerType,
            triggerValue: n.triggerValue,
            message: `📣 ${n.message}`,
            actionText: n.actionText,
            timestamp: new Date().toISOString(),
            active: true
          }));
          setNudges(prev => [...newNudges, ...prev.filter(n => !n.id.startsWith('coach-nudge'))]);
        }
        success = true;
      }
    } catch (error) {
      console.warn('Coaching API failed, using offline fallback:', error);
    }

    if (!success) {
      // Local Heuristic Coaching insights fallback
      const pendingCount = tasks.filter(t => t.status !== 'completed').length;
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 100;
      
      let motivational = "Your cognitive engine is aligned. Maintain small, atomic daily progress to compound focus dividends!";
      let focusTip = "Block 90-minute hyper-focus sprints early in the day when mental processing capital is highest.";
      let recommendations = ["Complete 1 high-gravity item before checking communications", "Execute active rest periods to reduce baseline neural fatigue"];

      if (completionRate < 30) {
        motivational = "Aura indicates slightly overloaded circuits. Let's break down high-priority backlogs into small 15-minute segments to build momentum.";
        focusTip = "Ruthlessly eliminate micro-distractions. Close background communication tools during focused execution blocks.";
      } else if (completionRate > 80) {
        motivational = "Incredible velocity! You are operating at peak Flow State. Calibrate recovery protocols to prevent systemic fatigue.";
        focusTip = "Take a structured 15-minute screen-free walk. Grounding resets prefrontal cortex fatigue indices.";
      }

      setCoachInsight({
        motivationalMessage: motivational,
        focusScoreTip: focusTip,
        habitRecommendations: recommendations
      });

      // Default smart nudges
      const defaultNudges = [
        {
          id: `coach-nudge-${Date.now()}-0`,
          triggerType: 'time' as const,
          triggerValue: '09:00',
          message: "📣 Focus Engine initialized. Review elevated high-gravity tasks for the day.",
          actionText: "Align Priorities",
          timestamp: new Date().toISOString(),
          active: true
        }
      ];
      setNudges(prev => [...defaultNudges, ...prev.filter(n => !n.id.startsWith('coach-nudge'))]);
    }

    setIsFetchingCoach(false);
  };

  const handleAddTaskFromVoice = async (parsed: any) => {
    const task: Task = {
      id: `task-${Date.now()}`,
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      dueDate: parsed.dueDate,
      estimatedDuration: parsed.estimatedDuration,
      priorityLevel: parsed.priorityLevel,
      priorityScore: parsed.priorityLevel === 'high' ? 85 : parsed.priorityLevel === 'medium' ? 55 : 25,
      priorityReasoning: `Transcribed & structured instantly via Voice Agent: "${parsed.description}"`,
      status: 'pending',
      steps: [],
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [task, ...prev]);
    triggerCelebration();
    setShowVoiceAssistant(false);

    if (user && !user.uid.startsWith('mock-guest-')) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', task.id), task);
      } catch (err) {
        console.warn('Firestore save task warning from voice:', err);
      }
    }
  };

  // Run initial prioritization and insights generation to populate everything beautifully
  useEffect(() => {
    handleAIPrioritizer();
    handleFetchCoachInsights();
    
    // Auto voice speak welcome on start
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        try {
          window.speechSynthesis.cancel();
          const greeting = new SpeechSynthesisUtterance("Aura cognitive scheduler initiated. Workspace priority parameters calibrated.");
          greeting.rate = 1.05;
          greeting.pitch = 1.05;
          window.speechSynthesis.speak(greeting);
        } catch (e) {
          console.warn("Welcome speech blocked or failed:", e);
        }
      }, 1200);
    }
  }, []);

  return (
    <div className={`min-h-screen theme-${appTheme} text-slate-100 flex flex-col relative transition-all duration-500`} id="applet-root">
      {/* Floating fluid glow shapes representing the 'flow' theme as requested */}
      {appTheme === 'flow' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-[-10%] w-[450px] h-[450px] bg-pink-500/10 rounded-full blur-[140px] animate-pulse-subtle" />
          <div className="absolute top-[60%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[160px] animate-pulse-subtle" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-subtle" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {appTheme === 'robotic' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[5%] left-[25%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[110px] animate-pulse-subtle" />
          <div className="absolute top-[45%] right-[20%] w-[350px] h-[350px] bg-slate-300/10 rounded-full blur-[100px] animate-pulse-subtle" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-[140px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent animate-pulse" />
        </div>
      )}

      {/* Particle celebration element */}
      <Confetti trigger={confettiActive} />

      {/* Dynamic Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b theme-border-brand-20 py-3.5 px-6 sticky top-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" id="applet-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-950 border theme-border-brand rounded-lg flex items-center justify-center font-bold text-white theme-shadow-brand-sm overflow-hidden relative">
            {appTheme === 'robotic' ? (
              <>
                <Bot className="w-5.5 h-5.5 theme-text-brand theme-glow-icon animate-bounce" />
                <span className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-sky-400 animate-ping" />
              </>
            ) : (
              <Sparkles className="w-5.5 h-5.5 theme-text-brand animate-spin-slow theme-glow-icon" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold text-lg tracking-wider text-white logo-title">
                {appTheme === 'robotic' ? "AURA ROBOTICS" : "AURA"}{' '}
                <span className="theme-text-brand font-bold theme-glow-text">
                  {appTheme === 'robotic' ? "// COGNITIVE" : "// AI-CORE"}
                </span>
              </h1>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 theme-bg-brand-10 theme-text-brand border theme-border-brand-30 rounded theme-shadow-brand-sm flex items-center gap-1">
                {appTheme === 'robotic' && <Cpu className="w-2.5 h-2.5 animate-spin-slow text-sky-400" />}
                {appTheme === 'robotic' ? "ROBOTIC_FOCUS" : "TELEMETRY ACTIVE"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans tracking-wide">
              {appTheme === 'robotic' 
                ? "Autonomous Micro-cybernetics, Neural Timelines & Robotic Focus Engines" 
                : "Cognitive Scheduler & Autonomous Priority Matrix"
              }
            </p>
          </div>
        </div>

        {/* Global Dashboard Metrics Deck */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
          {/* Status Indicators */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 border border-slate-800/80 rounded-lg text-[10px] font-mono">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-slate-400">SYNTH ENGINE:</span>
            <span className="theme-text-brand font-bold">ONLINE</span>
          </div>

          {/* Firestore Auth / Sync status badge */}
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-emerald-950/50 rounded-lg shadow-sm" id="firestore-sync-badge">
              <span className={`w-1.5 h-1.5 rounded-full ${isSyncingCloud ? 'bg-amber-400 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 font-mono font-semibold uppercase">FIRESTORE SYNC</span>
                <span className="text-[8px] text-emerald-400 font-sans font-medium max-w-[110px] truncate">{user.displayName || user.email || (user.isAnonymous ? 'Guest Client' : 'Authenticated')}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="ml-2.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] text-slate-400 hover:text-slate-200 font-mono font-bold hover:bg-slate-850"
                title="Sign Out of AURA Sync"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2" id="auth-actions-group">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await googleSignIn();
                  } catch (e: any) {
                    if (e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-closed-by-user') {
                      console.warn("Sign in popup closed by user.");
                    } else {
                      console.warn("Sign in failed:", e?.message || e);
                    }
                  }
                }}
                className="flex items-center gap-2 px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-rose-950/50 hover:border-slate-800 rounded-lg shadow-sm text-slate-300 hover:text-white transition-all text-left group"
                id="firestore-signin-btn"
                title="Click to authenticate and back up all tasks to cloud database"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover:animate-ping" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-mono font-semibold uppercase">DURABLE CLOUD</span>
                  <span className="text-[8px] text-rose-400 font-sans font-bold">GOOGLE SYNC</span>
                </div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const guestUser = await guestSignIn();
                    if (guestUser) {
                      setUser(guestUser);
                      setIsSyncingCloud(true);
                      setTimeout(() => setIsSyncingCloud(false), 800);
                    }
                  } catch (e: any) {
                    console.warn("Guest Sign in falling back to local sandbox client:", e?.message || e);
                    const mockUser = {
                      uid: 'mock-guest-' + Math.random().toString(36).substr(2, 9),
                      displayName: 'Sandbox Client',
                      email: 'guest@aura.local',
                      isAnonymous: true,
                    } as any;
                    setUser(mockUser);
                    setIsSyncingCloud(true);
                    setTimeout(() => setIsSyncingCloud(false), 800);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-cyan-950/50 hover:border-slate-800 rounded-lg shadow-sm text-slate-300 hover:text-white transition-all text-left group animate-pulse hover:animate-none"
                id="guest-signin-btn"
                title="Bypass Google verification block: Synchronize instantly using Guest Authentication"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-mono font-semibold uppercase">UNRESTRICTED</span>
                  <span className="text-[8px] text-cyan-400 font-sans font-bold">GUEST BYPASS</span>
                </div>
              </button>
            </div>
          )}

          {/* High-Tech Neural Theme Hub */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-850">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">THEME:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'flow', label: 'AURA Neo-Flow', color: 'bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400' },
                { id: 'robotic', label: 'RoboticFocus', color: 'bg-gradient-to-r from-sky-400 to-slate-300 border border-sky-400/50' },
                { id: 'futurism', label: 'AI Futurism', color: 'bg-violet-500' },
                { id: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
                { id: 'cyberpunk', label: 'Cyberpunk', color: 'bg-pink-500' },
                { id: 'matrix', label: 'Matrix', color: 'bg-green-500' },
                { id: 'amber', label: 'Gold', color: 'bg-amber-500' }
              ].map(thm => (
                <button
                   key={thm.id}
                   id={`theme-btn-${thm.id}`}
                   onClick={() => changeTheme(thm.id as any)}
                   className={`w-3.5 h-3.5 rounded-full ${thm.color} flex items-center justify-center transition-all relative group`}
                   title={`${thm.label} Theme`}
                >
                  {appTheme === thm.id && (
                    <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* UTC Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg shadow-sm" id="applet-clock">
            <Clock className="w-3.5 h-3.5 theme-text-brand" />
            <span className="font-mono text-[11px] font-semibold text-slate-300">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>

          {/* Productivity Stats summaries */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border theme-border-brand-20 rounded-lg shadow-md theme-shadow-brand-sm" id="global-metric-badge">
            <Activity className="w-3.5 h-3.5 theme-text-brand animate-pulse" />
            <span className="text-slate-400">Focus Index:</span>
            <span className="font-mono font-bold theme-text-brand text-[11px]">{focusScore}%</span>
          </div>

          <button
            id="btn-voice-panel-toggle"
            onClick={() => {
              const activeState = !showVoiceAssistant;
              setShowVoiceAssistant(activeState);
              if (activeState) {
                if ('speechSynthesis' in window) {
                  try {
                    window.speechSynthesis.cancel();
                    const promptSpeech = new SpeechSynthesisUtterance("Voice command deck initialized. Ready for user parameters.");
                    promptSpeech.rate = 1.05;
                    window.speechSynthesis.speak(promptSpeech);
                  } catch (err) {}
                }
              }
            }}
            className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 ${
              showVoiceAssistant 
                ? 'theme-bg-brand-10 theme-border-brand-30 theme-text-brand shadow-inner' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:theme-text-brand hover:theme-border-brand-30'
            }`}
            title="Toggle Voice Assistant"
          >
            <Mic className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold hidden md:inline">VOICE ENGINE</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Voice Assistant Collapsible Dock */}
        <AnimatePresence>
          {showVoiceAssistant && (
            <motion.div
              id="voice-collapsible-dock"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <VoiceAssistant onAddTaskFromVoice={handleAddTaskFromVoice} tasks={tasks} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Tab Switcher Bar */}
        <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-thin" id="workspace-tabs-deck">
          {[
            { id: 'prioritizer', label: 'Task Prioritizer', icon: ListTodo, count: tasks.filter(t => t.status !== 'completed').length },
            { id: 'scheduler', label: 'AI Calendar Scheduler', icon: Calendar, count: tasks.filter(t => t.status !== 'completed' && t.scheduledStart).length },
            { id: 'robotic', label: 'Robotic Focus Core', icon: Bot, count: 0 },
            { id: 'reminders', label: 'Proactive Reminders', icon: Bell, count: nudges.filter(n => n.active).length },
            { id: 'coach', label: 'Habit Coach & Streaks', icon: Flame, count: habits.length },
            { id: 'gmail', label: 'Gmail Workspace Sync', icon: Mail, count: 0 },
            { id: 'whatsapp', label: 'WhatsApp Sandbox', icon: MessageSquare, count: 0 },
            { id: 'telegram', label: 'Telegram Bot', icon: Send, count: 0 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'coach') {
                    handleFetchCoachInsights();
                  }
                }}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all relative flex-shrink-0 ${
                  isSelected 
                    ? 'border-b-2 theme-border-brand theme-text-brand font-bold theme-bg-brand-10/40' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'scale-105 theme-text-brand theme-glow-icon' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'theme-bg-brand-20 theme-text-brand' : 'bg-slate-900 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace Active Views Deck */}
        <div className="pb-12" id="active-tab-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'prioritizer' && (
                <TaskPrioritizer
                  tasks={tasks}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onCompleteTask={handleCompleteTask}
                  onPrioritize={handleAIPrioritizer}
                  isPrioritizing={isPrioritizing}
                  prioritizerInsight={prioritizerInsight}
                  onAddTask={handleAddTask}
                />
              )}

              {activeTab === 'scheduler' && (
                <SchedulerCalendar
                  tasks={tasks}
                  events={events}
                  onAddEvent={handleAddEvent}
                  onOptimizeSchedule={handleAIScheduling}
                  isOptimizing={isOptimizing}
                  schedulerInsight={schedulerInsight}
                  onUpdateTask={handleUpdateTask}
                />
              )}

               {activeTab === 'robotic' && (
                <RoboticFocusHub
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onCompleteTask={handleCompleteTask}
                />
              )}

              {activeTab === 'reminders' && (
                <ReminderNudger
                  tasks={tasks}
                  nudges={nudges}
                  onTriggerNudge={handleTriggerNudge}
                  onAddNudge={(n) => {
                    const nd: SmartNudge = {
                      ...n,
                      id: `nudge-${Date.now()}`,
                      timestamp: new Date().toISOString()
                    };
                    setNudges(prev => [nd, ...prev]);
                  }}
                  onCompleteTask={handleCompleteTask}
                  onTriggerCustomDeadlineAlert={triggerCustomDeadlineAlert}
                />
              )}

              {activeTab === 'coach' && (
                <HabitCoach
                  habits={habits}
                  stats={stats}
                  onCompleteHabit={handleCompleteHabit}
                  onAddHabit={handleAddHabit}
                  coachInsight={coachInsight}
                  onFetchInsights={handleFetchCoachInsights}
                  isFetchingInsights={isFetchingCoach}
                />
              )}

              {activeTab === 'gmail' && (
                <GmailSync
                  onAddTask={handleAddTask}
                />
              )}

              {activeTab === 'whatsapp' && (
                <WhatsAppSimulator
                  onAddTask={handleAddTask}
                />
              )}

              {activeTab === 'telegram' && (
                <TelegramSimulator
                  onAddTask={handleAddTask}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Real-time Global Deadline Warning Notification Alert Banner */}
      <AnimatePresence>
        {activeDeadlineAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-[100] max-w-sm w-full bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl shadow-2xl p-5 overflow-hidden text-sm"
            id="global-deadline-alarm-popup"
          >
            {/* Blinking visual pulse */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl pointer-events-none" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[8px] font-mono font-bold tracking-widest text-rose-400 uppercase">Imminent</span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="bg-rose-500/20 text-rose-400 p-2.5 rounded-xl border border-rose-500/30">
                <Bell className="w-5.5 h-5.5 animate-bounce text-rose-400" />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <h4 className="font-sans font-extrabold text-slate-100 text-sm tracking-wide flex items-center gap-1">
                  🚨 Cognitive Deadline Alert!
                </h4>
                <p className="text-xs font-semibold text-rose-300">
                  "{activeDeadlineAlert.title}"
                </p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  This high-priority task is scheduled to breach its deadline at: <strong className="text-slate-200">{new Date(activeDeadlineAlert.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveDeadlineAlert(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Snooze Warning
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCompleteTask(activeDeadlineAlert.id);
                  setActiveDeadlineAlert(null);
                  speakResponse("Excellent task accomplishment. Deadline cleared!");
                }}
                className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-rose-500 hover:bg-rose-400 rounded-xl transition-all shadow theme-shadow-brand-sm cursor-pointer"
              >
                Complete Task Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
