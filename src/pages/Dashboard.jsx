import { useState } from "react";
import { Shield, Activity, HardDrive, BellRing, Cpu, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagnosticsLogs, setDiagnosticsLogs] = useState([]);
  
  const metrics = [
    { title: "System Security Score", value: "98.8%", icon: <Shield className="w-5 h-5 text-cyan-400" /> },
    { title: "Streams Vetted (24h)", value: "1,248", icon: <Activity className="w-5 h-5 text-purple-400" /> },
    { title: "Interceptions Flagged", value: "84", icon: <BellRing className="w-5 h-5 text-red-400" /> },
    { title: "Operational Nodes", value: "48 / 48", icon: <HardDrive className="w-5 h-5 text-purple-400" /> }
  ];

  const chartData = [
    { day: "Mon", count: 12, height: "45%" },
    { day: "Tue", count: 18, height: "65%" },
    { day: "Wed", count: 8, height: "30%" },
    { day: "Thu", count: 24, height: "90%" },
    { day: "Fri", count: 15, height: "55%" },
    { day: "Sat", count: 6, height: "20%" },
    { day: "Sun", count: 10, height: "38%" }
  ];

  const runVettingDiagnostic = () => {
    setRunningDiagnostics(true);
    setDiagnosticsLogs(["Initializing node auditing system..."]);
    
    const steps = [
      { text: "Auditing edge communication channels... [SAFE]", delay: 1000 },
      { text: "Verifying model signature hashes... [AUTHENTIC]", delay: 2200 },
      { text: "Scanning decentralized database integrity... [SYNCED]", delay: 3500 },
      { text: "Recalibrating mel-spectrogram thresholds... [OPTIMIZED]", delay: 4800 },
      { text: "Sentinel Security Diagnostics Complete. System 100% operational.", delay: 6000 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setDiagnosticsLogs((prev) => [...prev, step.text]);
        if (step.text.includes("Complete")) {
          setRunningDiagnostics(false);
        }
      }, step.delay);
    });
  };

  return (
    <div className="relative z-10 w-full max-w-6xl px-4 py-12 md:py-16">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-purple-500/10 mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-white mb-1">Threat Operations Center</h2>
          <p className="text-sm text-gray-400">Operational Overview for Sentinel Security Node Cluster</p>
        </div>
        <button
          disabled={runningDiagnostics}
          onClick={runVettingDiagnostic}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-800 hover:scale-105 active:scale-95 text-white font-semibold font-display text-xs tracking-wider rounded border border-purple-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100"
        >
          <Cpu className={`w-4 h-4 ${runningDiagnostics ? "animate-spin" : ""}`} />
          {runningDiagnostics ? "DIAGNOSTICS RUNNING" : "RUN DIAGNOSTIC CHECKS"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((m, i) => (
          <div key={i} className="glass-panel rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-mono block mb-1 uppercase tracking-wider">{m.title}</span>
              <span className="text-2xl font-bold font-display text-white">{m.value}</span>
            </div>
            <div className="p-3 bg-purple-950/20 border border-purple-500/10 rounded-lg">
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Interceptions Chart (Custom CSS) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="font-display font-semibold text-white mb-2 text-base">Weekly Deepfake Interceptions</h3>
            <p className="text-xs text-gray-500 mb-6">Threat blocks compiled across VoIP and video channels</p>
          </div>
          
          {/* Chart visual grid */}
          <div className="h-44 flex items-end justify-between gap-2 border-b border-purple-500/15 pb-2 relative">
            {chartData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <span className="text-[10px] font-mono text-purple-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </span>
                <div
                  className="w-full max-w-[28px] bg-gradient-to-t from-purple-950 via-purple-600 to-cyan-400 rounded-t border-t border-cyan-400/40 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.2)] group-hover:brightness-110"
                  style={{ height: d.height }}
                />
                <span className="text-xs font-mono text-gray-500 mt-2">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Distribution Vector Breakdown */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-white mb-2 text-base">Threat Vectors</h3>
            <p className="text-xs text-gray-500 mb-6">Distribution breakdown of active cyber intercepts</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-1.5">
                <span>Audio Cloning (VoIP/KYC)</span>
                <span className="text-purple-400">45%</span>
              </div>
              <div className="w-full bg-cyber-dark border border-purple-500/10 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: "45%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-1.5">
                <span>Video Face-Swap (KYC/Streams)</span>
                <span className="text-cyan-400">30%</span>
              </div>
              <div className="w-full bg-cyber-dark border border-cyan-500/10 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full" style={{ width: "30%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-1.5">
                <span>Transcriptive Phishing Scams</span>
                <span className="text-amber-400">25%</span>
              </div>
              <div className="w-full bg-cyber-dark border border-amber-500/10 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: "25%" }} />
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 font-mono mt-6 text-center border-t border-purple-500/10 pt-4">
            Updates synchronize every 60 seconds
          </div>
        </div>
      </div>

      {/* Diagnostics Logs Box */}
      {diagnosticsLogs.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 font-mono text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-purple-500/10 mb-3 text-white">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            <span>Operational Diagnostic Feed</span>
          </div>
          <div className="space-y-1 text-gray-400">
            {diagnosticsLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-purple-500">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
