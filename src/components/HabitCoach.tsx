import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Flame, 
  Sparkles, 
  Plus, 
  Check, 
  Brain, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Heart,
  ChevronRight
} from 'lucide-react';
import { Habit, UserStats } from '../types';

interface HabitCoachProps {
  habits: Habit[];
  stats: UserStats;
  onCompleteHabit: (id: string) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'streak' | 'history' | 'createdAt'>) => void;
  coachInsight: {
    motivationalMessage: string;
    focusScoreTip: string;
    habitRecommendations: string[];
  };
  onFetchInsights: () => Promise<void>;
  isFetchingInsights: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'streak' | 'completion' | 'planning' | 'health';
  unlocked: boolean;
  icon: string;
}

export default function HabitCoach({
  habits,
  stats,
  onCompleteHabit,
  onAddHabit,
  coachInsight,
  onFetchInsights,
  isFetchingInsights
}: HabitCoachProps) {
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitFreq, setHabitFreq] = useState<'daily' | 'weekly'>('daily');

  // Gamified Badges Logic
  const badges: Badge[] = [
    {
      id: 'badge-1',
      name: 'Deadline Destroyer',
      description: 'Completed your first overdue task before nightfall.',
      category: 'completion',
      unlocked: stats.tasksCompleted > 0,
      icon: '⚡'
    },
    {
      id: 'badge-2',
      name: 'Habit Hero',
      description: 'Achieve a 5-day streak on any positive daily habit.',
      category: 'streak',
      unlocked: habits.some(h => h.streak >= 5),
      icon: '🔥'
    },
    {
      id: 'badge-3',
      name: 'Master Planner',
      description: 'Synchronized Google Calendar or ran AI Scheduler Optimizer.',
      category: 'planning',
      unlocked: stats.onTimeCompletionRate > 80,
      icon: '🎯'
    },
    {
      id: 'badge-4',
      name: 'Zen Peak',
      description: 'Completed Mindful Breathing habit 3 times in a single week.',
      category: 'health',
      unlocked: habits.find(h => h.name.toLowerCase().includes('breathing'))?.history.length! >= 3,
      icon: '🧘'
    }
  ];

  const handleCreateHabit = (e: FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    onAddHabit({
      name: habitName,
      description: habitDesc,
      frequency: habitFreq
    });

    setHabitName('');
    setHabitDesc('');
    setHabitFreq('daily');
    setIsAddingHabit(false);
  };

  const isCompletedToday = (habit: Habit) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return habit.lastCompletedDate === todayStr || habit.history.includes(todayStr);
  };

  return (
    <div className="space-y-6" id="coach-section">
      {/* Habit Coach Agent Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden" id="coach-header-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/10 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="theme-bg-brand p-2.5 rounded shadow-md theme-shadow-brand-sm">
            <Brain className="w-5 h-5 text-slate-950 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-semibold text-white tracking-wide uppercase text-xs">Habit Coach Agent</h3>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 theme-bg-brand-10 theme-text-brand rounded border theme-border-brand-30">Active</span>
            </div>
            <p className="text-sm text-slate-300 font-sans italic leading-relaxed">
              "{coachInsight.motivationalMessage || 'Coach standby. I monitor task completion behaviors and habit streaks to provide personalized cognitive feedback.'}"
            </p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard Grid (Gamification Stats) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="stats-dashboard">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow">
          <div className="flex justify-between items-center text-slate-500 text-xs font-mono uppercase">
            <span>Focus Score</span>
            <Brain className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-100 font-mono">{stats.focusScore}%</span>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">+{Math.round(stats.focusScore * 0.15)}%</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">{coachInsight.focusScoreTip || 'Complete tasks on-time to boost your score.'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow">
          <div className="flex justify-between items-center text-slate-500 text-xs font-mono uppercase">
            <span>Streak days</span>
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-100 font-mono">{stats.streakCount}</span>
            <span className="text-xs text-slate-400">consecutive</span>
          </div>
          <p className="text-[10px] text-slate-400">Complete at least 1 habit daily to keep the fire going!</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow">
          <div className="flex justify-between items-center text-slate-500 text-xs font-mono uppercase">
            <span>Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-100 font-mono">{stats.completionRate}%</span>
            <span className="text-xs text-slate-400">({stats.tasksCompleted} tasks)</span>
          </div>
          <p className="text-[10px] text-slate-400">Overall ratio of completed tasks vs total workloads.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow">
          <div className="flex justify-between items-center text-slate-500 text-xs font-mono uppercase">
            <span>On-Time Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-100 font-mono">{stats.onTimeCompletionRate}%</span>
            <span className="text-xs text-slate-400">on-time</span>
          </div>
          <p className="text-[10px] text-slate-400">Ratio of completions logged prior to deadline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="coach-workspace">
        {/* Habits Checklist Left */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4" id="habits-checklist-panel">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 theme-text-brand" />
                Active Habits Checklist
              </h4>
              <p className="text-[10px] text-slate-500 mt-1">Strengthen positive neural habits by checking them off daily.</p>
            </div>
            
            <button
              id="btn-add-habit-toggle"
              onClick={() => setIsAddingHabit(!isAddingHabit)}
              className="flex items-center gap-1 text-[11px] theme-text-brand hover:brightness-110 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Habit
            </button>
          </div>

          {/* Quick Create Habit form */}
          <AnimatePresence>
            {isAddingHabit && (
              <motion.form
                id="add-habit-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateHabit}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs overflow-hidden"
              >
                <h5 className="font-semibold text-slate-200">Create habit loop</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-400">Habit Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10-Min Stretch"
                      value={habitName}
                      onChange={e => setHabitName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-400">Frequency</label>
                    <select
                      value={habitFreq}
                      onChange={e => setHabitFreq(e.target.value as 'daily' | 'weekly')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-slate-400">Cue & Reward / Description</label>
                  <input
                    type="text"
                    placeholder="Details to trigger the cue..."
                    value={habitDesc}
                    onChange={e => setHabitDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingHabit(false)}
                    className="px-2 py-1 text-[10px] text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-[10px] theme-bg-brand text-slate-950 hover:brightness-110 rounded font-semibold transition-all shadow theme-shadow-brand-sm"
                  >
                    Add Habit
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Habits grid list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {habits.map(habit => {
              const doneToday = isCompletedToday(habit);
              return (
                <div
                  key={habit.id}
                  id={`habit-card-${habit.id}`}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 ${
                    doneToday 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <h5 className={`font-semibold text-sm truncate ${doneToday ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {habit.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{habit.description || 'No cue details.'}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>{habit.streak} day streak</span>
                    </div>
                  </div>

                  <button
                    id={`btn-complete-habit-${habit.id}`}
                    disabled={doneToday}
                    onClick={() => onCompleteHabit(habit.id)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      doneToday 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                        : 'bg-slate-900 border-slate-800 hover:border-blue-500/40 text-slate-500 hover:text-blue-400'
                    }`}
                  >
                    {doneToday ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gamified Badges / AI Advice Right */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Coach Specific Tips */}
          {coachInsight.habitRecommendations && coachInsight.habitRecommendations.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow" id="coach-tips-panel">
              <div className="flex items-center gap-1.5 theme-text-brand">
                <Sparkles className="w-4 h-4 theme-glow-icon" />
                <h4 className="text-xs font-mono uppercase tracking-wider">AI Habit Tips</h4>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-sans leading-normal">
                {coachInsight.habitRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2 items-start bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                    <ChevronRight className="w-3.5 h-3.5 theme-text-brand flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gamification Badges Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4" id="badges-unlocked-panel">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" />
                Gamified Badges ({badges.filter(b => b.unlocked).length}/4)
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  id={`badge-item-${badge.id}`}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center space-y-1.5 transition-all duration-300 ${
                    badge.unlocked 
                      ? 'bg-yellow-500/5 border-yellow-500/20 text-slate-200' 
                      : 'bg-slate-950/40 border-slate-800/40 opacity-40 grayscale text-slate-500'
                  }`}
                  title={badge.description}
                >
                  <span className={`text-2xl ${badge.unlocked ? 'scale-110' : ''}`}>{badge.icon}</span>
                  <div className="space-y-0.5">
                    <h5 className="font-sans font-bold text-[10px] tracking-wide truncate max-w-[80px]">{badge.name}</h5>
                    <p className="text-[8px] leading-tight text-slate-400 line-clamp-2 font-sans px-1">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
