import { useEffect, useState } from "react";
import { MessageSquare, Menu, Send, Shield, X } from "lucide-react";
import CyberBackground from "../CyberBackground";
import { navLinks } from "../../config/navigation";
import { useChatAssistant } from "../../hooks/useChatAssistant";

export default function AppShell({ page, setPage, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { chatInput, setChatInput, chatMessages, isChatting, sendMessage } = useChatAssistant();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleNavigate = (targetPage) => {
    setMobileMenuOpen(false);
    setPage(targetPage);
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(chatInput);
  };

  return (
    <div className="relative min-h-screen text-gray-200 overflow-x-hidden font-sans bg-black">
      <CyberBackground />
      <div className="absolute inset-0 cyber-grid z-0 pointer-events-none" />

      <div className="relative z-50 w-full bg-indigo-950/60 border-b border-purple-500/20 text-center py-2 px-4 text-xs font-mono text-purple-300 tracking-wider flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping shrink-0"></span>
        <span>DEFENSE WARNING: SECURE VECTORS ACTIVATED // ALL AUDIO & VIDEO VETTING ACTIVE</span>
      </div>

      <header className="sticky top-0 z-40 w-full glass-navbar transition-all duration-350">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleNavigate("landing")}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-800 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.35)] group-hover:scale-105 transition-all">
              <Shield className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-black text-lg md:text-xl tracking-widest text-white leading-none">
                SENTINEL<span className="text-purple-400">AI</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-cyan-400 uppercase font-semibold leading-normal mt-0.5">
                DEEP CONFLICT PROTECT
              </span>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm font-semibold tracking-wider uppercase font-display">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigate(link.id)}
                className={`px-3 py-2 rounded transition-all duration-200 cursor-pointer ${
                  page === link.id
                    ? "bg-purple-950/50 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:block">
            <button
              onClick={() => handleNavigate("live")}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-800 rounded font-display font-bold text-xs tracking-wider text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border border-purple-500/20"
            >
              DEPLOY CORE SCAN
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="lg:hidden p-2 rounded hover:bg-white/5 text-white transition-colors cursor-pointer border border-purple-500/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-500/15 bg-black/95 backdrop-blur-xl absolute top-full left-0 w-full shadow-2xl py-6 px-4 animate-fade-in z-50">
            <div className="flex flex-col gap-2 font-display uppercase tracking-widest text-xs">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavigate(link.id)}
                  className={`w-full py-3.5 px-4 text-left rounded border transition-all ${
                    page === link.id
                      ? "bg-purple-950/50 text-purple-300 border-purple-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => handleNavigate("live")}
                className="w-full py-4 mt-4 bg-gradient-to-r from-purple-500 to-purple-800 text-white font-bold text-center rounded border border-purple-500/20"
              >
                DEPLOY CORE SCAN
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 flex flex-col items-center min-h-[calc(100vh-16rem)]">
        {children}
      </main>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="w-[340px] md:w-[380px] h-[450px] bg-cyber-dark/95 border border-purple-500/30 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3)] flex flex-col overflow-hidden mb-4 backdrop-blur-2xl animate-fade-in">
            <div className="px-5 py-4 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-300" />
                <span className="font-display font-bold text-xs tracking-wider text-white">SENTINEL ASSISTANT</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
              {chatMessages.map((msg, idx) => (
                <div key={`${msg.sender}-${idx}`} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-xl border ${
                      msg.sender === "user"
                        ? "bg-purple-900/30 border-purple-500/40 text-purple-100 rounded-tr-none"
                        : "bg-white/5 border-white/10 text-gray-300 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-xl border bg-white/5 border-white/10 text-gray-300 rounded-tl-none">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 border-t border-purple-500/10 bg-black/60 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask about voice clones, lip-sync, specs..."
                className="flex-1 bg-cyber-dark border border-purple-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="submit"
                disabled={isChatting}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        <button
          onClick={() => setChatOpen((value) => !value)}
          className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-800 hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.45)] border border-purple-500/30 transition-all cursor-pointer"
        >
          <MessageSquare className="w-6 h-6 animate-pulse" />
        </button>
      </div>

      <footer className="relative z-10 w-full border-t border-purple-500/15 bg-black/80 py-12 mt-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs font-mono">
          <div className="md:col-span-2">
            <h4 className="font-display font-black text-base text-white tracking-widest mb-3">
              SENTINEL<span className="text-purple-400">AI</span>
            </h4>
            <p className="text-gray-500 leading-relaxed max-w-sm mb-4">
              Real-time biological biometric protection and synthetic behavioral attack mitigation. Vetting perimeters since 2024.
            </p>
            <span className="text-[10px] text-purple-400/80 px-2.5 py-1 rounded border border-purple-500/20 bg-purple-950/20">
              OPERATIONAL STATUS: CERTIFIED CORE
            </span>
          </div>

          <div>
            <h5 className="text-white font-bold tracking-wider mb-3 uppercase">Security Modules</h5>
            <ul className="space-y-2 text-gray-500">
              <li><button onClick={() => handleNavigate("upload-audio")} className="hover:text-purple-400 transition-colors cursor-pointer">Vocal Clone Profiler</button></li>
              <li><button onClick={() => handleNavigate("upload-video")} className="hover:text-purple-400 transition-colors cursor-pointer">Synthetic Video Scanner</button></li>
              <li><button onClick={() => handleNavigate("live")} className="hover:text-purple-400 transition-colors cursor-pointer">Live Feed Attestations</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold tracking-wider mb-3 uppercase">Corporate</h5>
            <ul className="space-y-2 text-gray-500">
              <li><button onClick={() => handleNavigate("about")} className="hover:text-purple-400 transition-colors cursor-pointer">About Mission</button></li>
              <li><button onClick={() => handleNavigate("dashboard")} className="hover:text-purple-400 transition-colors cursor-pointer">Ops Command Center</button></li>
              <li><button onClick={() => handleNavigate("contact")} className="hover:text-purple-400 transition-colors cursor-pointer">Incident Support</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-purple-500/10 pt-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-gray-600 gap-4">
          <p>&copy; {new Date().getFullYear()} SentinelAI Corporation. All simulated containment systems active.</p>
          <p className="tracking-wide">DEC DEEP INTELLIGENCE PROTOCOL // PRIVACY CERTIFICATE SECURE</p>
        </div>
      </footer>
    </div>
  );
}
