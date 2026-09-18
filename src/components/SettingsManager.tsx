import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Video, 
  Wifi, 
  Tv, 
  ShieldCheck, 
  Check, 
  KeyRound,
  Radio
} from 'lucide-react';
import { AppSettings, HardwareAcceleration } from '../types';

interface SettingsManagerProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void>;
  onTestFfmpeg: () => Promise<{ success: boolean; version?: string; encoders?: string[]; error?: string }>;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  onSaveSettings,
  onTestFfmpeg,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testingFfmpeg, setTestingFfmpeg] = useState(false);

  // Sync settings
  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      alert('Settings saved successfully.');
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunFfmpegTest = async () => {
    setTestingFfmpeg(true);
    try {
      const res = await onTestFfmpeg();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingFfmpeg(false);
    }
  };

  const currentBitrate = formData.defaultBitrateKbps || formData.videoBitrateKbps || 4500;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-rose-500" />
            <span>Application Settings & Encoders</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure FFmpeg binaries, GPU hardware acceleration, stream presets, and YouTube API credentials.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* 1. FFmpeg & Hardware Acceleration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
            <Cpu className="w-4 h-4 text-rose-500" />
            <span>FFmpeg & Encoder Pipeline</span>
          </h3>

          <div>
            <label className="text-slate-300 font-medium block mb-1">FFmpeg Executable Path</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.ffmpegPath}
                onChange={(e) => setFormData({ ...formData, ffmpegPath: e.target.value })}
                placeholder="ffmpeg (or C:\ffmpeg\bin\ffmpeg.exe)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={handleRunFfmpegTest}
                disabled={testingFfmpeg}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium shrink-0 transition-colors"
              >
                {testingFfmpeg ? 'Probing...' : 'Test Binary'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports Windows `.exe` paths or system PATH standard binaries.
            </p>
          </div>

          {/* Test Binary Results */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              testResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <p className="font-bold">
                {testResult.success ? '✓ FFmpeg Verified & Ready' : '✕ FFmpeg Detection Failed'}
              </p>
              {testResult.version && <p className="text-[11px] text-slate-300">Version: {testResult.version}</p>}
              {testResult.encoders && (
                <p className="text-[10px] text-slate-400">
                  Available Encoders: {testResult.encoders.join(', ')}
                </p>
              )}
              {testResult.error && <p className="text-[11px] text-rose-400">{testResult.error}</p>}
            </div>
          )}

          <div>
            <label className="text-slate-300 font-medium block mb-1">Hardware Acceleration</label>
            <select
              value={formData.hardwareAcceleration}
              onChange={(e) => setFormData({ ...formData, hardwareAcceleration: e.target.value as HardwareAcceleration })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="auto">Auto Detect Best Hardware Acceleration</option>
              <option value="nvenc">NVIDIA NVENC (h264_nvenc)</option>
              <option value="qsv">Intel Quick Sync Video (h264_qsv)</option>
              <option value="amf">AMD AMF (h264_amf)</option>
              <option value="none">CPU Software Only (libx264)</option>
            </select>
          </div>
        </div>

        {/* 2. Video & Stream Presets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
            <Video className="w-4 h-4 text-sky-400" />
            <span>Livestream Quality & Presets</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Default Resolution</label>
              <select
                value={formData.defaultResolution}
                onChange={(e) => setFormData({ ...formData, defaultResolution: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="1080p">1080p Full HD (1920x1080)</option>
                <option value="720p">720p HD (1280x720)</option>
                <option value="1440p">1440p 2K (2560x1440)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Framerate</label>
              <select
                value={formData.defaultFps}
                onChange={(e) => setFormData({ ...formData, defaultFps: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (High Motion)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Video Bitrate: <span className="text-rose-400 font-bold">{currentBitrate} kbps</span>
            </label>
            <input
              type="range"
              min="2000"
              max="12000"
              step="500"
              value={currentBitrate}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData({ ...formData, defaultBitrateKbps: val, videoBitrateKbps: val });
              }}
              className="w-full accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>2000 kbps (720p)</span>
              <span>4500-6000 kbps (1080p Recommended)</span>
              <span>12000 kbps (High)</span>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Audio Bitrate</label>
            <select
              value={formData.audioBitrateKbps}
              onChange={(e) => setFormData({ ...formData, audioBitrateKbps: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value={128}>128 kbps AAC</option>
              <option value={160}>160 kbps AAC (Recommended)</option>
              <option value={320}>320 kbps AAC (Audiophile)</option>
            </select>
          </div>
        </div>

        {/* 3. Reconnect & Network Recovery */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
            <Wifi className="w-4 h-4 text-amber-400" />
            <span>Auto-Reconnect & Drop Protection</span>
          </h3>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-slate-200 font-medium block">Automatic Reconnect on Network Drops</span>
              <span className="text-[10px] text-slate-500">Progressive exponential backoff retries</span>
            </div>
            <input
              type="checkbox"
              checked={formData.autoReconnect ?? true}
              onChange={(e) => setFormData({ ...formData, autoReconnect: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 text-rose-600 bg-slate-900"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Max Reconnect Attempts</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.maxReconnectAttempts}
                onChange={(e) => setFormData({ ...formData, maxReconnectAttempts: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Retry Delay (Seconds)</label>
              <input
                type="number"
                min="2"
                max="30"
                value={formData.reconnectDelaySeconds ?? 5}
                onChange={(e) => setFormData({ ...formData, reconnectDelaySeconds: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Test Mode Switch */}
          <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <span className="text-slate-200 font-semibold">Test Mode (Local Null Ingestion)</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.testMode)}
                onChange={(e) => setFormData({ ...formData, testMode: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-rose-600 bg-slate-900"
              />
            </label>
            <p className="text-[11px] text-slate-400">
              Streams to a local null sink instead of hitting real YouTube RTMP servers. Ideal for validating playlists and video codecs before going live.
            </p>
          </div>
        </div>

        {/* 4. YouTube OAuth & Policy Verification */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>YouTube Live API Authentication</span>
          </h3>

          <div className="space-y-2">
            <label className="text-slate-300 font-medium block">YouTube Stream Ingestion Key</label>
            <input
              type="password"
              value={formData.youtubeStreamKey || ''}
              onChange={(e) => setFormData({ ...formData, youtubeStreamKey: e.target.value })}
              placeholder="••••••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">
              Found in YouTube Studio &gt; Live Streaming &gt; Stream Settings. Encrypted locally and never sent to third parties.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-semibold text-rose-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Policy Compliance Guarantee
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This application operates strictly under YouTube Developer Policies. Automated loops, artificial view inflation, and rebroadcasting third-party materials without explicit licensing are strictly prohibited and architecturally blocked.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
