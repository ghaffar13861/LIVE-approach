import React from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  Cpu, 
  HardDrive, 
  Film, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Zap,
  Radio
} from 'lucide-react';
import { StreamMetrics } from '../types';

interface StreamHealthMonitorProps {
  metrics: StreamMetrics;
}

export const StreamHealthMonitor: React.FC<StreamHealthMonitorProps> = ({ metrics }) => {
  const isLive = metrics.state === 'LIVE';
  const isPaused = metrics.state === 'PAUSED';
  const isReconnecting = metrics.state === 'RECONNECTING';
  const isError = metrics.state === 'ERROR';

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const secs = (sec % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Convert kbps to Mbps
  const bitrateMbps = (metrics.bitrateKbps / 1000).toFixed(2);

  // Network badge
  const networkBadge = () => {
    if (metrics.networkQuality === 'GOOD') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <Wifi className="w-3 h-3 text-emerald-400" /> GOOD
        </span>
      );
    }
    if (metrics.networkQuality === 'WARNING') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Wifi className="w-3 h-3 text-amber-400" /> WARNING
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <WifiOff className="w-3 h-3 text-rose-400" /> POOR
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500" />
          <h3 className="font-bold text-slate-200 text-sm">Real-time Stream Telemetry</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Network:</span>
          {networkBadge()}
        </div>
      </div>

      {/* Reconnecting countdown alert */}
      {isReconnecting && (
        <div className="bg-amber-500/10 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between text-xs text-amber-300 animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Temporary network interruption. Progressive backoff recovery attempt {metrics.reconnectAttempt}/{metrics.maxReconnectAttempts}...</span>
          </div>
          <span className="font-bold font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">
            {metrics.reconnectCountdownSeconds}s
          </span>
        </div>
      )}

      {/* Error Banner with Solution */}
      {isError && metrics.errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/40 p-4 rounded-xl space-y-1.5 text-xs text-rose-300">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>{metrics.errorMessage}</span>
          </div>
          {metrics.errorSolution && (
            <p className="text-slate-300 pl-6 text-[11px]">
              <strong className="text-amber-400">Solution: </strong>
              {metrics.errorSolution}
            </p>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Stream Status */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Stream State</span>
          <div className="flex items-center gap-1.5 mt-1 font-bold text-xs">
            {isLive ? (
              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse-live" /> LIVE
              </span>
            ) : isPaused ? (
              <span className="text-amber-400">PAUSED</span>
            ) : isReconnecting ? (
              <span className="text-yellow-400">RECONNECTING</span>
            ) : (
              <span className="text-slate-500">STOPPED</span>
            )}
          </div>
        </div>

        {/* Bitrate */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Bitrate</span>
          <p className="font-bold text-slate-200 text-sm mt-1 font-mono">
            {metrics.bitrateKbps > 0 ? `${bitrateMbps} Mbps` : '0.00 Mbps'}
          </p>
        </div>

        {/* FPS */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Framerate (FPS)</span>
          <p className="font-bold text-slate-200 text-sm mt-1 font-mono">
            {metrics.fps} <span className="text-[10px] text-slate-500 font-normal">FPS</span>
          </p>
        </div>

        {/* Dropped Frames */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Dropped Frames</span>
          <p className={`font-bold text-sm mt-1 font-mono ${metrics.droppedFrames > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {metrics.droppedFrames}
          </p>
        </div>

        {/* Uploaded Data */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Uploaded Data</span>
          <p className="font-bold text-slate-200 text-sm mt-1 font-mono">
            {metrics.uploadedMegabytes.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">MB</span>
          </p>
        </div>

        {/* Elapsed Time */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Elapsed Time</span>
          <p className="font-bold text-slate-200 text-sm mt-1 font-mono">
            {formatElapsed(metrics.elapsedSeconds)}
          </p>
        </div>

        {/* Playlist Progress */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 sm:col-span-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            <span>Playlist Track Progress</span>
            <span className="text-slate-300 font-mono">
              {metrics.playlistIndex} / {metrics.playlistTotal || 1}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${metrics.playlistTotal > 0 ? (metrics.playlistIndex / metrics.playlistTotal) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Current and Next Video Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
          <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider block mb-1">
            Now Playing
          </span>
          <p className="font-semibold text-slate-200 truncate">
            {metrics.currentVideoTitle || 'No active video'}
          </p>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
          <span className="text-[10px] text-sky-400 uppercase font-bold tracking-wider block mb-1">
            Next Up
          </span>
          <p className="font-semibold text-slate-300 truncate">
            {metrics.nextVideoTitle || 'None (End of playlist)'}
          </p>
        </div>
      </div>
    </div>
  );
};
