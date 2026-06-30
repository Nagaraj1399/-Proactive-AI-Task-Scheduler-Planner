import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Plus, 
  Check, 
  RefreshCw, 
  Globe, 
  User,
  AlertCircle
} from 'lucide-react';
import { Task, CalendarEvent } from '../types';

interface SchedulerCalendarProps {
  tasks: Task[];
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onOptimizeSchedule: (targetDate: Date) => Promise<void>;
  isOptimizing: boolean;
  schedulerInsight: string;
  onUpdateTask: (task: Task) => void;
}

export default function SchedulerCalendar({
  tasks,
  events,
  onAddEvent,
  onOptimizeSchedule,
  isOptimizing,
  schedulerInsight,
  onUpdateTask
}: SchedulerCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventType, setEventType] = useState<'work' | 'personal'>('work');
  const [calendarSyncConnected, setCalendarSyncConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Manual scheduling state
  const [activeSchedulingTaskId, setActiveSchedulingTaskId] = useState<string | null>(null);
  const [manualStartTime, setManualStartTime] = useState<string>('');

  // Filter tasks that have scheduled slots on the current viewDate
  const scheduledTasksOnDay = tasks.filter(task => {
    if (!task.scheduledStart || task.status === 'completed') return false;
    const taskDate = new Date(task.scheduledStart);
    return taskDate.toDateString() === viewDate.toDateString();
  });

  // Filter busy calendar events on current viewDate
  const eventsOnDay = events.filter(evt => {
    const evtDate = new Date(evt.start);
    return evtDate.toDateString() === viewDate.toDateString();
  });

  const hoursRange = Array.from({ length: 13 }).map((_, i) => i + 8); // 8:00 AM to 8:00 PM

  const handleCreateEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventStart || !eventEnd) return;

    // Set dates relative to viewDate
    const startHour = Number(eventStart.split(':')[0]);
    const startMin = Number(eventStart.split(':')[1]);
    const endHour = Number(eventEnd.split(':')[0]);
    const endMin = Number(eventEnd.split(':')[1]);

    const sDate = new Date(viewDate);
    sDate.setHours(startHour, startMin, 0, 0);

    const eDate = new Date(viewDate);
    eDate.setHours(endHour, endMin, 0, 0);

    onAddEvent({
      title: eventTitle,
      start: sDate.toISOString(),
      end: eDate.toISOString(),
      isAllDay: false,
      type: eventType
    });

    setEventTitle('');
    setEventStart('');
    setEventEnd('');
    setIsAddingEvent(false);
  };

  const simulateCalendarConnection = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setCalendarSyncConnected(true);
      setIsConnecting(false);
      // Auto-inject a calendar event from Google Calendar to show real behavior!
      const gCalDate = new Date(viewDate);
      gCalDate.setHours(15, 0, 0, 0);
      const gCalEndDate = new Date(viewDate);
      gCalEndDate.setHours(16, 0, 0, 0);
      
      onAddEvent({
        title: "🔄 Synced Google Meet: Quarterly Sync",
        start: gCalDate.toISOString(),
        end: gCalEndDate.toISOString(),
        isAllDay: false,
        type: 'work'
      });
    }, 1200);
  };

  // Helper to compute CSS position coordinates (percentage-based grid)
  const getPositionStyles = (startISO: string, endISO: string) => {
    const s = new Date(startISO);
    const e = new Date(endISO);
    
    const startHourDecimal = s.getHours() + s.getMinutes() / 60;
    const endHourDecimal = e.getHours() + e.getMinutes() / 60;
    
    const gridStart = 8; // calendar starts at 8 AM
    const gridEnd = 20; // calendar ends at 8 PM (12 hours span)
    
    const startPercent = Math.max(0, ((startHourDecimal - gridStart) / (gridEnd - gridStart)) * 100);
    const endPercent = Math.min(100, ((endHourDecimal - gridStart) / (gridEnd - gridStart)) * 100);
    const heightPercent = Math.max(4, endPercent - startPercent);

    return {
      top: `${startPercent}%`,
      height: `${heightPercent}%`,
    };
  };

  return (
    <div className="space-y-6" id="scheduler-section">
      {/* Scheduler Header Info */}
      <div className="bg-slate-900 border theme-border-brand-20 rounded-xl p-5 shadow-lg relative overflow-hidden" id="scheduler-header-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/10 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="theme-bg-brand p-2.5 rounded-lg shadow-md theme-shadow-brand-sm">
            <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-semibold text-white tracking-wide">Scheduler Agent</h3>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 theme-bg-brand-10 theme-text-brand rounded border theme-border-brand-30">Active</span>
            </div>
            <p className="text-sm text-slate-300 font-sans italic leading-relaxed">
              "{schedulerInsight || 'Schedule optimizer standby. Press "AI Optimize Schedule" to fit priority tasks into your free windows between commitments.'}"
            </p>
          </div>
        </div>
      </div>

      {/* Sync Controls & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" id="scheduler-controls">
        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
          <Calendar className="w-4 h-4 theme-text-brand" />
          <span className="text-sm font-semibold text-slate-200">
            {viewDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <div className="flex gap-1 pl-2 border-l border-slate-800">
            <button 
              onClick={() => {
                const prev = new Date(viewDate);
                prev.setDate(prev.getDate() - 1);
                setViewDate(prev);
              }}
              className="text-xs hover:theme-text-brand px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              Prev
            </button>
            <button 
              onClick={() => setViewDate(new Date())}
              className="text-xs text-slate-400 hover:text-slate-200 px-1 py-0.5 rounded transition-colors"
            >
              Today
            </button>
            <button 
              onClick={() => {
                const next = new Date(viewDate);
                next.setDate(next.getDate() + 1);
                setViewDate(next);
              }}
              className="text-xs hover:theme-text-brand px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        {/* Sync & Optimize Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            id="btn-google-calendar-sync"
            onClick={simulateCalendarConnection}
            disabled={calendarSyncConnected || isConnecting}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
              calendarSyncConnected 
                ? 'theme-bg-brand-10 theme-text-brand theme-border-brand-30' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Globe className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
            {isConnecting ? 'Connecting GCal...' : calendarSyncConnected ? 'Google Calendar Synced' : 'Sync Google Calendar'}
          </button>

          <button
            id="btn-ai-optimize-schedule"
            onClick={() => onOptimizeSchedule(viewDate)}
            disabled={isOptimizing || tasks.filter(t => t.status !== 'completed').length === 0}
            className="flex items-center gap-2 px-4 py-2 theme-bg-brand hover:brightness-110 text-slate-950 font-bold text-sm rounded-lg shadow theme-shadow-brand-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'AI Scheduling...' : 'AI Optimize Schedule'}
          </button>
        </div>
      </div>

      {/* Main Calendar Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="calendar-workspace">
        {/* Unscheduled Tasks Left Panel */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4" id="unscheduled-sidebar">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Queue to Schedule</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Tasks needing scheduled slots today</p>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {tasks.filter(t => t.status !== 'completed' && !t.scheduledStart).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                All tasks are currently scheduled! Press AI Optimize to reposition them beautifully.
              </div>
            ) : (
              tasks
                .filter(t => t.status !== 'completed' && !t.scheduledStart)
                .map(task => (
                  <div 
                    key={task.id}
                    className="p-3 bg-slate-950 border border-slate-800/80 hover:border-cyan-500/30 rounded-lg text-xs space-y-1.5 transition-all cursor-pointer hover:bg-slate-950/80"
                    onClick={() => {
                      if (activeSchedulingTaskId === task.id) {
                        setActiveSchedulingTaskId(null);
                      } else {
                        setActiveSchedulingTaskId(task.id);
                        setManualStartTime('09:00');
                      }
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-slate-200 truncate">{task.title}</span>
                      <span className="font-mono text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{task.estimatedDuration}m</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{task.description || 'No notes'}</p>
                    <div className="flex justify-between items-center text-[9px] pt-1 border-t border-slate-900 text-slate-500">
                      <span>Priority: {task.priorityScore}</span>
                      <span>Level: {task.priorityLevel}</span>
                    </div>

                    {activeSchedulingTaskId === task.id && (
                      <div 
                        className="mt-2.5 p-2 bg-slate-900 border border-slate-800/80 rounded-lg space-y-2 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-slate-400 font-mono">Start Time</label>
                          <input
                            type="time"
                            required
                            value={manualStartTime}
                            onChange={e => setManualStartTime(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none focus:border-cyan-500 text-xs"
                          />
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSchedulingTaskId(null);
                              setManualStartTime('');
                            }}
                            className="flex-1 py-1 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded text-[9px] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!manualStartTime) return;
                              const startHour = Number(manualStartTime.split(':')[0]);
                              const startMin = Number(manualStartTime.split(':')[1]);

                              const sDate = new Date(viewDate);
                              sDate.setHours(startHour, startMin, 0, 0);

                              const eDate = new Date(sDate);
                              eDate.setMinutes(eDate.getMinutes() + (task.estimatedDuration || 30));

                              onUpdateTask({
                                ...task,
                                scheduledStart: sDate.toISOString(),
                                scheduledEnd: eDate.toISOString()
                              });

                              setActiveSchedulingTaskId(null);
                              setManualStartTime('');
                            }}
                            className="flex-1 py-1 theme-bg-brand text-slate-950 hover:brightness-110 rounded font-bold text-[9px] transition-all"
                          >
                            Schedule
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>

          <button
            id="btn-add-commitment-toggle"
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Add Manual Commitment
          </button>

          {/* Create Commitment Modal/Form inline */}
          {isAddingEvent && (
            <form onSubmit={handleCreateEvent} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2.5 text-xs">
              <h5 className="font-semibold text-slate-300">Add busy event</h5>
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  placeholder="Event name (e.g., Client sync)"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] uppercase text-slate-400">Start</label>
                  <input
                    type="time"
                    required
                    value={eventStart}
                    onChange={e => setEventStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] uppercase text-slate-400">End</label>
                  <input
                    type="time"
                    required
                    value={eventEnd}
                    onChange={e => setEventEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(false)}
                  className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1 theme-bg-brand text-slate-950 hover:brightness-110 rounded font-semibold text-[10px] transition-all"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Calendar Timeline Grid (3 columns) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[520px]" id="calendar-grid-card">
          {/* Grid Header */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-mono text-slate-400 uppercase tracking-widest text-[10px]">Timeline (8:00 AM - 8:00 PM)</span>
            <div className="flex items-center gap-4 text-[10px] font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
                <span className="text-slate-400">Commitments (Busy)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded theme-bg-brand-20 border theme-border-brand-30" />
                <span className="text-slate-400">AI Task Slots</span>
              </div>
            </div>
          </div>

          {/* Timeline Grid Body */}
          <div className="flex-1 overflow-y-auto relative p-4 h-full">
            {/* Hour markers row background */}
            <div className="absolute inset-x-4 inset-y-4 grid grid-rows-12 pointer-events-none border-l border-slate-800">
              {hoursRange.map((hr, idx) => (
                <div key={hr} className="border-b border-slate-800/40 relative flex items-start">
                  <span className="absolute -left-12 -top-2 text-[10px] font-mono text-slate-500 w-10 text-right">
                    {hr > 12 ? `${hr - 12} PM` : hr === 12 ? '12 PM' : `${hr} AM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Event Display Stage Overlay */}
            <div className="absolute inset-y-4 left-16 right-4 relative h-[420px] ml-4">
              {/* Render Busy Commitments */}
              {eventsOnDay.map(evt => {
                const styles = getPositionStyles(evt.start, evt.end);
                return (
                  <div
                    key={evt.id}
                    id={`cal-event-${evt.id}`}
                    style={styles}
                    className="absolute left-1/10 w-9/10 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg p-2 flex flex-col justify-center text-xs shadow-inner overflow-hidden"
                  >
                    <div className="flex items-center gap-1 text-slate-200 font-semibold truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{evt.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(evt.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - {new Date(evt.end).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {/* Render AI Scheduled Tasks */}
              {scheduledTasksOnDay.map(task => {
                const styles = getPositionStyles(task.scheduledStart!, task.scheduledEnd!);
                return (
                  <div
                    key={task.id}
                    id={`scheduled-task-block-${task.id}`}
                    style={styles}
                    className="absolute left-1/10 w-9/10 bg-slate-900 border theme-border-brand-30 theme-text-brand rounded-lg p-2 flex flex-col justify-center text-xs shadow-md overflow-hidden hover:theme-border-brand transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-100 truncate">
                        <Sparkles className="w-3.5 h-3.5 theme-text-brand flex-shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </div>
                      <span className="text-[9px] px-1 theme-bg-brand-20 theme-text-brand rounded font-mono flex-shrink-0">{task.estimatedDuration}m</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="font-mono">
                        {new Date(task.scheduledStart!).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - {new Date(task.scheduledEnd!).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => {
                          // Unschedule Task option
                          onUpdateTask({
                            ...task,
                            scheduledStart: undefined,
                            scheduledEnd: undefined
                          });
                        }}
                        className="text-[9px] hover:text-rose-400 transition-colors font-semibold"
                      >
                        Remove Slot
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Empty Placeholder overlay if completely quiet day */}
              {eventsOnDay.length === 0 && scheduledTasksOnDay.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-40 pointer-events-none">
                  <Calendar className="w-10 h-10 text-slate-600 mb-2" />
                  <span className="text-xs text-slate-400">Schedule is entirely open.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
