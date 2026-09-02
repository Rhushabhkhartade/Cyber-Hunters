import { useState, useRef, useEffect, useCallback } from "react";
import { sendLiveAudioChunk, stopLiveSession } from "../api/backend";

function encodePCMToWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (v, offset, str) => {
    for (let i = 0; i < str.length; i += 1) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function useLiveAudioStream() {
  const [status, setStatus] = useState("idle"); // idle | requesting_permission | connecting | active | analyzing | stopped | error
  const [selectedChannel, setSelectedChannel] = useState("webRTC");
  const [sessionId, setSessionId] = useState("");
  const [chunkCount, setChunkCount] = useState(0);
  const [transcripts, setTranscripts] = useState([]);
  const [threatAlerts, setThreatAlerts] = useState([]);
  const [liveThreatScore, setLiveThreatScore] = useState(null);
  const [soundBars, setSoundBars] = useState(Array(15).fill(15));
  const [errorMessage, setErrorMessage] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const demoIntervalRef = useRef(null);

  const sessionIdRef = useRef("");
  const pcmBufferRef = useRef([]);
  const chunkIndexRef = useRef(0);
  const isStreamingRef = useRef(false);
  const clientSpeechBufferRef = useRef("");
  const startTimeRef = useRef(0);
  const peakRiskRef = useRef(0);

  // Sound bars animation loop driven by real microphone AnalyserNode
  const startVisualizer = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateBars = () => {
      if (!isStreamingRef.current) return;
      analyser.getByteFrequencyData(dataArray);

      // Select 15 frequency bands
      const step = Math.floor(dataArray.length / 15) || 1;
      const newBars = [];
      for (let i = 0; i < 15; i += 1) {
        const val = dataArray[i * step] || 0;
        // Scale to 12% - 95% height
        const scaled = Math.min(95, Math.max(12, Math.round((val / 255) * 85 + 12)));
        newBars.push(scaled);
      }
      setSoundBars(newBars);
      animationFrameRef.current = requestAnimationFrame(updateBars);
    };

    updateBars();
  }, []);

  // Teardown and microphone release
  const stopStream = useCallback(async () => {
    isStreamingRef.current = false;
    setStatus("stopped");

    // 1. Cancel demo timers
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }

    // 2. Cancel visualizer loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setSoundBars(Array(15).fill(15));

    // 3. Stop speech recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // Ignore
      }
      speechRecognitionRef.current = null;
    }

    // 4. Stop ScriptProcessor and AudioContext
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // Ignore
      }
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }

    // 5. Stop and release all microphone tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      mediaStreamRef.current = null;
    }

    // 6. Send stop session summary to backend
    const duration = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const activeSessionId = sessionIdRef.current;
    if (activeSessionId) {
      stopLiveSession({
        session_id: activeSessionId,
        duration_seconds: duration,
        chunks_processed: chunkIndexRef.current,
        threats_detected: threatAlerts.length,
        peak_risk: peakRiskRef.current,
        final_classification: liveThreatScore?.severity || "LOW",
      }).catch(() => {});
    }
  }, [liveThreatScore?.severity, threatAlerts.length]);

  // Process a chunk of captured PCM samples through the real backend AI pipeline
  const processCapturedChunk = useCallback(
    async (samples, sampleRate, overrideTranscript = null) => {
      if (!isStreamingRef.current || samples.length === 0) return;

      const currentChunkIndex = chunkIndexRef.current;
      chunkIndexRef.current += 1;
      setChunkCount(chunkIndexRef.current);

      const clientTranscript = overrideTranscript !== null ? overrideTranscript : clientSpeechBufferRef.current.trim();
      clientSpeechBufferRef.current = ""; // Reset buffer for next chunk

      const activeSessionId = sessionIdRef.current;
      const wavBlob = encodePCMToWav(samples, sampleRate);
      const chunkFile = new File([wavBlob], `chunk_${activeSessionId}_${currentChunkIndex}.wav`, {
        type: "audio/wav",
      });

      setStatus("analyzing");

      try {
        const result = await sendLiveAudioChunk({
          file: chunkFile,
          sessionId: activeSessionId,
          chunkIndex: currentChunkIndex,
          clientTranscript,
        });

        if (!isStreamingRef.current) return;

        setStatus("active");

        // 1. Update transcription log if speech recognized
        const recognizedText = result.transcription?.text?.trim();
        if (recognizedText) {
          const timestamp = formatDuration(
            startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : currentChunkIndex * 5
          );
          setTranscripts((prev) => [
            ...prev,
            {
              id: `${currentChunkIndex}-${Date.now()}`,
              timestamp,
              speaker: "Caller Audio",
              text: recognizedText,
              confidence: result.transcription?.confidence ?? 0.85,
            },
          ]);
        }

        // 2. Update Neural Threat Signals if social engineering indicators detected
        const indicators = result.social_engineering?.indicators || [];
        const newDetected = indicators.filter((ind) => ind.detected);

        if (newDetected.length > 0) {
          setThreatAlerts((prev) => {
            const existingNames = new Set(prev.map((a) => a.name));
            const freshAlerts = newDetected
              .filter((ind) => !existingNames.has(ind.name))
              .map((ind) => {
                let severity = "WARN";
                if (
                  ind.confidence >= 50 ||
                  ["urgency", "threat_or_pressure", "financial_request", "otp_request", "credential_request"].includes(
                    ind.name
                  )
                ) {
                  severity = "CRITICAL";
                }
                const formattedName = ind.name.replace(/_/g, " ").toUpperCase();
                return {
                  id: `${ind.name}-${Date.now()}`,
                  name: ind.name,
                  title: `${formattedName} (${severity})`,
                  severity,
                  confidence: ind.confidence,
                  evidence: ind.evidence,
                };
              });
            return [...prev, ...freshAlerts];
          });
        }

        // 3. Update Live Threat Score
        const overallScore = result.overall_risk?.score ?? 15;
        const severity = result.overall_risk?.level ?? "LOW";
        const voiceRisk = result.audio_analysis?.risk_score ?? 10;
        const socialRisk = result.social_engineering?.risk_score ?? 0;

        if (overallScore > peakRiskRef.current) {
          peakRiskRef.current = overallScore;
        }

        setLiveThreatScore({
          overallScore,
          severity,
          voiceRisk,
          socialRisk,
          riskFactors: result.overall_risk?.risk_factors || [],
        });
      } catch (err) {
        if (!isStreamingRef.current) return;
        setStatus("active");
        console.warn("Audio chunk analysis notice:", err?.message);
      }
    },
    []
  );

  // Start live stream activation with browser microphone
  const startStream = useCallback(async () => {
    setErrorMessage("");
    setTranscripts([]);
    setThreatAlerts([]);
    setLiveThreatScore(null);
    setChunkCount(0);
    setElapsedSeconds(0);
    pcmBufferRef.current = [];
    clientSpeechBufferRef.current = "";
    chunkIndexRef.current = 0;
    peakRiskRef.current = 0;

    const newSessionId = `LIVE-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    sessionIdRef.current = newSessionId;
    setSessionId(newSessionId);

    // 1. Request microphone permission
    setStatus("requesting_permission");

    let stream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support microphone capture via getUserMedia.");
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      const msg =
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone permission was denied. Please allow microphone access in your browser to inspect live audio."
          : err.name === "NotFoundError" || err.name === "DevicesNotFoundError"
          ? "No microphone hardware was detected on your system."
          : `Unable to access microphone: ${err.message}`;
      setErrorMessage(msg);
      setStatus("error");
      return;
    }

    mediaStreamRef.current = stream;
    setStatus("connecting");

    try {
      // 2. Setup AudioContext and native PCM capture
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const sampleRate = audioCtx.sampleRate;
      const source = audioCtx.createMediaStreamSource(stream);

      // Analyser for sound bars visualizer
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Collect ~5 seconds of audio per chunk
      const CHUNK_SAMPLE_LIMIT = sampleRate * 5;
      const bufferSize = 4096;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isStreamingRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const copy = new Float32Array(inputData);
        pcmBufferRef.current.push(copy);

        let totalSamples = 0;
        for (let i = 0; i < pcmBufferRef.current.length; i += 1) {
          totalSamples += pcmBufferRef.current[i].length;
        }

        if (totalSamples >= CHUNK_SAMPLE_LIMIT) {
          const merged = new Float32Array(totalSamples);
          let offset = 0;
          for (let i = 0; i < pcmBufferRef.current.length; i += 1) {
            merged.set(pcmBufferRef.current[i], offset);
            offset += pcmBufferRef.current[i].length;
          }
          pcmBufferRef.current = [];
          processCapturedChunk(merged, sampleRate);
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      // 3. Web Speech API for near-instant client transcription
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            let currentSpeech = "";
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
              currentSpeech += event.results[i][0].transcript + " ";
            }
            if (currentSpeech.trim()) {
              clientSpeechBufferRef.current += " " + currentSpeech.trim();
            }
          };

          recognition.onerror = () => {};
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {
          // Optional; backend fallback handles transcription
        }
      }

      isStreamingRef.current = true;
      startTimeRef.current = Date.now();
      setStatus("active");
      startVisualizer();
    } catch (err) {
      stopStream();
      setErrorMessage(`Failed to initialize audio capture pipeline: ${err.message}`);
      setStatus("error");
    }
  }, [processCapturedChunk, startVisualizer, stopStream]);

  // Demo call stream simulator for presentation fallback or testing
  const startDemoStream = useCallback(() => {
    setErrorMessage("");
    setTranscripts([]);
    setThreatAlerts([]);
    setLiveThreatScore(null);
    setChunkCount(0);
    setElapsedSeconds(0);
    pcmBufferRef.current = [];
    clientSpeechBufferRef.current = "";
    chunkIndexRef.current = 0;
    peakRiskRef.current = 0;

    const newSessionId = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    sessionIdRef.current = newSessionId;
    setSessionId(newSessionId);

    isStreamingRef.current = true;
    startTimeRef.current = Date.now();
    setStatus("active");

    // Animate sound visualizer bars during demo
    const barInterval = setInterval(() => {
      if (!isStreamingRef.current) {
        clearInterval(barInterval);
        return;
      }
      setSoundBars(Array(15).fill(0).map(() => Math.floor(Math.random() * 70) + 20));
    }, 120);

    const demoChunks = [
      "Hello, this is David from IT security operations. We are verifying employee network access.",
      "We have detected an unauthorized intrusion. I need you to provide your OTP immediately to verify your workstation.",
      "If you do not provide your verification credentials right now, your account will be shut down and terminated.",
    ];

    let demoIndex = 0;
    const sendNextDemoChunk = () => {
      if (!isStreamingRef.current || demoIndex >= demoChunks.length) {
        return;
      }
      const text = demoChunks[demoIndex];
      demoIndex += 1;

      // Generate 5 seconds of 16kHz PCM audio
      const sampleRate = 16000;
      const samples = new Float32Array(sampleRate * 5);
      // Add subtle synthetic tone
      for (let i = 0; i < samples.length; i += 1) {
        samples[i] = Math.sin(i * 0.05) * 0.15;
      }
      processCapturedChunk(samples, sampleRate, text);
    };

    // Send first chunk immediately
    sendNextDemoChunk();
    // Subsequent chunks every 5.5 seconds
    demoIntervalRef.current = setInterval(sendNextDemoChunk, 5500);
  }, [processCapturedChunk]);

  // Track elapsed time when active
  useEffect(() => {
    if (status !== "active" && status !== "analyzing") return;
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (isStreamingRef.current) {
        stopStream();
      }
    };
  }, [stopStream]);

  return {
    status,
    isLive: status === "active" || status === "analyzing",
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
  };
}
