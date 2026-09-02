import { useCallback, useRef, useState } from "react";
import { UploadCloud, CheckCircle2, RefreshCw, BarChart2, ShieldAlert } from "lucide-react";
import { useUploadScanner } from "../hooks/useUploadScanner";

const analysisSteps = [
  "Analyzing vocal pitch frequency map...",
  "Vetting breathing intervals and noise floor...",
  "Scanning high-pass filters for synthetic compression...",
  "Executing deep neural voice clone signature check...",
  "Compiling threat report metrics..."
];

function createDemoWavFile() {
  const sampleRate = 44100;
  const durationSeconds = 1;
  const numSamples = sampleRate * durationSeconds;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i += 1) {
    view.setInt16(44 + i * 2, 0, true);
  }

  return new File([buffer], "demo_audio.wav", { type: "audio/wav" });
}

export default function UploadAudio() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const drawWave = useCallback((speedFactor = 1, amplitudeFactor = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let x = 0;

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height;

      for (let i = 0; i < width; i += 1) {
        const amplitude = Math.sin(i * 0.05 + x) * 15 * amplitudeFactor;
        const noise = (Math.random() - 0.5) * 2;
        ctx.lineTo(i, height / 2 + amplitude + noise);
      }

      ctx.stroke();
      x += 0.1 * speedFactor;
      animationRef.current = window.requestAnimationFrame(render);
    };

    render();
  }, [animationRef, canvasRef]);

  const {
    file,
    status,
    progress,
    scanStep,
    analysisResult,
    error: scannerError,
    startUpload,
    resetScanner,
  } = useUploadScanner({
    analysisSteps,
    onScanStart: () => drawWave(2.5, 2),
    canvasRef,
    animationRef,
    mediaType: "audio",
  });

  const [localError, setLocalError] = useState("");
  const errorMessage = scannerError || localError;

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setLocalError("");
    try {
      await startUpload(selectedFile);
    } catch (error) {
      setLocalError(error?.message || "Audio upload failed.");
    }
  };

  const simulateDragDrop = async () => {
    const demoFile = createDemoWavFile();
    setLocalError("");
    try {
      await startUpload(demoFile);
    } catch (error) {
      setLocalError(error?.message || "Unable to upload demo audio.");
    }
  };

  return (
    <div className="relative z-10 w-full max-w-4xl px-4 py-12 md:py-16">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-4">
          Voice Clone Profiler
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Upload phone calls, meetings, or voicemail audio clips to analyze biological speech patterns versus synthetic neural generation.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
        {/* Underlay glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-glow opacity-20 pointer-events-none" />

        {(status === "idle" || status === "error") && (
          <div className="flex flex-col items-center">
            {errorMessage && (
              <div className="w-full max-w-lg mx-auto mb-6 p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-200 text-sm flex flex-col gap-1">
                <div className="font-semibold text-red-400">Audio Analysis Notice</div>
                <p className="text-xs text-gray-300">{errorMessage}</p>
              </div>
            )}

            {/* Drop Zone Box */}
            <div 
              onClick={simulateDragDrop}
              className="w-full max-w-lg border-2 border-dashed border-purple-500/20 hover:border-purple-500/40 bg-cyber-dark/40 rounded-xl p-10 cursor-pointer flex flex-col items-center group transition-all duration-300"
            >
              <UploadCloud className="w-16 h-16 text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="text-white font-semibold font-display mb-2 text-center text-lg">
                Drag and Drop Call Audio
              </h4>
              <p className="text-xs text-gray-500 text-center mb-6">
                Supports WAV, MP3, AAC, FLAC up to 25MB
              </p>
              
              <label 
                onClick={(e) => e.stopPropagation()}
                className="px-6 py-2.5 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 text-white rounded text-xs font-semibold cursor-pointer tracking-wider"
              >
                SELECT FILE
                <input 
                  type="file" 
                  accept="audio/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <button 
              onClick={simulateDragDrop}
              className="mt-6 text-xs text-purple-400 font-mono tracking-widest uppercase hover:underline cursor-pointer"
            >
              [ USE SAMPLE AUDIO DIALER ]
            </button>
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center py-10 max-w-md mx-auto">
            <UploadCloud className="w-12 h-12 text-purple-400 mb-4 animate-bounce" />
            <h4 className="text-white font-semibold font-display mb-1 text-center">
              Uploading audio payload...
            </h4>
            <p className="text-xs text-gray-500 mb-6 text-center truncate w-full">
              {file?.name || "uploading_file.wav"}
            </p>
            
            {/* Progress bar container */}
            <div className="w-full bg-cyber-dark border border-purple-500/10 h-2.5 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-purple-400">{progress}% COMPLETE</span>
          </div>
        )}

        {status === "scanning" && (
          <div className="flex flex-col items-center py-10">
            <RefreshCw className="w-10 h-10 text-purple-400 mb-6 animate-spin" />
            <h4 className="text-white font-semibold font-display text-lg mb-2 text-center">
              Executing Vocal Pattern Analysis
            </h4>
            <p className="text-xs font-mono text-purple-400/80 mb-8 px-4 py-1.5 rounded border border-purple-500/20 bg-purple-950/20 text-center animate-pulse">
              {scanStep}
            </p>

            {/* Simulated Live Waveform Canvas */}
            <div className="w-full max-w-lg h-28 bg-black/40 border border-purple-500/10 rounded-lg overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-purple-500/20 scan-line animate-scanline" />
              <canvas ref={canvasRef} width="512" height="112" className="w-full h-full" />
            </div>
          </div>
        )}

        {status === "done" && analysisResult && (
          <div className="flex flex-col">
            {/* Analysis Result Box Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-purple-500/20 bg-slate-950/80 mb-8 gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-950/50 border border-purple-500/40 rounded-lg text-cyan-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-white mb-1">
                    AI Detection Engine — Demo Mode
                  </h3>
                  <p className="text-sm text-gray-300">
                    Payload: <strong className="text-white">{file?.name || analysisResult.audio_analysis.format}</strong>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 font-mono block mb-1">Deepfake Risk Score</span>
                <span className="text-3xl font-extrabold font-display text-cyan-400 tracking-tight">
                  {analysisResult.deepfake_analysis.risk_score}%
                </span>
                <span className="text-xs text-gray-400 block mt-1">Status: {analysisResult.deepfake_analysis.status}</span>
              </div>
            </div>

            {/* Detailed Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-black/40 border border-purple-500/15 p-5 rounded-lg">
                <h4 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                  Audio Analysis
                </h4>
                <ul className="space-y-3 font-mono text-xs text-gray-300">
                  <li className="flex justify-between pb-2 border-b border-purple-500/5">
                    <span>Duration</span>
                    <span className="text-purple-400">{analysisResult.audio_analysis.duration_seconds.toFixed(2)}s</span>
                  </li>
                  <li className="flex justify-between pb-2 border-b border-purple-500/5">
                    <span>Sample Rate</span>
                    <span className="text-purple-400">{analysisResult.audio_analysis.sample_rate} Hz</span>
                  </li>
                  <li className="flex justify-between pb-2 border-b border-purple-500/5">
                    <span>Channels</span>
                    <span className="text-purple-400">{analysisResult.audio_analysis.channels}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Format</span>
                    <span className="text-purple-400 uppercase">{analysisResult.audio_analysis.format}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-black/40 border border-cyan-500/15 p-5 rounded-lg">
                <h4 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Deepfake Confidence
                </h4>
                <ul className="space-y-3 font-mono text-xs text-gray-300">
                  <li className="flex justify-between pb-2 border-b border-cyan-500/5">
                    <span>Confidence</span>
                    <span className="text-cyan-400">{analysisResult.deepfake_analysis.confidence}%</span>
                  </li>
                  <li className="flex justify-between pb-2 border-b border-cyan-500/5">
                    <span>Analysis Mode</span>
                    <span className="text-cyan-400">Demo baseline heuristics</span>
                  </li>
                  <li>
                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Evidence</span>
                    <div className="text-xs text-gray-300 space-y-1">
                      {analysisResult.deepfake_analysis.evidence.map((item, index) => (
                        <p key={index}>• {item}</p>
                      ))}
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-black/40 border border-purple-500/15 p-5 rounded-lg mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display font-semibold text-white">Social Engineering Risk</h4>
                <span className="text-xs text-gray-400 uppercase tracking-wider">{analysisResult.social_engineering.risk_level}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Risk Score</div>
                  <div className="text-3xl font-extrabold text-white">{analysisResult.social_engineering.risk_score}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Indicators</div>
                  <div className="space-y-2 text-xs text-gray-300">
                    {analysisResult.social_engineering.indicators.map((indicator) => (
                      <div key={indicator.name} className={`p-2 rounded border ${indicator.detected ? "border-red-500/20 bg-red-950/10 text-red-300" : "border-purple-500/10 bg-slate-950/10 text-gray-400"}`}>
                        <div className="font-semibold uppercase tracking-wide text-[10px]">{indicator.name.replace(/_/g, " ")}</div>
                        <div>{indicator.detected ? indicator.evidence : "No match detected."}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-cyan-500/15 p-5 rounded-lg mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-display font-semibold text-white">Overall Risk</h4>
                  <p className="text-xs text-gray-400">Score is deterministic based on audio and social indicators.</p>
                </div>
                <span className="text-sm text-cyan-400 font-semibold">{analysisResult.overall_risk.level}</span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-4">{analysisResult.overall_risk.score}%</div>
              <div className="space-y-2 text-xs text-gray-300">
                {analysisResult.overall_risk.risk_factors.map((factor, index) => (
                  <p key={index}>• {factor}</p>
                ))}
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  resetScanner();
                  setLocalError("");
                }}
                className="px-6 py-2.5 bg-cyber-dark hover:bg-cyber-navy/80 text-white border border-purple-500/30 rounded text-xs font-semibold tracking-wider flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                SCAN NEW FILE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
