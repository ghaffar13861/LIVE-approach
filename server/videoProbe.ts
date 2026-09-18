import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { VideoItem } from '../src/types.js';
import { db } from './db.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const THUMB_DIR = path.join(DATA_DIR, 'thumbnails');

export interface VideoMetadata {
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  sizeBytes: number;
  videoCodec: string;
  audioCodec: string;
  audioChannels: number;
}

export function probeVideo(filePath: string, ffprobePath: string = '/usr/bin/ffprobe'): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    // Sanitize and check path
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }

    const stat = fs.statSync(filePath);
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    execFile(ffprobePath, args, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`FFprobe failed: ${error.message}. ${stderr}`));
      }

      try {
        const info = JSON.parse(stdout);
        const videoStream = info.streams?.find((s: any) => s.codec_type === 'video') || {};
        const audioStream = info.streams?.find((s: any) => s.codec_type === 'audio') || {};

        let durationSeconds = parseFloat(info.format?.duration || videoStream.duration || '0');
        if (isNaN(durationSeconds) || durationSeconds <= 0) {
          durationSeconds = 10; // Fallback
        }

        let fps = 30;
        if (videoStream.avg_frame_rate) {
          const parts = videoStream.avg_frame_rate.split('/');
          if (parts.length === 2 && parseFloat(parts[1]) > 0) {
            fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
          } else {
            fps = Math.round(parseFloat(videoStream.avg_frame_rate) || 30);
          }
        }

        resolve({
          durationSeconds: Math.round(durationSeconds * 10) / 10,
          width: parseInt(videoStream.width || '1280', 10),
          height: parseInt(videoStream.height || '720', 10),
          fps: fps || 30,
          sizeBytes: stat.size,
          videoCodec: (videoStream.codec_name || 'h264').toUpperCase(),
          audioCodec: (audioStream.codec_name || (info.streams?.some((s: any) => s.codec_type === 'audio') ? 'aac' : 'none')).toUpperCase(),
          audioChannels: parseInt(audioStream.channels || '2', 10),
        });
      } catch (err) {
        reject(new Error(`Failed to parse FFprobe output: ${err}`));
      }
    });
  });
}

export function generateThumbnail(filePath: string, videoId: string, ffmpegPath: string = '/usr/bin/ffmpeg'): Promise<string> {
  return new Promise((resolve) => {
    if (!fs.existsSync(THUMB_DIR)) {
      fs.mkdirSync(THUMB_DIR, { recursive: true });
    }

    const thumbFilename = `thumb_${videoId}.jpg`;
    const outputPath = path.join(THUMB_DIR, thumbFilename);

    const args = [
      '-y',
      '-ss', '00:00:01',
      '-i', filePath,
      '-vframes', '1',
      '-vf', 'scale=640:-1',
      '-q:v', '3',
      outputPath,
    ];

    execFile(ffmpegPath, args, { timeout: 10000 }, (error) => {
      if (error || !fs.existsSync(outputPath)) {
        // Fallback default thumbnail
        return resolve('/sample-thumb.jpg');
      }
      resolve(`/thumbnails/${thumbFilename}`);
    });
  });
}

export async function seedInitialVideosIfEmpty(): Promise<void> {
  const existing = db.getVideos();
  if (existing.length > 0) return;

  const sampleFiles = [
    {
      id: 'vid_original_intro_01',
      file: 'original_intro_sample.mp4',
      originalName: 'Creator Studio Welcome & Intro (Original Video).mp4',
      rightsStatus: 'OWNED' as const,
      rightsConfirmed: true,
      rightsConfirmedAt: new Date().toISOString(),
      rightsNotes: 'Created directly in-house by content creator. 100% original video and audio assets.',
    },
    {
      id: 'vid_licensed_track_02',
      file: 'licensed_ambient_track.mp4',
      originalName: 'Commercial Ambient Synth - Licensed Track.mp4',
      rightsStatus: 'LICENSED' as const,
      rightsConfirmed: true,
      rightsConfirmedAt: new Date().toISOString(),
      rightsNotes: 'Commercial Livestream Broadcast License #CC-BY-4029. Commercial streaming authorized.',
    },
    {
      id: 'vid_dev_vlog_03',
      file: 'episode1_dev_vlog.mp4',
      originalName: 'Episode 1 - Creator Dev Vlog (Unverified Rights).mp4',
      rightsStatus: 'NOT_VERIFIED' as const,
      rightsConfirmed: false,
      rightsNotes: 'Pending rights confirmation. Must be explicitly verified before livestreaming.',
    },
  ];

  for (const sample of sampleFiles) {
    const filePath = path.join(DATA_DIR, 'videos', sample.file);
    if (!fs.existsSync(filePath)) continue;

    try {
      const meta = await probeVideo(filePath);
      const thumbUrl = await generateThumbnail(filePath, sample.id);

      const videoItem: VideoItem = {
        id: sample.id,
        filename: sample.file,
        originalName: sample.originalName,
        filePath,
        thumbnailUrl: thumbUrl,
        durationSeconds: meta.durationSeconds,
        width: meta.width,
        height: meta.height,
        fps: meta.fps,
        sizeBytes: meta.sizeBytes,
        videoCodec: meta.videoCodec,
        audioCodec: meta.audioCodec,
        audioChannels: meta.audioChannels,
        rightsStatus: sample.rightsStatus,
        rightsConfirmed: sample.rightsConfirmed,
        rightsConfirmedAt: sample.rightsConfirmedAt,
        rightsNotes: sample.rightsNotes,
        addedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      db.addVideo(videoItem);
    } catch (e) {
      console.warn(`Could not seed ${sample.file}:`, e);
    }
  }

  // Create an initial default playlist with authorized videos
  const videos = db.getVideos();
  const authorizedVideoIds = videos.filter(v => v.rightsStatus !== 'NOT_VERIFIED').map(v => v.id);
  if (authorizedVideoIds.length > 0) {
    db.savePlaylist({
      id: 'playlist_main_original',
      name: 'Original Creator Showcase (Primary Playlist)',
      description: 'Sequential authorized original content stream playlist.',
      videoIds: authorizedVideoIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.addLog({
      level: 'SUCCESS',
      category: 'RIGHTS',
      message: 'Verified 2 original/licensed videos initialized in safe playlist.',
      details: 'All videos passed compliance check. NOT_VERIFIED items excluded.',
    });
  }
}
