import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  MapPin, 
  Clock, 
  Briefcase, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight, 
  Navigation,
  Check,
  AlertCircle,
  Smartphone,
  Send,
  Zap,
  Layers
} from 'lucide-react';
import { Task, SmartNudge } from '../types';

interface ReminderNudgerProps {
  tasks: Task[];
  nudges: SmartNudge[];
  onTriggerNudge: (nudge: SmartNudge) => void;
  onAddNudge: (nudge: Omit<SmartNudge, 'id' | 'timestamp'>) => void;
  onCompleteTask: (taskId: string) => void;
  onTriggerCustomDeadlineAlert?: () => void;
}

interface FCMPushMessage {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  category: string;
  payload: any;
}

export default function ReminderNudger({
  tasks,
  nudges,
  onTriggerNudge,
  onAddNudge,
  onCompleteTask,
  onTriggerCustomDeadlineAlert
}: ReminderNudgerProps) {
  // Context Simulator States
  const [currentLocation, setCurrentLocation] = useState('Home');
  const [currentTimeSim, setCurrentTimeSim] = useState('09:00');
  const [workloadLevel, setWorkloadLevel] = useState('Normal (2 tasks)');

  // Active floating toast state
  const [activeToast, setActiveToast] = useState<SmartNudge | null>(null);

  // FCM Simulator States
  const [fcmLogs, setFcmLogs] = useState<FCMPushMessage[]>([
    {
      id: 'fcm-1',
      title: 'AURA Cloud Services Connected',
      body: 'Firebase Cloud Messaging pipeline successfully initialized.',
      timestamp: new Date().toLocaleTimeString(),
      category: 'System',
      payload: { system_status: 'online', channel: 'fcm_default' }
    }
  ]);
  const [activeFcmAlert, setActiveFcmAlert] = useState<FCMPushMessage | null>(null);
  const [customFcmTitle, setCustomFcmTitle] = useState('Workspace Task Alert');
  const [customFcmBody, setCustomFcmBody] = useState('Urgent checkup on milestone deadline!');

  const locations = ['Home', 'Office desk', 'Near Bank', 'Grocery Store', 'Gym lobby'];
  const times = ['09:00', '12:00', '14:30', '18:00', '22:00'];
  const workloads = ['Quiet (0 tasks)', 'Normal (2 tasks)', 'Heavy (5+ tasks)'];

  // Check and fire triggers when simulated context changes
  useEffect(() => {
    // Check if any active nudge matches current simulated context
    const matchingNudge = nudges.find(nudge => {
      if (!nudge.active) return false;
      
      if (nudge.triggerType === 'location' && currentLocation.toLowerCase() === nudge.triggerValue.toLowerCase()) {
        return true;
      }
      
      if (nudge.triggerType === 'time') {
        // Compare approximate hours/minutes
        const [simH, simM] = currentTimeSim.split(':');
        const [nudH, nudM] = nudge.triggerValue.split(':');
        if (simH === nudH) return true;
      }

      if (nudge.triggerType === 'workload') {
        const pendingCount = tasks.filter(t => t.status !== 'completed').length;
        if (nudge.triggerValue.includes('pending') && pendingCount >= 4 && workloadLevel.includes('Heavy')) {
          return true;
        }
      }
      
      return false;
    });

    if (matchingNudge) {
      setActiveToast(matchingNudge);
    } else {
      setActiveToast(null);
    }
  }, [currentLocation, currentTimeSim, workloadLevel, nudges, tasks]);

  const handleNudgeAction = (nudge: SmartNudge) => {
    // Execute task associated with this nudge
    if (nudge.associatedTaskId) {
      onCompleteTask(nudge.associatedTaskId);
    }
    onTriggerNudge(nudge); // mark inactive
    setActiveToast(null);
  };

  const triggerFcmNotification = (title: string, body: string, category: string, payload: any) => {
    const newMsg: FCMPushMessage = {
      id: `fcm-${Date.now()}`,
      title,
      body,
      timestamp: new Date().toLocaleTimeString(),
      category,
      payload
    };
    setFcmLogs(prev => [newMsg, ...prev]);
    setActiveFcmAlert(newMsg);
    
    // Auto clear lockscreen alert in 6 seconds
    setTimeout(() => {
      setActiveFcmAlert(current => current?.id === newMsg.id ? null : current);
    }, 6000);

    // Speak the push notification if supported
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(`AURA push alert: ${title}`);
        speech.rate = 1.05;
        window.speechSynthesis.speak(speech);
      } catch (err) {}
    }
  };

  const handleCustomFcmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFcmTitle.trim() || !customFcmBody.trim()) return;
    triggerFcmNotification(
      customFcmTitle,
      customFcmBody,
      'Custom',
      { user_defined: true, emitted_at: new Date().toISOString() }
    );
  };

  return (
    <div className="space-y-6" id="reminder-section">
      {/* Reminder Agent Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden" id="reminder-header-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/10 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="theme-bg-brand p-2.5 rounded shadow-md theme-shadow-brand-sm">
            <Bell className="w-5 h-5 text-slate-950 animate-bounce" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-semibold text-white tracking-wide uppercase text-xs">Reminder Agent</h3>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 theme-bg-brand-10 theme-text-brand rounded border theme-border-brand-30">Active</span>
            </div>
            <p className="text-sm text-slate-300 font-sans italic leading-relaxed">
              "Traditional alarms are passive and easily ignored. I monitor your dynamic geolocation, active clock, and daily mental workload, sliding reminders onto your dashboard when you are in position to act."
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="reminder-workspace">
        {/* Context Simulator Control Board */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-lg" id="context-simulator">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 theme-text-brand animate-pulse" />
              Real-time Context Simulator
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">Change contexts to simulate sensor coordinates and trigger proactive nudges.</p>
          </div>

          {/* Location sim */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 theme-text-brand" />
              Simulate Location
            </label>
            <div className="flex flex-wrap gap-1.5">
              {locations.map(loc => (
                <button
                  key={loc}
                  id={`btn-loc-${loc.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setCurrentLocation(loc)}
                  className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                    currentLocation === loc
                      ? 'theme-bg-brand-10 theme-text-brand theme-border-brand-30 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Time sim */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 theme-text-secondary" />
              Simulate Time of Day
            </label>
            <div className="flex flex-wrap gap-1.5">
              {times.map(t => (
                <button
                  key={t}
                  id={`btn-time-${t.replace(':', '-')}`}
                  onClick={() => setCurrentTimeSim(t)}
                  className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                    currentTimeSim === t
                      ? 'theme-bg-secondary-10 theme-text-secondary theme-border-brand-30 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {t > '12:00' ? `${Number(t.split(':')[0]) - 12}:${t.split(':')[1]} PM` : `${t} AM`}
                </button>
              ))}
            </div>
          </div>

          {/* Workload level sim */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 theme-text-brand" />
              Simulate Active Workload
            </label>
            <div className="flex flex-wrap gap-1.5">
              {workloads.map(wl => (
                <button
                  key={wl}
                  id={`btn-wl-${wl.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setWorkloadLevel(wl)}
                  className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                    workloadLevel === wl
                      ? 'theme-bg-brand-10 theme-text-brand theme-border-brand-30 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {wl.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {onTriggerCustomDeadlineAlert && (
            <div className="pt-3 border-t border-slate-800/80">
              <button
                type="button"
                id="btn-test-live-alarm"
                onClick={onTriggerCustomDeadlineAlert}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-rose-950/40 to-orange-950/40 border border-rose-500/30 hover:border-rose-500/60 rounded-xl text-[11px] font-bold text-rose-300 hover:text-white transition-all shadow cursor-pointer"
              >
                <Bell className="w-4 h-4 text-rose-400 animate-bounce" />
                Test Alarm Chime & Alert
              </button>
            </div>
          )}
        </div>

        {/* Smart Nudges Registry */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between" id="nudges-registry">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Smart Nudges loaded in Engine</h4>
            <p className="text-[10px] text-slate-500 mt-1">Autonomous triggers waiting to slide into notification alerts based on sensor conditions.</p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 flex-1 py-2">
            {nudges.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 border border-slate-800 border-dashed rounded-lg">
                No proactive nudges loaded. Complete habits or add tasks to load nudges.
              </div>
            ) : (
              nudges.map(n => (
                <div
                  key={n.id}
                  id={`nudge-item-${n.id}`}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 text-xs transition-all ${
                    n.active 
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700' 
                      : 'bg-slate-900/40 border-slate-800/40 opacity-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                        n.triggerType === 'location' ? 'theme-bg-brand-10 theme-text-brand theme-border-brand-30' :
                        n.triggerType === 'time' ? 'theme-bg-secondary-10 theme-text-secondary theme-border-brand-30' :
                        'theme-bg-brand-10 theme-text-brand theme-border-brand-30'
                      }`}>
                        Trigger: {n.triggerType} ({n.triggerValue})
                      </span>
                      {!n.active && (
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-800 px-1 py-0.5 rounded">
                          Triggered & Completed
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 font-sans font-medium">{n.message}</p>
                    {n.associatedTaskId && (
                      <p className="text-[10px] text-slate-400">
                        Linked Task: {tasks.find(t => t.id === n.associatedTaskId)?.title || 'Task Details'}
                      </p>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-500 font-mono">
                    {n.active ? 'Armed' : 'Triggered'}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg text-xs text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>To experience the reminder, change your simulated context above to match an armed trigger (e.g., choose <strong>Near Bank</strong>, or set workload to <strong>Heavy</strong>).</span>
          </div>
        </div>
      </div>

      {/* FIREBASE CLOUD MESSAGING (FCM) SIMULATOR SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6" id="fcm-simulator-board">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-orange-500/20 text-orange-400">
              <Layers className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100 font-sans">Firebase Cloud Messaging (FCM) Pipeline Simulator</h4>
              <p className="text-[11px] text-slate-500 font-sans">Emulate downstream Firebase Push Notifications for dynamic task deadlines, calendar meetings, or context breaches.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: FCM Signal Generator */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold">Signal Generator</span>
              <p className="text-[11px] text-slate-400">Instantly trigger simulated Firebase notifications with deep payload schema.</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => triggerFcmNotification(
                  '🚨 Task Deadline Threat!',
                  'Your high-priority task "Review Quarterly Deck" is due in 15 minutes!',
                  'Urgent',
                  { taskId: 'task-101', priorityScore: 92, action: 'open_timeline' }
                )}
                className="w-full text-left p-3 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-orange-500/30 rounded-xl flex items-center justify-between gap-2 transition-all group"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-orange-400 transition-colors">Deadline Warning Push</p>
                  <p className="text-[10px] text-slate-500">Alerts user of imminent deadline task breaches</p>
                </div>
                <Zap className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400" />
              </button>

              <button
                onClick={() => triggerFcmNotification(
                  '📅 Google Calendar Synced',
                  'Retrieved direct doctor sync checkup from Gmail API.',
                  'Calendar',
                  { eventId: 'gmail-evt-99', type: 'health', category: 'Health' }
                )}
                className="w-full text-left p-3 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-cyan-500/30 rounded-xl flex items-center justify-between gap-2 transition-all group"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">Calendar Sync Alert Push</p>
                  <p className="text-[10px] text-slate-500">Discovered Gmail Workspace appointment sync</p>
                </div>
                <Clock className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400" />
              </button>

              <button
                onClick={() => triggerFcmNotification(
                  '🔥 Streak Accomplishment!',
                  'Daily streak count increased to 6. Mindful learning habit maintained.',
                  'Habit',
                  { habitId: 'h-1', streak_count: 6, bonus_multiplier: 1.5 }
                )}
                className="w-full text-left p-3 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-emerald-500/30 rounded-xl flex items-center justify-between gap-2 transition-all group"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">Habit Coach Motivation Push</p>
                  <p className="text-[10px] text-slate-500">Encouragement for continuous streak loops</p>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400" />
              </button>
            </div>

            {/* Custom JSON form */}
            <form onSubmit={handleCustomFcmSubmit} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block border-b border-slate-900 pb-1.5">Custom Raw Payload Push</span>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono">ALERT TITLE</label>
                <input
                  type="text"
                  value={customFcmTitle}
                  onChange={(e) => setCustomFcmTitle(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Workspace Update"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono">ALERT MESSAGE BODY</label>
                <textarea
                  value={customFcmBody}
                  onChange={(e) => setCustomFcmBody(e.target.value)}
                  rows={2}
                  className="w-full text-xs bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Notification context description"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5 text-slate-950" />
                Emit FCM Push
              </button>
            </form>
          </div>

          {/* Column 2: Lock-Screen Device Mockup */}
          <div className="flex flex-col items-center justify-center">
            <div className="space-y-1 text-center mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold">FCM Device Receiver</span>
              <p className="text-[11px] text-slate-400">Lockscreen rendering of pushed notification messages</p>
            </div>

            {/* Simulated smartphone frame */}
            <div className="w-[240px] h-[400px] bg-slate-950 rounded-3xl border-4 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-3 select-none">
              {/* Notch */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-b-xl z-20" />
              
              {/* Top status bar details */}
              <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono px-1.5 pt-1.5 z-10">
                <span>08:45</span>
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <div className="w-3.5 h-1.5 border border-slate-500 rounded-sm bg-slate-400" />
                </div>
              </div>

              {/* Wallpaper backdrop with lock symbol */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-slate-950 to-slate-950 z-0 opacity-80" />

              {/* Lockscreen clock */}
              <div className="text-center mt-6 z-10 space-y-0.5">
                <span className="block font-sans text-2xl font-light text-slate-100">08:45</span>
                <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest">Monday, June 29</span>
              </div>

              {/* FCM Slide in Notification Block inside Device Frame */}
              <div className="flex-1 flex flex-col justify-start pt-6 px-1 z-10">
                <AnimatePresence mode="wait">
                  {activeFcmAlert ? (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                      className="p-2.5 bg-slate-900/95 border border-orange-500/40 rounded-xl shadow-lg space-y-1 relative"
                    >
                      <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1 text-orange-400">
                          <Smartphone className="w-2 h-2" />
                          FCM Push
                        </span>
                        <span>Now</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-200 line-clamp-1">{activeFcmAlert.title}</p>
                      <p className="text-[9px] text-slate-400 line-clamp-2 leading-tight">{activeFcmAlert.body}</p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-10 opacity-35 space-y-1">
                      <Smartphone className="w-6 h-6 text-slate-600 animate-pulse" />
                      <span className="text-[9px] font-mono text-slate-500">FCM Idle / Locked</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Slide to unlock bar */}
              <div className="z-10 text-center pb-2">
                <div className="w-16 h-1 bg-slate-700 mx-auto rounded-full mb-1.5" />
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Swipe to Unlock</span>
              </div>
            </div>
          </div>

          {/* Column 3: FCM JSON Streams console */}
          <div className="flex flex-col space-y-2">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold">Raw FCM JSON Payload Stream</span>
              <p className="text-[11px] text-slate-400 font-sans">Debug logs reflecting incoming cloud notifications.</p>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 h-[250px] overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-2.5 scrollbar-thin">
              {fcmLogs.map(log => (
                <div key={log.id} className="border-b border-slate-900 pb-2 space-y-1">
                  <div className="flex items-center justify-between text-[8px] text-slate-500">
                    <span>{log.timestamp}</span>
                    <span className="text-orange-400 bg-orange-500/10 px-1 rounded">{log.category}</span>
                  </div>
                  <pre className="text-[9px] text-emerald-300 font-mono whitespace-pre-wrap leading-tight bg-slate-900/60 p-1.5 rounded border border-slate-900">
                    {JSON.stringify({
                      messageId: log.id,
                      notification: {
                        title: log.title,
                        body: log.body
                      },
                      data: log.payload
                    }, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Smart Nudge Alert Toast (Simulated Push Notification) */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            id="smart-nudge-toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-gradient-to-r from-slate-900 to-blue-950 border border-blue-500/30 rounded-xl shadow-2xl p-4 space-y-3 overflow-hidden text-sm"
          >
            {/* Pulsing glow background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl pointer-events-none" />
            
            <div className="flex items-start gap-3">
              <div className="bg-rose-500/20 text-rose-400 p-2 rounded-lg animate-pulse">
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-rose-300 font-bold">Proactive Smart Nudge</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                </div>
                <h5 className="font-sans font-semibold text-slate-100">
                  {currentLocation === 'Near Bank' ? 'Location Trigger Activated!' : 'Context Alert Match!'}
                </h5>
                <p className="text-xs text-slate-300 font-sans leading-normal">
                  {activeToast.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                id="btn-toast-dismiss"
                onClick={() => {
                  // dismiss temp
                  setActiveToast(null);
                }}
                className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Snooze
              </button>
              <button
                type="button"
                id="btn-toast-action"
                onClick={() => handleNudgeAction(activeToast)}
                className="px-4 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-inner transition-all"
              >
                {activeToast.actionText || 'Acknowledge'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
