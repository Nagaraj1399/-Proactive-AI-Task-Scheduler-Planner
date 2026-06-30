import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  MessageSquare, 
  Check, 
  CheckCheck, 
  User, 
  Bot, 
  Calendar, 
  Sparkles, 
  AlertCircle,
  Plus,
  Volume2,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Flame,
  Mail,
  Bell,
  Smartphone,
  Settings,
  X,
  Play,
  Pause,
  Key
} from 'lucide-react';
import { Task } from '../types';

interface WhatsAppSimulatorProps {
  onAddTask: (parsed: any) => void;
}

interface WhatsAppMessage {
  id: string;
  sender: 'user' | 'aura';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  extractedTask?: {
    title: string;
    description: string;
    category: string;
    dueDate: string;
    estimatedDuration: number;
    priorityLevel: 'high' | 'medium' | 'low';
  } | null;
  hasAudio?: boolean;
  audioDuration?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  avatar: React.ReactNode;
  subtitle: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  onlineStatus: string;
}

export default function WhatsAppSimulator({ onAddTask }: WhatsAppSimulatorProps) {
  // Configured target credentials (stored locally)
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('wa-phone-number') || '');
  const [twilioSid, setTwilioSid] = useState(() => localStorage.getItem('wa-twilio-sid') || '');
  const [twilioToken, setTwilioToken] = useState(() => localStorage.getItem('wa-twilio-token') || '');
  const [twilioSender, setTwilioSender] = useState(() => localStorage.getItem('wa-twilio-sender') || '+14155238886');
  const [provider, setProvider] = useState<'twilio' | 'callmebot' | 'cloudapi'>(() => (localStorage.getItem('wa-provider') as any) || 'callmebot');
  const [callmebotApikey, setCallmebotApikey] = useState(() => localStorage.getItem('wa-callmebot-apikey') || '');
  const [callmebotPhone, setCallmebotPhone] = useState(() => localStorage.getItem('wa-callmebot-phone') || '');
  const [cloudApiToken, setCloudApiToken] = useState(() => localStorage.getItem('wa-cloud-api-token') || '');
  const [cloudApiPhoneId, setCloudApiPhoneId] = useState(() => localStorage.getItem('wa-cloud-api-phone-id') || '');
  const [cloudApiWabaId, setCloudApiWabaId] = useState(() => localStorage.getItem('wa-cloud-api-waba-id') || '');
  const [cloudApiRecipient, setCloudApiRecipient] = useState(() => localStorage.getItem('wa-cloud-api-recipient') || '');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // WhatsApp Web QR Sync States
  const [isQrConnected, setIsQrConnected] = useState(() => localStorage.getItem('wa-qr-connected') === 'true');
  const [qrPhone, setQrPhone] = useState(() => localStorage.getItem('wa-qr-phone') || '+1 (555) 019-2834');
  const [qrActiveTab, setQrActiveTab] = useState<'qr' | 'api'>(() => localStorage.getItem('wa-qr-connected') === 'true' ? 'api' : 'qr');
  const [qrLoadingProgress, setQrLoadingProgress] = useState(0);
  const [qrIsScanning, setQrIsScanning] = useState(false);

  // Helper to send outbound notifications to real device
  const sendRealWhatsApp = async (bodyText: string) => {
    // 1. Dispatch real-time native browser desktop notification if permission is allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("AURA WA Web (Linked)", {
          body: bodyText.replace(/\*/g, ''), // Strip markdown formatting for native popups
          icon: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
          tag: 'aura-notification-' + Date.now()
        });
      } catch (err) {
        console.warn("Desktop Notification Dispatch error:", err);
      }
    }

    // 2. Dispatch to server if outbound API keys are defined
    try {
      const payload: any = { body: bodyText };
      let hasKeys = false;

      payload.provider = provider;
      if (provider === 'cloudapi') {
        const activeRecipient = cloudApiRecipient || phoneNumber;
        if (activeRecipient && cloudApiToken && cloudApiPhoneId) {
          payload.to = activeRecipient;
          payload.cloudApiToken = cloudApiToken;
          payload.cloudApiPhoneId = cloudApiPhoneId;
          hasKeys = true;
        }
      } else if (provider === 'callmebot') {
        const activePhone = callmebotPhone || phoneNumber;
        if (activePhone && callmebotApikey) {
          payload.useCallmebot = true;
          payload.callmebotPhone = activePhone;
          payload.callmebotApikey = callmebotApikey;
          hasKeys = true;
        }
      } else {
        if (phoneNumber && twilioSid && twilioToken) {
          payload.to = phoneNumber;
          payload.twilioSid = twilioSid;
          payload.twilioToken = twilioToken;
          payload.twilioSender = twilioSender;
          hasKeys = true;
        }
      }

      if (!hasKeys) {
        console.log("No real-time outbound API credentials defined. Notification dispatched locally to browser sandbox.");
        return;
      }

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log("Real WhatsApp API dispatch response:", data);
    } catch (e) {
      console.error("Failed to trigger real WhatsApp webhook:", e);
    }
  };

  // Active chat session
  const [activeChannelId, setActiveChannelId] = useState('aura-ai');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioRecording, setAudioRecording] = useState(false);
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Audio note playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Store thread conversations for each channel
  const [channelConversations, setChannelConversations] = useState<Record<string, WhatsAppMessage[]>>({
    'aura-ai': [
      {
        id: 'wa-init-1',
        sender: 'aura',
        text: '💚 Welcome to the AURA WhatsApp Gateway! I am your AI agent. You can text me naturally here to outline schedules, write todos, or ask productivity questions.',
        timestamp: '09:05 AM',
        status: 'read'
      },
      {
        id: 'wa-init-2',
        sender: 'aura',
        text: 'Try telling me: "remind me to prepare presentation slides tomorrow at 4 PM" and watch me generate a syncable task card!',
        timestamp: '09:06 AM',
        status: 'read'
      }
    ],
    'system-alerts': [
      {
        id: 'wa-sys-1',
        sender: 'aura',
        text: '🚨 *AURA SYSTEM BOOT*: Production database securely synced with Cloud Firestore. All background triggers running.',
        timestamp: '08:00 AM',
        status: 'read'
      },
      {
        id: 'wa-sys-2',
        sender: 'aura',
        text: '🔔 *AUTOMATED REMINDER*: Your task *Review financial budget report* has high workload score (92) and is due soon. Click below to add a focus session on your calendar.',
        timestamp: '10:15 AM',
        status: 'read',
        extractedTask: {
          title: "Focus: Financial Budget Report",
          description: "Dedicated block to review budget details and finish active work.",
          category: "Finance",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          estimatedDuration: 45,
          priorityLevel: "high"
        }
      }
    ],
    'habit-bot': [
      {
        id: 'wa-hab-1',
        sender: 'aura',
        text: '🔥 *STREAK RADAR*: Your Workout Routine habit has reached a *6-day streak*! Keep the loop alive today.',
        timestamp: '07:30 AM',
        status: 'read'
      },
      {
        id: 'wa-hab-2',
        sender: 'aura',
        text: '🏃‍♂️ GPS matching near *Gym lobby*. Simulated environmental nudge: Would you like to check off your daily workout now?',
        timestamp: '07:31 AM',
        status: 'read',
        extractedTask: {
          title: "Habit: Workout Routine",
          description: "Fulfill daily exercise routine to preserve streaks.",
          category: "Health",
          dueDate: new Date().toISOString(),
          estimatedDuration: 60,
          priorityLevel: "medium"
        }
      }
    ],
    'gmail-monitor': [
      {
        id: 'wa-gm-1',
        sender: 'aura',
        text: '📬 *GMAIL RADAR*: Analyzing primary inbox. Discovered meeting confirmation from *Dr. Larson* regarding checkup.',
        timestamp: 'Yesterday',
        status: 'read'
      },
      {
        id: 'wa-gm-2',
        sender: 'aura',
        text: '🤝 *MEETING DISCOVERED*: Cognitive analysis confirms "Dr. Larson Checkup Consult" scheduled for this Thursday.',
        timestamp: 'Yesterday',
        status: 'read',
        extractedTask: {
          title: "Dr. Larson Consultation",
          description: "Medical consultation synced dynamically from Gmail confirmation headers.",
          category: "Health",
          dueDate: new Date(Date.now() + 172800000).toISOString(),
          estimatedDuration: 30,
          priorityLevel: "medium"
        }
      }
    ]
  });

  // Sidebar Channels definitions
  const channels: ChatChannel[] = [
    {
      id: 'aura-ai',
      name: 'AURA AI Core',
      avatar: <Bot className="w-5 h-5 text-emerald-400" />,
      subtitle: 'online & monitoring',
      lastMessage: channelConversations['aura-ai']?.[channelConversations['aura-ai'].length - 1]?.text || 'No messages',
      time: channelConversations['aura-ai']?.[channelConversations['aura-ai'].length - 1]?.timestamp || '09:05 AM',
      unreadCount: 0,
      onlineStatus: 'Online'
    },
    {
      id: 'system-alerts',
      name: 'AURA System Alerts',
      avatar: <Bell className="w-5 h-5 text-cyan-400" />,
      subtitle: 'Alerts active',
      lastMessage: channelConversations['system-alerts']?.[channelConversations['system-alerts'].length - 1]?.text || 'No messages',
      time: channelConversations['system-alerts']?.[channelConversations['system-alerts'].length - 1]?.timestamp || '10:15 AM',
      unreadCount: 1,
      onlineStatus: 'Active'
    },
    {
      id: 'habit-bot',
      name: 'Habit Consistency Bot',
      avatar: <Flame className="w-5 h-5 text-amber-500" />,
      subtitle: 'Streaks tracking',
      lastMessage: channelConversations['habit-bot']?.[channelConversations['habit-bot'].length - 1]?.text || 'No messages',
      time: channelConversations['habit-bot']?.[channelConversations['habit-bot'].length - 1]?.timestamp || '07:31 AM',
      unreadCount: 0,
      onlineStatus: 'Standby'
    },
    {
      id: 'gmail-monitor',
      name: 'Gmail Workspace Monitor',
      avatar: <Mail className="w-5 h-5 text-violet-400" />,
      subtitle: 'Inbox scanning active',
      lastMessage: channelConversations['gmail-monitor']?.[channelConversations['gmail-monitor'].length - 1]?.text || 'No messages',
      time: channelConversations['gmail-monitor']?.[channelConversations['gmail-monitor'].length - 1]?.timestamp || 'Yesterday',
      unreadCount: 0,
      onlineStatus: 'Scanning'
    }
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelConversations, activeChannelId, isLoading]);

  const handleSimulateQrScan = () => {
    setQrIsScanning(true);
    setQrLoadingProgress(10);
    
    const interval = setInterval(() => {
      setQrLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsQrConnected(true);
          setQrIsScanning(false);
          localStorage.setItem('wa-qr-connected', 'true');
          localStorage.setItem('wa-qr-phone', qrPhone);
          
          // Request browser notification permission for authentic real-time background notification feedback
          if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                try {
                  new Notification("AURA WA Web (Linked)", {
                    body: `Session successfully initialized with device ${qrPhone}! Background sync is active.`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/733/733585.png'
                  });
                } catch (e) {}
              }
            });
          }

          if ('speechSynthesis' in window) {
            try {
              window.speechSynthesis.cancel();
              const speech = new SpeechSynthesisUtterance("WhatsApp Web connection established! All session caches initialized.");
              speech.rate = 1.05;
              window.speechSynthesis.speak(speech);
            } catch (e) {}
          }
          return 100;
        }
        return prev + 15;
      });
    }, 250);
  };

  const handleDisconnectQr = () => {
    setIsQrConnected(false);
    setQrLoadingProgress(0);
    localStorage.removeItem('wa-qr-connected');
    
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance("WhatsApp Web logged out.");
        speech.rate = 1.05;
        window.speechSynthesis.speak(speech);
      } catch (e) {}
    }
  };

  const handleCompleteTask = (msgId: string) => {
    setChannelConversations(prev => {
      const activeConvo = prev[activeChannelId] || [];
      const updatedConvo = activeConvo.map(msg => {
        if (msg.id === msgId && msg.extractedTask) {
          return {
            ...msg,
            extractedTask: {
              ...msg.extractedTask,
              isCompleted: true
            }
          };
        }
        return msg;
      });
      return { ...prev, [activeChannelId]: updatedConvo };
    });

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance("Action complete! Task marked as done.");
        speech.rate = 1.05;
        window.speechSynthesis.speak(speech);
      } catch (e) {}
    }
  };

  const handleSnoozeTask = (msgId: string, minutes: number = 30) => {
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChannelConversations(prev => {
      const activeConvo = prev[activeChannelId] || [];
      const updatedConvo = activeConvo.map(msg => {
        if (msg.id === msgId && msg.extractedTask) {
          return {
            ...msg,
            extractedTask: {
              ...msg.extractedTask,
              snoozedUntil: snoozeTime
            }
          };
        }
        return msg;
      });
      return { ...prev, [activeChannelId]: updatedConvo };
    });

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(`Reminder snoozed for ${minutes} minutes. New alert scheduled at ${snoozeTime}.`);
        speech.rate = 1.05;
        window.speechSynthesis.speak(speech);
      } catch (e) {}
    }
  };

  const handleRescheduleTask = (msgId: string, days: number = 1) => {
    const newDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    setChannelConversations(prev => {
      const activeConvo = prev[activeChannelId] || [];
      const updatedConvo = activeConvo.map(msg => {
        if (msg.id === msgId && msg.extractedTask) {
          return {
            ...msg,
            extractedTask: {
              ...msg.extractedTask,
              dueDate: newDate
            }
          };
        }
        return msg;
      });
      return { ...prev, [activeChannelId]: updatedConvo };
    });

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(`Task rescheduled for ${days === 1 ? 'tomorrow' : 'next week'}.`);
        speech.rate = 1.05;
        window.speechSynthesis.speak(speech);
      } catch (e) {}
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('wa-provider', provider);
    localStorage.setItem('wa-phone-number', phoneNumber);
    localStorage.setItem('wa-twilio-sid', twilioSid);
    localStorage.setItem('wa-twilio-token', twilioToken);
    localStorage.setItem('wa-twilio-sender', twilioSender);
    localStorage.setItem('wa-callmebot-apikey', callmebotApikey);
    localStorage.setItem('wa-callmebot-phone', callmebotPhone);
    localStorage.setItem('wa-cloud-api-token', cloudApiToken);
    localStorage.setItem('wa-cloud-api-phone-id', cloudApiPhoneId);
    localStorage.setItem('wa-cloud-api-waba-id', cloudApiWabaId);
    localStorage.setItem('wa-cloud-api-recipient', cloudApiRecipient);
    setConfigSuccess(true);
    setTimeout(() => {
      setConfigSuccess(false);
      setIsConfigOpen(false);
    }, 1500);
  };

  const handleSendMessage = async (textToSend: string, isAudio = false) => {
    if (!textToSend.trim()) return;

    const userMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      hasAudio: isAudio,
      audioDuration: isAudio ? '0:06' : undefined
    };

    // Update active conversation
    setChannelConversations(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), userMsg]
    }));

    setInputText('');
    setIsLoading(true);

    try {
      // 1. Hit our local cognitive AI parser endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceInput: textToSend })
      });

      if (response.ok) {
        const data = await response.json();
        
        const auraMsg: WhatsAppMessage = {
          id: `msg-aura-${Date.now()}`,
          sender: 'aura',
          text: data.chatResponse || "Cognitive parameters processed successfully.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
          extractedTask: data.extractedTask || null
        };

        setChannelConversations(prev => ({
          ...prev,
          [activeChannelId]: [...(prev[activeChannelId] || []), auraMsg]
        }));

        // Send a REAL WhatsApp notification!
        const taskAddition = auraMsg.extractedTask 
          ? `\n\nTask Discovered:\n📌 ${auraMsg.extractedTask.title}\nDue: ${new Date(auraMsg.extractedTask.dueDate).toLocaleDateString()}\nPriority: ${auraMsg.extractedTask.priorityLevel.toUpperCase()}`
          : '';
        sendRealWhatsApp(`${auraMsg.text}${taskAddition}`);

        // Voice output
        if ('speechSynthesis' in window && auraMsg.text) {
          try {
            window.speechSynthesis.cancel();
            const speech = new SpeechSynthesisUtterance(auraMsg.text);
            speech.rate = 1.05;
            window.speechSynthesis.speak(speech);
          } catch (e) {}
        }
      } else {
        throw new Error("Local processing failure");
      }
    } catch (error) {
      console.error(error);
      const errorMsg: WhatsAppMessage = {
        id: `msg-error-${Date.now()}`,
        sender: 'aura',
        text: "Gateway synced. Processing query offline using localized context...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };
      setChannelConversations(prev => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), errorMsg]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleSendMessage(inputText);
  };

  const triggerVoiceNote = () => {
    setAudioRecording(true);
    setTimeout(() => {
      setAudioRecording(false);
      handleSendMessage("Schedule dentist teeth checkup for this Thursday afternoon at 4 PM", true);
    }, 2000);
  };

  const handleSyncTask = (msgId: string, task: any) => {
    onAddTask(task);
    setSyncedIds(prev => {
      const next = new Set(prev);
      next.add(msgId);
      return next;
    });

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(`Task "${task.title}" scheduled successfully.`);
        speech.rate = 1.05;
        window.speechSynthesis.speak(speech);
      } catch (err) {}
    }
  };

  const triggerMockReminderPush = (channelId: string, title: string, body: string, taskParams: any) => {
    const pushMsg: WhatsAppMessage = {
      id: `msg-push-${Date.now()}`,
      sender: 'aura',
      text: body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      extractedTask: taskParams
    };

    setChannelConversations(prev => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), pushMsg]
    }));

    // Trigger real outbound notification if credentials are active
    const taskAddition = taskParams 
      ? `\n\n📌 Task: ${taskParams.title}\nDue: ${new Date(taskParams.dueDate).toLocaleDateString()}\nPriority: ${taskParams.priorityLevel.toUpperCase()}`
      : '';
    sendRealWhatsApp(`${body}${taskAddition}`);

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(`AURA WhatsApp: ${title}`);
        speech.rate = 1.05;
        window.speechSynthesis.speak(speech);
      } catch (e) {}
    }
  };

  const activeMessages = channelConversations[activeChannelId] || [];
  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="whatsapp-simulator-root">
      {/* Intro Header banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden" id="wa-info-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-lg shadow-md flex-shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-white tracking-wide uppercase text-xs">WhatsApp Real Sync & Simulator</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">REST API Gateway Ready</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Experience a full-fidelity WhatsApp Web clone. Switch channels, test smart scheduling triggers, or input your **real credentials** to send notifications directly to your actual mobile device.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-sans font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md self-start md:self-center"
          >
            <Key className="w-3.5 h-3.5 text-slate-950" />
            Link Real WhatsApp API
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main WhatsApp Web Mock Container (Covers 3 columns in XL, full width in mobile) */}
        <div className="xl:col-span-3 bg-[#111b21] rounded-2xl border border-slate-800 h-[650px] flex overflow-hidden shadow-2xl relative" id="whatsapp-web-frame">
          
          {/* 1. Left Contact Sidebar */}
          <div className="w-80 border-r border-[#222e35] flex flex-col bg-[#111b21] h-full" id="wa-sidebar">
            
            {/* Sidebar Header */}
            <div className="h-14 bg-[#202c33] px-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 font-mono font-bold text-xs text-emerald-400 shadow-inner relative flex-shrink-0">
                  AU
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#202c33] ${isQrConnected ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#e9edef] block truncate">My Workspace</span>
                  <span className="text-[9px] text-[#8696a0] font-sans block truncate flex items-center gap-1">
                    {isQrConnected ? (
                      <>
                        <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Web Linked: {qrPhone}
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-1 h-1 rounded-full bg-slate-400" />
                        Web Session Offline
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[#aebac1] flex-shrink-0">
                <MessageSquare className="w-4.5 h-4.5 hover:text-white cursor-pointer" title="New Chat" />
                <Settings className="w-4.5 h-4.5 hover:text-white cursor-pointer" onClick={() => setIsConfigOpen(true)} title="API Settings" />
              </div>
            </div>

            {/* Sidebar Search bar */}
            <div className="p-2 bg-[#111b21] border-b border-[#222e35]">
              <div className="bg-[#202c33] rounded-lg px-3 py-1.5 flex items-center gap-3">
                <Search className="w-4 h-4 text-[#8696a0]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search or start new chat"
                  className="bg-transparent border-none text-xs text-slate-200 placeholder-[#8696a0] focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Sidebar Chats/Channels List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#222e35] custom-scrollbar">
              {filteredChannels.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8696a0]">
                  No chats match your criteria.
                </div>
              ) : (
                filteredChannels.map(channel => {
                  const isActive = channel.id === activeChannelId;
                  return (
                    <div
                      key={channel.id}
                      onClick={() => setActiveChannelId(channel.id)}
                      className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-all ${
                        isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                      }`}
                    >
                      {/* Avatar container */}
                      <div className="w-11 h-11 rounded-full bg-[#202c33] flex items-center justify-center relative flex-shrink-0 border border-slate-800 shadow-md">
                        {channel.avatar}
                        <span className={`w-2.5 h-2.5 rounded-full border-2 border-[#111b21] absolute bottom-0 right-0 ${
                          channel.onlineStatus === 'Online' ? 'bg-emerald-500' :
                          channel.onlineStatus === 'Active' ? 'bg-cyan-400' : 'bg-slate-500'
                        }`} />
                      </div>

                      {/* Info & Last Msg block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[13px] font-semibold text-[#e9edef] truncate">{channel.name}</h4>
                          <span className="text-[10px] text-[#8696a0] font-mono">{channel.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-[#8696a0] truncate leading-tight font-sans">
                            {channel.lastMessage}
                          </p>
                          {channel.unreadCount > 0 && !isActive && (
                            <span className="bg-[#00a884] text-slate-950 font-bold text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center">
                              {channel.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Right WhatsApp Chat Content Window */}
          <div className="flex-1 flex flex-col bg-[#0b141a] h-full" id="wa-chat-window">
            
            {/* Header section */}
            <div className="h-14 bg-[#202c33] px-4 flex items-center justify-between border-b border-[#222e35] z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#111b21] flex items-center justify-center border border-slate-700 shadow-sm">
                  {activeChannel.avatar}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#e9edef]">{activeChannel.name}</h4>
                  <span className="text-[10px] text-[#8696a0] font-sans flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {activeChannel.subtitle}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-4 text-[#aebac1]">
                <Phone className="w-4 h-4 hover:text-white cursor-pointer" />
                <Video className="w-4 h-4 hover:text-white cursor-pointer" />
                <div className="h-4 w-[1px] bg-[#222e35]" />
                <Search className="w-4 h-4 hover:text-white cursor-pointer" />
                <MoreVertical className="w-4 h-4 hover:text-white cursor-pointer" />
              </div>
            </div>

            {/* Conversation Flow Canvas (with traditional WhatsApp doodle wallpaper styling) */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-3.5 relative flex flex-col"
              style={{ 
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                backgroundBlendMode: 'overlay',
                backgroundColor: '#0b141a',
                opacity: 0.96
              }} 
              id="wa-messages-view"
            >
              {/* Day Break Badge */}
              <div className="self-center bg-[#182229] px-3 py-1 rounded-md border border-slate-800 text-[10px] text-[#8696a0] font-mono uppercase tracking-wider shadow-sm select-none">
                TODAY
              </div>

              <AnimatePresence initial={false}>
                {activeMessages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.96, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`flex flex-col max-w-[78%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl text-xs space-y-1.5 shadow-md relative ${
                        isUser 
                          ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none border border-[#00705a]/50' 
                          : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-slate-800'
                      }`}>
                        
                        {/* Audio Note player container */}
                        {msg.hasAudio && (
                          <div className="flex items-center gap-3.5 pb-1 bg-black/15 p-2 rounded-xl mb-1 border border-white/5 w-64">
                            <button
                              type="button"
                              onClick={() => setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)}
                              className="p-1.5 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 hover:bg-emerald-400 shadow transition-all flex-shrink-0"
                            >
                              {playingAudioId === msg.id ? <Pause className="w-3 h-3 fill-current text-slate-950" /> : <Play className="w-3 h-3 fill-current text-slate-950" />}
                            </button>
                            
                            <div className="flex-1 space-y-1">
                              {/* Animated audio wave */}
                              <div className="flex items-end gap-[2px] h-5 px-1 pt-2">
                                {[3, 5, 2, 6, 8, 4, 7, 3, 5, 6, 2, 4, 8, 3, 5, 7, 4, 6, 2].map((h, i) => (
                                  <span
                                    key={i}
                                    style={{ 
                                      height: playingAudioId === msg.id ? `${h * 2}px` : '4px',
                                      animationDelay: `${i * 100}ms`
                                    }}
                                    className={`w-[2px] rounded-full transition-all duration-300 ${
                                      playingAudioId === msg.id ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="flex justify-between items-center text-[8px] text-[#8696a0] font-mono">
                                <span>Voice Note</span>
                                <span>{msg.audioDuration || '0:06'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <p className="leading-relaxed font-sans whitespace-pre-wrap select-text">{msg.text}</p>

                        {/* Interactive Task syncing capsule */}
                        {msg.extractedTask && (
                          <div className="mt-2.5 p-3.5 bg-[#111b21] border border-[#222e35] rounded-xl space-y-2.5 text-left" id={`wa-task-${msg.id}`}>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-cyan-400" />
                                Smart Task Sync
                              </span>
                              <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                                msg.extractedTask.priorityLevel === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                msg.extractedTask.priorityLevel === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {msg.extractedTask.priorityLevel} priority
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <p className={`text-xs font-bold tracking-wide ${msg.extractedTask.isCompleted ? 'text-emerald-500 line-through decoration-emerald-500/50' : 'text-[#e9edef]'}`}>
                                {msg.extractedTask.isCompleted && "✓ "}{msg.extractedTask.title}
                              </p>
                              <p className="text-[10px] text-[#8696a0] leading-normal">{msg.extractedTask.description}</p>
                              
                              {msg.extractedTask.snoozedUntil && (
                                <div className="flex items-center gap-1 text-[8px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                                  <Bell className="w-2 text-amber-400 animate-bounce" />
                                  Snoozed until {msg.extractedTask.snoozedUntil}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center text-[9px] text-[#8696a0] font-mono border-t border-slate-800/50 pt-2">
                              <span>Due: {new Date(msg.extractedTask.dueDate).toLocaleDateString()}</span>
                              <span>Est: {msg.extractedTask.estimatedDuration} min</span>
                            </div>

                            {/* Actions Button Deck */}
                            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/50">
                              {/* Sync Trigger button */}
                              <button
                                type="button"
                                onClick={() => handleSyncTask(msg.id, msg.extractedTask)}
                                disabled={syncedIds.has(msg.id) || msg.extractedTask.isCompleted}
                                className={`w-full py-2 rounded-lg text-[10px] font-sans font-bold flex items-center justify-center gap-1.5 transition-all ${
                                  syncedIds.has(msg.id)
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : msg.extractedTask.isCompleted
                                    ? 'bg-slate-900 border border-slate-800 text-slate-500'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold hover:shadow-lg hover:scale-[1.01]'
                                }`}
                              >
                                {syncedIds.has(msg.id) ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Synced to Task database
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5 text-slate-950 font-bold" />
                                    Approve & Save Task
                                  </>
                                )}
                              </button>

                              {/* Done, Snooze, Reschedule Row */}
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCompleteTask(msg.id)}
                                  disabled={msg.extractedTask.isCompleted}
                                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-sans font-bold flex items-center justify-center gap-1 transition-all ${
                                    msg.extractedTask.isCompleted
                                      ? 'bg-emerald-950/20 text-emerald-500 border border-emerald-500/25'
                                      : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                  Done
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => handleSnoozeTask(msg.id, 30)}
                                  disabled={msg.extractedTask.isCompleted}
                                  className="flex-1 py-1.5 rounded-lg text-[9px] font-sans font-bold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 flex items-center justify-center gap-1 transition-all disabled:opacity-40"
                                >
                                  <Bell className="w-3 h-3" />
                                  Snooze
                                </button>

                                <div className="relative group flex-1">
                                  <button
                                    type="button"
                                    disabled={msg.extractedTask.isCompleted}
                                    className="w-full py-1.5 rounded-lg text-[9px] font-sans font-bold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 flex items-center justify-center gap-1 transition-all disabled:opacity-40"
                                  >
                                    <Calendar className="w-3 h-3" />
                                    Delay
                                  </button>
                                  <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:flex flex-col bg-slate-950 border border-slate-800 rounded-lg p-1 shadow-xl z-20 w-24 space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => handleRescheduleTask(msg.id, 1)}
                                      className="text-left px-2 py-1 hover:bg-slate-900 text-[8px] text-slate-300 rounded font-bold"
                                    >
                                      Tomorrow
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRescheduleTask(msg.id, 3)}
                                      className="text-left px-2 py-1 hover:bg-slate-900 text-[8px] text-slate-300 rounded font-bold"
                                    >
                                      In 3 Days
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRescheduleTask(msg.id, 7)}
                                      className="text-left px-2 py-1 hover:bg-slate-900 text-[8px] text-slate-300 rounded font-bold"
                                    >
                                      Next Week
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Receipt Checks details */}
                        <div className="flex items-center justify-end gap-1 text-[8px] text-[#8696a0] text-right mt-1.5 font-mono select-none">
                          <span>{msg.timestamp}</span>
                          {isUser && (
                            <CheckCheck className="w-3 h-3 text-sky-400" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Adaptive typing loader */}
              {isLoading && (
                <div className="self-start bg-[#202c33] border border-slate-800 px-3 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-2 max-w-[70%] text-slate-400 shadow-md">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">AURA typing...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input message strip */}
            <form onSubmit={handleSubmit} className="h-16 bg-[#202c33] px-4 flex items-center gap-3.5 border-t border-[#222e35] z-10">
              <div className="flex items-center gap-4 text-[#aebac1]">
                <Smile className="w-5.5 h-5.5 hover:text-white cursor-pointer" />
                <Paperclip className="w-5 h-5 hover:text-white cursor-pointer" />
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={audioRecording ? "Simulating dynamic voice note..." : "Type a message"}
                disabled={audioRecording || isLoading}
                className="flex-1 bg-[#2a3942] border-none text-[13px] text-slate-100 placeholder-[#8696a0] focus:outline-none px-4 py-2 rounded-lg"
              />

              {/* Microphone / Send Button wrapper */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full flex items-center justify-center transition-all shadow-md"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerVoiceNote}
                  disabled={audioRecording || isLoading}
                  className={`p-2.5 rounded-full flex items-center justify-center transition-all ${
                    audioRecording
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg scale-105'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                  }`}
                  title="Click to dictate simulated Voice note"
                >
                  <Volume2 className="w-4 h-4 text-slate-950" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* 3. Right Sandbox Triggers Panel */}
        <div className="space-y-4 flex flex-col justify-between">
          
          <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Simulator Push Deck</h4>
                <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Force background webhook alerts</p>
              </div>
            </div>

            <p className="text-[11px] text-[#8696a0] leading-relaxed font-sans">
              Test AURA-9000's primary features directly. Click any scenario below to trigger its automated push, which will also dispatch to your linked phone!
            </p>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {/* Scenario 1 */}
              <button
                onClick={() => triggerMockReminderPush(
                  "system-alerts",
                  "Smart Notifications (Scenario 1)",
                  "📅 *UPCOMING EVENT*: Your interview starts in 1 hour. Heavy commute load predicted. Leave now to ensure seamless arrival.",
                  {
                    title: "Interview Event Briefing",
                    description: "Pre-scheduled interview. Auto-prompted traffic warning active.",
                    category: "Urgent",
                    dueDate: new Date(Date.now() + 3600000).toISOString(),
                    estimatedDuration: 60,
                    priorityLevel: "high"
                  }
                )}
                className="w-full text-left p-2.5 bg-[#111b21] hover:bg-[#202c33] border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] text-slate-300 hover:text-emerald-400 transition-all flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider">1. Smart Notifications</div>
                  <div className="truncate text-[10px] text-slate-400">"Your interview starts in 1 hour. Leave now."</div>
                </div>
              </button>

              {/* Scenario 2 */}
              <button
                onClick={() => triggerMockReminderPush(
                  "aura-ai",
                  "Task Prioritization (Scenario 2)",
                  "📊 *AURA PRIORITIZATION SERVICE*: I suggest you complete the *Project Report* today because you have multiple heavy meeting blocks tomorrow.",
                  {
                    title: "Action: Complete Project Report",
                    description: "Dynamic schedule block to beat upcoming dense calendar stress.",
                    category: "Work",
                    dueDate: new Date().toISOString(),
                    estimatedDuration: 90,
                    priorityLevel: "high"
                  }
                )}
                className="w-full text-left p-2.5 bg-[#111b21] hover:bg-[#202c33] border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] text-slate-300 hover:text-emerald-400 transition-all flex items-center gap-2.5"
              >
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[10px] text-cyan-400 uppercase tracking-wider">2. AI Prioritization & Scheduling</div>
                  <div className="truncate text-[10px] text-slate-400">"Complete Project Report today because of tomorrow's meetings."</div>
                </div>
              </button>

              {/* Scenario 3 */}
              <button
                onClick={() => triggerMockReminderPush(
                  "gmail-monitor",
                  "Meeting Notes & Email Summary (Scenario 3)",
                  "🤝 *POST-MEETING BREIFING*: Strategic milestone notes compiled. Sending summarized action items, deadlines, and deliverables directly to your inbox.",
                  {
                    title: "Review Meeting Deliverables",
                    description: "Follow-up list of action items, dependencies, and timelines extracted from meeting transcription.",
                    category: "Work",
                    dueDate: new Date(Date.now() + 86400000).toISOString(),
                    estimatedDuration: 30,
                    priorityLevel: "medium"
                  }
                )}
                className="w-full text-left p-2.5 bg-[#111b21] hover:bg-[#202c33] border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] text-slate-300 hover:text-emerald-400 transition-all flex items-center gap-2.5"
              >
                <Mail className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[10px] text-violet-400 uppercase tracking-wider">3. Meeting Notes & Summaries</div>
                  <div className="truncate text-[10px] text-slate-400">"After a meeting, send email with action items & deadlines."</div>
                </div>
              </button>

              {/* Scenario 4 */}
              <button
                onClick={() => triggerMockReminderPush(
                  "aura-ai",
                  "Context-Aware Reminders (Scenario 4)",
                  "🚗 *INTELLIGENT TRAFFIC RADAR*: Heavy traffic detected on highway. Leave 30 minutes earlier to arrive on time for your Doctor Appointment.",
                  {
                    title: "Doctor Appointment Commute",
                    description: "Adjusted transit window based on live congestion metrics.",
                    category: "Health",
                    dueDate: new Date(Date.now() + 7200000).toISOString(),
                    estimatedDuration: 45,
                    priorityLevel: "medium"
                  }
                )}
                className="w-full text-left p-2.5 bg-[#111b21] hover:bg-[#202c33] border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] text-slate-300 hover:text-emerald-400 transition-all flex items-center gap-2.5"
              >
                <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[10px] text-amber-400 uppercase tracking-wider">4. Context-Aware Reminders</div>
                  <div className="truncate text-[10px] text-slate-400">"Heavy traffic detected. Leave 30m earlier for doctor."</div>
                </div>
              </button>

              {/* Scenario 5 */}
              <button
                onClick={() => triggerMockReminderPush(
                  "habit-bot",
                  "Autonomous Planning (Scenario 5)",
                  "🏆 *GOAL PROGRESS LOOP*: To finish your target certification before the exam date, you need to study 2 hours today. Initiating study focus session block.",
                  {
                    title: "Goal Focus: Certification Study Session",
                    description: "Autonomous track adjustment to guarantee exam preparation milestones.",
                    category: "Personal",
                    dueDate: new Date().toISOString(),
                    estimatedDuration: 120,
                    priorityLevel: "high"
                  }
                )}
                className="w-full text-[#e9edef] text-left p-2.5 bg-[#111b21] hover:bg-[#202c33] border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] text-slate-300 hover:text-emerald-400 transition-all flex items-center gap-2.5"
              >
                <Flame className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider">5. Autonomous Goal Planning</div>
                  <div className="truncate text-[10px] text-slate-400">"Study 2 hours today to finish certification before exam."</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick instructions and sandbox credentials */}
          <div className="bg-slate-900/60 border border-slate-900 p-4 rounded-xl text-[11px] text-slate-500 space-y-2 leading-relaxed font-sans">
            <span className="font-bold text-slate-400 block text-xs tracking-wider uppercase">🔌 Real WhatsApp Credentials</span>
            <div className="space-y-1 font-mono text-[9px]">
              <p>Twilio Sandbox: <span className="text-emerald-500">+1 415 523 8886</span></p>
              <p>Sandbox Code: <span className="text-emerald-500">join memory-shield</span></p>
            </div>
            <p className="text-[10px]">
              Type <span className="text-emerald-500 font-mono">join memory-shield</span> to your Twilio Sandbox on WhatsApp to link your device, then configure your phone number above!
            </p>
          </div>

        </div>

      </div>

      {/* 4. Link Real WhatsApp Setup Modal / Configuration Drawer */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="wa-config-modal-root">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative"
            >
              {/* Modal Top Bar */}
              <div className="bg-[#202c33] px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-sans font-bold text-white text-sm">Link Your Real WhatsApp Phone</h3>
                    <p className="text-[10px] text-slate-400">Receive actual real-time agent notifications</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dual Modal Tabs */}
              <div className="bg-[#111b21] p-2 flex gap-1.5 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setQrActiveTab('qr')}
                  className={`flex-1 py-2 rounded-lg text-xs font-sans font-bold transition-all flex items-center justify-center gap-2 ${
                    qrActiveTab === 'qr'
                      ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-inner'
                      : 'bg-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  📲 QR Web Login
                </button>
                <button
                  type="button"
                  onClick={() => setQrActiveTab('api')}
                  className={`flex-1 py-2 rounded-lg text-xs font-sans font-bold transition-all flex items-center justify-center gap-2 ${
                    qrActiveTab === 'api'
                      ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-inner'
                      : 'bg-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  🔌 Real Outbound APIs
                </button>
              </div>

              {/* Modal Body depending on Tab */}
              <div className="p-6">
                {qrActiveTab === 'qr' ? (
                  <div className="space-y-5" id="wa-qr-tab-content">
                    {!isQrConnected && (
                      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 text-[11px] leading-relaxed text-slate-300 font-sans flex items-start gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500 flex-shrink-0">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                            ⚠️ Scanning this QR with your physical phone will NOT work!
                          </p>
                          <p className="text-[#8696a0] leading-relaxed">
                            Because this app runs in a sandboxed Cloud environment, it cannot directly link to your physical WhatsApp Web. It is an interactive visual simulation for testing.
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                            <span className="text-[10px] text-slate-300">To send <strong className="text-emerald-400">real WhatsApp messages</strong> to your phone:</span>
                            <button
                              type="button"
                              onClick={() => setQrActiveTab('api')}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-[9px] rounded uppercase tracking-wider transition-all"
                            >
                              Open Real APIs Tab 🔌
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {!isQrConnected ? (
                      <div className="flex flex-col md:flex-row gap-5 items-center">
                        {/* Interactive QR Code Mock */}
                        <div className="relative w-44 h-44 bg-white p-3 rounded-xl shadow-inner flex-shrink-0 flex items-center justify-center border border-slate-800">
                          {qrIsScanning ? (
                            <div className="absolute inset-0 bg-slate-950/90 rounded-xl flex flex-col items-center justify-center p-3 text-center space-y-3">
                              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                              <div className="space-y-1">
                                <p className="text-[10px] font-mono font-bold text-emerald-400">CONNECTING...</p>
                                <p className="text-[8px] text-slate-400 font-sans">Syncing workspace caches</p>
                              </div>
                              {/* progress bar */}
                              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div style={{ width: `${qrLoadingProgress}%` }} className="bg-emerald-500 h-full transition-all duration-300" />
                              </div>
                            </div>
                          ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                              {/* High fidelity realistic SVG QR representing WhatsApp session credentials */}
                              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current opacity-30">
                                <rect x="0" y="0" width="25" height="25" />
                                <rect x="5" y="5" width="15" height="15" fill="white" />
                                <rect x="8" y="8" width="9" height="9" />
                                
                                <rect x="75" y="0" width="25" height="25" />
                                <rect x="80" y="5" width="15" height="15" fill="white" />
                                <rect x="83" y="8" width="9" height="9" />
                                
                                <rect x="0" y="75" width="25" height="25" />
                                <rect x="5" y="80" width="15" height="15" fill="white" />
                                <rect x="8" y="83" width="9" height="9" />

                                {/* Random QR dots representing session keys */}
                                <rect x="35" y="5" width="5" height="10" />
                                <rect x="45" y="0" width="10" height="5" />
                                <rect x="60" y="10" width="5" height="5" />
                                <rect x="30" y="20" width="15" height="5" />
                                <rect x="50" y="25" width="5" height="15" />
                                <rect x="10" y="40" width="15" height="5" />
                                <rect x="0" y="50" width="5" height="10" />
                                <rect x="20" y="60" width="10" height="5" />
                                <rect x="40" y="45" width="20" height="5" />
                                <rect x="65" y="40" width="5" height="15" />
                                <rect x="80" y="30" width="15" height="5" />
                                <rect x="75" y="45" width="10" height="10" />
                                <rect x="90" y="60" width="5" height="10" />
                                <rect x="35" y="75" width="5" height="15" />
                                <rect x="50" y="85" width="15" height="5" />
                                <rect x="70" y="80" width="10" height="10" />
                                <rect x="85" y="90" width="10" height="5" />
                              </svg>
                              
                              {/* Overlay Badge preventing real scanning */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 select-none pointer-events-none">
                                <span className="bg-amber-600 border border-amber-400 text-white font-sans font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg shadow-lg uppercase tracking-wider leading-tight max-w-[90%]">
                                  ⚠️ SIMULATION<br/>DO NOT SCAN
                                </span>
                              </div>

                              {/* Glowing laser scanline simulation */}
                              <div className="absolute top-0 inset-x-0 h-[2px] bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-bounce" />
                            </div>
                          )}
                        </div>

                        {/* Scan Instructions */}
                        <div className="space-y-3 flex-1">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Pair Simulated Web Client</h4>
                          <p className="text-[10px] text-[#8696a0] font-sans leading-relaxed">
                            This screen simulates linking a virtual browser to the sandbox AI routing gateway.
                          </p>
                          <ol className="list-decimal list-inside text-[10px] text-slate-400 space-y-1.5 leading-relaxed font-sans">
                            <li>This is a **fully functional sandbox client** to test scheduling.</li>
                            <li>No physical mobile device or scanning is required!</li>
                            <li>Simply enter any phone number below to identify your sandbox session.</li>
                            <li>Click <strong className="text-emerald-400">"Simulate Scan & Connect"</strong> below to instantly pair the mock window!</li>
                            <li>To send **actual alerts to your real phone**, click the <strong className="text-emerald-400">"🔌 Real Outbound APIs"</strong> tab!</li>
                          </ol>

                          <div className="space-y-1 pt-1">
                            <label className="text-[9px] font-mono text-slate-500 uppercase font-bold">Simulated Phone Number</label>
                            <input
                              type="text"
                              value={qrPhone}
                              onChange={(e) => setQrPhone(e.target.value)}
                              placeholder="+1 (555) 019-2834"
                              disabled={qrIsScanning}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-5 text-center space-y-4">
                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow animate-pulse">
                          <Check className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">WhatsApp Web Session Connected</h4>
                          <p className="text-[10px] text-slate-400 font-sans">Linked to device: <span className="text-emerald-400 font-bold font-mono">{qrPhone}</span></p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-left font-mono text-[9px] bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <p className="text-slate-500">Gateway Status: <span className="text-emerald-500 font-bold">ACTIVE</span></p>
                          <p className="text-slate-500">Session Type: <span className="text-slate-300">WhatsApp Web App</span></p>
                          <p className="text-slate-500">Ping Latency: <span className="text-slate-300">42ms (Synced)</span></p>
                          <p className="text-slate-500">Last Sync: <span className="text-slate-300">Just Now</span></p>
                        </div>

                        <button
                          type="button"
                          onClick={handleDisconnectQr}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-sans font-bold text-xs rounded-lg transition-all w-full flex items-center justify-center gap-1.5"
                        >
                          Disconnect Linked Device
                        </button>
                      </div>
                    )}

                    {!isQrConnected && (
                      <button
                        type="button"
                        onClick={handleSimulateQrScan}
                        disabled={qrIsScanning}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-sans font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md mt-2"
                      >
                        <Smartphone className="w-4 h-4 text-slate-950" />
                        {qrIsScanning ? `Connecting... ${qrLoadingProgress}%` : 'Simulate Scan & Connect'}
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveConfig} className="space-y-4" id="wa-api-tab-content">
                    {/* Provider Sub Tabs */}
                    <div className="bg-slate-950 p-1 flex gap-1 rounded-lg border border-slate-850 mb-2">
                      <button
                        type="button"
                        onClick={() => setProvider('callmebot')}
                        className={`flex-1 py-1.5 rounded text-[10px] font-sans font-bold transition-all ${
                          provider === 'callmebot'
                            ? 'bg-[#00a884] text-slate-950 font-bold shadow-sm'
                            : 'bg-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Free CallMeBot (Instant Setup)
                      </button>
                      <button
                        type="button"
                        onClick={() => setProvider('cloudapi')}
                        className={`flex-1 py-1.5 rounded text-[10px] font-sans font-bold transition-all ${
                          provider === 'cloudapi'
                            ? 'bg-[#00a884] text-slate-950 font-bold shadow-sm'
                            : 'bg-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        WhatsApp Cloud API (Official)
                      </button>
                      <button
                        type="button"
                        onClick={() => setProvider('twilio')}
                        className={`flex-1 py-1.5 rounded text-[10px] font-sans font-bold transition-all ${
                          provider === 'twilio'
                            ? 'bg-[#00a884] text-slate-950 font-bold shadow-sm'
                            : 'bg-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Twilio Sandbox
                      </button>
                    </div>

                    <div className="space-y-4">
                      {provider === 'callmebot' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Recipient Phone Number</label>
                            <input
                              type="text"
                              placeholder="e.g. +15551234567"
                              value={callmebotPhone || phoneNumber}
                              onChange={(e) => {
                                setCallmebotPhone(e.target.value);
                                setPhoneNumber(e.target.value);
                              }}
                              required
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <p className="text-[9px] text-slate-500">Include country code without spaces (e.g., +15551234567).</p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">CallMeBot API Key</label>
                            <input
                              type="password"
                              placeholder="Enter your CallMeBot API Key"
                              value={callmebotApikey}
                              onChange={(e) => setCallmebotApikey(e.target.value)}
                              required
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>

                          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">How to get a Free Key (Takes 10 Seconds):</span>
                            <ol className="list-decimal list-inside text-[9px] text-slate-400 space-y-1.5 leading-relaxed font-sans">
                              <li>Add <span className="text-emerald-400 font-mono font-semibold">+34 644 20 13 46</span> to your phone contacts.</li>
                              <li>Send a WhatsApp message saying: <span className="text-emerald-400 font-mono font-semibold">I allow callmebot to send me messages</span></li>
                              <li>The bot instantly replies with your API key! Paste it here to receive real physical WhatsApp alerts.</li>
                            </ol>
                          </div>
                        </>
                      )}

                      {provider === 'cloudapi' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Recipient Phone Number</label>
                            <input
                              type="text"
                              placeholder="e.g. +15551234567"
                              value={cloudApiRecipient || phoneNumber}
                              onChange={(e) => {
                                setCloudApiRecipient(e.target.value);
                                setPhoneNumber(e.target.value);
                              }}
                              required
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <p className="text-[9px] text-slate-500">The destination phone number where you want to receive AURA scheduled alerts.</p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Meta Access Token</label>
                            <input
                              type="password"
                              placeholder="EAAG..."
                              value={cloudApiToken}
                              onChange={(e) => setCloudApiToken(e.target.value)}
                              required
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <p className="text-[9px] text-slate-500">Your Permanent/System Token or Temporary Token from Meta App Dashboard.</p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Phone Number ID</label>
                            <input
                              type="text"
                              placeholder="e.g. 104849382109283"
                              value={cloudApiPhoneId}
                              onChange={(e) => setCloudApiPhoneId(e.target.value)}
                              required
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <p className="text-[9px] text-slate-500">Your specific Meta Phone Number ID used for message dispatches.</p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">WhatsApp Business Account ID</label>
                            <input
                              type="text"
                              placeholder="e.g. 293848192847192"
                              value={cloudApiWabaId}
                              onChange={(e) => setCloudApiWabaId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>

                          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-2">
                            <span className="text-[10px] font-bold text-amber-400 block uppercase">🔌 Setup Real-Time Webhook Recipient:</span>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              To receive and automatically process user incoming WhatsApp messages with our **AURA AI Engine**, add this webhook to your Meta Webhooks Settings:
                            </p>
                            <div className="space-y-1 text-[9px] font-mono bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                              <div><strong>Callback URL:</strong> <span className="text-emerald-400 font-semibold">{window.location.origin}/api/whatsapp/webhook</span></div>
                              <div><strong>Verify Token:</strong> <span className="text-emerald-400 font-semibold">aura_whatsapp_verify_token</span></div>
                              <div><strong>Fields to Subscribe:</strong> <span className="text-emerald-400">messages</span></div>
                            </div>
                            <p className="text-[9px] text-slate-500 italic">
                              Once configured, texting your Meta phone number triggers AURA to reply automatically!
                            </p>
                          </div>
                        </>
                      )}

                      {provider === 'twilio' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Recipient Phone Number</label>
                            <input
                              type="text"
                              placeholder="e.g. +15551234567"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <p className="text-[9px] text-slate-500">Must include country code (e.g., +1 for USA, +91 for India).</p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Twilio Account SID</label>
                            <input
                              type="text"
                              placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                              value={twilioSid}
                              onChange={(e) => setTwilioSid(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Twilio Auth Token</label>
                            <input
                              type="password"
                              placeholder="Enter Auth Token"
                              value={twilioToken}
                              onChange={(e) => setTwilioToken(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Twilio Sender Number (WhatsApp)</label>
                            <input
                              type="text"
                              placeholder="whatsapp:+14155238886"
                              value={twilioSender}
                              onChange={(e) => setTwilioSender(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <p className="text-[9px] text-slate-500">Sandbox default is: <span className="text-emerald-400">whatsapp:+14155238886</span></p>
                          </div>

                          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">How to setup:</span>
                            <ol className="list-decimal list-inside text-[9px] text-slate-400 space-y-1.5 leading-normal font-sans">
                              <li>Create a free account at <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-semibold">twilio.com</a></li>
                              <li>Go to WhatsApp Sandbox, join by texting code <span className="text-emerald-400 font-mono font-semibold">join memory-shield</span> to <span className="text-emerald-400 font-mono font-semibold">+1 415 523 8886</span></li>
                              <li>Copy your Account SID and Auth Token and save!</li>
                            </ol>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Submit action panel */}
                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setIsConfigOpen(false)}
                        className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-xs font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#00a884] hover:bg-[#00c298] text-slate-950 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5"
                      >
                        {configSuccess ? 'Linked Successfully!' : 'Save Credentials'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
