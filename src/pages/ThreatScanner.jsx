import { useState } from "react";
import {
  Mail,
  Globe,
  MessageSquare,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Link,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { scanEmail, scanUrl, scanSms } from "../api/backend";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const CHANNELS = [
  { id: "email", label: "Email", icon: Mail, description: "Analyze suspicious emails for phishing & impersonation" },
  { id: "url",   label: "Website / URL", icon: Globe, description: "Inspect URLs for phishing indicators (no browsing required)" },
  { id: "sms",   label: "SMS / Message", icon: MessageSquare, description: "Detect smishing, scam patterns & suspicious links" },
];

const SEVERITY_CONFIG = {
  SAFE:     { color: "text-emerald-400",  bg: "bg-emerald-950/40",  border: "border-emerald-500/30", badge: "bg-emerald-900/40 text-emerald-300", icon: ShieldCheck },
  LOW:      { color: "text-cyan-400",     bg: "bg-cyan-950/30",     border: "border-cyan-500/30",    badge: "bg-cyan-900/30 text-cyan-300",    icon: Shield },
  MEDIUM:   { color: "text-amber-400",    bg: "bg-amber-950/30",    border: "border-amber-500/30",   badge: "bg-amber-900/30 text-amber-300",  icon: AlertTriangle },
  HIGH:     { color: "text-orange-400",   bg: "bg-orange-950/30",   border: "border-orange-500/30",  badge: "bg-orange-900/30 text-orange-300",icon: ShieldAlert },
  CRITICAL: { color: "text-red-400",      bg: "bg-red-950/40",      border: "border-red-500/40",     badge: "bg-red-900/40 text-red-300",      icon: XCircle },
};

const SIGNAL_SEVERITY_CONFIG = {
  low:      { dot: "bg-cyan-400",    text: "text-cyan-400" },
  medium:   { dot: "bg-amber-400",   text: "text-amber-400" },
  high:     { dot: "bg-orange-400",  text: "text-orange-400" },
  critical: { dot: "bg-red-400",     text: "text-red-400" },
};

function severityCfg(severity) {
  return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TabBar({ active, onSelect }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      {CHANNELS.map(({ id, label, icon: Icon, description }) => (
        <button
          key={id}
          id={`threat-tab-${id}`}
          onClick={() => onSelect(id)}
          className={`flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
            active === id
              ? "bg-purple-950/50 border-purple-500/50 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
              : "glass-panel border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-950/20"
          }`}
        >
          <div className={`p-2.5 rounded-lg border transition-colors ${
            active === id
              ? "bg-purple-600/30 border-purple-500/40 text-purple-300"
              : "bg-white/5 border-white/10 text-gray-400 group-hover:text-purple-400 group-hover:border-purple-500/20"
          }`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className={`font-display font-bold text-xs tracking-wider uppercase transition-colors ${
              active === id ? "text-white" : "text-gray-400 group-hover:text-gray-200"
            }`}>{label}</div>
            <div className="text-[10px] font-mono text-gray-600 mt-0.5 hidden sm:block">{description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function FormInput({ id, label, value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2 font-bold"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-cyber-dark border border-purple-500/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/60 transition-colors placeholder:text-gray-600 font-sans"
        {...rest}
      />
    </div>
  );
}

function FormTextarea({ id, label, value, onChange, placeholder, rows = 6, ...rest }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2 font-bold"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-cyber-dark border border-purple-500/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/60 transition-colors placeholder:text-gray-600 font-sans resize-y"
        {...rest}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Score Ring
// ---------------------------------------------------------------------------

function RiskScoreRing({ score, severity }) {
  const cfg = severityCfg(severity);
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="44"
          fill="none"
          stroke={
            severity === "CRITICAL" ? "#f87171"
            : severity === "HIGH" ? "#fb923c"
            : severity === "MEDIUM" ? "#fbbf24"
            : severity === "LOW" ? "#22d3ee"
            : "#34d399"
          }
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-black font-display ${cfg.color}`}>{score}</span>
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Threat Result Display
// ---------------------------------------------------------------------------

function ThreatResult({ result, onReset }) {
  const cfg = severityCfg(result.severity);
  const SeverityIcon = cfg.icon;

  return (
    <div className={`rounded-2xl border p-6 md:p-8 space-y-6 ${cfg.bg} ${cfg.border} transition-all duration-500`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-purple-500/10">
        <div className="flex items-center gap-3">
          <SeverityIcon className={`w-6 h-6 ${cfg.color}`} />
          <div>
            <h3 className="font-display font-bold text-white text-base tracking-wider">THREAT ANALYSIS RESULT</h3>
            <p className="text-xs font-mono text-gray-500 mt-0.5 uppercase tracking-widest">
              Channel: {result.channel.toUpperCase()} · {new Date(result.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          id="threat-reset-btn"
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 border border-purple-500/20 rounded-lg text-gray-400 hover:text-white hover:border-purple-500/40 text-xs font-mono tracking-wider transition-all cursor-pointer hover:bg-purple-950/30"
        >
          <RefreshCw className="w-3.5 h-3.5" /> NEW SCAN
        </button>
      </div>

      {/* Score + Severity */}
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <RiskScoreRing score={result.risk_score} severity={result.severity} />
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block mb-1">Severity Level</span>
            <span className={`text-3xl font-black font-display ${cfg.color} tracking-widest`}>{result.severity}</span>
          </div>
          <div>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block mb-1">Confidence</span>
            <span className="text-lg font-bold font-display text-white">{result.confidence}%</span>
          </div>
          <span className={`text-[11px] font-mono px-3 py-1.5 rounded border ${cfg.badge} ${cfg.border} w-fit`}>
            {result.signals.length} threat signal{result.signals.length !== 1 ? "s" : ""} detected
          </span>
        </div>
      </div>

      {/* Threat Signals */}
      {result.signals.length > 0 && (
        <div>
          <h4 className="font-display font-bold text-white text-xs tracking-wider uppercase mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Threat Signals
          </h4>
          <div className="space-y-2">
            {result.signals.map((signal, idx) => {
              const sc = SIGNAL_SEVERITY_CONFIG[signal.severity] || SIGNAL_SEVERITY_CONFIG.medium;
              return (
                <div key={`signal-${idx}`} className="flex items-start gap-3 p-3 bg-black/30 rounded-lg border border-white/5">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sc.dot}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold font-display uppercase tracking-wide ${sc.text}`}>{signal.title}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${sc.text} border-current opacity-60`}>
                        {signal.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{signal.description}</p>
                    {signal.evidence && (
                      <p className="text-[10px] font-mono text-gray-600 mt-1 truncate">
                        Evidence: {signal.evidence}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extracted URLs */}
      {result.extracted_urls && result.extracted_urls.length > 0 && (
        <div>
          <h4 className="font-display font-bold text-white text-xs tracking-wider uppercase mb-3 flex items-center gap-2">
            <Link className="w-4 h-4 text-cyan-400" />
            Extracted URL Analysis
          </h4>
          <div className="space-y-2">
            {result.extracted_urls.map((urlResult, idx) => {
              const urlCfg = severityCfg(urlResult.severity);
              return (
                <div key={`url-${idx}`} className={`p-3 rounded-lg border ${urlCfg.bg} ${urlCfg.border}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-gray-300 truncate max-w-[70%]">{urlResult.url}</span>
                    <span className={`text-xs font-bold font-display ${urlCfg.color}`}>
                      {urlResult.risk_score}/100 · {urlResult.severity}
                    </span>
                  </div>
                  {urlResult.signals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {urlResult.signals.slice(0, 3).map((s, si) => (
                        <span key={si} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-gray-500 border border-white/5">
                          {s.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross-Channel Correlation */}
      {result.cross_channel_correlation?.detected && (
        <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl">
          <h4 className="font-display font-bold text-amber-300 text-xs tracking-wider uppercase mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Cross-Channel Correlation Detected
          </h4>
          <p className="text-xs text-amber-200/80 leading-relaxed">{result.cross_channel_correlation.summary}</p>
          {result.cross_channel_correlation.correlated_vectors.length > 0 && (
            <div className="flex gap-2 mt-2">
              {result.cross_channel_correlation.correlated_vectors.map((v, i) => (
                <span key={i} className="text-[9px] font-mono px-2 py-1 rounded bg-amber-900/40 text-amber-400 border border-amber-500/20">
                  {v.replace("_", " ").toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      <div>
        <h4 className="font-display font-bold text-white text-xs tracking-wider uppercase mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          Why SentinelAI Flagged This
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">{result.explanation}</p>
      </div>

      {/* Recommendations */}
      {result.recommendations?.length > 0 && (
        <div>
          <h4 className="font-display font-bold text-white text-xs tracking-wider uppercase mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Recommended Actions
          </h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec, idx) => (
              <li key={`rec-${idx}`} className="flex items-start gap-2 text-xs text-gray-300">
                <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Email Form
// ---------------------------------------------------------------------------

function EmailForm({ onResult }) {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!body.trim()) {
      setError("Email body is required.");
      return;
    }
    setLoading(true);
    try {
      const result = await scanEmail({ sender, subject, body });
      onResult(result);
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillTestEmail = () => {
    setSender("security@paypa1-support-example.com");
    setSubject("URGENT: Your account will be suspended");
    setBody(
      "Dear Customer,\n\nYour PayPal account will be permanently suspended within 24 hours due to suspicious activity.\n\nVerify your identity immediately to restore access:\nhttps://paypa1-secure-example.com/login\n\nDo not ignore this message or your account will be permanently locked.\n\nYou must provide your password and OTP verification code to confirm your identity.\n\nPayPal Security Team"
    );
  };

  return (
    <form id="threat-email-form" onSubmit={handleSubmit} className="space-y-5">
      <FormInput
        id="email-sender"
        label="Sender Email Address"
        value={sender}
        onChange={setSender}
        placeholder="e.g. security@paypa1-support.com"
        type="email"
        autoComplete="off"
      />
      <FormInput
        id="email-subject"
        label="Subject Line"
        value={subject}
        onChange={setSubject}
        placeholder="e.g. URGENT: Your account will be suspended"
      />
      <FormTextarea
        id="email-body"
        label="Email Body *"
        value={body}
        onChange={setBody}
        placeholder="Paste the full email content here…"
        rows={8}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          id="threat-email-submit"
          disabled={loading}
          className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-purple-800 hover:scale-[1.02] active:scale-[0.98] text-white font-semibold font-display text-xs tracking-wider rounded-lg border border-purple-500/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> ANALYZING…</>
          ) : (
            <><Search className="w-4 h-4" /> ANALYZE EMAIL</>
          )}
        </button>
        <button
          type="button"
          id="threat-email-test"
          onClick={fillTestEmail}
          disabled={loading}
          className="px-4 py-3.5 bg-cyber-dark border border-purple-500/20 hover:border-purple-500/40 text-gray-400 hover:text-white rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer disabled:opacity-50"
        >
          USE TEST EMAIL
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// URL Form
// ---------------------------------------------------------------------------

function UrlForm({ onResult }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL to analyze.");
      return;
    }
    const hasScheme = trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("www.");
    if (!hasScheme) {
      setError("Please enter a URL starting with http://, https://, or www.");
      return;
    }
    setLoading(true);
    try {
      const result = await scanUrl({ url: trimmed });
      onResult(result);
    } catch (err) {
      setError(err.message || "URL analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="threat-url-form" onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-cyan-300/80 leading-relaxed font-mono">
            SentinelAI analyzes the URL structure only — it does not navigate to, fetch, or execute the target URL. Your device remains safe.
          </p>
        </div>
      </div>

      <FormInput
        id="url-input"
        label="URL to Analyze"
        value={url}
        onChange={setUrl}
        placeholder="https://secure-bank-login-example.com/verify/account"
        type="url"
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          id="threat-url-submit"
          disabled={loading}
          className="flex-1 py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-900 hover:scale-[1.02] active:scale-[0.98] text-white font-semibold font-display text-xs tracking-wider rounded-lg border border-cyan-500/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> INSPECTING…</>
          ) : (
            <><Search className="w-4 h-4" /> INSPECT URL</>
          )}
        </button>
        <button
          type="button"
          id="threat-url-test"
          onClick={() => setUrl("https://secure-bank-login-example.com/verify/account")}
          disabled={loading}
          className="px-4 py-3.5 bg-cyber-dark border border-cyan-500/20 hover:border-cyan-500/40 text-gray-400 hover:text-white rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer disabled:opacity-50"
        >
          USE TEST URL
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// SMS Form
// ---------------------------------------------------------------------------

function SmsForm({ onResult }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!message.trim()) {
      setError("Please paste the SMS message to analyze.");
      return;
    }
    setLoading(true);
    try {
      const result = await scanSms({ message });
      onResult(result);
    } catch (err) {
      setError(err.message || "SMS analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillTestSms = () => {
    setMessage(
      "URGENT! Your bank account will be blocked today. Complete KYC immediately and provide your OTP to our representative: http://bank-verify-example.com"
    );
  };

  return (
    <form id="threat-sms-form" onSubmit={handleSubmit} className="space-y-5">
      <FormTextarea
        id="sms-message"
        label="SMS / Message Content *"
        value={message}
        onChange={setMessage}
        placeholder="Paste the SMS or message content here…"
        rows={6}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          id="threat-sms-submit"
          disabled={loading}
          className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-700 hover:scale-[1.02] active:scale-[0.98] text-white font-semibold font-display text-xs tracking-wider rounded-lg border border-purple-500/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> ANALYZING…</>
          ) : (
            <><Search className="w-4 h-4" /> ANALYZE SMS</>
          )}
        </button>
        <button
          type="button"
          id="threat-sms-test"
          onClick={fillTestSms}
          disabled={loading}
          className="px-4 py-3.5 bg-cyber-dark border border-purple-500/20 hover:border-purple-500/40 text-gray-400 hover:text-white rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer disabled:opacity-50"
        >
          USE TEST SMS
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Loading Overlay
// ---------------------------------------------------------------------------

const LOADING_STEPS = {
  email: [
    "Parsing sender domain…",
    "Scanning subject for urgency patterns…",
    "Analyzing email body for social engineering…",
    "Extracting and inspecting embedded URLs…",
    "Computing cross-channel threat correlation…",
  ],
  url: [
    "Parsing domain structure…",
    "Checking TLD reputation…",
    "Inspecting URL path for phishing keywords…",
    "Analyzing encoding and obfuscation…",
    "Computing heuristic risk score…",
  ],
  sms: [
    "Detecting urgency and pressure language…",
    "Scanning for OTP, KYC, and financial patterns…",
    "Checking for brand impersonation…",
    "Extracting and analyzing embedded URLs…",
    "Computing smishing risk score…",
  ],
};

function LoadingState({ channel }) {
  const steps = LOADING_STEPS[channel] || LOADING_STEPS.email;
  return (
    <div className="flex flex-col items-center py-12 text-center space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
        <div className="absolute inset-3 rounded-full bg-purple-950/40 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-purple-400 animate-pulse" />
        </div>
      </div>
      <div>
        <h4 className="font-display font-bold text-white text-base tracking-wider mb-1">
          ANALYZING THREAT VECTORS
        </h4>
        <p className="text-xs font-mono text-purple-400 animate-pulse">
          SentinelAI threat analysis in progress…
        </p>
      </div>
      <div className="w-full max-w-xs space-y-1.5 text-left">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-[11px] font-mono text-gray-500"
            style={{ animation: `fadeIn 0.4s ease ${i * 0.35}s both` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60 shrink-0 animate-pulse" />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ThreatScanner() {
  const [activeChannel, setActiveChannel] = useState("email");
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  const handleChannelChange = (channel) => {
    setActiveChannel(channel);
    setResult(null);
    setScanning(false);
  };

  // We wrap the onResult to show a brief scanning overlay
  const handleScanStart = () => setScanning(true);
  const handleResult = (data) => {
    setScanning(false);
    setResult(data);
  };
  const handleError = () => setScanning(false);

  // Wrap form submit handlers to include scanning state
  const makeFormProps = (onResult) => ({
    onResult: (data) => {
      handleResult(data);
    },
  });

  return (
    <div className="relative z-10 w-full max-w-4xl px-4 py-12 md:py-16">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-purple-950/40 border border-purple-500/20 rounded-full">
          <ShieldAlert className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-mono text-purple-300 tracking-widest uppercase">Multi-Channel Threat Detection</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black font-display text-white mb-4 leading-tight">
          THREAT <span className="text-purple-400">SCANNER</span>
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
          Detect phishing emails, malicious URLs, and smishing SMS using SentinelAI's
          multi-channel heuristic threat analysis engine.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial-glow opacity-10 pointer-events-none" />

        {result ? (
          <ThreatResult
            result={result}
            onReset={() => setResult(null)}
          />
        ) : (
          <>
            {/* Channel Tabs */}
            <TabBar active={activeChannel} onSelect={handleChannelChange} />

            {/* Form Area */}
            <div className="relative">
              {activeChannel === "email" && <EmailForm {...makeFormProps(handleResult)} />}
              {activeChannel === "url" && <UrlForm {...makeFormProps(handleResult)} />}
              {activeChannel === "sms" && <SmsForm {...makeFormProps(handleResult)} />}
            </div>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[10px] font-mono text-gray-600 mt-6 leading-relaxed max-w-xl mx-auto">
        SentinelAI uses heuristic pattern analysis. Results are indicative, not
        definitive legal conclusions. Always verify suspicious content through official channels.
      </p>
    </div>
  );
}
