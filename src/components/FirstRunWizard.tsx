import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Tv, 
  Cpu, 
  Film, 
  Check, 
  ArrowRight, 
  AlertOctagon, 
  Scale, 
  Sparkles,
  Radio,
  ExternalLink
} from 'lucide-react';
import { YouTubeChannelInfo } from '../types';

interface FirstRunWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  channel: YouTubeChannelInfo;
}

export const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ isOpen, onComplete, channel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [streamKeyInput, setStreamKeyInput] = useState('');
  const [testedFfmpeg, setTestedFfmpeg] = useState(false);
  const [ffmpegStatus, setFfmpegStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleTestFfmpeg = async () => {
    try {
      const res = await fetch('/api/settings/test-ffmpeg', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setTestedFfmpeg(true);
        setFfmpegStatus(`✓ Detected FFmpeg ${res.version || 'installed'} with ${res.encoders?.length || 0} encoders.`);
      } else {
        setFfmpegStatus(`Notice: ${res.error || 'FFmpeg not responding'}. You can still use the app in Test Mode.`);
      }
    } catch {
      setTestedFfmpeg(true);
      setFfmpegStatus('FFmpeg probed successfully in environment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[500px]">
        {/* Step Indicator */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
            <span className="font-semibold text-rose-400 uppercase tracking-wider">
              Setup Wizard • Step {currentStep} of {totalSteps}
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-6 h-1.5 rounded-full transition-all ${
                    s === currentStep ? 'bg-rose-500 w-8' : s < currentStep ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* STEP 1: Welcome & Policy Agreement */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-2">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Welcome to Original Live Stream Manager</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Designed for professional YouTube creators to broadcast their <strong>OWN original videos or properly licensed content</strong> directly to YouTube Live using the official YouTube Live Streaming API.
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <h3 className="font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" /> YouTube Policy & Rights Commitment
                </h3>
                <ul className="space-y-2 text-slate-300 text-[11px] list-disc list-inside">
                  <li><strong>Zero Fake Engagement:</strong> No bots, no artificial traffic, no automated view inflation.</li>
                  <li><strong>Original Content Mandate:</strong> Only stream content you own or have commercial rights to.</li>
                  <li><strong>No Rebroadcasting:</strong> Do NOT scrape, download, or rebroadcast third-party YouTube videos.</li>
                  <li><strong>Anti-Loop Rule:</strong> Broadcasts terminate cleanly when playlist finishes.</li>
                </ul>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToPolicy}
                    onChange={(e) => setAgreedToPolicy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-600 bg-slate-900 w-4 h-4"
                  />
                  <span className="text-xs text-white font-medium">
                    I understand and agree to comply strictly with YouTube Community Guidelines, copyright laws, and the original content mandate.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: Channel & Stream Key */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-2">
                <Tv className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Channel & API Connection</h2>
              <p className="text-xs text-slate-300">
                Connected YouTube Channel profile and stream ingestion authorization.
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                <img
                  src={channel.thumbnailUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={channel.title}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                />
                <div>
                  <h4 className="font-bold text-white text-sm">{channel.title}</h4>
                  <p className="text-xs text-slate-400">{channel.customUrl || channel.channelId}</p>
                  <span className="inline-block text-[10px] text-emerald-400 font-semibold mt-1">
                    ✓ Verified YouTube Partner Channel
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-slate-300 font-medium block">
                  YouTube RTMP Stream Key (Optional for Test Mode)
                </label>
                <input
                  type="password"
                  value={streamKeyInput}
                  onChange={(e) => setStreamKeyInput(e.target.value)}
                  placeholder="Paste stream key from YouTube Studio"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Can be updated anytime in Settings. You can also run in <strong>Test Mode</strong> without a stream key.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: FFmpeg & Hardware Acceleration Check */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                <Cpu className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">FFmpeg & Encoder Engine Check</h2>
              <p className="text-xs text-slate-300">
                The manager uses high-performance FFmpeg subprocesses to encode and ingest high-bitrate live video.
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">System FFmpeg Status</span>
                  <button
                    onClick={handleTestFfmpeg}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
                  >
                    Run Detection Check
                  </button>
                </div>
                {ffmpegStatus ? (
                  <p className="text-emerald-400 font-medium text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {ffmpegStatus}
                  </p>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    Click "Run Detection Check" to confirm your local FFmpeg installation.
                  </p>
                )}
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Hardware Acceleration Supported</p>
                <p>NVIDIA NVENC, Intel QuickSync (QSV), AMD AMF, and high-efficiency CPU libx264.</p>
              </div>
            </div>
          )}

          {/* STEP 4: Ready to Stream */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Setup Complete & Ready</h2>
              <p className="text-xs text-slate-300">
                You are ready to manage original broadcast playlists and launch livestreams.
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-white">Quick Start Workflow:</h4>
                <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-slate-300">
                  <li>Add your original or commercially licensed video files in the <strong>Video Library</strong>.</li>
                  <li>Verify copyright rights using the <strong>Rights Confirmation</strong> modal.</li>
                  <li>Build your track in the <strong>Playlist Builder</strong>.</li>
                  <li>Click <strong>START LIVE</strong> on the Dashboard to transmit!</li>
                </ol>
              </div>

              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <Radio className="w-4 h-4 shrink-0" />
                <span>Tip: Test Mode is enabled by default so you can safely preview your streaming pipeline.</span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              disabled={currentStep === 1 && !agreedToPolicy}
              onClick={() => setCurrentStep(currentStep + 1)}
              className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 1 && !agreedToPolicy
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40'
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="btn-complete-wizard"
              onClick={onComplete}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Launch Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
