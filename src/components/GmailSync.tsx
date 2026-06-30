import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Sparkles, 
  Calendar, 
  Check, 
  RefreshCw, 
  LogOut, 
  AlertCircle,
  HelpCircle,
  Plus,
  Clock,
  Briefcase,
  UserCheck,
  Clipboard,
  Info,
  Layers,
  Inbox,
  Send,
  Lock
} from 'lucide-react';
import { initAuth, googleSignIn, logout } from '../lib/firebase';
import { User } from 'firebase/auth';

interface GmailSyncProps {
  onAddTask: (parsed: any) => void;
}

const SANDBOX_EMAILS = [
  {
    id: 'demo-1',
    subject: 'Action Required: Q3 Product Roadmap & Backlog Review',
    from: 'sarah.petersen@techcorp.com',
    date: 'Today, 9:00 AM',
    snippet: 'Hi team, let\'s meet tomorrow at 10:00 AM EST (standard 60 minutes) to review the Q3 product roadmap and assign owners to the priority backlog. Please bring your slides. Zoom link is attached.',
    fullBody: `Hey team,

I hope you all had a great weekend. As we transition into the new quarter, let's synchronize on the Q3 Product Roadmap and the upcoming sprint priorities.

We will meet tomorrow at 10:00 AM (EST) for 60 minutes. I've reserved a Zoom meeting and added the calendar invitation. Please review the backlog in Jira beforehand and come prepared with your team slides.

Best,
Sarah Petersen
VP of Product, TechCorp`
  },
  {
    id: 'demo-2',
    subject: 'Appointment Confirmed - Dental Cleaning & X-Rays',
    from: 'reminders@smiledentalcare.com',
    date: 'Yesterday',
    snippet: 'Hello, this is a reminder that you have a dental checkup and cleaning scheduled with Dr. Emily Watson this Friday at 2:30 PM (Duration: 45 minutes). Please arrive 10 minutes early.',
    fullBody: `Dear Patient,

This is an automated confirmation of your upcoming appointment at Smile Dental Care.

Details:
- Practitioner: Dr. Emily Watson
- Service: Annual Dental Cleaning & Preventive X-Rays
- Date: This Friday
- Time: 2:30 PM
- Expected Duration: 45 Minutes

Please reply to this email to confirm, or click here to reschedule. Please arrive 10 minutes prior to fill out any pending health insurance update forms.`
  },
  {
    id: 'demo-3',
    subject: 'Project Genesis - Client Kickoff Call',
    from: 'michael.chang@genesisventures.co',
    date: '2 days ago',
    snippet: 'Hi there, looking forward to starting our collaboration! Our kickoff meeting is set for next Monday at 1:00 PM for 30 minutes to discuss deliverables and timeline milestones.',
    fullBody: `Hello Nagarajan,

We are extremely thrilled to begin our development partnership on Project Genesis.

To keep our launch timeline aligned, let's schedule a brief 30-minute kickoff call next Monday at 1:00 PM. We will finalize product requirements, introduce key stakeholders, and define milestone dates.

Talk soon,
Michael Chang
Managing Partner, Genesis Ventures`
  },
  {
    id: 'demo-4',
    subject: 'Google Technical Interview Phase 2 - System Design',
    from: 'recruiting-team@google.com',
    date: '3 days ago',
    snippet: 'Dear candidate, we have scheduled your technical system design interview for next Wednesday at 4:00 PM (Duration: 60 minutes) on Google Meet. Please join using the link in your calendar invite.',
    fullBody: `Hello Candidate,

We are pleased to invite you to the next phase of our interview process for the Software Engineering role at Google.

This session will focus on Technical System Design and is scheduled for next Wednesday at 4:00 PM (your local time). The session will be 60 minutes long and will be conducted online via Google Meet.

Please ensure you have a stable internet connection and are in a quiet room with a working webcam.

Warm regards,
Google Recruiting Team`
  }
];

export default function GmailSync({ onAddTask }: GmailSyncProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Tab switching: 'clipboard' | 'sandbox' | 'auto'
  const [activeTab, setActiveTab] = useState<'clipboard' | 'sandbox' | 'auto'>('clipboard');
  
  // Sandbox state
  const [selectedDemoId, setSelectedDemoId] = useState<string>('demo-1');
  
  // Clipboard parser input states
  const [pastedSubject, setPastedSubject] = useState('');
  const [pastedBody, setPastedBody] = useState('');
  
  // Analytics and data state
  const [isLoading, setIsLoading] = useState(false);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [agentInsight, setAgentInsight] = useState<string>("Standby. Select a method or copy-paste text below to analyze schedule parameters with AURA.");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Listen for auth state changes on load
    const unsubscribe = initAuth(
      (currentUser, cachedToken) => {
        setUser(currentUser);
        setToken(cachedToken);
        setNeedsAuth(false);
        if (activeTab === 'auto' && cachedToken) {
          fetchGmailData(cachedToken);
        }
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, [activeTab]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn(true);
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        fetchGmailData(result.accessToken);
      }
    } catch (err: any) {
      if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        console.warn('Google login popup closed or cancelled by user.');
      } else {
        console.error('Google login failed:', err);
        setStatusMessage(
          "Access Blocked: Your account needs Google Console registration as an approved tester to perform standard scope OAuth. Please use Method A (Clipboard Parser) or Method B (Simulated Live Sandbox) below to completely bypass Google verification blocks."
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setMeetings([]);
      setAddedIds(new Set());
      setAgentInsight("Signed out of Google Workspace.");
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGmailData = async (accessToken: string) => {
    if (!accessToken) return;
    setIsLoading(true);
    setStatusMessage("Querying Google Gmail REST API for calendar invites and scheduled meetings...");
    try {
      const listUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=subject:(meeting OR appointment OR scheduled OR calendar OR zoom OR "google meet" OR "discussion" OR "call")';
      const listRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!listRes.ok) {
        throw new Error(`Gmail API returned status ${listRes.status}`);
      }
      
      const listData = await listRes.json();
      if (!listData.messages || listData.messages.length === 0) {
        setStatusMessage("No meeting-related email threads found in your primary inbox.");
        setMeetings([]);
        setIsLoading(false);
        return;
      }

      setStatusMessage(`Retrieving subject lines and body snippets for ${listData.messages.length} email headers...`);
      const emailPromises = listData.messages.slice(0, 8).map(async (msg: any) => {
        try {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const headers = detail.payload?.headers || [];
            const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
            const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
            const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
            const snippet = detail.snippet || '';
            return { id: msg.id, subject, from, date, snippet };
          }
        } catch (err) {
          console.error(`Failed to fetch message ${msg.id}:`, err);
        }
        return null;
      });

      const emailDetails = (await Promise.all(emailPromises)).filter(Boolean);
      
      setStatusMessage("AURA Cognitive agent analyzing email snippets for scheduling metrics...");
      
      const analyzeRes = await fetch('/api/gmail/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailDetails, currentTime: new Date().toISOString() })
      });

      if (analyzeRes.ok) {
        const analyzeData = await analyzeRes.json();
        setMeetings(analyzeData.meetings || []);
        setAgentInsight(analyzeData.agentInsight || "Email analysis complete.");
        setStatusMessage(null);
      } else {
        throw new Error("Backend was unable to process email parameters.");
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage(`Gmail Integration Notice: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // AI Clipboard Parser Handler
  const parseClipboardData = async () => {
    if (!pastedBody.trim()) {
      setStatusMessage("Please paste meeting request details or email content into the description box.");
      return;
    }
    
    setIsLoading(true);
    setStatusMessage("AURA Cognitive Agent reading clipboard payload and parsing schedule parameters...");
    
    try {
      const mockEmail = {
        id: 'clip-' + Date.now(),
        subject: pastedSubject.trim() || 'Manual Import Invite',
        from: 'Copied Content',
        date: new Date().toISOString(),
        snippet: pastedBody.trim()
      };

      const analyzeRes = await fetch('/api/gmail/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: [mockEmail], currentTime: new Date().toISOString() })
      });

      if (analyzeRes.ok) {
        const analyzeData = await analyzeRes.json();
        const extracted = analyzeData.meetings || [];
        
        if (extracted.length === 0) {
          setStatusMessage("No scheduled meetings could be parsed from the pasted content. Try copying a clear subject and date context.");
        } else {
          setMeetings(prev => {
            const filtered = prev.filter(m => m.emailSourceId !== mockEmail.id);
            return [...extracted, ...filtered];
          });
          setAgentInsight(analyzeData.agentInsight || "Meeting details parsed successfully!");
          setStatusMessage(null);
          setPastedSubject("");
          setPastedBody("");
        }
      } else {
        throw new Error("Actionable cognitive breakdown failed.");
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage(`AI Clipboard Parsing Failure: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sandbox Email Analyzer
  const analyzeSandboxEmail = async () => {
    const demoEmail = SANDBOX_EMAILS.find(e => e.id === selectedDemoId);
    if (!demoEmail) return;

    setIsLoading(true);
    setStatusMessage(`AURA scanning sandbox email: "${demoEmail.subject}"...`);

    try {
      const mockEmail = {
        id: demoEmail.id,
        subject: demoEmail.subject,
        from: demoEmail.from,
        date: new Date().toISOString(),
        snippet: demoEmail.fullBody
      };

      const analyzeRes = await fetch('/api/gmail/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: [mockEmail], currentTime: new Date().toISOString() })
      });

      if (analyzeRes.ok) {
        const analyzeData = await analyzeRes.json();
        const extracted = analyzeData.meetings || [];

        setMeetings(prev => {
          const filtered = prev.filter(m => m.emailSourceId !== mockEmail.id);
          return [...extracted, ...filtered];
        });
        setAgentInsight(analyzeData.agentInsight || "Sandbox email parsed onto timeline successfully!");
        setStatusMessage(null);
      } else {
        throw new Error("Actionable sandbox simulation analysis failed.");
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage(`Sandbox Parsing Failure: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncMeetingToTask = (meeting: any) => {
    onAddTask({
      title: meeting.title,
      description: meeting.description,
      category: meeting.category || 'Work',
      dueDate: meeting.dueDate,
      estimatedDuration: meeting.estimatedDuration || 30,
      priorityLevel: meeting.priorityLevel || 'medium'
    });

    setAddedIds(prev => {
      const next = new Set(prev);
      next.add(meeting.emailSourceId);
      return next;
    });

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(`Synchronized ${meeting.title} to your timeline grid.`);
        speech.rate = 1.05;
        window.speechSynthesis.speak(speech);
      } catch (err) {}
    }
  };

  const handleSyncAllMeetings = () => {
    const unadded = meetings.filter(m => !addedIds.has(m.emailSourceId));
    if (unadded.length === 0) return;

    unadded.forEach(m => handleSyncMeetingToTask(m));

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(`Synchronized all ${unadded.length} meetings into timeline!`);
        speech.rate = 1.05;
        window.speechSynthesis.speak(speech);
      } catch (err) {}
    }
  };

  const selectedDemoEmail = SANDBOX_EMAILS.find(e => e.id === selectedDemoId) || SANDBOX_EMAILS[0];

  return (
    <div className="space-y-6" id="gmail-sync-section">
      {/* High-Tech Intro Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden" id="gmail-sync-header">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="theme-bg-brand p-2.5 rounded shadow-md theme-shadow-brand-sm">
              <Mail className="w-5 h-5 text-slate-950" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-semibold text-white tracking-wide uppercase text-xs">AURA Workspace Portal</h3>
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                  activeTab === 'clipboard' 
                    ? 'bg-slate-950 text-cyan-400 border-cyan-900/50' 
                    : activeTab === 'sandbox'
                      ? 'bg-slate-950 text-emerald-400 border-emerald-900/50'
                      : needsAuth 
                        ? 'bg-slate-950 text-slate-500 border-slate-800' 
                        : 'theme-bg-brand-10 theme-text-brand theme-border-brand-30'
                }`}>
                  {activeTab === 'clipboard' ? 'AI CLIPBOARD' : activeTab === 'sandbox' ? 'SANDBOX ACTIVE' : needsAuth ? 'Disconnected' : 'Connected'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Synchronize external invites, commitments, and calendar emails. Use the Sandbox or Clipboard Parser to fully bypass verification limits.
              </p>
            </div>
          </div>

          {!needsAuth && user && activeTab === 'auto' && (
            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-200">{user.displayName || 'Google User'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg transition-all"
                title="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* High-fidelity Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-thin gap-1" id="workspace-import-tabs">
        <button
          onClick={() => { setActiveTab('clipboard'); setStatusMessage(null); }}
          className={`px-4 py-2 text-xs font-semibold transition-all relative flex-shrink-0 ${
            activeTab === 'clipboard' 
              ? 'text-cyan-400 border-b-2 border-cyan-500' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clipboard className="w-3.5 h-3.5" />
            Method A: AI Clipboard Parser
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('sandbox'); setStatusMessage(null); }}
          className={`px-4 py-2 text-xs font-semibold transition-all relative flex-shrink-0 ${
            activeTab === 'sandbox' 
              ? 'text-cyan-400 border-b-2 border-cyan-500' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5 font-bold">
            <Inbox className="w-3.5 h-3.5 text-emerald-400" />
            Method B: Interactive Sandbox Mailbox
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('auto'); setStatusMessage(null); }}
          className={`px-4 py-2 text-xs font-semibold transition-all relative flex-shrink-0 ${
            activeTab === 'auto' 
              ? 'text-cyan-400 border-b-2 border-cyan-500' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            Method C: Real Gmail Scanner (Requires approved Google testers)
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workspace Portal Left/Main view */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          
          {/* Method A: Clipboard Parser Form */}
          {activeTab === 'clipboard' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl" id="clipboard-import-portal">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-semibold uppercase text-cyan-400 font-mono tracking-wider flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4" /> Import invite or email headers
                </h4>
                <span className="text-[10px] text-slate-500 italic flex items-center gap-1">
                  <Info className="w-3 h-3" /> Copy meeting text from Outlook, Slack, or Gmail
                </span>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">Email Subject / Title (Optional)</label>
                  <input
                    type="text"
                    value={pastedSubject}
                    onChange={(e) => setPastedSubject(e.target.value)}
                    placeholder="e.g., Weekly Milestone Sync, Dr. Larson Appointment"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-xs outline-none transition-all font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">Email Snippet / Conversation / Invite Content</label>
                  <textarea
                    rows={4}
                    value={pastedBody}
                    onChange={(e) => setPastedBody(e.target.value)}
                    placeholder="Paste meeting details here... e.g.:&#10;Hey, let's connect this Wednesday at 3:00 PM to talk about marketing goals on Zoom."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100 placeholder-slate-600 rounded-lg p-3 text-xs outline-none transition-all resize-none font-sans"
                  />
                </div>

                <button
                  onClick={parseClipboardData}
                  disabled={isLoading || !pastedBody.trim()}
                  className="w-full py-2.5 rounded-lg font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Analyze with AURA Cognitive Agent</span>
                </button>
              </div>
            </div>
          )}

          {/* Method B: Live Sandbox Email Simulator */}
          {activeTab === 'sandbox' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4" id="sandbox-import-portal">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-semibold uppercase text-emerald-400 font-mono tracking-wider flex items-center gap-1.5">
                  <Inbox className="w-4 h-4" /> Sandbox Live Mail Simulator
                </h4>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Bypasses verification, fully testable
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Email Sidebar selection list */}
                <div className="md:col-span-1 border-r border-slate-800/80 pr-2 space-y-2 max-h-[280px] overflow-y-auto">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-1 mb-1.5">Simulated Inbox</p>
                  {SANDBOX_EMAILS.map((email) => (
                    <button
                      key={email.id}
                      onClick={() => setSelectedDemoId(email.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-all space-y-1 block border ${
                        selectedDemoId === email.id
                          ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
                          : 'hover:bg-slate-850 border-transparent text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate max-w-[85px] block text-slate-200">{email.from.split('@')[0]}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{email.date}</span>
                      </div>
                      <p className="font-medium truncate text-[11px]">{email.subject}</p>
                    </button>
                  ))}
                </div>

                {/* Email body reader view */}
                <div className="md:col-span-2 flex flex-col justify-between space-y-3 pl-1">
                  <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-850 space-y-2 flex-1 min-h-[160px]">
                    <div className="border-b border-slate-900 pb-2 space-y-1">
                      <p className="text-[11px] text-slate-400 font-sans">
                        <strong className="text-slate-300 font-mono text-[10px] uppercase">From:</strong> {selectedDemoEmail.from}
                      </p>
                      <p className="text-[11px] text-slate-400 font-sans">
                        <strong className="text-slate-300 font-mono text-[10px] uppercase">Subject:</strong> {selectedDemoEmail.subject}
                      </p>
                    </div>
                    <pre className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line max-h-[140px] overflow-y-auto pt-1">
                      {selectedDemoEmail.fullBody}
                    </pre>
                  </div>

                  <button
                    onClick={analyzeSandboxEmail}
                    disabled={isLoading}
                    className="w-full py-2 rounded-lg font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    )}
                    <span>Run AURA Scanner on Selected Email</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Method C: Auto Scanner */}
          {activeTab === 'auto' && needsAuth && (
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center space-y-6" id="gmail-auth-portal">
              <div className="w-14 h-14 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-800 relative">
                <Lock className="w-6 h-6 text-slate-500" />
                <AlertCircle className="w-4.5 h-4.5 text-amber-500 absolute -top-1 -right-1" />
              </div>

              <div className="space-y-2 max-w-md text-center">
                <h4 className="text-sm font-semibold text-slate-200">Connect Google Gmail (Requires Approved Tester)</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gmail read-only access is a Google **Restricted Scope**. Because this application is in development, Google blocks personal accounts unless they are explicitly whitelisted as developer testers.
                </p>
                
                {/* Developer Instructions Card */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-left space-y-3 mt-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] text-amber-400 font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Google Cloud Console Quick Fix
                    </span>
                    <a 
                      href="https://console.cloud.google.com/apis/credentials/consent?project=gemini-agent-499108"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
                    >
                      Open Google Console ↗
                    </a>
                  </div>
                  
                  <div className="space-y-2 leading-relaxed text-slate-300 text-[11px]">
                    <p>
                      <strong>Step 1:</strong> Click the link above to open your project <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-400">gemini-agent-499108</code> consent settings.
                    </p>
                    <p>
                      <strong>Step 2:</strong> Scroll down to the <strong>Test users</strong> list, click <strong>Add Users</strong>, and whitelist your developer/tester emails:
                    </p>
                    
                    <div className="flex flex-col gap-1.5 bg-slate-950 p-2 rounded border border-slate-850">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400">nagarajan1320@gmail.com</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText('nagarajan1320@gmail.com');
                            alert('Copied nagarajan1320@gmail.com to clipboard!');
                          }}
                          className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400">raghu13219@gmail.com</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText('raghu13219@gmail.com');
                            alert('Copied raghu13219@gmail.com to clipboard!');
                          }}
                          className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-slate-400 text-[10px]">
                      <em>Alternative:</em> Click <strong>Publish App</strong> on that page to move it to Production status. This completely removes the restricted user cap!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850 text-left space-y-1">
                  <span className="text-[10px] text-cyan-400 font-mono font-semibold uppercase tracking-wider block">💡 No-Login Fallback</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    You can still fully test the system right now! Click **Method A (AI Clipboard Parser)** or **Method B (Interactive Sandbox)** above to schedule emails immediately without any login required.
                  </p>
                </div>
              </div>

              {/* Styled GSI button */}
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button flex items-center justify-center gap-2 cursor-pointer bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold py-2.5 px-5 rounded-lg transition-all duration-200 shadow hover:shadow-md disabled:opacity-50"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                <span>Sign in with Google Workspace</span>
              </button>
            </div>
          )}

          {/* Results Discovered Calendar/Meeting Deck */}
          {(activeTab !== 'auto' || !needsAuth) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col min-h-[300px] shadow-xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-100">Discovered / Parsed Meetings</h3>
                </div>

                <div className="flex items-center gap-2">
                  {meetings.length > 0 && (
                    <button
                      onClick={handleSyncAllMeetings}
                      disabled={meetings.filter(m => !addedIds.has(m.emailSourceId)).length === 0}
                      className="px-2.5 py-1 text-[10px] font-bold bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Sync All ({meetings.filter(m => !addedIds.has(m.emailSourceId)).length})
                    </button>
                  )}
                  {activeTab === 'auto' && !needsAuth && (
                    <button
                      onClick={() => fetchGmailData(token || '')}
                      disabled={isLoading}
                      className="p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-lg transition-all"
                      title="Reload Gmail mailbox"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Status or loading logs */}
              {statusMessage && (
                <div className="flex gap-2.5 bg-slate-950 border border-slate-850 rounded-xl p-3 mb-4">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] text-slate-400 font-sans">{statusMessage}</span>
                </div>
              )}

              {/* List deck */}
              <div className="flex-1 space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {meetings.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500 space-y-2">
                    <HelpCircle className="w-8 h-8 opacity-40 text-slate-600" />
                    <p className="text-xs font-semibold text-slate-400">No Meetings Discovered Yet</p>
                    <p className="text-[10px] text-slate-500 px-6 max-w-sm">
                      {activeTab === 'clipboard' 
                        ? "Paste any calendar invite or meeting email above and AURA's cognitive engine will extract it." 
                        : activeTab === 'sandbox'
                          ? "Select an inbox email on the left, then click 'Run AURA Scanner' to trigger the neural scheduler demo."
                          : "Query your Gmail inbox using the Refresh button above to look for scheduled invitations."}
                    </p>
                  </div>
                ) : (
                  meetings.map((meeting, index) => {
                    const isAdded = addedIds.has(meeting.emailSourceId);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl flex items-start justify-between gap-4 transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-200 text-xs truncate max-w-[200px] sm:max-w-xs">{meeting.title}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                              meeting.category === 'Health' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                              meeting.category === 'Urgent' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                              'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                            }`}>
                              {meeting.category}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                              meeting.priorityLevel === 'high' ? 'bg-rose-500/10 text-rose-400' :
                              meeting.priorityLevel === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {meeting.priorityLevel} priority
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">{meeting.description}</p>

                          {/* Date/Time and metadata details */}
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(meeting.dueDate).toLocaleString(undefined, { 
                                dateStyle: 'short', 
                                timeStyle: 'short' 
                              })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-slate-500" />
                              {meeting.estimatedDuration} mins
                            </span>
                          </div>
                        </div>

                        {/* Action sync button */}
                        <button
                          onClick={() => handleSyncMeetingToTask(meeting)}
                          disabled={isAdded}
                          className={`flex-shrink-0 p-2.5 rounded-lg border transition-all ${
                            isAdded
                              ? 'bg-slate-900 border-slate-850 text-emerald-500'
                              : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-cyan-400'
                          }`}
                          title={isAdded ? "Added to Timeline Grid" : "Synchronize to Scheduler"}
                        >
                          {isAdded ? <UserCheck className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Cognitive Sidebar Insights */}
        <div className="flex flex-col space-y-4">
          
          {/* AURA Cog Deck */}
          <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <div className="p-1 rounded bg-cyan-500/20 text-cyan-400 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 font-display">AURA Cog-Scheduler</h4>
                <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Neural workspace analyzer</p>
              </div>
            </div>

            <div className="space-y-3 leading-relaxed text-xs text-slate-400 font-sans">
              <p className="italic text-slate-300">"{agentInsight}"</p>
              
              <div className="pt-2.5 border-t border-slate-800/80 space-y-2 text-[11px]">
                <p className="text-slate-400">
                  {activeTab === 'clipboard' 
                    ? "Our custom clipboard parser bypasses OAuth restrictions entirely, feeding parsed email structures straight into the Gemini scheduling agent."
                    : activeTab === 'sandbox'
                      ? "Play with realistic scheduling examples in the interactive live mailbox to test neural priority parsing instantly."
                      : "AURA's scanner monitors subjects and body snippets dynamically within Gmail inbox logs, aligning schedules instantly."
                  }
                </p>
                <p className="text-slate-400">
                  Adding meetings from here resolves them on the prioritization queue and immediately schedules them on the main dynamic timeline!
                </p>
              </div>
            </div>
          </div>

          {/* Quick Helper Tips */}
          <div className="bg-slate-900/60 border border-slate-900/80 rounded-xl p-4 text-[11px] text-slate-500 leading-normal font-sans">
            <span className="font-semibold text-slate-400 block mb-1">💡 Workspace Guide</span>
            {activeTab === 'clipboard' 
              ? "Pasted meetings will be processed and matched chronologically relative to your current local time."
              : activeTab === 'sandbox'
                ? "Simulate parsing high-fidelity messages instantly without any Google login popup restrictions."
                : "The Gmail analyzer extracts priorities, lengths, and logical due dates relative to your local time."
            }
          </div>

        </div>
      </div>
    </div>
  );
}
