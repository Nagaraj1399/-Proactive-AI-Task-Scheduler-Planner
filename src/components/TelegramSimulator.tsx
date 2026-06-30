import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, User, Activity, Paperclip, Smile, MoreVertical, Search, 
  Menu, Check, CheckCheck, Calendar, AlertCircle, Terminal, Settings, 
  Key, RefreshCw, Copy, Plus, ExternalLink, ShieldCheck, Sparkles, 
  Smartphone, Lock, Cloud, MessageSquare, Info
} from 'lucide-react';

interface TaskDraft {
  title: string;
  description: string;
  category: string;
  dueDate: string;
  estimatedDuration: number;
  priorityLevel: 'high' | 'medium' | 'low';
}

interface TelegramMessage {
  id: string;
  sender: 'user' | 'aura' | 'system';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  extractedTask?: TaskDraft | null;
}

interface TelegramSimulatorProps {
  onAddTask: (task: {
    title: string;
    description: string;
    category: string;
    dueDate: string;
    estimatedDuration: number;
    priorityLevel: 'high' | 'medium' | 'low';
  }) => void;
}

export default function TelegramSimulator({ onAddTask }: TelegramSimulatorProps) {
  // Navigation / Tabs
  const [activeChannelId, setActiveChannelId] = useState<'aura' | 'saved' | 'system'>('aura');
  const [telegramTab, setTelegramTab] = useState<'client' | 'api'>('client');
  
  // Credentials and active configs
  const [botToken, setBotToken] = useState(() => localStorage.getItem('tg-bot-token') || '');
  const [chatId, setChatId] = useState(() => localStorage.getItem('tg-chat-id') || '');
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configError, setConfigError] = useState('');
  
  // Real webhook registration state
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [webhookMessage, setWebhookMessage] = useState('');

  // Interactive local conversations
  const [channelConversations, setChannelConversations] = useState<Record<string, TelegramMessage[]>>(() => {
    const saved = localStorage.getItem('tg-conversations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to defaults
      }
    }
    return {
      aura: [
        {
          id: 'msg-1',
          sender: 'aura',
          text: '⚡ AURA-9000 Cognitive Scheduler Engine connected. I am ready to schedule events, categorize tasks, and deliver proactive nudges. Try typing: "Review budget tomorrow at 2 PM"!',
          timestamp: '10:00 AM',
          status: 'read'
        }
      ],
      saved: [
        {
          id: 'msg-saved-1',
          sender: 'user',
          text: 'This is your Saved Messages folder. You can store drafts, thoughts, or test scheduling inputs privately here!',
          timestamp: '09:30 AM',
          status: 'read'
        }
      ],
      system: [
        {
          id: 'msg-sys-1',
          sender: 'system',
          text: '[TELEMETRY LOG] ⚡ AURA routing gateway is online. Simulated WebSocket listening on secure port 3000.',
          timestamp: '09:00 AM',
          status: 'read'
        },
        {
          id: 'msg-sys-2',
          sender: 'system',
          text: '[SYSTEM LOG] webhook state: listening for events on /api/telegram/webhook.',
          timestamp: '09:05 AM',
          status: 'read'
        }
      ]
    };
  });

  // Client states
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem('tg-conversations', JSON.stringify(channelConversations));
  }, [channelConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelConversations, activeChannelId, isLoading]);

  // Simulate incoming alert or webhook telemetry log
  const addSystemLog = (logText: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logMsg: TelegramMessage = {
      id: `sys-${Date.now()}`,
      sender: 'system',
      text: `[SYSTEM LOG] ${logText}`,
      timestamp: timeStr,
      status: 'read'
    };
    setChannelConversations(prev => ({
      ...prev,
      system: [...(prev.system || []), logMsg]
    }));
  };

  // Handle local simulation chat message submission
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add User Message
    const userMsg: TelegramMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: timeStr,
      status: 'read'
    };

    setChannelConversations(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), userMsg]
    }));

    setInputText('');
    setIsLoading(true);

    try {
      // Hit local Cognitive AI parser /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceInput: textToSend })
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.chatResponse || "Cognitive request successfully cataloged.";

        const auraMsg: TelegramMessage = {
          id: `aura-${Date.now()}`,
          sender: 'aura',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
          extractedTask: data.extractedTask || null
        };

        setChannelConversations(prev => ({
          ...prev,
          [activeChannelId]: [...(prev[activeChannelId] || []), auraMsg]
        }));

        if (data.extractedTask) {
          addSystemLog(`Extracted potential task item: "${data.extractedTask.title}" (${data.extractedTask.category})`);
        }
      } else {
        throw new Error("Local engine failed to respond.");
      }
    } catch (err: any) {
      console.warn("Failed to reach local parser:", err);
      // Fallback
      setTimeout(() => {
        const auraMsg: TelegramMessage = {
          id: `aura-fallback-${Date.now()}`,
          sender: 'aura',
          text: `I've received your query "${textToSend}". I can help prioritize this, but please configure a physical Bot Token in the credentials panel to route physical alerts.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        };
        setChannelConversations(prev => ({
          ...prev,
          [activeChannelId]: [...(prev[activeChannelId] || []), auraMsg]
        }));
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Bot API Settings
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigSaving(true);
    setConfigError('');
    setConfigSuccess(false);

    try {
      localStorage.setItem('tg-bot-token', botToken.trim());
      localStorage.setItem('tg-chat-id', chatId.trim());
      setConfigSuccess(true);
      addSystemLog(`Telegram Bot credentials successfully updated. Token: ${botToken.trim().slice(0, 10)}...`);
    } catch (err: any) {
      setConfigError(err.message || 'Failed to save settings.');
    } finally {
      setIsConfigSaving(false);
    }
  };

  // One-Click Webhook Register
  const handleRegisterWebhook = async () => {
    if (!botToken) {
      alert("Please enter a valid Telegram Bot Token first.");
      return;
    }

    setWebhookStatus('loading');
    setWebhookMessage('');

    try {
      // Find callback URL (this deployment's URL + webhook path)
      const origin = window.location.origin;
      const webhookUrl = `${origin}/api/telegram/webhook`;
      const registerUrl = `https://api.telegram.org/bot${botToken.trim()}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

      addSystemLog(`Attempting to bind Webhook with Telegram servers: ${webhookUrl}`);
      const res = await fetch(registerUrl);
      const data = await res.json();

      if (res.ok && data.ok) {
        setWebhookStatus('success');
        setWebhookMessage(data.description || 'Webhook set successfully!');
        addSystemLog(`Telegram webhook registered successfully! Server is now linked to your bot.`);
      } else {
        setWebhookStatus('error');
        setWebhookMessage(data.description || 'Telegram API rejected webhook registration.');
        addSystemLog(`Webhook binding failed: ${data.description || 'Unknown Telegram Error'}`);
      }
    } catch (err: any) {
      setWebhookStatus('error');
      setWebhookMessage(err.message || 'Failed to register webhook.');
      addSystemLog(`Webhook binding request error: ${err.message}`);
    }
  };

  // Quick dispatch of a physical outbound test message
  const handleSendTestAlert = async () => {
    if (!botToken || !chatId) {
      alert("Please enter both Bot Token and Chat ID to send a physical test!");
      return;
    }

    addSystemLog(`Sending outbound test message to Telegram Chat ${chatId}`);

    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: `<b>⚡ AURA Cognitive Scheduler Update</b>\n\nThis is a real-time notification from your AURA workspace! Core engines are synchronous and ready.`,
          botToken: botToken.trim(),
          chatId: chatId.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Success! Real-time Telegram notification dispatched to your phone.");
        addSystemLog(`Physical alert successfully sent! Message ID: ${data.messageId}`);
      } else {
        alert(`Telegram Bot rejected dispatch: ${data.error || 'Check credentials'}`);
        addSystemLog(`Physical dispatch failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Outbound error: ${err.message}`);
      addSystemLog(`Outbound connection error: ${err.message}`);
    }
  };

  // Convert localized priority to style classes
  const getPriorityBadge = (p?: 'high' | 'medium' | 'low') => {
    switch (p) {
      case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/35';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/35';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35';
    }
  };

  return (
    <div className="space-y-6" id="telegram-simulator-root">
      {/* Header Cards & Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden" id="tg-intro-panel">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                <Smartphone className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Telegram Cognitive Bot Gateway
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/25">
                    Live
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Send real-time scheduler notifications and trigger conversational task syncing with your physical device.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTelegramTab('client')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                telegramTab === 'client'
                  ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/15'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              📲 Interactive Web Client
            </button>
            <button
              onClick={() => setTelegramTab('api')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                telegramTab === 'api'
                  ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/15'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              🔌 Real Outbound APIs
            </button>
          </div>
        </div>
      </div>

      {/* Main Sandbox Layout / Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side Web Telegram Frame (Takes 3 Columns) */}
        <div className="xl:col-span-3 bg-[#0e1621] rounded-2xl border border-slate-800 h-[650px] flex overflow-hidden shadow-2xl relative" id="telegram-web-frame">
          
          {/* Active Sandbox Alert Indicator */}
          {telegramTab === 'client' && (
            <div className="absolute top-3 right-3 bg-[#17212b]/95 border border-slate-800 rounded-xl px-3 py-1.5 z-40 flex items-center gap-2 shadow-lg backdrop-blur-sm pointer-events-none text-[10px]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400 font-mono font-medium">SIMULATION ACTIVE</span>
            </div>
          )}

          {telegramTab === 'api' ? (
            /* Credentials Integration View */
            <div className="w-full h-full p-8 overflow-y-auto scrollbar-thin bg-slate-950 text-slate-200 flex flex-col justify-between">
              <div className="max-w-2xl mx-auto w-full space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1.5">
                    <Key className="w-5 h-5 text-sky-400" />
                    Configure Telegram Bot Credentials
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Connecting to your physical Telegram account is completely free and requires zero credit cards or complex setups.
                    By creating an official bot via <b>@BotFather</b>, you can receive proactive task reminders and chat with your calendar schedule directly from Telegram!
                  </p>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-4" id="tg-api-config-form">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Telegram Bot Token</label>
                    <input
                      type="password"
                      placeholder="e.g. 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Acquired from chatting with Telegram's official <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">@BotFather</a> bot.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Your Chat ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 987654321"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <p className="text-[9px] text-slate-500 leading-normal">
                      The destination Chat ID. Find your ID by texting your new bot then checking updates, or message <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">@userinfobot</a> on Telegram.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isConfigSaving}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-sans font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                    >
                      {isConfigSaving ? 'Saving...' : 'Save Credentials'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendTestAlert}
                      disabled={!botToken || !chatId}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-sans font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Dispatch Outbound Test Message
                    </button>
                  </div>

                  {configSuccess && (
                    <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Credentials saved securely! System logs updated.
                    </p>
                  )}
                  {configError && (
                    <p className="text-xs text-rose-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {configError}
                    </p>
                  )}
                </form>

                {/* Webhook Endpoint binding section */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-sky-400" />
                        Configure Real-Time Webhook Connection
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        Register your sandbox callback URL so that when you send a message to your physical bot on Telegram, the **AURA Cognitive AI Engine** will receive it and reply with a schedule summary!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRegisterWebhook}
                      disabled={!botToken || webhookStatus === 'loading'}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sky-400 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {webhookStatus === 'loading' ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        'Register Webhook with Telegram ⚡'
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[10px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-850 text-slate-300 leading-normal">
                    <div><strong>Webhook Endpoint:</strong> <span className="text-sky-400">{window.location.origin}/api/telegram/webhook</span></div>
                    <div><strong>Verify Status:</strong> {webhookStatus === 'success' ? (
                      <span className="text-emerald-400 font-bold">Successfully Registered (OK)</span>
                    ) : webhookStatus === 'error' ? (
                      <span className="text-rose-400 font-bold">Registration Failed - {webhookMessage}</span>
                    ) : (
                      <span className="text-slate-500">Not connected</span>
                    )}</div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    <b>Tip:</b> If successful, send your Bot a message like "Create appointment on Friday at 4 PM" on your phone, and wait for your custom bot to instantly schedule it and send you back a beautiful response.
                  </p>
                </div>
              </div>

              {/* Bot Setup Instructions Footer */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850/50 text-center text-[10px] text-slate-500 max-w-2xl mx-auto w-full mt-6">
                🔐 Access tokens are stored 100% locally in your sandboxed browser cache. Dispatches are routed securely via our transient proxies.
              </div>
            </div>
          ) : (
            /* High Fidelity Telegram Web Client Interface */
            <>
              {/* Telegram Left Chat Sidebar */}
              <div className="w-80 border-r border-[#101921] bg-[#17212b] flex flex-col h-full flex-shrink-0" id="tg-sidebar">
                
                {/* Search Bar / Header */}
                <div className="p-3.5 space-y-3.5" id="tg-sidebar-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Menu className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-200" />
                      <span className="text-sm font-bold text-slate-200">Telegram Web</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[9px] font-mono font-bold">
                      v4.12
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      className="w-full bg-[#24303f] border border-transparent rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-[#202b36] focus:border-sky-500 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Chat items list */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#101921]/50 divide-dashed scrollbar-thin" id="tg-chat-list">
                  
                  {/* Channel: AURA Bot */}
                  <button
                    onClick={() => setActiveChannelId('aura')}
                    className={`w-full p-3.5 flex items-start gap-3 transition-all text-left ${
                      activeChannelId === 'aura' ? 'bg-[#2b5278] text-white' : 'hover:bg-[#202b36]'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold relative shadow-md">
                        <Bot className="w-5 h-5" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#17212b]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold truncate flex items-center gap-1 ${
                          activeChannelId === 'aura' ? 'text-white' : 'text-slate-100'
                        }`}>
                          AURA Cognitive Bot ⚡
                          <span className="bg-sky-500 text-slate-950 px-1 py-0.2 rounded text-[8px] font-extrabold uppercase">
                            BOT
                          </span>
                        </span>
                        <span className={`text-[9px] font-mono ${
                          activeChannelId === 'aura' ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                          Active
                        </span>
                      </div>
                      <p className={`text-[11px] truncate leading-tight ${
                        activeChannelId === 'aura' ? 'text-slate-200' : 'text-slate-400'
                      }`}>
                        {channelConversations.aura[channelConversations.aura.length - 1]?.text || 'Start conversation'}
                      </p>
                    </div>
                  </button>

                  {/* Channel: Saved Messages */}
                  <button
                    onClick={() => setActiveChannelId('saved')}
                    className={`w-full p-3.5 flex items-start gap-3 transition-all text-left ${
                      activeChannelId === 'saved' ? 'bg-[#2b5278] text-white' : 'hover:bg-[#202b36]'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-sky-500 flex items-center justify-center text-white relative shadow-md">
                        <Cloud className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold truncate ${
                          activeChannelId === 'saved' ? 'text-white' : 'text-slate-100'
                        }`}>
                          Saved Messages
                        </span>
                        <span className={`text-[9px] font-mono ${
                          activeChannelId === 'saved' ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                          Folder
                        </span>
                      </div>
                      <p className={`text-[11px] truncate leading-tight ${
                        activeChannelId === 'saved' ? 'text-slate-200' : 'text-slate-400'
                      }`}>
                        {channelConversations.saved[channelConversations.saved.length - 1]?.text || 'No saved entries'}
                      </p>
                    </div>
                  </button>

                  {/* Channel: System logs */}
                  <button
                    onClick={() => setActiveChannelId('system')}
                    className={`w-full p-3.5 flex items-start gap-3 transition-all text-left ${
                      activeChannelId === 'system' ? 'bg-[#2b5278] text-white' : 'hover:bg-[#202b36]'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-[#1c2a38] flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-md">
                        <Terminal className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold truncate flex items-center gap-1 ${
                          activeChannelId === 'system' ? 'text-white' : 'text-slate-100'
                        }`}>
                          System Telemetry Logs
                        </span>
                        <span className={`text-[9px] font-mono ${
                          activeChannelId === 'system' ? 'text-slate-300' : 'text-amber-500/80'
                        }`}>
                          Logs
                        </span>
                      </div>
                      <p className={`text-[11px] truncate font-mono text-xs leading-tight ${
                        activeChannelId === 'system' ? 'text-slate-200' : 'text-slate-400'
                      }`}>
                        {channelConversations.system[channelConversations.system.length - 1]?.text || 'Clean slate'}
                      </p>
                    </div>
                  </button>

                </div>
              </div>

              {/* Chat Viewport (Right Column) */}
              <div className="flex-1 flex flex-col h-full bg-[#0e1621] relative" id="tg-chat-viewport">
                
                {/* Chat Top Header bar */}
                <div className="h-16 border-b border-[#101921] bg-[#17212b] px-5 flex items-center justify-between relative z-15" id="tg-chat-header">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500/20 to-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      {activeChannelId === 'aura' && <Bot className="w-4 h-4" />}
                      {activeChannelId === 'saved' && <Cloud className="w-4 h-4" />}
                      {activeChannelId === 'system' && <Terminal className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
                        {activeChannelId === 'aura' && 'AURA Cognitive Bot ⚡'}
                        {activeChannelId === 'saved' && 'Saved Messages'}
                        {activeChannelId === 'system' && 'System Telemetry Logs'}
                      </h4>
                      <p className="text-[10px] text-sky-400/80 font-mono">
                        {activeChannelId === 'aura' && 'bot • online & processing cognitive scheduling'}
                        {activeChannelId === 'saved' && 'personal cloud storage'}
                        {activeChannelId === 'system' && 'active socket listening on port 3000'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3.5 text-slate-400">
                    <Search className="w-4 h-4 hover:text-slate-200 cursor-pointer" />
                    <MoreVertical className="w-4 h-4 hover:text-slate-200 cursor-pointer" />
                  </div>
                </div>

                {/* Messages Body Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[size:340px] bg-[#0e1621]" id="tg-messages-box">
                  {channelConversations[activeChannelId]?.map((msg) => {
                    const isAura = msg.sender === 'aura';
                    const isSys = msg.sender === 'system';

                    if (isSys) {
                      return (
                        <div key={msg.id} className="flex justify-center my-1.5">
                          <span className="bg-[#1c2a38]/90 border border-slate-800 rounded-lg px-3 py-1 font-mono text-[9px] text-slate-400 max-w-[90%] shadow-md leading-relaxed">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAura ? 'justify-start' : 'justify-end'} items-end gap-2`}
                      >
                        {isAura && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}
                        
                        <div className={`max-w-[70%] rounded-xl px-3.5 py-2.5 text-xs shadow-md leading-relaxed relative ${
                          isAura 
                            ? 'bg-[#182533] text-slate-100 rounded-bl-none border border-slate-800' 
                            : 'bg-[#2b5278] text-white rounded-br-none'
                        }`}>
                          <p className="whitespace-pre-line select-text text-slate-100">{msg.text}</p>
                          
                          {/* Inline parsed Cognitive Task Card */}
                          {msg.extractedTask && (
                            <div className="mt-3.5 bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-left space-y-2.5">
                              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                <span className="text-[9px] font-extrabold uppercase text-sky-400 flex items-center gap-1 tracking-wider">
                                  <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" />
                                  AI Structured Task
                                </span>
                                <span className={`text-[8px] uppercase font-mono px-1.5 py-0.2 rounded-md border ${getPriorityBadge(msg.extractedTask.priorityLevel)}`}>
                                  {msg.extractedTask.priorityLevel}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <h5 className="font-bold text-slate-200 text-xs truncate">{msg.extractedTask.title}</h5>
                                <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{msg.extractedTask.description}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400 pt-1">
                                <div>📅 {new Date(msg.extractedTask.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="text-right">⏱️ {msg.extractedTask.estimatedDuration} mins</div>
                              </div>

                              <button
                                onClick={() => {
                                  if (msg.extractedTask) {
                                    onAddTask(msg.extractedTask);
                                    addSystemLog(`Added Task "${msg.extractedTask.title}" to AURA Main Workspace Queue!`);
                                    alert(`Successfully added task "${msg.extractedTask.title}" to priority list!`);
                                  }
                                }}
                                className="w-full bg-[#2b5278] hover:bg-sky-650 text-white font-sans font-extrabold py-1.5 px-2 rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all uppercase tracking-wider"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add to AURA Queue
                              </button>
                            </div>
                          )}

                          <div className="flex justify-end items-center gap-1 mt-1">
                            <span className={`text-[8px] font-mono font-medium ${isAura ? 'text-slate-500' : 'text-slate-300'}`}>
                              {msg.timestamp}
                            </span>
                            {!isAura && (
                              <CheckCheck className="w-3 h-3 text-sky-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex justify-start items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                        <Bot className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <div className="bg-[#182533] text-slate-100 rounded-xl rounded-bl-none px-4 py-3 text-xs border border-slate-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce delay-0" />
                        <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce delay-150" />
                        <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce delay-300" />
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Message Input Form bar */}
                <form 
                  onSubmit={handleSendMessage} 
                  className="h-16 border-t border-[#101921] bg-[#17212b] px-4 flex items-center gap-3 relative z-10" 
                  id="tg-message-input-form"
                >
                  <button
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-slate-200 transition-all rounded-full hover:bg-slate-800/40"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isLoading}
                    placeholder="Type a scheduling command or general thought..."
                    className="flex-1 bg-[#24303f] border border-transparent rounded-lg px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans disabled:opacity-50"
                  />

                  <button
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-slate-200 transition-all rounded-full hover:bg-slate-800/40"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-2 bg-sky-500 text-slate-950 font-bold rounded-lg shadow-md hover:bg-sky-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Right Side Guide / Sidebar (Takes 1 Column) */}
        <div className="space-y-4" id="telegram-guide-panel">
          
          {/* Quick Stats Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-400" />
              Gateway Diagnostics
            </h4>

            <div className="divide-y divide-slate-800/60 space-y-2">
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-2">
                <span className="text-slate-400">Outbound Host</span>
                <span className="text-slate-300 font-mono text-[9px]">api.telegram.org</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-2">
                <span className="text-slate-400">Incoming Webhooks</span>
                <span className="text-slate-300 font-mono text-[9px]">/api/telegram/webhook</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-2">
                <span className="text-slate-400">AI Cognitive Core</span>
                <span className="text-sky-400 font-bold">AURA-9000 (Active)</span>
              </div>
            </div>
          </div>

          {/* Quick instructions panel */}
          <div className="bg-[#17212b]/40 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg text-[11px]">
            <h4 className="font-bold text-slate-200 flex items-center gap-1">
              <Info className="w-4 h-4 text-sky-400" />
              Quick Command Reference
            </h4>
            <p className="text-[#7f91a4] leading-relaxed">
              When chatting in the simulator sandbox, try typing command statements like:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 font-sans pl-1">
              <li>
                <strong className="text-sky-400 font-semibold font-mono">"add task Review report tomorrow at 5pm"</strong>
              </li>
              <li>
                <strong className="text-sky-400 font-semibold font-mono">"schedule urgent sync at 3pm with director"</strong>
              </li>
              <li>
                <strong className="text-sky-400 font-semibold font-mono">"remind me to call Mom next monday"</strong>
              </li>
            </ul>
            <p className="text-slate-400 italic text-[10px] leading-relaxed">
              AURA's Cognitive AI parses details, maps timeframes, ranks priority automatically, and generates inline save drafts!
            </p>
          </div>

          {/* Real Phone Link Quick Guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-lg text-[11px]">
            <h4 className="font-bold text-slate-200 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Telegram Sandbox Benefits
            </h4>
            <ol className="list-decimal list-inside text-slate-400 space-y-2 leading-relaxed">
              <li><b>Zero Fees</b>: Telegram Bot API is 100% free with no credit card billing requirements.</li>
              <li><b>Simple Authentication</b>: Bot tokens allow instant API calls without complicated OAuth.</li>
              <li><b>Bidirectional Chat</b>: Using our verified webhook, you can chat directly with your scheduler from your Telegram client.</li>
            </ol>
          </div>

        </div>

      </div>
    </div>
  );
}
