import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Cpu, Zap, Activity, ShieldCheck, AlertTriangle, 
  Wrench, Eye, RefreshCw, Layers, CheckCircle2, Sliders, Play, Volume2
} from 'lucide-react';
import { Task } from '../types';

interface RoboticFocusHubProps {
  tasks: Task[];
  onAddTask: (task: {
    title: string;
    description: string;
    category: string;
    dueDate: string;
    estimatedDuration: number;
    priorityLevel: 'high' | 'medium' | 'low';
  }) => void;
  onCompleteTask: (taskId: string) => void;
}

export default function RoboticFocusHub({ tasks, onAddTask, onCompleteTask }: RoboticFocusHubProps) {
  // Robotic States
  const [cpuTemp, setCpuTemp] = useState(42);
  const [powerLevel, setPowerLevel] = useState(85);
  const [efficiency, setEfficiency] = useState(92);
  const [armStatus, setArmStatus] = useState<'Optimal' | 'Calibrating' | 'Needs Service'>('Optimal');
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsLog, setDiagnosticsLog] = useState<string[]>([
    "SYS_INIT: RoboticFocus Core v4.9 Online",
    "MEM_CHECK: 16TB Cybernetic Cache verified",
    "SERVO_MOTOR_A: Operational at 12,000 RPM",
    "OPTICS_FEED: UHD Spectrographic scanner active"
  ]);

  const [activeArmTab, setActiveArmTab] = useState<'status' | 'calibration' | 'telemetry'>('status');
  const [calibrationAngle, setCalibrationAngle] = useState(45);
  const [opticsInstalled, setOpticsInstalled] = useState(false);
  const [maintenanceRequired, setMaintenanceRequired] = useState(true);

  // Play audio feedbacks
  const playCyberFeedback = (type: 'beep' | 'success' | 'alert' | 'charge') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const playTone = (time: number, freq: number, duration: number, oscType: 'sine' | 'square' | 'sawtooth' = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      if (type === 'beep') {
        playTone(now, 880, 0.1, 'sine');
      } else if (type === 'success') {
        playTone(now, 523.25, 0.15, 'sine'); // C5
        playTone(now + 0.12, 659.25, 0.2, 'sine'); // E5
      } else if (type === 'alert') {
        playTone(now, 220, 0.25, 'sawtooth');
        playTone(now + 0.2, 220, 0.25, 'sawtooth');
      } else if (type === 'charge') {
        for (let i = 0; i < 6; i++) {
          playTone(now + i * 0.08, 300 + i * 150, 0.12, 'sine');
        }
      }
    } catch (e) {
      console.warn("AudioContext blocked or unavailable", e);
    }
  };

  // Run Diagnostics sequence
  const handleRunDiagnostics = () => {
    if (diagnosticsRunning) return;
    setDiagnosticsRunning(true);
    playCyberFeedback('beep');
    setDiagnosticsLog(prev => [`[${new Date().toLocaleTimeString()}] INITIATING DYNAMIC DIAGNOSTIC RUN...`, ...prev]);

    const steps = [
      "SCANNING NEURAL SYNAPSES...",
      "TESTING MOTOR TORQUE OVERLOAD...",
      "CHROME BEVEL REFLECTIVITY: OPTIMAL",
      "UPGRADING HEURISTIC CACHE BUFFER...",
      "CALCULATING COGNITIVE EFFICIENCY INDEX..."
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setDiagnosticsLog(prev => [`[${new Date().toLocaleTimeString()}] ${step}`, ...prev]);
        if (idx === steps.length - 1) {
          setDiagnosticsRunning(false);
          setEfficiency(Math.min(100, Math.floor(90 + Math.random() * 11)));
          setCpuTemp(prev => Math.max(35, prev - 4));
          playCyberFeedback('success');
        } else {
          playCyberFeedback('beep');
        }
      }, (idx + 1) * 900);
    });
  };

  // Calibrate servo motors
  const handleCalibrateArm = () => {
    setArmStatus('Calibrating');
    playCyberFeedback('charge');
    setDiagnosticsLog(prev => [`[${new Date().toLocaleTimeString()}] ARM CALIBRATION: INITIATING HIGH-TECH RE-ALIGNMENT...`, ...prev]);
    
    setTimeout(() => {
      setCalibrationAngle(180);
      setTimeout(() => {
        setCalibrationAngle(90);
        setArmStatus('Optimal');
        setEfficiency(prev => Math.min(100, prev + 3));
        setDiagnosticsLog(prev => [`[${new Date().toLocaleTimeString()}] ARM CALIBRATION SUCCESS: 0.02% VIBRATIONAL TOLERANCE`, ...prev]);
        playCyberFeedback('success');
      }, 1000);
    }, 1000);
  };

  // Instant Battery charge
  const handleChargePower = () => {
    playCyberFeedback('charge');
    setPowerLevel(100);
    setDiagnosticsLog(prev => [`[${new Date().toLocaleTimeString()}] LIGHTNING CHARGE DETECTED: POWER CAPACITORS AT 100%`, ...prev]);
  };

  // Upgrade Advanced Optics
  const handleInstallOptics = () => {
    playCyberFeedback('success');
    setOpticsInstalled(true);
    setDiagnosticsLog(prev => [`[${new Date().toLocaleTimeString()}] MOUNTED OPTICAL MODULE: ADVANCED SPECTRO-LENS INSTALLED`, ...prev]);
    // Create actual task
    onAddTask({
      title: 'Robotics Advanced Optics Calibration Run',
      description: 'Run visual benchmarks and optimize spectrum scan accuracy for cybernetic implants.',
      category: 'Work',
      dueDate: new Date(Date.now() + 60 * 60000 * 2).toISOString(),
      estimatedDuration: 45,
      priorityLevel: 'medium'
    });
  };

  // Perform Maintenance task
  const handlePerformMaintenance = () => {
    playCyberFeedback('success');
    setMaintenanceRequired(false);
    setDiagnosticsLog(prev => [`[${new Date().toLocaleTimeString()}] MAINTENANCE ACCOMPLISHED: LUBRICATING SYNAPTIC JOINTS`, ...prev]);
    onAddTask({
      title: 'Complete System Diagnostics Review',
      description: 'Inspect error buffers, trace structural anomalies, and clear robotic debris.',
      category: 'Personal',
      dueDate: new Date(Date.now() + 60 * 60000 * 24).toISOString(),
      estimatedDuration: 15,
      priorityLevel: 'high'
    });
  };

  const activeTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="robotic-focus-hub-deck">
      {/* LEFT HAND: Robotic Status Monitor Widgets (Columns: 4) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Welcome and Avatar HUD Card */}
        <div className="bg-slate-900/90 border border-sky-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          {/* Neon laser scan line effect */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-sky-400 opacity-60 animate-bounce" />
          <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-950 border-2 border-sky-400/50 rounded-2xl flex items-center justify-center relative overflow-hidden group-hover:border-sky-400 transition-colors">
              <Bot className="w-9 h-9 text-sky-400 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-t from-sky-400/10 to-transparent" />
              {/* Spinning corner ticks */}
              <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-sky-400" />
              <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-sky-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-sky-950/60 border border-sky-500/30 text-sky-400 rounded">ROBOTIC_AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 font-display uppercase tracking-wide">Operator Hub</h3>
              <p className="text-xs text-sky-400/80 font-mono">nagarajan1320@gmail.com</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                playCyberFeedback('beep');
                setCpuTemp(prev => Math.min(85, prev + 5));
              }}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-all text-left flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              Overclock Engine
            </button>
            <button
              onClick={handleChargePower}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-all text-left flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Rapid Charge
            </button>
          </div>
        </div>

        {/* Robot Status Monitors */}
        <div className="bg-slate-900/90 border border-sky-500/20 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
              Robot Live Telemetry
            </h4>
            <span className="text-[10px] font-mono text-sky-400 font-bold">ONLINE_STATE</span>
          </div>

          {/* Grid indicators */}
          <div className="grid grid-cols-3 gap-3">
            {/* CPU TEMP */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-center space-y-1 relative group overflow-hidden">
              <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">CPU TEMP</span>
              <span className={`text-lg font-bold block font-mono ${cpuTemp > 50 ? 'text-amber-400 animate-pulse' : 'text-sky-400'}`}>
                {cpuTemp}°C
              </span>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full transition-all duration-500 ${cpuTemp > 50 ? 'bg-amber-400' : 'bg-sky-400'}`} 
                  style={{ width: `${(cpuTemp / 100) * 100}%` }}
                />
              </div>
              {cpuTemp > 40 && (
                <button 
                  onClick={() => {
                    playCyberFeedback('beep');
                    setCpuTemp(35);
                  }}
                  className="absolute inset-0 bg-slate-950/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono text-sky-400 uppercase font-bold cursor-pointer"
                >
                  Cool Engine
                </button>
              )}
            </div>

            {/* POWER LEVEL */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-center space-y-1 relative">
              <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">POWER</span>
              <span className="text-lg font-bold block font-mono text-sky-400">
                {powerLevel}%
              </span>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-sky-400 h-full transition-all duration-500" style={{ width: `${powerLevel}%` }} />
              </div>
            </div>

            {/* EFFICIENCY */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-center space-y-1">
              <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">EFFICIENCY</span>
              <span className="text-lg font-bold block font-mono text-sky-400">
                {efficiency}%
              </span>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-sky-400 h-full transition-all duration-500" style={{ width: `${efficiency}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleRunDiagnostics}
              disabled={diagnosticsRunning}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-sky-950/60 to-blue-950/60 hover:from-sky-900/60 hover:to-blue-900/60 border border-sky-500/30 hover:border-sky-500/60 rounded-xl text-xs font-bold text-sky-400 hover:text-white transition-all shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${diagnosticsRunning ? 'animate-spin' : ''}`} />
              {diagnosticsRunning ? 'Running Heuristics...' : 'Trigger Cybernetic Diagnostic Scan'}
            </button>
          </div>
        </div>

        {/* Status Alerts and Upgrades Registry */}
        <div className="bg-slate-900/90 border border-sky-500/20 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-200">Alerts & Hardware</h4>
          </div>

          <div className="space-y-3">
            {/* Maintenance Check Alert */}
            {maintenanceRequired ? (
              <div className="flex items-start gap-3 p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-mono font-bold text-rose-300 uppercase tracking-wider">Maintenance Check Required</p>
                  <p className="text-slate-400 leading-normal text-[11px]">Synaptic pivot bearings require friction optimization and torque balancing.</p>
                  <button
                    onClick={handlePerformMaintenance}
                    className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 hover:border-rose-500/60 text-[10px] font-bold text-rose-300 rounded transition-all cursor-pointer"
                  >
                    Calibrate Joints
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>All physical joints operating under normal friction.</span>
              </div>
            )}

            {/* Advanced Optics Upgrade */}
            {!opticsInstalled ? (
              <div className="flex items-start gap-3 p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl text-xs">
                <Eye className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-mono font-bold text-sky-300 uppercase tracking-wider">Advanced Optics: Ready to Install</p>
                  <p className="text-slate-400 leading-normal text-[11px]">Install spectral lens array to highlight hidden priority tasks.</p>
                  <button
                    onClick={handleInstallOptics}
                    className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-500/30 hover:border-sky-500/60 text-[10px] font-bold text-sky-300 rounded transition-all cursor-pointer"
                  >
                    Mount Optical Module
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-sky-950/20 border border-sky-500/20 rounded-xl text-xs text-sky-400">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>UHD Spectral Lens array installed and active!</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CENTER STAGE: Arm Module Detail View & Interactive Controls (Columns: 5) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900/90 border border-sky-500/20 rounded-2xl p-5 shadow-lg flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-200">
                Integrated Arm Module Controls
              </h4>
              <p className="text-[10px] text-slate-400 font-mono">ID: ARM-MOD-908</p>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
              armStatus === 'Optimal' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
              armStatus === 'Calibrating' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse' :
              'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {armStatus}
            </span>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-800/50 my-3">
            {(['status', 'calibration', 'telemetry'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  playCyberFeedback('beep');
                  setActiveArmTab(tab);
                }}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
                  activeArmTab === tab 
                    ? 'border-sky-500 text-sky-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-6 relative">
            {/* Embedded Cybernetic Arm Animation Canvas */}
            <div className="w-full max-w-[280px] h-[220px] rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center relative overflow-hidden">
              {/* Sci-fi scanner overlay lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:100%_8px] pointer-events-none" />
              <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent animate-pulse" />

              {/* Graphic container */}
              <motion.div 
                className="relative w-44 h-44 flex items-center justify-center"
                animate={armStatus === 'Calibrating' ? {
                  rotate: [0, 45, -30, 0],
                  scale: [1, 1.05, 0.95, 1]
                } : {
                  rotate: [0, 2, -2, 0]
                }}
                transition={{
                  duration: armStatus === 'Calibrating' ? 2 : 6,
                  repeat: armStatus === 'Calibrating' ? 0 : Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Outer ring */}
                <svg className="absolute inset-0 w-full h-full text-sky-500/25 animate-spin-slow" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="8,6" />
                </svg>

                {/* Inner compass elements */}
                <svg className="absolute w-32 h-32 text-sky-500/40" viewBox="0 0 100 100">
                  <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4,4" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4,4" />
                </svg>

                {/* Simulated Cybernetic Mechanical Hand/Arm Graphic */}
                <div className="absolute text-center space-y-1">
                  <div className="w-16 h-16 rounded-full border-2 border-sky-400/40 bg-slate-900/90 flex items-center justify-center theme-shadow-brand-sm mx-auto">
                    <Cpu className={`w-8 h-8 text-sky-400 ${armStatus === 'Calibrating' ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-[9px] font-mono text-sky-400 font-bold block uppercase tracking-widest mt-2">
                    {armStatus === 'Calibrating' ? 'RE-ALIGNING' : 'READY'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Angle: {calibrationAngle}°</span>
                </div>
              </motion.div>
            </div>

            {/* Tab content displays */}
            <div className="w-full mt-5 space-y-2.5 text-xs">
              {activeArmTab === 'status' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5 leading-relaxed">
                  <p className="text-slate-300 font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    Hydraulic Pressure: <span className="text-sky-400 font-mono">120 bar (Optimal)</span>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Arm module handles spatial timeline adjustments, sorting tasks dynamically by cognitive urgency and rendering holographic interfaces.
                  </p>
                </div>
              )}

              {activeArmTab === 'calibration' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Micro-motor calibration angle:</span>
                    <span className="font-mono text-sky-400 font-bold">{calibrationAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={calibrationAngle}
                    onChange={(e) => {
                      setCalibrationAngle(Number(e.target.value));
                    }}
                    className="w-full accent-sky-400 bg-slate-900 h-1.5 rounded-lg appearance-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleCalibrateArm}
                      disabled={armStatus === 'Calibrating'}
                      className="px-3.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-500/30 hover:border-sky-500/60 text-[10px] font-bold text-sky-300 rounded-xl transition-all cursor-pointer"
                    >
                      Autotune Actuators
                    </button>
                  </div>
                </div>
              )}

              {activeArmTab === 'telemetry' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1 font-mono text-[10px] text-slate-400 max-h-[85px] overflow-y-auto">
                  <p className="text-sky-400">&gt; motor_a_temp: 34.2 C</p>
                  <p>&gt; pivot_stress: 0.005 N/m</p>
                  <p>&gt; kinetic_precision_rate: 99.998%</p>
                  <p>&gt; load_balance: 50.0 / 50.0</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT HAND: Diagnostics Logs & High-Tech Task Pipeline (Columns: 3) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Real-time Diagnostics Terminal */}
        <div className="bg-slate-900/90 border border-sky-500/20 rounded-2xl p-5 shadow-lg flex flex-col h-[230px]">
          <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-3">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-200">
              Heuristic Trace Logs
            </h4>
          </div>

          <div className="flex-1 mt-3 bg-slate-950/80 border border-slate-850 rounded-xl p-3 font-mono text-[9px] text-sky-400/90 overflow-y-auto space-y-1.5">
            {diagnosticsLog.map((log, idx) => (
              <p key={idx} className="leading-relaxed whitespace-pre-wrap break-all">
                {log}
              </p>
            ))}
          </div>
        </div>

        {/* Task Pipeline Integration */}
        <div className="bg-slate-900/90 border border-sky-500/20 rounded-2xl p-5 shadow-lg flex flex-col h-[230px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-200">
                Robotic Task Pipeline
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">{activeTasks.length} pending</span>
          </div>

          <div className="flex-1 mt-3 space-y-2 overflow-y-auto pr-1">
            {activeTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs text-slate-500 font-mono">No active micro-tasks found in pipeline.</p>
              </div>
            ) : (
              activeTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="p-2.5 bg-slate-950/60 border border-slate-850 rounded-xl flex items-start justify-between gap-2 hover:border-sky-500/30 transition-all">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono">
                      <span className={`px-1 rounded ${
                        task.priorityLevel === 'high' ? 'bg-rose-950/50 text-rose-400 border border-rose-500/20' : 'bg-slate-900 text-slate-400'
                      }`}>
                        {task.priorityLevel.toUpperCase()}
                      </span>
                      <span className="text-slate-500">
                        {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onCompleteTask(task.id)}
                    className="p-1 text-slate-500 hover:text-emerald-400 bg-slate-900 hover:bg-emerald-950/40 rounded border border-slate-800 hover:border-emerald-500/30 transition-colors cursor-pointer"
                    title="Mark Complete"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
