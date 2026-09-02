import { useState } from "react";
import { Terminal, Shield, Send, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState("webRTC");
  const [severity, setSeverity] = useState("medium"); // low, medium, critical
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const resetForm = () => {
    setSubmitted(false);
    setName("");
    setEmail("");
    setMessage("");
    setSeverity("medium");
  };

  return (
    <div className="relative z-10 w-full max-w-4xl px-4 py-12 md:py-16">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-4">
          Contact Core Defense
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Request system integrations or report synthetic security vulnerabilities. Critical incident dispatches route directly to SecOps standby channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-radial-glow opacity-25 pointer-events-none" />

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1.5 font-bold">
                    User Signature
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Signature Name"
                    className="w-full bg-cyber-dark border border-purple-500/20 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1.5 font-bold">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="secops@entity.com"
                    className="w-full bg-cyber-dark border border-purple-500/20 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1.5 font-bold">
                  Communication Target
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-cyber-dark border border-purple-500/20 rounded px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500/60 font-sans"
                >
                  <option value="webRTC">WebRTC Audio/Video Streaming API</option>
                  <option value="sip">VoIP SIP Gateways</option>
                  <option value="appHook">Teams/Zoom Hook Configuration</option>
                  <option value="custom">Enterprise Custom Solution</option>
                </select>
              </div>

              {/* Severity buttons */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-2 font-bold">
                  Incident Severity Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSeverity("low")}
                    className={`py-2 rounded font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                      severity === "low"
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400"
                        : "border-gray-500/20 text-gray-500 bg-cyber-dark"
                    }`}
                  >
                    LOW (TEST/DEV)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity("medium")}
                    className={`py-2 rounded font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                      severity === "medium"
                        ? "bg-purple-950/40 border-purple-500/50 text-purple-400"
                        : "border-gray-500/20 text-gray-500 bg-cyber-dark"
                    }`}
                  >
                    MEDIUM (INFO SEC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity("critical")}
                    className={`py-2 rounded font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                      severity === "critical"
                        ? "bg-red-950/40 border-red-500/50 text-red-400 glow-red animate-pulse"
                        : "border-gray-500/20 text-gray-500 bg-cyber-dark"
                    }`}
                  >
                    CRITICAL (ATTACK RUNNING)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1.5 font-bold">
                  Description Payload
                </label>
                <textarea
                  required
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your request or integration specs..."
                  className="w-full bg-cyber-dark border border-purple-500/20 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-800 text-white font-semibold font-display text-xs tracking-wider rounded border border-purple-500/30 flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all duration-300 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                DISPATCH SECURE PACKET
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center py-10">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4 animate-bounce" />
              <h3 className="text-lg font-bold font-display text-white mb-2">
                Packet Transmitted Successfully
              </h3>
              <p className="text-xs text-gray-400 text-center max-w-sm leading-relaxed mb-6 font-sans">
                Secure link connection verified. Incidents set with <strong className="text-red-400">{severity.toUpperCase()}</strong> threat index route directly to our standby operations grid. Vetting dispatch response time estimate: 12 minutes.
              </p>
              
              <button
                onClick={resetForm}
                className="px-5 py-2 border border-purple-500/30 text-white text-xs font-semibold rounded hover:bg-cyber-navy/80 tracking-wider transition-all duration-350 cursor-pointer"
              >
                DISPATCH NEW PACKET
              </button>
            </div>
          )}
        </div>

        {/* Security Telemetry details */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-purple-500/10 mb-4">
              <Terminal className="w-4 h-4 text-purple-400" />
              <h3 className="font-display font-semibold text-white text-sm">Security Telemetry</h3>
            </div>
            
            <ul className="space-y-4 font-mono text-[10px] text-gray-400">
              <li>
                <span className="text-gray-500 block mb-0.5">SOCKET ENCRYPTION</span>
                <span className="text-emerald-400">ACTIVE: TLS_AES_256_GCM</span>
              </li>
              <li>
                <span className="text-gray-500 block mb-0.5">TLS SHA HASH</span>
                <span className="text-purple-400 break-all">f7a810b4fbc87de766d034a5d...</span>
              </li>
              <li>
                <span className="text-gray-500 block mb-0.5">DISPATCH ENDPOINT</span>
                <span className="text-cyan-400">secops-node-la-4.sentinel.net</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-purple-500/10 text-[9px] text-gray-500 font-mono flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encrypted using decentralized public identities.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
