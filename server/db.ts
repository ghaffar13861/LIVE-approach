import fs from 'fs';
import path from 'path';
import { 
  VideoItem, 
  PlaylistItem, 
  ScheduledStream, 
  ActivityLog, 
  AppSettings, 
  YouTubeChannelInfo 
} from '../src/types.js';

interface DatabaseSchema {
  videos: VideoItem[];
  playlists: PlaylistItem[];
  schedules: ScheduledStream[];
  logs: ActivityLog[];
  settings: AppSettings;
  youtubeChannel: YouTubeChannelInfo;
  activeBroadcastId: string | null;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const DEFAULT_SETTINGS: AppSettings = {
  ffmpegPath: '/usr/bin/ffmpeg',
  ffprobePath: '/usr/bin/ffprobe',
  defaultResolution: '1080p',
  defaultFps: 30,
  videoBitrateKbps: 4500,
  audioBitrateKbps: 128,
  hardwareAcceleration: 'none',
  maxReconnectAttempts: 5,
  logLevel: 'INFO',
  defaultPrivacy: 'unlisted',
  streamServerUrl: 'rtmp://a.rtmp.youtube.com/live2',
  testModeDefault: true,
  testMode: true,
  safePassThrough: true,
};

const DEFAULT_CHANNEL: YouTubeChannelInfo = {
  connected: true,
  channelId: 'UC_ORIGINAL_CREATOR_STUDIO_982',
  title: 'Original Content Studio',
  customUrl: '@OriginalContentStudio',
  thumbnailUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  subscriberCount: '124,500',
  videoCount: '84',
  liveStreamingEligible: true,
  lastConnectedAt: new Date().toISOString(),
  authMode: 'demo',
};

class LocalDatabase {
  private data: DatabaseSchema;
  private isSaving: boolean = false;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const thumbDir = path.join(DATA_DIR, 'thumbnails');
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }
    const videoDir = path.join(DATA_DIR, 'videos');
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          videos: parsed.videos || [],
          playlists: parsed.playlists || [],
          schedules: parsed.schedules || [],
          logs: parsed.logs || [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          youtubeChannel: parsed.youtubeChannel || DEFAULT_CHANNEL,
          activeBroadcastId: parsed.activeBroadcastId || null,
        };
      }
    } catch (err) {
      console.error('Failed to parse database.json, initializing fresh store:', err);
    }

    return {
      videos: [],
      playlists: [],
      schedules: [],
      logs: [],
      settings: DEFAULT_SETTINGS,
      youtubeChannel: DEFAULT_CHANNEL,
      activeBroadcastId: null,
    };
  }

  public save(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      // Atomic write via temp file
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    } finally {
      this.isSaving = false;
    }
  }

  // --- Videos ---
  public getVideos(): VideoItem[] {
    return this.data.videos;
  }

  public getVideo(id: string): VideoItem | undefined {
    return this.data.videos.find(v => v.id === id);
  }

  public addVideo(video: VideoItem): void {
    this.data.videos.push(video);
    this.save();
  }

  public updateVideo(id: string, updates: Partial<VideoItem>): VideoItem | null {
    const idx = this.data.videos.findIndex(v => v.id === id);
    if (idx === -1) return null;
    this.data.videos[idx] = { ...this.data.videos[idx], ...updates };
    this.save();
    return this.data.videos[idx];
  }

  public removeVideo(id: string): boolean {
    const idx = this.data.videos.findIndex(v => v.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.videos.splice(idx, 1);
    
    // Also remove from any playlists
    this.data.playlists.forEach(pl => {
      pl.videoIds = pl.videoIds.filter(vId => vId !== id);
    });

    // Delete file if exists
    try {
      if (removed.filePath && fs.existsSync(removed.filePath)) {
        fs.unlinkSync(removed.filePath);
      }
      if (removed.thumbnailUrl && removed.thumbnailUrl.startsWith('/thumbnails/')) {
        const thumbFilename = path.basename(removed.thumbnailUrl);
        const fullThumb = path.join(DATA_DIR, 'thumbnails', thumbFilename);
        if (fs.existsSync(fullThumb)) fs.unlinkSync(fullThumb);
      }
    } catch (e) {
      console.warn('Could not clean up video file on disk:', e);
    }

    this.save();
    return true;
  }

  // --- Playlists ---
  public getPlaylists(): PlaylistItem[] {
    return this.data.playlists;
  }

  public getPlaylist(id: string): PlaylistItem | undefined {
    return this.data.playlists.find(p => p.id === id);
  }

  public savePlaylist(playlist: PlaylistItem): void {
    const idx = this.data.playlists.findIndex(p => p.id === playlist.id);
    if (idx === -1) {
      this.data.playlists.push(playlist);
    } else {
      this.data.playlists[idx] = playlist;
    }
    this.save();
  }

  public deletePlaylist(id: string): boolean {
    const idx = this.data.playlists.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.playlists.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Schedules ---
  public getSchedules(): ScheduledStream[] {
    return this.data.schedules;
  }

  public addSchedule(schedule: ScheduledStream): void {
    this.data.schedules.push(schedule);
    this.save();
  }

  public updateSchedule(id: string, updates: Partial<ScheduledStream>): ScheduledStream | null {
    const idx = this.data.schedules.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.schedules[idx] = { ...this.data.schedules[idx], ...updates };
    this.save();
    return this.data.schedules[idx];
  }

  public deleteSchedule(id: string): boolean {
    const idx = this.data.schedules.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.schedules.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Logs ---
  public getLogs(limit: number = 200): ActivityLog[] {
    return this.data.logs.slice(-limit).reverse();
  }

  public addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
    const fullLog: ActivityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toLocaleTimeString(),
      ...log,
    };
    this.data.logs.push(fullLog);
    // Keep max 1000 logs in memory/disk
    if (this.data.logs.length > 1000) {
      this.data.logs = this.data.logs.slice(-1000);
    }
    this.save();
    return fullLog;
  }

  public clearLogs(): void {
    this.data.logs = [];
    this.save();
  }

  // --- Settings ---
  public getSettings(): AppSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }

  // --- YouTube Channel ---
  public getChannel(): YouTubeChannelInfo {
    return this.data.youtubeChannel;
  }

  public updateChannel(channel: Partial<YouTubeChannelInfo>): YouTubeChannelInfo {
    this.data.youtubeChannel = { ...this.data.youtubeChannel, ...channel };
    this.save();
    return this.data.youtubeChannel;
  }

  public getActiveBroadcastId(): string | null {
    return this.data.activeBroadcastId;
  }

  public setActiveBroadcastId(id: string | null): void {
    this.data.activeBroadcastId = id;
    this.save();
  }
}

export const db = new LocalDatabase();
