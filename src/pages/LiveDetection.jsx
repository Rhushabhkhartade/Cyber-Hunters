import { Radio, AlertTriangle, MessageSquare, Play, Square, Mic, ShieldAlert, CheckCircle2, Activity } from "lucide-react";
import { useLiveAudioStream } from "../hooks/useLiveAudioStream";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function LiveDetection() {
  const {
    status,
    isLive,
    selectedChannel,
    setSelectedChannel,
    sessionId,
    chunkCount,
    transcripts,
    threatAlerts,
    liveThreatScore,
    soundBars,
    errorMessage,
    elapsedSeconds,
    startStream,
    startDemoStream,
    stopStream,
  } = useLiveAudioStream();

  const handleToggle = () => {
    if (isLive) {
      stopStream();
    } else {
      startStream();
    }
  };

  const isConnecting = status === "requesting_permission" || status === "connecting";

  return (
    <div className="relative z-10 w-full max-w-6xl px-4 py-12 md:py-16">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-4">
          Live Stream Inspector
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Monitor VoIP conversations, WebRTC calls, or Zoom feeds in near-real-time to analyze voice footprints and linguistic coercion methods.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Viewport Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[380px]">
            {/* Hologram aesthetic overlay */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-radial-glow opacity-30 pointer-events-none" />

            {/* Header / Channel Selector */}
            <div className="flex items-center justify-between pb-4 border-b border-purple-500/10 z-10">
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isLive ? "bg-emerald-400 animate-ping" : status === "stopped" ? "bg-purple-400" : "bg-gray-500"
                  }`}
                />
                <div>
                  <h3 className="font-display font-semibold text-lg text-white leading-tight">
                    Active Monitoring Channel
                  </h3>
                  {sessionId && (
                    <span className="text-[10px] font-mono text-purple-400/80">
                      ID: {sessionId}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={isLive}
                  onClick={() => setSelectedChannel("webRTC")}
                  className={`px-3 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                    selectedChannel === "webRTC"
                      ? "bg-purple-950/60 border-purple-400/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                      : "border-gray-500/20 text-gray-500 hover:text-gray-400"
                  }`}
                >
                  WebRTC
                </button>
                <button
                  disabled
                  title="SIP Trunk integration coming in enterprise tier"
                  className="px-3 py-1 text-xs font-mono rounded border border-gray-700/30 text-gray-600 bg-black/20 cursor-not-allowed"
                >
                  SIP Trunk (Enterprise)
                </button>
              </div>
            </div>

            {/* Visual feed viewport */}
            <div className="my-6 bg-black/60 rounded-xl border border-purple-500/15 flex flex-col items-center justify-center min-h-[190px] p-6 relative overflow-hidden">
              {isLive ? (
                <div className="w-full flex flex-col items-center justify-center">
                  {/* Live Radar/Sonar visualization */}
                  <div className="relative w-24 h-24 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mb-3">
                    <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin" />
                    <Radio className="w-9 h-9 text-emerald-400 animate-pulse" />
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider">
                      STREAM CONNECTION ACTIVE // LIVE ANALYSIS RUNNING
                    </span>
                  </div>

                  {status === "analyzing" && (
                    <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded animate-pulse">
                      Analyzing audio segment...
                    </span>
                  )}

                  {/* Channel status badges */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[11px] font-mono text-gray-400">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <Mic className="w-3.5 h-3.5 text-emerald-400" /> Microphone:{" "}
                      <strong className="text-emerald-400">ACTIVE</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" /> Chunks:{" "}
                      <strong className="text-white">{chunkCount}</strong>
                    </span>
                    <span className="text-purple-300 font-mono">
                      Elapsed: <strong>{formatTime(elapsedSeconds)}</strong>
                    </span>
                  </div>
                </div>
              ) : isConnecting ? (
                <div className="text-center p-4">
                  <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white">
                    {status === "requesting_permission"
                      ? "Requesting microphone permission..."
                      : "Connecting to SentinelAI neural pipeline..."}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Please allow browser microphone access when prompted.
                  </p>
                </div>
              ) : status === "stopped" ? (
                <div className="text-center p-4">
                  <CheckCircle2 className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-white font-semibold">Stream Connection Offline</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Live inspection session completed. Processed {chunkCount} audio segment{chunkCount === 1 ? "" : "s"}.
                  </p>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Radio className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-semibold">Stream Connection Offline</p>
                  <p className="text-xs text-gray-600 mt-1 max-w-sm">
                    Connect browser microphone to inspect voice authenticity and detect linguistic coercion patterns in near-real-time.
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Control Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-purple-500/10 z-10 gap-4">
              {/* Sound wave visualizer bars */}
              <div className="flex items-end gap-[3px] h-8">
                {soundBars.map((val, idx) => (
                  <div
                    key={idx}
                    className={`w-[4px] rounded-full transition-all duration-75 ${
                      isLive ? "bg-gradient-to-t from-purple-500 to-cyan-400" : "bg-purple-900/30"
                    }`}
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>

              {/* Main Action Button */}
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleToggle}
                  disabled={isConnecting}
                  className={`px-6 py-2.5 rounded font-display font-semibold text-xs tracking-wider flex items-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isLive
                      ? "bg-red-950/40 hover:bg-red-950/70 border border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)] active:scale-95"
                      : "bg-gradient-to-r from-purple-600 to-purple-800 hover:scale-105 active:scale-95 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  }`}
                >
                  {isLive ? (
                    <>
                      <Square className="w-4 h-4 fill-current" /> STOP LIVE SCAN
                    </>
                  ) : isConnecting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      CONNECTING...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> ACTIVATE LIVE SCAN
                    </>
                  )}
                </button>
                {!isLive && !isConnecting && (
                  <button
                    onClick={startDemoStream}
                    className="mt-1 text-[11px] text-purple-400 font-mono tracking-wider uppercase hover:underline cursor-pointer"
                  >
                    [ STREAM SAMPLE VOIP CALL ]
                  </button>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-950/30 text-red-200 text-xs">
                <strong>Notice:</strong> {errorMessage}
              </div>
            )}
          </div>

          {/* Live Threat Score Summary Card */}
          {liveThreatScore && (
            <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 bg-black/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                  <h4 className="font-display font-semibold text-white text-sm tracking-wider uppercase">
                    Live Multimodal Threat Score
                  </h4>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                    liveThreatScore.severity === "CRITICAL"
                      ? "bg-red-950/60 border border-red-500 text-red-400 animate-pulse"
                      : liveThreatScore.severity === "HIGH"
                      ? "bg-orange-950/60 border border-orange-500 text-orange-400"
                      : liveThreatScore.severity === "MEDIUM"
                      ? "bg-amber-950/60 border border-amber-500 text-amber-400"
                      : "bg-emerald-950/60 border border-emerald-500 text-emerald-400"
                  }`}
                >
                  {liveThreatScore.severity} RISK
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center pb-3 border-b border-purple-500/10">
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-500/10">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                    Overall Threat
                  </span>
                  <span
                    className={`text-2xl font-extrabold font-display ${
                      liveThreatScore.overallScore >= 75
                        ? "text-red-400"
                        : liveThreatScore.overallScore >= 45
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {liveThreatScore.overallScore}
                    <span className="text-xs text-gray-500">/100</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-500/10">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                    Voice Risk
                  </span>
                  <span className="text-xl font-bold font-display text-cyan-400">
                    {liveThreatScore.voiceRisk}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-500/10">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                    Social Eng.
                  </span>
                  <span className="text-xl font-bold font-display text-purple-400">
                    {liveThreatScore.socialRisk}%
                  </span>
                </div>
              </div>

              {liveThreatScore.riskFactors && liveThreatScore.riskFactors.length > 0 && (
                <div className="mt-3 space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block">
                    Observed Threat Factors:
                  </span>
                  {liveThreatScore.riskFactors.map((factor, idx) => (
                    <p key={idx} className="text-xs text-gray-300 font-mono flex items-center gap-1.5">
                      <span className="text-purple-400">•</span> {factor}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Logs and Alerts Panel */}
        <div className="flex flex-col gap-6">
          {/* Alerts panel */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between min-h-[240px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/10 mb-4">
                <h3 className="font-display font-semibold text-white text-base">
                  Neural Threat Signals
                </h3>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    threatAlerts.length > 0
                      ? "bg-red-950/40 border border-red-500/30 text-red-400"
                      : "text-purple-400"
                  }`}
                >
                  {threatAlerts.length} ALERTS
                </span>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-44 pr-1">
                {threatAlerts.length > 0 ? (
                  threatAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs font-mono transition-all duration-300 animate-fadeIn ${
                        alert.severity === "CRITICAL"
                          ? "border-red-500/30 bg-red-950/20 text-red-300"
                          : "border-amber-500/30 bg-amber-950/20 text-amber-300"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold block text-white">{alert.title}</span>
                          <span className="text-[10px] opacity-75">{alert.confidence}% conf</span>
                        </div>
                        {alert.evidence && (
                          <p className="text-[11px] text-gray-400 mt-1 italic">
                            {alert.evidence}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic text-center py-8">
                    No threat vectors identified yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Transcript Panel */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/10 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-semibold text-white text-base">Call Transcription</h3>
              </div>
              {isLive && (
                <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> STREAMING
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1 max-h-[300px]">
              {transcripts.length > 0 ? (
                transcripts.map((t) => (
                  <div key={t.id} className="border-b border-gray-500/10 pb-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-cyan-400 font-semibold text-[11px]">
                        {t.speaker}
                      </span>
                      <span className="text-gray-500 text-[10px]">{t.timestamp}</span>
                    </div>
                    <p className="text-gray-200 leading-relaxed text-[12px] bg-slate-950/40 p-2 rounded border border-purple-500/5">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-12">
                  {isLive
                    ? "Listening for speech... spoken phrases will appear here."
                    : "Transcription logs will stream here..."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
