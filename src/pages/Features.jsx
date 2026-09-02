import { Mic, Video, Brain, Zap, Key, Link } from "lucide-react";

export default function Features() {
  const featureList = [
    {
      icon: <Mic className="w-6 h-6 text-purple-400" />,
      title: "Voice Biometric Auditing",
      description: "Analyze vocal resonance, breath pauses, pitch variance, and speech compression anomalies to identify synthesized or cloned voices with 99.8% precision."
    },
    {
      icon: <Video className="w-6 h-6 text-cyan-400" />,
      title: "Generative Face & Texture Scanner",
      description: "Identify AI video deepfakes through facial blood-flow simulation scans, lip-sync alignment verification, and generative boundary textures."
    },
    {
      icon: <Brain className="w-6 h-6 text-purple-400" />,
      title: "Linguistic Social Engineering Guard",
      description: "Scans active transcripts using NLP models to alert users of psychological tactics, authority scams, and high-urgency credential traps."
    },
    {
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
      title: "Sub-100ms Edge Scans",
      description: "Operates globally over decentralized secure edge nodes, providing active interception feeds without causing delay or latency on live calls."
    },
    {
      icon: <Key className="w-6 h-6 text-purple-400" />,
      title: "Cryptographic Stream Attestation",
      description: "Cryptographically sign cleared video or audio feeds using decentralised identity logs, proving channel integrity to client endpoints."
    },
    {
      icon: <Link className="w-6 h-6 text-cyan-400" />,
      title: "Unified Communication Connectors",
      description: "Deploy in 5 minutes using SDK extensions and API webhooks for Slack Huddles, Zoom, Microsoft Teams, and standard SIP/VoIP trunks."
    }
  ];

  return (
    <div className="relative z-10 w-full max-w-6xl px-4 py-12 md:py-16">
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-radial-glow opacity-30 pointer-events-none" />
        <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-4">
          Defensive Capabilities
        </h2>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          SentinelAI offers full-spectrum protection, securing your organization's voice channels and video communications against generative impersonation attacks.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {featureList.map((f, i) => (
          <div
            key={i}
            className="glass-panel hover:border-purple-500/40 rounded-xl p-8 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-purple-950/20 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-950/40">
                {f.icon}
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-3 tracking-wide">
                {f.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed font-sans">
                {f.description}
              </p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-purple-500/5 flex items-center justify-between text-xs text-gray-500 font-mono">
              <span>LATENCY SCORE: {"<"}100ms</span>
              <span className="text-purple-400 uppercase tracking-widest font-semibold group-hover:underline">Active Defense</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Benchmark Statistics Panel */}
      <div className="glass-panel-cyan rounded-xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial-cyan-glow opacity-30 pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
          <div>
            <h4 className="text-4xl md:text-5xl font-bold font-display text-cyan-400 mb-2 glow-text-cyan">
              99.9%
            </h4>
            <p className="text-xs uppercase font-mono tracking-widest text-gray-400">
              Deepfake Detection Accuracy
            </p>
          </div>
          <div>
            <h4 className="text-4xl md:text-5xl font-bold font-display text-purple-400 mb-2 glow-text-purple">
              &lt; 90ms
            </h4>
            <p className="text-xs uppercase font-mono tracking-widest text-gray-400">
              AI Analysis Inference Speed
            </p>
          </div>
          <div>
            <h4 className="text-4xl md:text-5xl font-bold font-display text-white mb-2">
              1.2B+
            </h4>
            <p className="text-xs uppercase font-mono tracking-widest text-gray-400">
              Call Stream Hours Audited
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
