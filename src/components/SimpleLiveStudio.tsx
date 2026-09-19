import React, { useState, useEffect } from 'react';
import { 
  Youtube, 
  Play, 
  Square, 
  Radio, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Clock, 
  Tv, 
  Sparkles,
  Settings,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { StreamMetrics, VideoItem } from '../types';

interface SimpleLiveStudioProps {
  metrics: StreamMetrics;
  onRefreshMetrics: () => void;
  onSwitchToAdvanced?: () => void;
}

export const SimpleLiveStudio: React.FC<SimpleLiveStudioProps> = ({
  metrics,
  onRefreshMetrics,
  onSwitchToAdvanced,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [streamKey, setStreamKey] = useState(() => localStorage.getItem('yt_simple_stream_key') || '');
  const [streamMode, setStreamMode] = useState<'real' | 'test'>('real');
  const [customTitle, setCustomTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);

  const isLive = metrics.state === 'LIVE';
  const isPreparing = metrics.state === 'PREPARING';

  // Save stream key locally so user doesn't have to retype every time
  useEffect(() => {
    if (streamKey) {
      localStorage.setItem('yt_simple_stream_key', streamKey);
    }
  }, [streamKey]);

  // Handle Starting Live Stream
  const handleStartLive = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!youtubeUrl.trim() && !currentVideo) {
      setError('Pehle YouTube video ka link yahan paste karein.');
      return;
    }

    if (streamMode === 'real' && !streamKey.trim()) {
      setError('Asal YouTube par live chalane ke liye YouTube Studio se Stream Key yahan dalein, ya neeche "Quick Test Mode" select karein.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/stream/quick-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim(),
          streamKey: streamMode === 'real' ? streamKey.trim() : 'mock_test_key',
          testMode: streamMode === 'test',
          title: customTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Live stream shuru nahi ho saki.');
      }

      if (data.video) {
        setCurrentVideo(data.video);
      }

      onRefreshMetrics();
    } catch (err: any) {
      setError(err.message || 'Stream shuru karne me masla aaya.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Stopping Live Stream
  const handleStopLive = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/stream/stop', { method: 'POST' });
      onRefreshMetrics();
    } catch (err: any) {
      setError('Stream band karne me masla aaya.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick sample links
  const handleUseSample = (url: string) => {
    setYoutubeUrl(url);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>YouTube 24/7 Live Streamer</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                Aasan 1-Click Mode
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Sirf video link paste karein aur live button dabayein!
            </p>
          </div>
        </div>

        {onSwitchToAdvanced && (
          <button
            type="button"
            onClick={onSwitchToAdvanced}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Advanced Studio</span>
          </button>
        )}
      </div>

      {/* WHEN LIVE: ACTIVE BROADCAST SCREEN */}
      {isLive ? (
        <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />

          {/* Live Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-rose-600 text-white px-3.5 py-1.5 rounded-full font-bold text-xs tracking-wider uppercase animate-pulse shadow-md shadow-rose-950/60">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>LIVE CHAL RAHA HAI (BROADCASTING)</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {metrics.connectionStatus === 'CONNECTED' ? '✅ Connected' : metrics.connectionStatus}
              </span>
            </div>

            {/* Live Uptime Timer */}
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <Clock className="w-4 h-4 text-rose-500" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Live Waqt (Duration)</span>
                <span className="font-mono text-base font-bold text-white">
                  {Math.floor(metrics.elapsedSeconds / 3600).toString().padStart(2, '0')}:
                  {Math.floor((metrics.elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
                  {(metrics.elapsedSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Video Title & Player */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
              <Tv className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{metrics.currentVideoTitle || 'Live Video'}</span>
            </h2>

            {/* Live Video Preview Box */}
            <div className="w-full aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden relative shadow-inner flex items-center justify-center">
              {metrics.currentVideoId && (
                <video
                  src={`/api/videos/${metrics.currentVideoId}/file`}
                  autoPlay
                  loop
                  muted
                  controls
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>LIVE FEED</span>
              </div>
            </div>
          </div>

          {/* Stream Stats pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Bitrate</span>
              <span className="font-mono font-bold text-slate-200">
                {metrics.bitrateKbps > 0 ? `${metrics.bitrateKbps} kbps` : '4,500 kbps'}
              </span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Framerate</span>
              <span className="font-mono font-bold text-slate-200">
                {metrics.fps > 0 ? `${metrics.fps} FPS` : '25 FPS'}
              </span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 block">24/7 Loop</span>
              <span className="font-mono font-bold text-emerald-400">
                Active (Auto-Loop)
              </span>
            </div>
          </div>

          {/* Big Stop Live Button */}
          <button
            type="button"
            id="btn-stop-live-simple"
            onClick={handleStopLive}
            disabled={isLoading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-red-950/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.01]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Stream Band Ho Rahi Hai...</span>
              </>
            ) : (
              <>
                <Square className="w-5 h-5 fill-current" />
                <span>LIVE BAND KAREIN (STOP LIVE STREAM)</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* WHEN IDLE: THE 1-CLICK LAUNCHPAD */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

          {/* Form */}
          <form onSubmit={handleStartLive} className="space-y-6">
            {/* STEP 1: YOUTUBE VIDEO LINK */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <Youtube className="w-5 h-5 text-rose-500" />
                  <span>YouTube Video Ka Link Paste Karein:</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  id="simple-youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=... ya https://youtu.be/..."
                  className="w-full px-4 py-3.5 bg-slate-950 border-2 border-slate-700 hover:border-slate-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 rounded-2xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none transition-all font-mono shadow-inner"
                />
                {youtubeUrl && (
                  <button
                    type="button"
                    onClick={() => setYoutubeUrl('')}
                    className="absolute right-3 top-3.5 px-2 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sample link helpers */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs text-slate-400">Nahi hai link? Test ke liye click karein:</span>
                <button
                  type="button"
                  onClick={() => handleUseSample('https://www.youtube.com/watch?v=jNQXAC9IVRw')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                >
                  ▶ Me at the zoo (Sample 1)
                </button>
                <button
                  type="button"
                  onClick={() => handleUseSample('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                >
                  ▶ Rick Astley (Sample 2)
                </button>
              </div>
            </div>

            {/* STEP 2: STREAM DESTINATION */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                <Radio className="w-5 h-5 text-rose-500" />
                <span>Kahan Live Chalana Chahte Hain?</span>
              </label>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Real YouTube Channel */}
                <div
                  onClick={() => setStreamMode('real')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    streamMode === 'real'
                      ? 'bg-rose-500/10 border-rose-500 text-white shadow-lg shadow-rose-950/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <input
                      type="radio"
                      name="streamMode"
                      checked={streamMode === 'real'}
                      onChange={() => setStreamMode('real')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-sm text-white">Asal YouTube Channel Par</span>
                  </div>
                  <p className="text-xs text-slate-400 pl-6">
                    Aap ke YouTube Channel par asal Live broadcast shuru hogi.
                  </p>
                </div>

                {/* Option B: Quick Test Mode */}
                <div
                  onClick={() => setStreamMode('test')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    streamMode === 'test'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <input
                      type="radio"
                      name="streamMode"
                      checked={streamMode === 'test'}
                      onChange={() => setStreamMode('test')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-sm text-emerald-400">Quick Test Mode (Free)</span>
                  </div>
                  <p className="text-xs text-slate-400 pl-6">
                    Bina kisi Stream Key ke foran check karein ke live kaise chalta hai.
                  </p>
                </div>
              </div>

              {/* Stream Key input if Real YouTube mode is selected */}
              {streamMode === 'real' && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-rose-500" />
                      <span>YouTube Stream Key:</span>
                    </label>
                    <a
                      href="https://studio.youtube.com/channel/live"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <span>YouTube Studio Kholein</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <input
                    type="password"
                    id="simple-stream-key"
                    value={streamKey}
                    onChange={(e) => {
                      setStreamKey(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="xxxx-xxxx-xxxx-xxxx (YouTube Studio se copy karein)"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    Yeh key aap ke browser me save rehti hai, baar baar daalne ki zaroorat nahi padegi.
                  </p>
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/40 p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-rose-300 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* BIG RED ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-go-live-now"
                disabled={isLoading}
                className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-2xl cursor-pointer ${
                  isLoading
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:via-red-500 hover:to-rose-600 text-white shadow-rose-950/70 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Live Shuru Ho Raha Hai (Please wait 2-3 sec)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" />
                    <span>🔴 LIVE CHALAO (GO LIVE NOW)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Simple Explanation at the bottom */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs text-slate-400">
            <div className="p-2.5 rounded-xl bg-slate-950/50">
              <span className="font-semibold text-slate-200 block mb-0.5">1. Link Paste Karein</span>
              <span>Koi bhi YouTube link dalain</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/50">
              <span className="font-semibold text-slate-200 block mb-0.5">2. Button Dabayein</span>
              <span>"Live Chalao" par click karein</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/50">
              <span className="font-semibold text-slate-200 block mb-0.5">3. 24/7 Live Stream</span>
              <span>Stream bina ruko continuous chalegi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
