/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { PolicyBanner } from './components/PolicyBanner';
import { Dashboard } from './components/Dashboard';
import { VideoLibrary } from './components/VideoLibrary';
import { PlaylistManager } from './components/PlaylistManager';
import { LiveStreamCreator } from './components/LiveStreamCreator';
import { Scheduler } from './components/Scheduler';
import { LogsViewer } from './components/LogsViewer';
import { SettingsManager } from './components/SettingsManager';
import { FirstRunWizard } from './components/FirstRunWizard';

import {
  VideoItem,
  PlaylistItem,
  StreamMetrics,
  LiveBroadcastConfig,
  YouTubeChannelInfo,
  ActivityLog,
  ScheduledStream,
  AppSettings,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core entities state
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [channel, setChannel] = useState<YouTubeChannelInfo>({
    connected: true,
    channelId: 'UC_ORIGINAL_CREATOR',
    title: 'Original Studio Live',
    description: 'Official verified original content creator live broadcast studio.',
    customUrl: '@OriginalStudioLive',
    subscriberCount: '142,500',
    thumbnailUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    liveStreamingEligible: true,
    isLiveStreamingEnabled: true,
    authMode: 'oauth',
  });

  const [metrics, setMetrics] = useState<StreamMetrics>({
    state: 'STOPPED',
    bitrateKbps: 0,
    fps: 0,
    droppedFrames: 0,
    uploadedMegabytes: 0,
    currentVideoId: undefined,
    currentVideoTitle: undefined,
    nextVideoId: undefined,
    nextVideoTitle: undefined,
    elapsedSeconds: 0,
    playlistIndex: 0,
    playlistTotal: 0,
    networkQuality: 'GOOD',
    autoReconnect: true,
    reconnectAttempt: 0,
    maxReconnectAttempts: 5,
    reconnectCountdownSeconds: 0,
  });

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [schedules, setSchedules] = useState<ScheduledStream[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    ffmpegPath: 'ffmpeg',
    hardwareAcceleration: 'auto',
    defaultResolution: '1080p',
    defaultBitrateKbps: 4500,
    videoBitrateKbps: 4500,
    defaultFps: 30,
    audioBitrateKbps: 160,
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelaySeconds: 5,
    testMode: true,
    youtubeStreamKey: '',
    firstRunWizardCompleted: true,
  });

  const [showWizard, setShowWizard] = useState(false);

  // Helper for safe JSON fetching with Content-Type verification
  const safeFetchJson = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 150)}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON response from ${url} but received ${contentType}`);
    }
    return res.json();
  };

  // 1. Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [videosRes, playlistsRes, channelRes, settingsRes, logsRes, schedRes] = await Promise.all([
        safeFetchJson('/api/videos'),
        safeFetchJson('/api/playlists'),
        safeFetchJson('/api/youtube/channel'),
        safeFetchJson('/api/settings'),
        safeFetchJson('/api/logs'),
        safeFetchJson('/api/scheduler'),
      ]);

      if (Array.isArray(videosRes)) setVideos(videosRes);
      if (Array.isArray(playlistsRes)) {
        setPlaylists(playlistsRes);
        if (playlistsRes.length > 0 && !activePlaylistId) {
          setActivePlaylistId(playlistsRes[0].id);
        }
      }
      if (channelRes && channelRes.channelId) {
        setChannel((prev) => ({ ...prev, ...channelRes }));
      }
      if (settingsRes && (settingsRes.ffmpegPath || settingsRes.settings?.ffmpegPath)) {
        const actualSettings = settingsRes.settings || settingsRes;
        setSettings((prev) => ({ ...prev, ...actualSettings }));
        if (actualSettings.firstRunWizardCompleted === false) {
          setShowWizard(true);
        }
      }
      if (Array.isArray(logsRes)) setLogs(logsRes);
      if (Array.isArray(schedRes)) setSchedules(schedRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [activePlaylistId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Poll stream metrics every 1 second
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const m = await fetch('/api/stream/metrics').then((r) => r.json());
        if (m && m.state) {
          setMetrics(m);
        }
      } catch (err) {
        // Ignore polling glitches
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 3. Poll logs periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const l = await fetch('/api/logs').then((r) => r.json());
        if (Array.isArray(l)) setLogs(l);
      } catch (err) {
        // Ignore
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Broadcast Actions
  const handleStartLive = async () => {
    if (!activePlaylistId) {
      alert('Please select a playlist first.');
      return;
    }
    try {
      const res = await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId: activePlaylistId,
          testMode: settings.testMode,
        }),
      }).then((r) => r.json());

      if (res.error) {
        alert(`Failed to start livestream: ${res.error}\n${res.solution ? 'Solution: ' + res.solution : ''}`);
      } else {
        const updatedLogs = await fetch('/api/logs').then((r) => r.json());
        if (Array.isArray(updatedLogs)) setLogs(updatedLogs);
      }
    } catch (err: any) {
      alert(`Network error starting stream: ${err.message}`);
    }
  };

  const handleStopLive = async () => {
    if (!confirm('Are you sure you want to stop the livestream?')) return;
    try {
      await fetch('/api/stream/stop', { method: 'POST' });
    } catch (err: any) {
      alert(`Error stopping stream: ${err.message}`);
    }
  };

  const handlePauseLive = async () => {
    try {
      await fetch('/api/stream/pause', { method: 'POST' });
    } catch (err: any) {
      alert(`Error pausing stream: ${err.message}`);
    }
  };

  const handleResumeLive = async () => {
    try {
      await fetch('/api/stream/resume', { method: 'POST' });
    } catch (err: any) {
      alert(`Error resuming stream: ${err.message}`);
    }
  };

  const handleEmergencyStop = async () => {
    if (!confirm('⚠️ EMERGENCY STOP will immediately kill all streaming encoder processes. Proceed?')) return;
    try {
      await fetch('/api/stream/emergency-stop', { method: 'POST' });
    } catch (err: any) {
      alert(`Emergency stop failed: ${err.message}`);
    }
  };

  // Video Actions
  const handleUploadVideo = async (formData: FormData) => {
    const res = await fetch('/api/videos/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Upload failed');
    }
    const data = await res.json();
    const newVideo = data.video || data;
    setVideos((prev) => [newVideo, ...prev]);
  };

  const handleUpdateVideo = async (id: string, updates: Partial<VideoItem>) => {
    const res = await fetch(`/api/videos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then((r) => r.json());

    const updatedVideo = res.video || res;
    setVideos((prev) => prev.map((v) => (v.id === id ? updatedVideo : v)));
  };

  const handleDeleteVideo = async (id: string) => {
    await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleImportYouTubeVideo = (video: VideoItem, playlist?: PlaylistItem | null) => {
    setVideos((prev) => {
      const exists = prev.some((v) => v.id === video.id);
      if (exists) return prev.map((v) => (v.id === video.id ? video : v));
      return [video, ...prev];
    });

    if (playlist) {
      setPlaylists((prev) => {
        const exists = prev.some((p) => p.id === playlist.id);
        if (exists) return prev.map((p) => (p.id === playlist.id ? playlist : p));
        return [...prev, playlist];
      });
      setActivePlaylistId(playlist.id);
    }
  };

  // Playlist Actions
  const handleSavePlaylist = async (playlist: PlaylistItem) => {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlist),
    }).then((r) => r.json());

    const savedPl = res.playlist || res;
    setPlaylists((prev) => {
      const exists = prev.some((p) => p.id === savedPl.id);
      if (exists) return prev.map((p) => (p.id === savedPl.id ? savedPl : p));
      return [...prev, savedPl];
    });
    if (savedPl && savedPl.id) {
      setActivePlaylistId(savedPl.id);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (activePlaylistId === id) {
      setActivePlaylistId(playlists[0]?.id || null);
    }
  };

  // Broadcast setup
  const handleCreateBroadcast = async (config: LiveBroadcastConfig) => {
    const res = await fetch('/api/youtube/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create broadcast');
    }
    return data;
  };

  // Scheduler Actions
  const handleAddSchedule = async (schedule: Omit<ScheduledStream, 'id' | 'createdAt' | 'status'>) => {
    const res = await fetch('/api/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    }).then((r) => r.json());

    const newSchedule = res.schedule || res;
    setSchedules((prev) => [...prev, newSchedule]);
  };

  const handleDeleteSchedule = async (id: string) => {
    await fetch(`/api/scheduler/${id}`, { method: 'DELETE' });
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Logs Actions
  const handleClearLogs = async () => {
    if (!confirm('Clear all logged activities?')) return;
    await fetch('/api/logs', { method: 'DELETE' });
    setLogs([]);
  };

  // Settings Actions
  const handleSaveSettings = async (newSettings: AppSettings) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).then((r) => r.json());

    const savedSettings = res.settings || res;
    setSettings(savedSettings);
  };

  const handleTestFfmpeg = async () => {
    const res = await fetch('/api/settings/test-ffmpeg', { method: 'POST' });
    return await res.json();
  };

  const handleCompleteWizard = async () => {
    setShowWizard(false);
    const updated = { ...settings, firstRunWizardCompleted: true };
    await handleSaveSettings(updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Compliance & Monetization Safety Banner */}
      <PolicyBanner />

      {/* Main App Navigation */}
      <Navigation
        activeTab={activeTab === 'playlists' ? 'playlist' : activeTab}
        setActiveTab={(tab) => setActiveTab(tab === 'playlist' ? 'playlists' : tab)}
        metrics={metrics}
        channel={channel}
        onOpenWizard={() => setShowWizard(true)}
        onEmergencyStop={handleEmergencyStop}
        testMode={settings.testMode}
        setTestMode={(val) => {
          const updated = { ...settings, testMode: val };
          handleSaveSettings(updated);
        }}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            metrics={metrics}
            channel={channel}
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onSelectPlaylist={setActivePlaylistId}
            videos={videos}
            onStartLive={handleStartLive}
            onStopLive={handleStopLive}
            onPauseLive={handlePauseLive}
            onResumeLive={handleResumeLive}
            onEmergencyStop={handleEmergencyStop}
            onNavigateTab={(tab) => setActiveTab(tab === 'playlist' ? 'playlists' : tab)}
            testMode={settings.testMode}
            setTestMode={(val) => {
              const updated = { ...settings, testMode: val };
              handleSaveSettings(updated);
            }}
            onImportYouTubeSuccess={handleImportYouTubeVideo}
          />
        )}

        {activeTab === 'videos' && (
          <VideoLibrary
            videos={videos}
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onUploadVideo={handleUploadVideo}
            onUpdateVideo={handleUpdateVideo}
            onDeleteVideo={handleDeleteVideo}
            onImportYouTubeSuccess={handleImportYouTubeVideo}
            onAddToPlaylist={(videoId) => {
              if (activePlaylistId) {
                const pl = playlists.find((p) => p.id === activePlaylistId);
                if (pl) {
                  const updated = { ...pl, videoIds: [...pl.videoIds, videoId] };
                  handleSavePlaylist(updated);
                  alert(`Added to playlist "${pl.name}"`);
                }
              } else {
                setActiveTab('playlists');
              }
            }}
          />
        )}

        {(activeTab === 'playlists' || activeTab === 'playlist') && (
          <PlaylistManager
            playlists={playlists}
            videos={videos}
            activePlaylistId={activePlaylistId}
            onSelectActivePlaylist={setActivePlaylistId}
            onSavePlaylist={handleSavePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
          />
        )}

        {activeTab === 'livestream' && (
          <LiveStreamCreator
            channel={channel}
            onCreateBroadcast={handleCreateBroadcast}
            testMode={settings.testMode}
          />
        )}

        {activeTab === 'scheduler' && (
          <Scheduler
            schedules={schedules}
            playlists={playlists}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onStartScheduledNow={(sch) => {
              setActivePlaylistId(sch.playlistId);
              setActiveTab('dashboard');
              setTimeout(() => {
                handleStartLive();
              }, 300);
            }}
          />
        )}

        {activeTab === 'logs' && (
          <LogsViewer logs={logs} onClearLogs={handleClearLogs} />
        )}

        {activeTab === 'settings' && (
          <SettingsManager
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onTestFfmpeg={handleTestFfmpeg}
          />
        )}
      </main>

      {/* First-Run Setup Wizard */}
      <FirstRunWizard
        isOpen={showWizard}
        onComplete={handleCompleteWizard}
        channel={channel}
      />
    </div>
  );
}
