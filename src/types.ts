/**
 * Core type definitions for Original Live Stream Manager
 */

export type RightsStatus = 'OWNED' | 'LICENSED' | 'NOT_VERIFIED';

export interface VideoItem {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  thumbnailUrl: string;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  sizeBytes: number;
  videoCodec: string;
  audioCodec: string;
  audioChannels: number;
  rightsStatus: RightsStatus;
  rightsConfirmed: boolean;
  rightsConfirmedAt?: string;
  rightsNotes?: string;
  addedDate: string;
  sourceType?: 'local' | 'youtube';
  youtubeUrl?: string;
  youtubeVideoId?: string;
  channelAuthor?: string;
}

export interface PlaylistItem {
  id: string;
  name: string;
  description: string;
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type StreamState = 
  | 'IDLE' 
  | 'PREPARING' 
  | 'LIVE' 
  | 'PAUSED' 
  | 'RECONNECTING' 
  | 'STOPPED' 
  | 'COMPLETED' 
  | 'ERROR';

export type NetworkQuality = 'GOOD' | 'WARNING' | 'POOR';

export interface StreamMetrics {
  state: StreamState;
  connectionStatus?: 'CONNECTED' | 'DISCONNECTED';
  bitrateKbps: number;
  fps: number;
  droppedFrames: number;
  uploadedMegabytes: number;
  elapsedSeconds: number;
  currentVideoId?: string | null;
  currentVideoTitle?: string | null;
  currentVideoProgressSeconds?: number;
  currentVideoDurationSeconds?: number;
  nextVideoId?: string | null;
  nextVideoTitle?: string | null;
  playlistIndex: number;
  playlistTotal: number;
  networkQuality: NetworkQuality;
  autoReconnect?: boolean;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
  reconnectCountdownSeconds: number;
  errorMessage?: string;
  errorSolution?: string;
}

export type PrivacyStatus = 'public' | 'unlisted' | 'private';

export interface LiveBroadcastConfig {
  id?: string;
  title: string;
  description: string;
  category: string;
  privacy: PrivacyStatus;
  tags: string[];
  madeForKids: boolean;
  enableDvr: boolean;
  recordFromStart: boolean;
  autoStart: boolean;
  autoStop: boolean;
  testMode: boolean;
  scheduledStartTime?: string;
  playlistId?: string;
  rtmpIngestionUrl?: string;
  streamKey?: string;
}

export interface YouTubeChannelInfo {
  connected: boolean;
  channelId: string;
  title: string;
  description?: string;
  customUrl?: string;
  thumbnailUrl: string;
  subscriberCount?: string;
  videoCount?: string;
  liveStreamingEligible?: boolean;
  isLiveStreamingEnabled?: boolean;
  lastConnectedAt?: string;
  authMode?: 'oauth' | 'demo';
}

export interface ScheduledStream {
  id: string;
  title: string;
  description: string;
  privacy: PrivacyStatus;
  playlistId: string;
  playlistName: string;
  scheduledDateTime: string;
  autoStart: boolean;
  status: 'SCHEDULED' | 'READY' | 'STREAMING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
export type LogCategory = 'YOUTUBE' | 'FFMPEG' | 'RIGHTS' | 'PLAYLIST' | 'NETWORK' | 'SYSTEM';

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: string;
}

export type HardwareAcceleration = 'none' | 'nvenc' | 'qsv' | 'amf' | 'auto';

export interface AppSettings {
  ffmpegPath: string;
  ffprobePath?: string;
  defaultResolution: '720p' | '1080p' | '1440p';
  defaultFps: number;
  videoBitrateKbps: number;
  defaultBitrateKbps?: number;
  audioBitrateKbps: number;
  hardwareAcceleration: HardwareAcceleration;
  autoReconnect?: boolean;
  maxReconnectAttempts: number;
  reconnectDelaySeconds?: number;
  logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  defaultPrivacy?: PrivacyStatus;
  streamServerUrl?: string;
  testMode: boolean;
  testModeDefault?: boolean;
  youtubeStreamKey?: string;
  firstRunWizardCompleted?: boolean;
  safePassThrough?: boolean;
}
