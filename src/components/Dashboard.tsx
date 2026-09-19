import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  AlertTriangle, 
  Radio, 
  Tv, 
  CheckCircle, 
  Clock, 
  ListOrdered, 
  Film, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  StreamMetrics, 
  YouTubeChannelInfo, 
  PlaylistItem, 
  LiveBroadcastConfig, 
  VideoItem 
} from '../types';
import { StreamHealthMonitor } from './StreamHealthMonitor';
import { YouTubeLinkImporter } from './YouTubeLinkImporter';

interface DashboardProps {
  metrics: StreamMetrics;
  channel: YouTubeChannelInfo;
  playlists: PlaylistItem[];
  activePlaylistId: string | null;
  onSelectPlaylist: (id: string) => void;
  videos: VideoItem[];
  onStartLive: () => void;
  onStopLive: () => void;
  onPauseLive: () => void;
  onResumeLive: () => void;
  onEmergencyStop: () => void;
  onNavigateTab: (tab: string) => void;
  testMode: boolean;
  setTestMode: (val: boolean) => void;
  onImportYouTubeSuccess?: (video: VideoItem, playlist?: PlaylistItem | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  channel,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  videos,
  onStartLive,
  onStopLive,
  onPauseLive,
  onResumeLive,
  onEmergencyStop,
  onNavigateTab,
  testMode,
  setTestMode,
  onImportYouTubeSuccess,
}) => {
  const isLive = metrics.state === 'LIVE';
  const isPaused = metrics.state === 'PAUSED';
  const isPreparing = metrics.state === 'PREPARING';
  const isReconnecting = metrics.state === 'RECONNECTING';

  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0] || null;
  const currentVideo = videos.find(v => v.id === metrics.currentVideoId) || null;

  // Unverified count in current playlist
  const unverifiedInPlaylist = activePlaylist
    ? activePlaylist.videoIds
        .map(id => videos.find(v => v.id === id))
        .filter(v => !v || v.rightsStatus === 'NOT_VERIFIED' || !v.rightsConfirmed).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Big Live Status Indicator when streaming */}
      {isLive && (
        <div className="bg-gradient-to-r from-rose-950/80 via-red-900/60 to-rose-950/80 border border-rose-500/50 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <span className="w-4 h-4 rounded-full bg-white animate-pulse-live" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white tracking-widest uppercase">
                  BROADCASTING LIVE
                </span>
                <span className="text-xs text-rose-300 font-medium">
                  {testMode ? '(Local Ingestion Test Sink)' : 'to YouTube Live Channel'}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white mt-0.5">
                {metrics.currentVideoTitle || 'Original Showcase Stream'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-rose-500/30 text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Live Duration</span>
              <span className="font-mono font-bold text-white text-base">
                {Math.floor(metrics.elapsedSeconds / 3600).toString().padStart(2, '0')}:
                {Math.floor((metrics.elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
                {(metrics.elapsedSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Front-and-Center YouTube Video Link Importer */}
      <YouTubeLinkImporter
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        onImportSuccess={(video, playlist) => {
          if (onImportYouTubeSuccess) {
            onImportYouTubeSuccess(video, playlist);
          }
        }}
      />

      {/* Main Broadcast Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-500" />
              <span>Broadcast Control Deck</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live transmission switchboard, playlist binding, and process controls.
            </p>
          </div>

          {/* Active Playlist Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0">Track:</span>
            <select
              value={activePlaylist?.id || ''}
              onChange={(e) => onSelectPlaylist(e.target.value)}
              disabled={isLive || isPreparing}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-medium"
            >
              {playlists.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.videoIds.length} videos)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Warning if playlist has unverified videos */}
        {unverifiedInPlaylist > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Selected playlist contains <strong>{unverifiedInPlaylist} unverified video(s)</strong>. Unverified content is blocked from live streaming.
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('videos')}
              className="text-[11px] font-semibold text-rose-400 hover:text-white underline"
            >
              Verify in Library →
            </button>
          </div>
        )}

        {/* LARGE ACTION BUTTONS (Core Requirement Q) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. START LIVE */}
          <button
            id="btn-start-live"
            onClick={onStartLive}
            disabled={isLive || isPreparing || unverifiedInPlaylist > 0 || !activePlaylist || activePlaylist.videoIds.length === 0}
            className={`py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold transition-all shadow-lg ${
              isLive || isPreparing || unverifiedInPlaylist > 0 || !activePlaylist || activePlaylist.videoIds.length === 0
                ? 'bg-slate-800/80 text-slate-600 border border-slate-800 cursor-not-allowed'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/40 hover:scale-[1.02] cursor-pointer'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            <span className="text-sm tracking-wide">START LIVE</span>
            <span className="text-[10px] font-normal opacity-80">
              {isPreparing ? 'Preparing FFmpeg...' : 'Initiate RTMP Stream'}
            </span>
          </button>

          {/* 2. STOP LIVE */}
          <button
            id="btn-stop-live"
            onClick={onStopLive}
            disabled={!isLive && !isPaused && !isReconnecting}
            className={`py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold transition-all shadow-lg ${
              !isLive && !isPaused && !isReconnecting
                ? 'bg-slate-800/80 text-slate-600 border border-slate-800 cursor-not-allowed'
                : 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-950/40 hover:scale-[1.02] cursor-pointer'
            }`}
          >
            <Square className="w-6 h-6 fill-current" />
            <span className="text-sm tracking-wide">STOP LIVE</span>
            <span className="text-[10px] font-normal opacity-80">Clean Stream Termination</span>
          </button>

          {/* 3. PAUSE / RESUME */}
          {isPaused ? (
            <button
              id="btn-resume-live"
              onClick={onResumeLive}
              className="py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40 hover:scale-[1.02] cursor-pointer transition-all"
            >
              <Play className="w-6 h-6 fill-current" />
              <span className="text-sm tracking-wide">RESUME LIVE</span>
              <span className="text-[10px] font-normal opacity-80">Continue Transmission</span>
            </button>
          ) : (
            <button
              id="btn-pause-live"
              onClick={onPauseLive}
              disabled={!isLive}
              className={`py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold transition-all shadow-lg ${
                !isLive
                  ? 'bg-slate-800/80 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:scale-[1.02] cursor-pointer'
              }`}
            >
              <Pause className="w-6 h-6" />
              <span className="text-sm tracking-wide">PAUSE</span>
              <span className="text-[10px] font-normal opacity-80">Hold Transmission</span>
            </button>
          )}

          {/* 4. EMERGENCY STOP */}
          <button
            id="btn-emergency-stop"
            onClick={onEmergencyStop}
            className="py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 hover:text-white shadow-lg shadow-red-950/50 hover:scale-[1.02] cursor-pointer transition-all"
          >
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="text-sm tracking-wide">EMERGENCY STOP</span>
            <span className="text-[10px] font-normal opacity-80">Force Kill All Encoders</span>
          </button>
        </div>
      </div>

      {/* Real-Time Stream Health Monitor Component */}
      <StreamHealthMonitor metrics={metrics} />

      {/* Bottom Grid: Channel Card & Track Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Channel Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">YouTube Channel</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              API Connected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={channel.thumbnailUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={channel.title}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
            />
            <div className="overflow-hidden">
              <h4 className="font-bold text-slate-200 text-sm truncate">{channel.title}</h4>
              <p className="text-xs text-slate-400 truncate">{channel.customUrl || channel.channelId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">Subscribers</span>
              <span className="font-semibold text-slate-300">{channel.subscriberCount || '128K'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Live Eligibility</span>
              <span className="font-semibold text-emerald-400">ENABLED</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('settings')}
            className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Manage YouTube Authorization
          </button>
        </div>

        {/* Current Video Preview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Active Video Track</h3>
            <span className="text-[10px] text-slate-400">
              {metrics.playlistIndex} of {metrics.playlistTotal || 1}
            </span>
          </div>

          <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
            {currentVideo ? (
              <img
                src={currentVideo.thumbnailUrl || '/sample-thumb.jpg'}
                alt={currentVideo.originalName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="text-center p-4 text-slate-600 text-xs">
                <Film className="w-8 h-8 mx-auto mb-1 text-slate-700" />
                <span>No active video feed</span>
              </div>
            )}
            {isLive && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-600 text-[10px] font-bold text-white tracking-wider animate-pulse-live">
                ENCODING
              </div>
            )}
          </div>

          <div className="text-xs">
            <p className="font-semibold text-slate-200 truncate">
              {metrics.currentVideoTitle || 'Ready for broadcast start'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Next in queue: <span className="text-slate-300">{metrics.nextVideoTitle || 'None (End of playlist)'}</span>
            </p>
          </div>
        </div>

        {/* Quick Operations & Policy Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider border-b border-slate-800 pb-3">
              Broadcast Actions
            </h3>
            <div className="space-y-2 mt-3 text-xs">
              <button
                onClick={() => onNavigateTab('livestream')}
                className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-rose-500" />
                  <span>Configure YouTube Event</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigateTab('videos')}
                className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Review Rights ({videos.filter(v => v.rightsStatus === 'NOT_VERIFIED').length} unverified)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigateTab('scheduler')}
                className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>Schedule Broadcast</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <span className="text-slate-300 font-semibold block mb-0.5">Policy Reminder</span>
            Do not rebroadcast unauthorized footage. Ensure all videos in track are verified original content.
          </div>
        </div>
      </div>
    </div>
  );
};
