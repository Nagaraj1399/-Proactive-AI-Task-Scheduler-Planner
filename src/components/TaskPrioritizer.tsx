import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Trash2, 
  CheckCircle, 
  ListTodo, 
  Plus, 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  Play,
  RotateCw
} from 'lucide-react';
import { Task, PriorityLevel, TaskStep } from '../types';

interface TaskPrioritizerProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onPrioritize: () => Promise<void>;
  isPrioritizing: boolean;
  prioritizerInsight: string;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'steps' | 'priorityScore' | 'priorityReasoning'>) => void;
}

export default function TaskPrioritizer({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  onPrioritize,
  isPrioritizing,
  prioritizerInsight,
  onAddTask
}: TaskPrioritizerProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Work');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [isBreakingDown, setIsBreakingDown] = useState<string | null>(null);

  // Sorting active tasks by priority score descending
  const activeTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const completedTasks = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime());

  const handleStepToggle = (task: Task, stepId: string) => {
    const updatedSteps = task.steps.map(s => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );
    
    // Auto-complete task if all steps are completed and task has steps
    const allDone = updatedSteps.length > 0 && updatedSteps.every(s => s.completed);
    
    if (allDone) {
      onCompleteTask(task.id);
    } else {
      onUpdateTask({
        ...task,
        steps: updatedSteps
      });
    }
  };

  const triggerTaskBreakdown = async (task: Task) => {
    setIsBreakingDown(task.id);
    try {
      const res = await fetch('/api/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task })
      });
      if (res.ok) {
        const data = await res.json();
        const steps: TaskStep[] = data.steps.map((step: any, index: number) => ({
          id: `step-${task.id}-${index}-${Date.now()}`,
          title: step.title,
          duration: step.duration,
          completed: false
        }));
        
        onUpdateTask({
          ...task,
          steps,
          priorityReasoning: `${task.priorityReasoning || ''}\n\n[Planner Agent Plan]: ${data.planningInsight}`
        });
      }
    } catch (error) {
      console.error('Failed task breakdown:', error);
    } finally {
      setIsBreakingDown(null);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    // Setup a default date if not provided (e.g. 24h from now)
    const dueDateVal = newDueDate 
      ? new Date(newDueDate).toISOString() 
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    onAddTask({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      dueDate: dueDateVal,
      estimatedDuration: Number(newDuration),
      priorityLevel: newPriority
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Work');
    setNewDueDate('');
    setNewDuration(30);
    setNewPriority('medium');
    setIsAdding(false);
  };

  const getPriorityBadgeColor = (level: PriorityLevel, score: number) => {
    if (level === 'high' || score >= 75) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (level === 'medium' || score >= 40) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'work': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'personal': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'health': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'finance': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'urgent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'work': return '💼';
      case 'personal': return '🏠';
      case 'health': return '🍏';
      case 'finance': return '💵';
      case 'urgent': return '🔥';
      default: return '🤖';
    }
  };

  return (
    <div className="space-y-6" id="prioritizer-section">
      {/* Agent Header Tip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden" id="prioritizer-header-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/10 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="theme-bg-brand p-2.5 rounded shadow-md theme-shadow-brand-sm">
            <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-semibold text-white tracking-wide uppercase text-xs">AI Priority Queue</h3>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 theme-bg-brand-10 theme-text-brand rounded border theme-border-brand-30">Vertex AI Optimized</span>
            </div>
            <p className="text-sm text-slate-300 font-sans italic leading-relaxed">
              "{prioritizerInsight || 'Analyze and rank your workload dynamically. Our Agent ranks tasks by computing deadline gravity, estimated duration overhead, and current context score.'}"
            </p>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center justify-between gap-4" id="prioritizer-controls">
        <div className="flex gap-2">
          <button
            id="btn-ai-reprioritize"
            onClick={onPrioritize}
            disabled={isPrioritizing || activeTasks.length === 0}
            className="flex items-center gap-2 px-4 py-2 theme-bg-brand hover:brightness-110 text-slate-950 font-bold text-xs rounded border theme-border-brand-30 shadow-md theme-shadow-brand-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            <RotateCw className={`w-4 h-4 ${isPrioritizing ? 'animate-spin' : ''}`} />
            {isPrioritizing ? 'AI Prioritizing...' : 'AI Re-Prioritize Workload'}
          </button>
        </div>

        <button
          id="btn-add-task-toggle"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Quick Add Task
        </button>
      </div>

      {/* Quick Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
              id="add-task-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleFormSubmit}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl overflow-hidden"
            >
              <h4 className="text-sm font-semibold text-white">Create New Task</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-400">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prep slides for client demo"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:theme-border-brand rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-400">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:theme-border-brand rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Health">Health</option>
                    <option value="Finance">Finance</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-400">Description</label>
                <textarea
                  placeholder="Details or notes about this task..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:theme-border-brand rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-400">Due Date</label>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:theme-border-brand rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-400">Estimated Duration (Mins)</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:theme-border-brand rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-400">Target Priority Level</label>
                  <div className="flex gap-2 h-[38px] items-center">
                    {(['low', 'medium', 'high'] as PriorityLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setNewPriority(level)}
                        className={`flex-1 text-xs capitalize py-1.5 rounded-lg border font-medium transition-all ${
                          newPriority === level 
                            ? 'theme-bg-brand-20 theme-text-brand theme-border-brand-30 shadow-inner' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all"
              >
                Create Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List Grid */}
      <div className="space-y-4" id="task-list-container">
        {activeTasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed" id="empty-tasks-placeholder">
            <ListTodo className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-sans font-medium text-slate-300">No pending tasks yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Tasks you create or speak will appear here. Run the Prioritizer Agent to structure your workload.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {activeTasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const completedStepsCount = task.steps.filter(s => s.completed).length;
              const progressPercentage = task.steps.length > 0 
                ? Math.round((completedStepsCount / task.steps.length) * 100) 
                : 0;
              const isOverdue = task.status === 'overdue' || new Date(task.dueDate).getTime() < Date.now();

              return (
                <motion.div
                  key={task.id}
                  id={`task-card-${task.id}`}
                  layoutId={`task-${task.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`bg-slate-900 border rounded-xl overflow-hidden shadow transition-all duration-200 ${
                    isExpanded ? 'ring-1 ring-blue-500/40 border-blue-500/40' : isOverdue ? 'border-rose-500/20' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Task Header info */}
                  <div 
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        id={`btn-complete-task-${task.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteTask(task.id);
                        }}
                        className="group flex-shrink-0 text-slate-600 hover:text-emerald-500 transition-colors"
                        title="Mark Completed"
                      >
                        <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${getCategoryColor(task.category)} flex items-center gap-1`}>
                            <span>{getCategoryEmoji(task.category)}</span>
                            <span>{task.category}</span>
                          </span>
                          <h4 className="font-sans font-medium text-sm text-slate-100 truncate tracking-wide">
                            {task.title}
                          </h4>
                          {isOverdue && (
                            <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 font-sans">
                          {task.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Right-side Indicators */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Priority Score badge */}
                      <div 
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getPriorityBadgeColor(task.priorityLevel, task.priorityScore)}`}
                        title={`AI Priority Score: ${task.priorityScore}/100. Reasoning available on expand.`}
                      >
                        <span className="font-mono">{task.priorityScore}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">{task.priorityLevel}</span>
                      </div>

                      {/* Expand / Collapse Icon */}
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-950/60 border-t border-slate-800/80 p-4 space-y-4"
                      >
                        {/* Meta Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 font-sans">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span>Due Date: {new Date(task.dueDate).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span>Duration: {task.estimatedDuration} Minutes</span>
                          </div>
                        </div>

                        {/* Description block */}
                        {task.description && (
                          <div className="space-y-1">
                            <h5 className="text-xs font-mono uppercase text-slate-400">Full Description</h5>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{task.description}</p>
                          </div>
                        )}

                        {/* AI Priority Reasoning */}
                        {task.priorityReasoning && (
                          <div className="bg-slate-900 border border-blue-500/10 p-3 rounded-lg space-y-1">
                            <div className="flex items-center gap-1 text-blue-400">
                              <Sparkles className="w-3 h-3" />
                              <h5 className="text-xs font-semibold">Prioritizer Reasoning</h5>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                              {task.priorityReasoning}
                            </p>
                          </div>
                        )}

                        {/* Sub-steps Planning section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
                              <ListTodo className="w-4 h-4 text-blue-400" />
                              <span>Actionable Steps {task.steps.length > 0 && `(${completedStepsCount}/${task.steps.length})`}</span>
                            </div>
                            
                            {task.steps.length === 0 && (
                              <button
                                type="button"
                                id={`btn-breakdown-${task.id}`}
                                onClick={() => triggerTaskBreakdown(task)}
                                disabled={isBreakingDown === task.id}
                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-300 text-[11px] font-medium rounded transition-all"
                              >
                                {isBreakingDown === task.id ? 'Planning...' : 'AI Generate Action Steps'}
                              </button>
                            )}
                          </div>

                          {task.steps.length > 0 && (
                            <div className="space-y-2 pt-1">
                              {/* Steps Progress bar */}
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-emerald-500 h-full transition-all duration-300" 
                                    style={{ width: `${progressPercentage}%` }} 
                                  />
                                </div>
                                <span className="font-mono">{progressPercentage}%</span>
                              </div>

                              {/* Steps listing */}
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {task.steps.map((step) => (
                                  <div 
                                    key={step.id}
                                    className="flex items-center justify-between gap-3 bg-slate-900/50 hover:bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800/60 text-xs transition-all"
                                  >
                                    <label className="flex items-center gap-2 text-slate-200 cursor-pointer min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={step.completed}
                                        onChange={() => handleStepToggle(task, step.id)}
                                        className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                                      />
                                      <span className={`truncate ${step.completed ? 'line-through text-slate-500' : ''}`}>
                                        {step.title}
                                      </span>
                                    </label>
                                    <span className="font-mono text-[10px] text-slate-500 flex-shrink-0 bg-slate-950 px-1 py-0.5 rounded">
                                      {step.duration}m
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Task Card Footer Actions */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            id={`btn-delete-${task.id}`}
                            onClick={() => {
                              const conf = window.confirm(`Remove task "${task.title}"? This cannot be undone.`);
                              if (conf) onDeleteTask(task.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Completed Tasks section */}
      {completedTasks.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800" id="completed-tasks-section">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Completed Tasks ({completedTasks.length})
          </h4>
          
          <div className="space-y-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
            {completedTasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 px-4 py-2.5 rounded-lg text-xs"
                id={`completed-task-card-${task.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-400 line-through truncate font-sans">{task.title}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px]">
                  <span>Completed {new Date(task.completedAt || '').toLocaleDateString()}</span>
                  <button
                    onClick={() => {
                      const conf = window.confirm(`Delete task "${task.title}"?`);
                      if (conf) onDeleteTask(task.id);
                    }}
                    className="text-slate-600 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
