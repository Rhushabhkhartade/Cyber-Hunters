import { Users, Layers, Activity } from "lucide-react";

export default function About() {
  return (
    <div className="relative z-10 w-full max-w-6xl px-4 py-12 md:py-16">
      {/* Narrative Section */}
      <section className="mb-16 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-6">
          Defending Truth in the Synthetic Age
        </h2>
        <p className="text-gray-400 text-base leading-relaxed mb-6 font-sans">
          SentinelAI was founded in 2024 by cyber defense engineers and artificial intelligence researchers. Our mission is to secure human identity and corporate perimeters in a world where voice cloning, synthetic videos, and AI-driven social engineering can bypass traditional security filters.
        </p>
        <p className="text-gray-400 text-base leading-relaxed font-sans">
          We protect financial institutions, national security hubs, and multinational organizations from CEO fraud, deepfake identity verification bypasses, and high-frequency spoofing campaigns.
        </p>
      </section>

      {/* Corporate Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <div className="glass-panel rounded-xl p-6 text-left border-l-4 border-l-purple-500">
          <Users className="w-8 h-8 text-purple-400 mb-4" />
          <h3 className="font-display font-semibold text-lg text-white mb-2">Zero-Trust Identity</h3>
          <p className="text-sm text-gray-400 leading-relaxed font-sans">
            Every audio and video feed entering your business communication streams must be vetted, verified, and dynamically signed.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6 text-left border-l-4 border-l-cyan-400">
          <Layers className="w-8 h-8 text-cyan-400 mb-4" />
          <h3 className="font-display font-semibold text-lg text-white mb-2">Neural Defense Stack</h3>
          <p className="text-sm text-gray-400 leading-relaxed font-sans">
            We operate multi-layered convolutional classifiers and natural language analyzers to spot irregularities that escape human senses.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6 text-left border-l-4 border-l-purple-500">
          <Activity className="w-8 h-8 text-purple-400 mb-4" />
          <h3 className="font-display font-semibold text-lg text-white mb-2">Active Interception</h3>
          <p className="text-sm text-gray-400 leading-relaxed font-sans">
            Rather than scanning post-incident logs, our technology analyzes call and conference data on the fly to stop wire transfers before execution.
          </p>
        </div>
      </section>

      {/* Technical Architecture Pipeline Map */}
      <section className="glass-panel rounded-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial-glow opacity-25 pointer-events-none" />
        
        <h3 className="text-center font-display text-2xl text-white font-bold mb-10">
          Detection Pipeline Architecture
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10 text-center font-mono">
          {/* Step 1 */}
          <div className="flex flex-col items-center bg-black/40 border border-purple-500/20 p-5 rounded-lg">
            <span className="text-xs text-purple-400 font-bold mb-2">01 / INGESTION</span>
            <h4 className="text-white text-base font-semibold font-display mb-3">Feed Audio & Video</h4>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Streams ingest via unified API, Zoom client hook, or browser drag-and-drop.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center text-purple-500/30 text-xl font-bold">
            &rarr;
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center bg-black/40 border border-cyan-500/20 p-5 rounded-lg">
            <span className="text-xs text-cyan-400 font-bold mb-2">02 / DECOMPOSITION</span>
            <h4 className="text-white text-base font-semibold font-display mb-3">Feature Extraction</h4>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Splits streams into facial keypoint coordinates and speech mel-spectrogram arrays.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center text-cyan-500/30 text-xl font-bold">
            &rarr;
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center bg-black/40 border border-purple-500/20 p-5 rounded-lg">
            <span className="text-xs text-purple-400 font-bold mb-2">03 / INFERENCE</span>
            <h4 className="text-white text-base font-semibold font-display mb-3">Neural Classification</h4>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Run models against deep neural pattern databases checking for micro-textures and vocal cloning.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center text-purple-500/30 text-xl font-bold">
            &rarr;
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center bg-black/40 border border-cyan-500/20 p-5 rounded-lg">
            <span className="text-xs text-cyan-400 font-bold mb-2">04 / DISPATCH</span>
            <h4 className="text-white text-base font-semibold font-display mb-3">Policy & Alerts</h4>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Triggers alerts, updates system logs, issues risk reports, and cuts malicious VoIP routes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
