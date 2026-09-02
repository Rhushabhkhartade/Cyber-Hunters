import { useState, useEffect } from "react";
import { Shield, Radio, Terminal, Cpu } from "lucide-react";

export default function Landing({ setPage }) {
  const [activeThreats, setActiveThreats] = useState(148);
  const [logs, setLogs] = useState([
    { id: 1, time: "00:19:24", status: "BLOCKED", msg: "Synthetic audio clone signature matched on IP: 184.22.109.5", type: "audio" },
    { id: 2, time: "00:19:11", status: "CLEARED", msg: "Linguistic authenticity check passed for Zoom feed ID #884", type: "clean" },
    { id: 3, time: "00:18:49", status: "WARN", msg: "Facial micro-expression anomaly flagged (0.84 probability)", type: "video" }
  ]);

  // Simulate updating dashboard counts and logs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveThreats(prev => prev + (Math.random() > 0.6 ? 1 : -1));

      if (Math.random() > 0.7) {
        const timestamp = new Date().toLocaleTimeString();
        const templates = [
          { status: "BLOCKED", msg: `Intercepted VoIP spoof targeting Treasury officer: Clone model #V7`, type: "audio" },
          { status: "BLOCKED", msg: `Generative adversarial facial warp blocked during live KYC review`, type: "video" },
          { status: "CLEARED", msg: `Secure channel verified - Video stream checksum authentic`, type: "clean" },
          { status: "WARN", msg: `Voice rhythm inconsistency detected on incoming Slack Huddle`, type: "audio" }
        ];
        const newLog = {
          id: Date.now(),
          time: timestamp,
          ...templates[Math.floor(Math.random() * templates.length)]
        };
        setLogs(prev => [newLog, ...prev.slice(0, 5)]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-10 flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-6xl px-4 pt-16 pb-12 text-center md:pt-24 md:pb-20 relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-radial-glow opacity-60 pointer-events-none" />

        {/* Top Active Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyber-purple/40 bg-cyber-purple/10 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-6 animate-pulse shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Sentinel AI Threat Core Active v4.2.1
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight font-display text-white mb-6 leading-tight">
          Defending Networks From <br />
          <span className="bg-gradient-to-r from-purple-400 via-violet-500 to-cyan-400 bg-clip-text text-transparent glow-text-purple">
            Generative Attacks
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-400 mb-10 font-sans leading-relaxed">
          Real-Time Deepfake and Social Engineering Detector. SentinelAI stops synthetic audio clones, face swaps, and identity fraud attacks before they bypass your perimeter.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={() => setPage("live")}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyber-purple to-purple-800 rounded-lg text-white font-semibold font-display shadow-lg hover:shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all duration-300 border border-purple-500/30 cursor-pointer"
          >
            Deploy Live Scan
          </button>
          <button
            onClick={() => setPage("dashboard")}
            className="w-full sm:w-auto px-8 py-4 bg-cyber-dark hover:bg-cyber-navy/80 text-white font-semibold font-display rounded-lg border border-purple-500/30 transition-all duration-300 hover:border-cyan-500/40 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-5 h-5 text-cyan-400" />
            Threat Center
          </button>
        </div>
      </section>

      {/* Cyber Operations Simulator Block */}
      <section className="w-full max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        
        {/* Network Health & Threats Indicator */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial-glow opacity-30 pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30">
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white tracking-wide">Threat Core</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-1">Active Interceptions</span>
                <span className="text-4xl font-bold font-display text-purple-400 tracking-tight glow-text-purple">{activeThreats}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-1">Defense Confidence</span>
                <span className="text-4xl font-bold font-display text-cyan-400 tracking-tight glow-text-cyan">99.98%</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-purple-500/10">
            <span className="text-xs text-gray-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              All micro-neural networks operational
            </span>
          </div>
        </div>

        {/* Global Threat Map Simulation */}
        <div className="lg:col-span-2 glass-panel-cyan rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30">
                <Radio className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white tracking-wide">Live Attack Vectors Map</h3>
            </div>
            <span className="text-xs text-cyan-400 font-mono border border-cyan-500/20 px-2 py-1 rounded bg-cyan-950/20">
              SECURE STREAM
            </span>
          </div>

          {/* Graphical Mock Grid for Threat Map */}
          <div className="relative h-48 md:h-56 bg-cyber-dark/80 rounded border border-cyan-500/10 cyber-grid overflow-hidden flex items-center justify-center">
            {/* Pulsing Interception Spots */}
            <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-500/80 animate-ping absolute"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-[9px] text-purple-400 font-mono mt-1 bg-black/60 px-1 rounded border border-purple-500/20">Audio Fake IP</span>
            </div>

            <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/80 animate-ping absolute"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-[9px] text-red-400 font-mono mt-1 bg-black/60 px-1 rounded border border-red-500/20">DDoS Bypass</span>
            </div>

            <div className="absolute top-1/2 left-2/3 flex flex-col items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-cyan-500/80 animate-ping absolute"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              <span className="text-[9px] text-cyan-400 font-mono mt-1 bg-black/60 px-1 rounded border border-cyan-500/20">VOIP Filter</span>
            </div>

            <div className="absolute top-1/3 right-1/3 flex flex-col items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500/80 animate-ping absolute"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-[9px] text-amber-400 font-mono mt-1 bg-black/60 px-1 rounded border border-amber-500/20">Video Synth</span>
            </div>

            <div className="absolute inset-x-0 bottom-0 py-1 bg-black/40 border-t border-cyan-500/10 text-center text-[10px] text-gray-500 font-mono">
              GPS Vector Matrix: 34.0522° N, 118.2437° W | Live Intercept Protocol Active
            </div>
          </div>
        </div>
      </section>

      {/* Live System Log Ticker */}
      <section className="w-full max-w-6xl px-4 mb-16">
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-purple-500/10 mb-4">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h3 className="font-display font-semibold text-lg text-white">Live Interception Terminal</h3>
            </div>
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-ping"></span>
          </div>

          <div className="space-y-3 font-mono text-sm max-h-56 overflow-y-auto pr-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded border ${
                  log.status === "BLOCKED"
                    ? "border-red-500/20 bg-red-950/10 text-red-400"
                    : log.status === "WARN"
                    ? "border-amber-500/20 bg-amber-950/10 text-amber-400"
                    : "border-emerald-500/20 bg-emerald-950/10 text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs">[{log.time}]</span>
                  <span className="font-bold tracking-wider text-xs px-2 py-0.5 rounded border border-current bg-black/40">
                    {log.status}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-200">{log.msg}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1 sm:mt-0 uppercase tracking-widest">
                  Vector: {log.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access Portal Grid */}
      <section className="w-full max-w-6xl px-4 py-8 mb-16">
        <h2 className="text-center font-display text-2xl md:text-3xl text-white mb-10 font-bold">
          Access Security Controls
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => setPage("upload-audio")}
            className="glass-panel hover:border-purple-400/40 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 group"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20">
              <Radio className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-display font-semibold text-lg text-white mb-2">Voice Clone Profiler</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Upload call recordings, voice memos, or podcasts to scan for speech pattern synthesis and neural vocal cloning signatures.
            </p>
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider group-hover:underline">
              Analyze Audio &rarr;
            </span>
          </div>

          <div 
            onClick={() => setPage("upload-video")}
            className="glass-panel hover:border-purple-400/40 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 group"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20">
              <Cpu className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-display font-semibold text-lg text-white mb-2">Synthetic Video Scanner</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Perform structural frame analyses to spot generative skin mapping, eye blink mismatches, and synthetic facial warping.
            </p>
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider group-hover:underline">
              Analyze Video &rarr;
            </span>
          </div>

          <div 
            onClick={() => setPage("live")}
            className="glass-panel hover:border-cyan-400/40 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 group"
          >
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="font-display font-semibold text-lg text-white mb-2">Live Stream Inspector</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Integrate directly into Zoom, Teams, or cellular streams to scan active voices and transcription text for malicious social engineering.
            </p>
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider group-hover:underline">
              Initialize Live Stream &rarr;
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
