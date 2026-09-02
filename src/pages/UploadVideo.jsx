import { useCallback, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertOctagon, RefreshCw, Eye } from "lucide-react";
import { useUploadScanner } from "../hooks/useUploadScanner";

const analysisSteps = [
  "Vetting frame-by-frame structural boundaries...",
  "Tracing facial keypoints (eye, mouth, chin coordinate mesh)...",
  "Calculating lip-to-audio sync offset...",
  "Scanning skin texture frequency for GAN boundaries...",
  "Evaluating eye blinking intervals and glare anomalies..."
];

function createDemoVideoFile() {
  const dummyData = new Uint8Array(1024);
  return new File([dummyData], "executive_kyc_verification_feed.mp4", { type: "video/mp4" });
}

export default function UploadVideo() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const drawFaceMesh = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let lineY = 0;
    let direction = 1;

    const facePoints = [
      { x: 256, y: 30 },
      { x: 200, y: 70 }, { x: 312, y: 70 },
      { x: 220, y: 90 }, { x: 292, y: 90 },
      { x: 256, y: 110 },
      { x: 256, y: 140 },
      { x: 210, y: 170 }, { x: 256, y: 180 }, { x: 302, y: 170 },
      { x: 256, y: 220 },
      { x: 160, y: 100 }, { x: 352, y: 100 },
      { x: 170, y: 180 }, { x: 342, y: 180 }
    ];

    const connections = [
      [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5],
      [5, 6], [6, 7], [6, 8], [6, 9], [7, 10], [8, 10],
      [9, 10], [1, 11], [2, 12], [11, 13], [12, 14],
      [13, 10], [14, 10]
    ];

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1;
      for (let c = 0; c < connections.length; c += 1) {
        const p1 = facePoints[connections[c][0]];
        const p2 = facePoints[connections[c][1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(6, 182, 212, 0.7)";
      for (let p = 0; p < facePoints.length; p += 1) {
        ctx.beginPath();
        ctx.arc(facePoints[p].x, facePoints[p].y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (Math.random() > 0.95) {
          ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
          ctx.font = "8px monospace";
          ctx.fillText(`ID_${p}:${(Math.random() * 100).toFixed(0)}%`, facePoints[p].x + 6, facePoints[p].y - 3);
          ctx.fillStyle = "rgba(6, 182, 212, 0.7)";
        }
      }

      ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, lineY);
      ctx.lineTo(width - 80, lineY);
      ctx.stroke();

      ctx.fillStyle = "rgba(6, 182, 212, 0.05)";
      ctx.fillRect(80, lineY - 15, width - 160, 30);

      lineY += 2 * direction;
      if (lineY >= height - 20 || lineY <= 20) {
        direction = -direction;
      }

      animationRef.current = window.requestAnimationFrame(render);
    };

    render();
  }, [animationRef, canvasRef]);

  const { file, status, progress, scanStep, error: scannerError, startUpload, resetScanner } = useUploadScanner({
    analysisSteps,
    onScanStart: () => drawFaceMesh(),
    canvasRef,
    animationRef,
    mediaType: "video"
  });

  const handleFileChange = (event) => {
    if (event.target.files?.[0]) {
      startUpload(event.target.files[0]);
    }
  };

  const simulateDragDrop = () => {
    startUpload(createDemoVideoFile());
  };

  return (
    <div className="relative z-10 w-full max-w-4xl px-4 py-12 md:py-16">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-4">
          Synthetic Video Scanner
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Uload security KYC records, video conference recordings, or statements to check for facial structural mapping and lip-sync anomalies.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-cyan-glow opacity-20 pointer-events-none" />

        {(status === "idle" || status === "error") && (
          <div className="flex flex-col items-center">
            {scannerError && (
              <div className="w-full max-w-lg mx-auto mb-6 p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-200 text-sm flex flex-col gap-1">
                <div className="font-semibold text-red-400">Video Analysis Notice</div>
                <p className="text-xs text-gray-300">{scannerError}</p>
              </div>
            )}
            {/* Drop Zone Box */}
            <div 
              onClick={simulateDragDrop}
              className="w-full max-w-lg border-2 border-dashed border-cyan-500/20 hover:border-cyan-500/40 bg-cyber-dark/40 rounded-xl p-10 cursor-pointer flex flex-col items-center group transition-all duration-300"
            >
              <UploadCloud className="w-16 h-16 text-cyan-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="text-white font-semibold font-display mb-2 text-center text-lg">
                Drag and Drop Call Video
              </h4>
              <p className="text-xs text-gray-500 text-center mb-6">
                Supports MP4, WEBM, MOV up to 100MB
              </p>
              
              <label 
                onClick={(e) => e.stopPropagation()}
                className="px-6 py-2.5 bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/30 text-white rounded text-xs font-semibold cursor-pointer tracking-wider"
              >
                SELECT FILE
                <input 
                  type="file" 
                  accept="video/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <button 
              onClick={simulateDragDrop}
              className="mt-6 text-xs text-cyan-400 font-mono tracking-widest uppercase hover:underline cursor-pointer"
            >
              [ USE SAMPLE KYC VIDEO ]
            </button>
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center py-10 max-w-md mx-auto">
            <UploadCloud className="w-12 h-12 text-cyan-400 mb-4 animate-bounce" />
            <h4 className="text-white font-semibold font-display mb-1 text-center">
              Uploading video payload...
            </h4>
            <p className="text-xs text-gray-500 mb-6 text-center truncate w-full">
              {file?.name || "uploading_video.mp4"}
            </p>
            
            {/* Progress bar container */}
            <div className="w-full bg-cyber-dark border border-cyan-500/10 h-2.5 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-cyan-500 h-full rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-cyan-400">{progress}% COMPLETE</span>
          </div>
        )}

        {status === "scanning" && (
          <div className="flex flex-col items-center py-10">
            <RefreshCw className="w-10 h-10 text-cyan-400 mb-6 animate-spin" />
            <h4 className="text-white font-semibold font-display text-lg mb-2 text-center">
              Analyzing Spatial Face Geometries
            </h4>
            <p className="text-xs font-mono text-cyan-400/80 mb-8 px-4 py-1.5 rounded border border-cyan-500/20 bg-cyan-950/20 text-center animate-pulse">
              {scanStep}
            </p>

            {/* Simulated wireframe mesh */}
            <div className="w-full max-w-lg h-64 bg-black/40 border border-cyan-500/15 rounded-lg overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-500/20 scan-line animate-scanline" />
              <canvas ref={canvasRef} width="512" height="256" className="w-full h-full" />
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col">
            {/* Analysis Result Box Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-red-500/20 bg-red-950/10 mb-8 gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-red-500">
                  <AlertOctagon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-red-500 mb-1">
                    SYNTHETIC FACIAL MAPPING DETECTED
                  </h3>
                  <p className="text-sm text-gray-300">
                    Payload: <strong className="text-white">{file?.name || "executive_kyc_verification_feed.mp4"}</strong>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 font-mono block mb-1">PROBABILITY RATING</span>
                <span className="text-3xl font-extrabold font-display text-red-500 tracking-tight glow-text-cyan">
                  96.2% FAKE
                </span>
              </div>
            </div>

            {/* Detailed Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-black/40 border border-cyan-500/15 p-5 rounded-lg">
                <h4 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  Facial Warp Profile
                </h4>
                <ul className="space-y-3 font-mono text-xs text-gray-300">
                  <li className="flex justify-between pb-2 border-b border-cyan-500/5">
                    <span>Synthesis Model:</span>
                    <span className="text-cyan-400">Stable Video Diffusion (Mock clone)</span>
                  </li>
                  <li className="flex justify-between pb-2 border-b border-cyan-500/5">
                    <span>Lip-Sync Delay:</span>
                    <span className="text-red-400">340ms Anomaly Offset</span>
                  </li>
                  <li className="flex justify-between pb-2 border-b border-cyan-500/5">
                    <span>Eye Blinking Interval:</span>
                    <span className="text-red-400">Static pattern (0 blinks / 60s)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Boundary Artifacts:</span>
                    <span className="text-red-400">Skin Texture Noise Detected</span>
                  </li>
                </ul>
              </div>

              <div className="bg-black/40 border border-purple-500/15 p-5 rounded-lg flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Advisory Mitigation
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans mb-4">
                    The video exhibits high frequency pixel flickering near the jawline and eye glare reflection mismatches characteristic of generative neural model renders. System recommends denying identity vetting credentials immediately.
                  </p>
                </div>
                <button
                  onClick={() => alert("Incident report logged & shared with SecOps team.")}
                  className="w-full py-2 bg-red-950/40 hover:bg-red-950/60 border border-red-500/40 text-red-400 rounded text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer"
                >
                  LOG RISK REPORT
                </button>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={resetScanner}
                className="px-6 py-2.5 bg-cyber-dark hover:bg-cyber-navy/80 text-white border border-cyan-500/30 rounded text-xs font-semibold tracking-wider flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
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
