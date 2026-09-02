import { useState } from "react";
import { Download, CheckCircle, RefreshCw } from "lucide-react";

export default function RiskReport() {
  const [compiling, setCompiling] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [department, setDepartment] = useState("Finance & Operations");
  const [riskGrade, setRiskGrade] = useState("A-");
  const [auditRef, setAuditRef] = useState("");
  const [genDate, setGenDate] = useState("");

  const generateAuditBrief = (e) => {
    e.preventDefault();
    if (!companyName) {
      alert("Please enter a corporate entity name.");
      return;
    }
    setCompiling(true);
    setReportReady(false);

    // Simulate audit synthesis
    setTimeout(() => {
      setCompiling(false);
      setReportReady(true);
      // Randomly assign a risk grade for diversity
      const grades = ["A-", "B+", "A", "B"];
      setRiskGrade(grades[Math.floor(Math.random() * grades.length)]);
      setAuditRef(`S-AUDIT-${Math.floor(Math.random() * 90000 + 10000)}`);
      setGenDate(new Date().toLocaleDateString());
    }, 3000);
  };

  const handleDownload = () => {
    alert(`Downloading SentinelAI_Risk_Report_${companyName.replace(/\s+/g, "_")}.pdf ... (Simulation)`);
  };

  return (
    <div className="relative z-10 w-full max-w-4xl px-4 py-12 md:py-16">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-4">
          Corporate Risk Compiler
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Generate comprehensive audit summaries on synthetic identity vulnerability, communication pathway vetting, and threat defense ratios.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-glow opacity-20 pointer-events-none" />

        {!reportReady && !compiling && (
          <form onSubmit={generateAuditBrief} className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2 font-bold">
                Corporate Entity Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full bg-cyber-dark border border-purple-500/20 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/60 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2 font-bold">
                Operational Sector
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-cyber-dark border border-purple-500/20 rounded px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-purple-500/60 font-sans"
              >
                <option value="Finance & Operations">Finance & Treasury Operations</option>
                <option value="Executive Administration">Executive Administration & HR</option>
                <option value="KYC Vetting / Customer Support">KYC Vetting & Customer Support</option>
                <option value="Full Corporate Network">Full Enterprise Communication Node</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyber-purple to-purple-800 hover:scale-102 active:scale-98 text-white font-semibold font-display text-xs tracking-wider rounded border border-purple-500/30 transition-all duration-300 cursor-pointer"
            >
              RUN SECURITY AUDIT
            </button>
          </form>
        )}

        {compiling && (
          <div className="flex flex-col items-center py-12 max-w-md mx-auto">
            <RefreshCw className="w-12 h-12 text-purple-400 mb-6 animate-spin" />
            <h4 className="text-white font-semibold font-display text-lg mb-2">Analyzing Endpoint Configs</h4>
            <p className="text-xs font-mono text-purple-400 animate-pulse">
              Compiling vulnerability indexes for {companyName}...
            </p>
          </div>
        )}

        {reportReady && (
          <div className="flex flex-col">
            {/* Success Heading */}
            <div className="flex items-center gap-3 pb-4 border-b border-purple-500/10 mb-8">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-bold font-display text-white">
                Vulnerability Report Synthesized
              </h3>
            </div>

            {/* Simulated Document Container */}
            <div className="bg-black/60 border border-purple-500/15 rounded-xl p-6 md:p-8 font-mono text-xs text-gray-300 space-y-6 relative mb-8">
              {/* Document watermark grid */}
              <div className="absolute inset-0 bg-cyber-grid opacity-5 rounded-xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/10 pb-4 relative z-10">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-widest uppercase">SENTINEL SECURITY SYSTEM AUDIT</h4>
                  <span className="text-[10px] text-gray-500">REF: {auditRef || "S-AUDIT-20481"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">GEN TIME</span>
                  <span className="text-xs font-semibold text-white">{genDate}</span>
                </div>
              </div>

              {/* Core summary specs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-purple-500/10 pb-6 relative z-10">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase">CORPORATION</span>
                  <strong className="text-white text-sm font-display">{companyName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase">TARGET AUDIT</span>
                  <strong className="text-white text-sm font-display">{department}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase">DEFENSE GRADE</span>
                  <strong className="text-cyan-400 text-sm font-display glow-text-cyan">{riskGrade}</strong>
                </div>
              </div>

              {/* Bullet analysis notes */}
              <div className="space-y-4 relative z-10">
                <h5 className="font-bold text-white text-xs tracking-wider uppercase">VETTING DETAILS</h5>
                <ul className="space-y-3 list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">[CLEARED]</span>
                    <span className="text-gray-300">Video KYC boundary vectors show 99.4% authentication resistance.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold shrink-0">[SECURED]</span>
                    <span className="text-gray-300">Decentralized credential signatures successfully logs caller identification tokens.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">[WARN]</span>
                    <span className="text-gray-300">Unencrypted VoIP SIP gateways show vulnerability to generative audio synthesis hijacking.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-800 text-white font-semibold font-display text-xs tracking-wider rounded border border-purple-500/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                DOWNLOAD REPORT PDF
              </button>
              
              <button
                onClick={() => setReportReady(false)}
                className="w-full sm:w-auto px-6 py-3 bg-cyber-dark hover:bg-cyber-navy/80 text-white border border-purple-500/30 rounded text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                COMPILE ANOTHER AUDIT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
