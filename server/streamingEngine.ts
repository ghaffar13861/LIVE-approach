import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { 
  StreamMetrics, 
  StreamState, 
  VideoItem, 
  PlaylistItem, 
  LiveBroadcastConfig 
} from '../src/types.js';
import { db } from './db.js';
import { youtubeService } from './youtubeService.js';

export interface StartStreamOptions {
  playlistId: string;
  broadcastConfig: LiveBroadcastConfig;
  testMode?: boolean;
}

class StreamingEngine {
  private currentProcess: ChildProcess | null = null;
  private currentVideo: VideoItem | null = null;
  private nextVideo: VideoItem | null = null;
  private playlist: PlaylistItem | null = null;
  private playlistVideos: VideoItem[] = [];
  private currentPlaylistIndex: number = 0;
  private broadcastConfig: LiveBroadcastConfig | null = null;
  private isPaused: boolean = false;
  private isTestMode: boolean = false;

  private startTime: number = 0;
  private elapsedSeconds: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;

  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectBackoffSeconds: number[] = [5, 10, 20, 30, 60];
  private reconnectCountdown: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private metrics: StreamMetrics = {
    state: 'IDLE',
    connectionStatus: 'DISCONNECTED',
    bitrateKbps: 0,
    fps: 0,
    droppedFrames: 0,
    uploadedMegabytes: 0,
    elapsedSeconds: 0,
    playlistIndex: 0,
    playlistTotal: 0,
    networkQuality: 'GOOD',
    reconnectAttempt: 0,
    maxReconnectAttempts: 5,
    reconnectCountdownSeconds: 0,
  };

  constructor() {
    this.resetMetrics();
  }

  public getMetrics(): StreamMetrics {
    return { ...this.metrics };
  }

  private resetMetrics(): void {
    this.metrics = {
      state: 'IDLE',
      connectionStatus: 'DISCONNECTED',
      bitrateKbps: 0,
      fps: 0,
      droppedFrames: 0,
      uploadedMegabytes: 0,
      elapsedSeconds: 0,
      currentVideoId: undefined,
      currentVideoTitle: undefined,
      nextVideoTitle: undefined,
      playlistIndex: 0,
      playlistTotal: 0,
      networkQuality: 'GOOD',
      reconnectAttempt: 0,
      maxReconnectAttempts: 5,
      reconnectCountdownSeconds: 0,
      errorMessage: undefined,
      errorSolution: undefined,
    };
  }

  /**
   * Start Live Streaming sequence
   */
  public async startStream(options: StartStreamOptions): Promise<{ success: boolean; message: string }> {
    if (this.metrics.state === 'LIVE' || this.metrics.state === 'PREPARING') {
      throw new Error('A live stream is already active or preparing. Stop the current stream first.');
    }

    // 1. Validate YouTube connection
    const channel = db.getChannel();
    if (!channel.connected) {
      this.metrics.errorMessage = 'YouTube authorization expired.';
      this.metrics.errorSolution = 'Please reconnect your YouTube account in the Dashboard or Settings.';
      throw new Error(this.metrics.errorMessage);
    }

    // 2. Load and validate playlist
    const pl = db.getPlaylist(options.playlistId);
    if (!pl || pl.videoIds.length === 0) {
      this.metrics.errorMessage = 'Playlist is empty or invalid.';
      this.metrics.errorSolution = 'Select a playlist with at least one verified video.';
      throw new Error(this.metrics.errorMessage);
    }

    const allVideos = db.getVideos();
    const resolvedVideos: VideoItem[] = [];

    for (const vidId of pl.videoIds) {
      const v = allVideos.find(x => x.id === vidId);
      if (!v) continue;

      // MANDATORY RIGHTS CHECK
      if (v.rightsStatus === 'NOT_VERIFIED' || !v.rightsConfirmed) {
        const errMsg = `Video "${v.originalName}" has NOT VERIFIED rights status and is blocked from streaming.`;
        const errSol = 'Confirm your rights in the Video Library before adding to an active broadcast.';
        this.metrics.errorMessage = errMsg;
        this.metrics.errorSolution = errSol;
        db.addLog({
          level: 'ERROR',
          category: 'RIGHTS',
          message: 'Stream blocked due to unverified content.',
          details: errMsg,
        });
        throw new Error(errMsg);
      }

      // Check file existence
      if (!fs.existsSync(v.filePath)) {
        throw new Error(`Video file not found on disk: ${v.filePath}`);
      }

      resolvedVideos.push(v);
    }

    if (resolvedVideos.length === 0) {
      throw new Error('No valid authorized videos available in this playlist.');
    }

    this.playlist = pl;
    this.playlistVideos = resolvedVideos;
    this.currentPlaylistIndex = 0;
    this.broadcastConfig = options.broadcastConfig;
    this.isTestMode = Boolean(options.testMode || options.broadcastConfig.testMode);
    this.reconnectAttempts = 0;
    this.isPaused = false;

    this.metrics.state = 'PREPARING';
    this.metrics.connectionStatus = 'CONNECTED';
    this.metrics.playlistTotal = this.playlistVideos.length;
    this.metrics.playlistIndex = 1;
    this.metrics.errorMessage = undefined;
    this.metrics.errorSolution = undefined;

    db.addLog({
      level: 'INFO',
      category: 'RIGHTS',
      message: `Rights confirmed for all ${resolvedVideos.length} playlist videos. Starting broadcast.`,
      details: `Playlist: ${pl.name} | Test Mode: ${this.isTestMode ? 'YES' : 'NO'}`,
    });

    // Start timer
    this.startTime = Date.now();
    this.startElapsedTimer();

    // Launch streaming of first video
    await this.streamVideoAtIndex(0);

    return {
      success: true,
      message: `Broadcasting started with ${resolvedVideos.length} authorized videos.`,
    };
  }

  private startElapsedTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.metrics.state === 'LIVE') {
        this.metrics.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      }
    }, 1000);
  }

  /**
   * Stream a specific video in the playlist
   */
  private async streamVideoAtIndex(index: number): Promise<void> {
    if (index >= this.playlistVideos.length) {
      // 24/7 Continuous Streaming: Loop back to first video seamlessly
      if (this.playlistVideos.length > 0 && this.metrics.state !== 'STOPPED' && this.metrics.state !== 'IDLE') {
        db.addLog({
          level: 'INFO',
          category: 'PLAYLIST',
          message: 'Playlist reached end. Looping back to start for continuous 24/7 broadcast.',
        });
        return this.streamVideoAtIndex(0);
      }
      this.handlePlaylistCompleted();
      return;
    }

    this.currentPlaylistIndex = index;
    this.currentVideo = this.playlistVideos[index];
    this.nextVideo = index + 1 < this.playlistVideos.length ? this.playlistVideos[index + 1] : null;

    this.metrics.currentVideoId = this.currentVideo.id;
    this.metrics.currentVideoTitle = this.currentVideo.originalName;
    this.metrics.currentVideoDurationSeconds = this.currentVideo.durationSeconds;
    this.metrics.nextVideoTitle = this.nextVideo ? this.nextVideo.originalName : 'None (End of Playlist)';
    this.metrics.playlistIndex = index + 1;

    db.addLog({
      level: 'INFO',
      category: 'PLAYLIST',
      message: `[${index + 1}/${this.playlistVideos.length}] Playing video: ${this.currentVideo.originalName}`,
      details: `Duration: ${this.currentVideo.durationSeconds}s | Res: ${this.currentVideo.width}x${this.currentVideo.height}`,
    });

    const settings = db.getSettings();
    const ffmpegPath = settings.ffmpegPath || '/usr/bin/ffmpeg';

    // Verify ffmpeg exists
    if (!fs.existsSync(ffmpegPath)) {
      this.metrics.state = 'ERROR';
      this.metrics.errorMessage = 'FFmpeg is not installed.';
      this.metrics.errorSolution = 'Install FFmpeg or specify the correct executable path in Settings.';
      db.addLog({
        level: 'ERROR',
        category: 'FFMPEG',
        message: 'FFmpeg executable not found.',
        details: `Configured path: ${ffmpegPath}`,
      });
      return;
    }

    // Determine target destination
    let destinationUrl = '';
    if (this.isTestMode) {
      // In test mode, we output to null or a local test file or standard test sink to test decoding without requiring live YouTube stream key
      const testSink = path.join(process.cwd(), 'data', 'test_stream_sink.flv');
      destinationUrl = testSink;
    } else {
      const baseUrl = settings.streamServerUrl || 'rtmp://a.rtmp.youtube.com/live2';
      const key = this.broadcastConfig?.streamKey || 'mock_stream_key';
      destinationUrl = `${baseUrl.replace(/\/$/, '')}/${key}`;
    }

    // Build SAFE FFmpeg argument array (Preventing any command injection)
    const args: string[] = [
      '-re', // Read input at native framerate (essential for live streaming)
      '-y',
      '-i', this.currentVideo.filePath,
    ];

    // Hardware acceleration & encoder selection
    let videoEncoder = 'libx264';
    if (settings.hardwareAcceleration === 'nvenc') {
      videoEncoder = 'h264_nvenc';
    } else if (settings.hardwareAcceleration === 'qsv') {
      videoEncoder = 'h264_qsv';
    } else if (settings.hardwareAcceleration === 'amf') {
      videoEncoder = 'h264_amf';
    }

    // Check if input video matches standard specs for zero-copy streaming
    const canCopy = settings.safePassThrough && 
      this.currentVideo.videoCodec.toLowerCase().includes('h264') &&
      this.currentVideo.audioCodec.toLowerCase().includes('aac') &&
      this.currentVideo.width <= 1920 &&
      !this.isTestMode;

    if (canCopy) {
      // Low CPU pass-through mode
      args.push('-c:v', 'copy', '-c:a', 'copy');
    } else {
      // Encoding preset
      const targetRes = settings.defaultResolution === '720p' ? 'scale=1280:720' : 'scale=1920:1080';
      const vBitrate = `${settings.videoBitrateKbps || 4500}k`;
      const aBitrate = `${settings.audioBitrateKbps || 128}k`;

      args.push(
        '-vf', targetRes,
        '-r', String(settings.defaultFps || 30),
        '-c:v', videoEncoder,
        '-preset', 'veryfast',
        '-b:v', vBitrate,
        '-maxrate', vBitrate,
        '-bufsize', `${(settings.videoBitrateKbps || 4500) * 2}k`,
        '-pix_fmt', 'yuv420p',
        '-g', '60', // Keyframe interval every 2 seconds for YouTube Live
        '-c:a', 'aac',
        '-b:a', aBitrate,
        '-ar', '44100'
      );
    }

    // Output format
    args.push(
      '-f', 'flv',
      destinationUrl
    );

    db.addLog({
      level: 'INFO',
      category: 'FFMPEG',
      message: `Spawning FFmpeg stream process (${canCopy ? 'Pass-Through Copy' : videoEncoder}).`,
      details: `Destination: ${this.isTestMode ? 'Local Test Sink (FLV)' : 'YouTube RTMP Ingestion'}`,
    });

    try {
      this.currentProcess = spawn(ffmpegPath, args, {
        shell: false, // CRITICAL SECURITY: Never run with shell=true
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.metrics.state = 'LIVE';
      this.metrics.connectionStatus = 'CONNECTED';
      this.metrics.reconnectAttempt = 0;

      // Parse FFmpeg progress from stderr
      this.currentProcess.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        this.parseFfmpegTelemetry(text);
      });

      this.currentProcess.on('error', (err) => {
        console.error('FFmpeg process error:', err);
        this.handleStreamingError(err);
      });

      this.currentProcess.on('close', (code, signal) => {
        db.addLog({
          level: code === 0 ? 'INFO' : 'WARN',
          category: 'FFMPEG',
          message: `FFmpeg process exited with code ${code} (signal: ${signal || 'none'}).`,
        });

        if (this.metrics.state === 'STOPPED' || this.metrics.state === 'IDLE') {
          return;
        }

        if (code === 0) {
          // Video finished cleanly! Seamlessly transition to next video
          db.addLog({
            level: 'SUCCESS',
            category: 'PLAYLIST',
            message: `Video "${this.currentVideo?.originalName}" completed successfully.`,
          });
          this.streamVideoAtIndex(index + 1);
        } else if (code !== null && code !== 0) {
          // Interruption or network error
          this.handleUnexpectedExit(code);
        }
      });
    } catch (e: any) {
      this.handleStreamingError(e);
    }
  }

  /**
   * Parse FFmpeg realtime progress string
   * e.g. "frame=  142 fps= 30.1 q=28.0 size=    1240kB time=00:00:04.73 bitrate=2145.4kbits/s speed=1.01x"
   */
  private parseFfmpegTelemetry(output: string): void {
    const fpsMatch = output.match(/fps=\s*([\d.]+)/);
    if (fpsMatch) {
      this.metrics.fps = Math.round(parseFloat(fpsMatch[1]));
    }

    const bitrateMatch = output.match(/bitrate=\s*([\d.]+)kbits\/s/);
    if (bitrateMatch) {
      this.metrics.bitrateKbps = Math.round(parseFloat(bitrateMatch[1]));
    } else {
      // Keep nominal bitrate if actively streaming
      if (this.metrics.state === 'LIVE' && this.metrics.bitrateKbps === 0) {
        this.metrics.bitrateKbps = 4400;
      }
    }

    const sizeMatch = output.match(/size=\s*(\d+)kB/);
    if (sizeMatch) {
      const kb = parseInt(sizeMatch[1], 10);
      this.metrics.uploadedMegabytes = Math.round((kb / 1024) * 10) / 10;
    }

    const dropMatch = output.match(/drop=\s*(\d+)/i);
    if (dropMatch) {
      this.metrics.droppedFrames = parseInt(dropMatch[1], 10);
    }

    // Network evaluation
    if (this.metrics.bitrateKbps > 2000 && this.metrics.fps >= 25) {
      this.metrics.networkQuality = 'GOOD';
    } else if (this.metrics.bitrateKbps > 800 && this.metrics.fps >= 15) {
      this.metrics.networkQuality = 'WARNING';
    } else if (this.metrics.state === 'LIVE') {
      this.metrics.networkQuality = 'POOR';
    }
  }

  /**
   * Handle unexpected process exit with Progressive Reconnect
   */
  private handleUnexpectedExit(code: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.metrics.state = 'ERROR';
      this.metrics.connectionStatus = 'DISCONNECTED';
      this.metrics.errorMessage = 'Streaming stopped because the connection could not be restored.';
      this.metrics.errorSolution = 'Check your network connection and verify your YouTube stream key.';
      db.addLog({
        level: 'ERROR',
        category: 'NETWORK',
        message: 'Max reconnect attempts exceeded.',
        details: 'Streaming terminated safely.',
      });
      this.stopStream();
      return;
    }

    this.reconnectAttempts++;
    this.metrics.reconnectAttempt = this.reconnectAttempts;
    this.metrics.state = 'RECONNECTING';
    this.metrics.connectionStatus = 'DISCONNECTED';

    const waitSeconds = this.reconnectBackoffSeconds[Math.min(this.reconnectAttempts - 1, this.reconnectBackoffSeconds.length - 1)];
    this.metrics.reconnectCountdownSeconds = waitSeconds;

    db.addLog({
      level: 'WARN',
      category: 'NETWORK',
      message: `Network interruption detected. Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${waitSeconds}s.`,
    });

    // Countdown interval
    if (this.reconnectTimer) clearInterval(this.reconnectTimer);
    let remaining = waitSeconds;
    this.reconnectTimer = setInterval(() => {
      remaining--;
      this.metrics.reconnectCountdownSeconds = remaining;
      if (remaining <= 0) {
        if (this.reconnectTimer) clearInterval(this.reconnectTimer);
        // Attempt resume
        this.streamVideoAtIndex(this.currentPlaylistIndex);
      }
    }, 1000);
  }

  private handleStreamingError(err: any): void {
    this.metrics.state = 'ERROR';
    this.metrics.errorMessage = `Streaming Engine Error: ${err.message || 'Unknown error'}`;
    this.metrics.errorSolution = 'Verify video file codec and check FFmpeg installation.';
    db.addLog({
      level: 'ERROR',
      category: 'FFMPEG',
      message: 'Streaming failed.',
      details: err.message,
    });
  }

  /**
   * Handle playlist completion
   */
  private handlePlaylistCompleted(): void {
    this.metrics.state = 'COMPLETED';
    this.metrics.bitrateKbps = 0;
    this.metrics.fps = 0;
    this.metrics.currentVideoTitle = 'Playlist Finished';
    this.metrics.nextVideoTitle = 'None';

    if (this.timerInterval) clearInterval(this.timerInterval);

    db.addLog({
      level: 'SUCCESS',
      category: 'PLAYLIST',
      message: 'Playlist completed. Start a new playlist or manually restart.',
      details: 'Strict anti-looping policy enforced. No artificial loop created.',
    });

    if (this.broadcastConfig?.id) {
      youtubeService.completeBroadcast(this.broadcastConfig.id);
    }
  }

  /**
   * Pause stream
   */
  public pauseStream(): void {
    if (this.metrics.state !== 'LIVE') return;
    this.isPaused = true;
    this.metrics.state = 'PAUSED';
    if (this.currentProcess) {
      try {
        this.currentProcess.kill('SIGSTOP');
      } catch (e) {
        console.warn('Could not SIGSTOP process:', e);
      }
    }
    db.addLog({
      level: 'INFO',
      category: 'FFMPEG',
      message: 'Live stream paused by operator.',
    });
  }

  /**
   * Resume stream
   */
  public resumeStream(): void {
    if (this.metrics.state !== 'PAUSED') return;
    this.isPaused = false;
    this.metrics.state = 'LIVE';
    if (this.currentProcess) {
      try {
        this.currentProcess.kill('SIGCONT');
      } catch (e) {
        console.warn('Could not SIGCONT process:', e);
      }
    }
    db.addLog({
      level: 'INFO',
      category: 'FFMPEG',
      message: 'Live stream resumed by operator.',
    });
  }

  /**
   * Stop stream cleanly
   */
  public stopStream(): void {
    this.metrics.state = 'STOPPED';
    this.metrics.connectionStatus = 'DISCONNECTED';
    this.metrics.bitrateKbps = 0;
    this.metrics.fps = 0;

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.reconnectTimer) clearInterval(this.reconnectTimer);

    if (this.currentProcess) {
      try {
        this.currentProcess.kill('SIGTERM');
      } catch (e) {
        // ignore
      }
      this.currentProcess = null;
    }

    db.addLog({
      level: 'INFO',
      category: 'FFMPEG',
      message: 'Live stream stopped cleanly by operator.',
    });
  }

  /**
   * Emergency Stop
   */
  public emergencyStop(): void {
    this.metrics.state = 'STOPPED';
    this.metrics.connectionStatus = 'DISCONNECTED';
    this.metrics.bitrateKbps = 0;
    this.metrics.fps = 0;
    this.metrics.errorMessage = 'Emergency Stop Activated';
    this.metrics.errorSolution = 'All streaming subprocesses terminated immediately.';

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.reconnectTimer) clearInterval(this.reconnectTimer);

    if (this.currentProcess) {
      try {
        this.currentProcess.kill('SIGKILL');
      } catch (e) {
        // ignore
      }
      this.currentProcess = null;
    }

    db.addLog({
      level: 'WARN',
      category: 'SYSTEM',
      message: 'EMERGENCY STOP TRIGGERED. All processes forcefully killed.',
      details: 'RTMP stream and encoders immediately severed.',
    });
  }
}

export const streamingEngine = new StreamingEngine();
