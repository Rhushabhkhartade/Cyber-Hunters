import { useState } from "react";
import AppShell from "./components/layout/AppShell";
import ErrorBoundary from "./components/common/ErrorBoundary";

import Landing from "./pages/Landing";
import Features from "./pages/Features";
import About from "./pages/About";
import UploadAudio from "./pages/UploadAudio";
import UploadVideo from "./pages/UploadVideo";
import LiveDetection from "./pages/LiveDetection";
import Dashboard from "./pages/Dashboard";
import RiskReport from "./pages/RiskReport";
import Contact from "./pages/Contact";
import ThreatScanner from "./pages/ThreatScanner";

export default function App() {
  const [page, setPage] = useState("landing");

  return (
    <ErrorBoundary>
      <AppShell page={page} setPage={setPage}>
        {page === "landing" && <Landing setPage={setPage} />}
        {page === "features" && <Features />}
        {page === "about" && <About />}
        {page === "upload-audio" && <UploadAudio />}
        {page === "upload-video" && <UploadVideo />}
        {page === "live" && <LiveDetection />}
        {page === "threat-scanner" && <ThreatScanner />}
        {page === "dashboard" && <Dashboard />}
        {page === "risk-report" && <RiskReport />}
        {page === "contact" && <Contact />}
      </AppShell>
    </ErrorBoundary>
  );
}

