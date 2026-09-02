import { useCallback, useEffect, useRef, useState } from "react";
import { uploadMedia } from "../api/backend";

export function useUploadScanner({
  analysisSteps = [],
  onScanStart,
  canvasRef: providedCanvasRef,
  animationRef: providedAnimationRef,
  mediaType = "audio",
}) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | scanning | done | error
  const [progress, setProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const internalCanvasRef = useRef(null);
  const internalAnimationRef = useRef(null);
  const canvasRef = providedCanvasRef || internalCanvasRef;
  const animationRef = providedAnimationRef || internalAnimationRef;

  const resetScanner = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setScanStep("");
    setAnalysisResult(null);
    setError(null);
    if (animationRef?.current) {
      window.cancelAnimationFrame(animationRef.current);
    }
  }, [animationRef]);

  const startUpload = useCallback(
    async (selectedFile) => {
      setFile(selectedFile);
      setStatus("uploading");
      setProgress(10);
      setScanStep("");
      setError(null);
      setAnalysisResult(null);

      // Smooth upload progress timer up to 90% while network request is in flight
      const progressTimer = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            window.clearInterval(progressTimer);
            return 90;
          }
          return prev + 10;
        });
      }, 120);

      try {
        const response = await uploadMedia(mediaType, selectedFile);
        window.clearInterval(progressTimer);
        setProgress(100);
        setAnalysisResult(response);
        setScanStep(analysisSteps?.[0] || "Analyzing payload...");
        setStatus("scanning");
        return response;
      } catch (err) {
        window.clearInterval(progressTimer);
        setStatus("error");
        const msg = err?.message || "Audio upload failed. Please check your connection.";
        setError(msg);
        console.error("Upload failed", err);
        throw err;
      }
    },
    [analysisSteps, mediaType]
  );

  const onScanStartRef = useRef(onScanStart);
  useEffect(() => {
    onScanStartRef.current = onScanStart;
  });

  // Scanning / analysis steps animation
  useEffect(() => {
    if (status !== "scanning") return;

    if (typeof onScanStartRef.current === "function") {
      onScanStartRef.current({ canvasRef, animationRef });
    }

    let stepIndex = 0;
    const stepInterval = window.setInterval(() => {
      stepIndex += 1;

      if (stepIndex < analysisSteps.length) {
        setScanStep(analysisSteps[stepIndex]);
      } else {
        window.clearInterval(stepInterval);
        setStatus("done");
        if (animationRef.current) {
          window.cancelAnimationFrame(animationRef.current);
        }
      }
    }, 900);

    const activeAnimation = animationRef.current;
    return () => {
      window.clearInterval(stepInterval);
      if (activeAnimation) {
        window.cancelAnimationFrame(activeAnimation);
      }
    };
  }, [analysisSteps, animationRef, canvasRef, status]);

  return {
    file,
    status,
    progress,
    scanStep,
    analysisResult,
    error,
    setError,
    canvasRef,
    animationRef,
    startUpload,
    resetScanner,
  };
}
