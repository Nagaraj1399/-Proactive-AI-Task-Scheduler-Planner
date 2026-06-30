import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Check, 
  HelpCircle, 
  ArrowRight,
  Plus,
  Volume2,
  VolumeX,
  Volume1,
  User,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Task } from '../types';

interface VoiceAssistantProps {
  onAddTaskFromVoice: (parsedTask: any) => void;
  tasks: Task[];
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export default function VoiceAssistant({ onAddTaskFromVoice, tasks }: VoiceAssistantProps) {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceRate, setVoiceRate] = useState<number>(1.05);
  const [voiceProfile, setVoiceProfile] = useState<string>('aura');
  
  // Rolling chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      sender: 'assistant', 
      text: "AURA-9000 Online. I am your cognitive voice agent. Ask me any productivity question, or say things like 'Remind me to draft project milestones tomorrow at 9 AM'!" 
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const samplePrompts = [
    "Draft the Q3 marketing slide deck tomorrow morning at 10 AM, takes 90 minutes",
    "Remind me to buy groceries for personal needs at 5 PM today, takes 30 minutes",
    "How can I manage my time better when I have high priority tasks?",
    "Add a health habit training session for 8:00 AM on Sunday, takes 60 minutes",
  ];

  // Store settings in ref so SpeechRecognition callbacks can access current parameters without re-binding
  const settingsRef = useRef({ isMuted, voiceRate, voiceProfile });
  useEffect(() => {
    settingsRef.current = { isMuted, voiceRate, voiceProfile };
  }, [isMuted, voiceRate, voiceProfile]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Text to Speech Helper
  const speakResponse = (text: string) => {
    if (settingsRef.current.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settingsRef.current.voiceRate;
      
      if (settingsRef.current.voiceProfile === 'nova') {
        utterance.pitch = 1.35; // Bright high-frequency agent
      } else if (settingsRef.current.voiceProfile === 'echo') {
        utterance.pitch = 0.75; // Deep resonant commander
      } else {
        utterance.pitch = 1.05; // Default balanced cognitive agent
      }
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google US English') || 
        voice.name.includes('Natural') || 
        voice.lang.startsWith('en-US')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS Speech failed:", e);
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
        speakResponse("Listening. Please speak now.");
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        
        // Append user transcript to chat log and process
        setMessages(prev => [...prev, { sender: 'user', text }]);
        handleParseText(text);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setSpeechError(
            "Microphone permission blocked. This is standard security inside web iframes. Open the application in a new tab to activate live microphone streaming, or use the interactive input below!"
          );
          speakResponse("Microphone access blocked. Standard sandbox protection active. Please type your message.");
        } else {
          setSpeechError(`Microphone notice: ${event.error}. Feel free to type in your command instead!`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      setSpeechError("Speech recognition API is not supported in this browser environment. Type your instructions below!");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      setTranscript('');
      setParsedResult(null);
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleParseText = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsParsing(true);
    setTranscript('');
    
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceInput: textToParse, tasks })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Append AURA's conversational text reply
        const replyText = result.chatResponse || "I have analyzed your request successfully.";
        setMessages(prev => [...prev, { sender: 'assistant', text: replyText }]);
        speakResponse(replyText);

        if (result.extractedTask) {
          // Store extracted task draft for confirmation
          setParsedResult(result.extractedTask);
        } else {
          setParsedResult(null);
        }
      } else {
        const errText = "I encountered an issue processing that instruction. Please try again.";
        setMessages(prev => [...prev, { sender: 'assistant', text: errText }]);
        speakResponse(errText);
      }
    } catch (error) {
      console.error(error);
      const errText = "Connection offline. Unable to complete cognitive parsing.";
      setMessages(prev => [...prev, { sender: 'assistant', text: errText }]);
      speakResponse(errText);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmTask = () => {
    if (!parsedResult) return;
    onAddTaskFromVoice(parsedResult);
    
    const confirmMessage = `Synchronized! I've scheduled "${parsedResult.title}" on your timeline grid.`;
    setMessages(prev => [...prev, { sender: 'assistant', text: confirmMessage }]);
    speakResponse(confirmMessage);
    
    setParsedResult(null);
  };

  const submitTextCommand = () => {
    if (!transcript.trim()) return;
    const userText = transcript;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    handleParseText(userText);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="voice-assistant-view">
      {/* Voice / Chat Stream Console */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[420px] shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 theme-text-brand animate-pulse" />
              <div>
                <h3 className="text-sm font-semibold text-slate-100">AURA-9000 Cognitive Stream</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Neural Dialog & Task Parser</p>
              </div>
            </div>
            
            {/* Audio Profile Controls */}
            <div className="flex items-center gap-2 bg-slate-950/60 rounded-lg p-1 border border-slate-800/50">
              <select 
                value={voiceProfile} 
                onChange={(e) => setVoiceProfile(e.target.value)}
                className="bg-transparent border-none text-[10px] text-slate-300 font-semibold focus:outline-none cursor-pointer pr-1"
                title="Select Voice Profile"
              >
                <option value="aura">Voice: Aura (F)</option>
                <option value="nova">Voice: Nova (F-Hi)</option>
                <option value="echo">Voice: Echo (M)</option>
              </select>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-1 rounded hover:bg-slate-800 transition-colors ${isMuted ? 'text-rose-400' : 'theme-text-brand'}`}
                title={isMuted ? "Unmute Assistant voice response" : "Mute Assistant voice response"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Chat Bubble Logs */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4" id="chat-scroller">
            {messages.map((msg, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg theme-bg-brand-20 border theme-border-brand-30 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 theme-text-brand" />
                  </div>
                )}
                
                <div className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed shadow ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-cyan-600/30 to-blue-600/20 border border-cyan-500/30 text-slate-100 rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-300 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Interactive Mic and Input Bar */}
          <div className="space-y-3 pt-3 border-t border-slate-800/60">
            {speechError && (
              <p className="text-[10px] text-amber-400/90 leading-normal bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 font-sans">
                {speechError}
              </p>
            )}

            <div className="flex items-center gap-3">
              {/* Mic Deck Button */}
              <button
                type="button"
                id="btn-voice-recording-toggle"
                onClick={toggleRecording}
                className={`p-3.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                  isRecording 
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse' 
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100'
                }`}
              >
                {isRecording ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
              </button>

              {/* Text Input Container */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={transcript}
                  id="voice-command-input"
                  onChange={(e) => setTranscript(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitTextCommand();
                    }
                  }}
                  placeholder={isRecording ? "Listening to voice input..." : "Type schedules or chat, e.g. 'Add work task tomorrow at 10 AM'"}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-200 outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  id="btn-voice-parse"
                  onClick={submitTextCommand}
                  disabled={isParsing || !transcript.trim()}
                  className="absolute right-2 p-1.5 rounded-lg theme-text-brand hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Send input to AURA"
                >
                  {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Draft Preview & Quick triggers */}
      <div className="flex flex-col space-y-4">
        {/* Extracted Card Draft Block */}
        <AnimatePresence mode="wait">
          {parsedResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/95 border theme-border-brand-40 rounded-2xl p-5 space-y-4 shadow-xl"
              id="aura-extraction-preview"
            >
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">AURA Parameter Draft</h4>
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Decoded Workspace Coordinates</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">Task Title</span>
                  <p className="text-slate-100 font-medium">{parsedResult.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500">Category</span>
                    <p className="text-slate-300 font-semibold">{parsedResult.category}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500">Estimated duration</span>
                    <p className="text-slate-300 font-semibold">{parsedResult.estimatedDuration} minutes</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500">Priority Level</span>
                    <p className={`font-semibold capitalize ${
                      parsedResult.priorityLevel === 'high' ? 'text-rose-400' :
                      parsedResult.priorityLevel === 'medium' ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {parsedResult.priorityLevel}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500">Inferred Due Date</span>
                    <p className="text-slate-300 truncate" title={parsedResult.dueDate}>
                      {new Date(parsedResult.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="btn-voice-confirm-commit"
                onClick={handleConfirmTask}
                className="w-full flex items-center justify-center gap-2 py-2 theme-bg-brand hover:brightness-110 text-slate-950 font-bold text-xs rounded-xl shadow theme-shadow-brand-sm transition-all"
              >
                <Check className="w-4 h-4 stroke-[3px]" />
                Commit to Scheduler
              </button>
            </motion.div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-center flex flex-col items-center justify-center h-[180px] text-slate-500 space-y-2">
              <HelpCircle className="w-8 h-8 opacity-40 text-slate-600" />
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Queue is Clear</span>
                <p className="text-[10px] text-slate-500 leading-normal px-4">When AURA extracts structured task schedules, parameters will materialize here.</p>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Dynamic Smart Triggers */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl flex-1 flex flex-col">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
              <Sparkles className="w-4 h-4 theme-text-brand" />
              <h4 className="text-xs font-semibold text-slate-200">Interactive Cognitive Actions</h4>
            </div>
            
            <button
              type="button"
              id="btn-voice-audit-deadlines"
              onClick={() => {
                const text = "Audit my active task list and tell me about my upcoming deadlines.";
                setMessages(prev => [...prev, { sender: 'user', text }]);
                handleParseText(text);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl text-xs font-bold text-cyan-400 hover:text-white transition-all shadow-md group cursor-pointer"
            >
              <Bell className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform animate-bounce" />
              Voice Audit Active Deadlines
            </button>
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
              <Sparkles className="w-4 h-4 theme-text-brand" />
              <h4 className="text-xs font-semibold text-slate-200">Interactive Preset Queries</h4>
            </div>
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 flex-1">
              <button
                type="button"
                onClick={() => {
                  setTranscript("Any urgent high-priority deadlines today?");
                  speakResponse(`Selected query. Click send to execute.`);
                }}
                className="w-full text-left p-2.5 bg-slate-950/80 hover:bg-slate-950 hover:border-slate-700/80 border border-slate-800/50 rounded-xl text-[11px] text-slate-400 hover:text-slate-200 transition-all leading-normal flex items-start gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">Any urgent high-priority deadlines today?</span>
              </button>

              {samplePrompts.map((promptText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTranscript(promptText);
                    speakResponse(`Selected query. Click send to execute.`);
                  }}
                  className="w-full text-left p-2.5 bg-slate-950/80 hover:bg-slate-950 hover:border-slate-700/80 border border-slate-800/50 rounded-xl text-[11px] text-slate-400 hover:text-slate-200 transition-all leading-normal flex items-start gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{promptText}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
