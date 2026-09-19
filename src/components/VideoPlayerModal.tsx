import React, { useState } from 'react';
import { X, Film, Volume2, ShieldCheck, Clock, Monitor, Youtube, ExternalLink } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoPlayerModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, isOpen, onClose }) => {
  const [playerMode, setPlayerMode] = useState<'stream' | 'youtube'>('youtube');

  if (!isOpen || !video) return null;

  // Derive preview URL
  const videoUrl = `/video-files/${video.filename}`;
  const isYouTube = video.sourceType === 'youtube' && video.youtubeVideoId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {isYouTube ? (
              <Youtube className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <Film className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <h3 className="font-semibold text-slate-200 text-sm truncate">{video.originalName}</h3>
          </div>

          <div className="flex items-center gap-2">
            {isYouTube && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setPlayerMode('youtube')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    playerMode === 'youtube'
                      ? 'bg-rose-600 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  YouTube Web
                </button>
                <button
                  onClick={() => setPlayerMode('stream')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    playerMode === 'stream'
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stream File
                </button>
              </div>
            )}

            {video.youtubeUrl && (
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Open on YouTube"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-black flex items-center justify-center relative min-h-[360px] max-h-[520px]">
          {isYouTube && playerMode === 'youtube' ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}?autoplay=1&rel=0`}
              title={video.originalName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full min-h-[360px] md:min-h-[480px] border-0"
            />
          ) : (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full max-h-[520px] object-contain"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Metadata bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-[10px] text-slate-500 block">Duration</span>
              <span className="font-medium">
                {Math.floor(video.durationSeconds / 60)}m {Math.floor(video.durationSeconds % 60)}s
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Monitor className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-[10px] text-slate-500 block">Source & Codec</span>
              <span className="font-medium">
                {video.sourceType === 'youtube' ? 'YouTube Stream' : `${video.width}x${video.height}`} ({video.videoCodec})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-[10px] text-slate-500 block">Audio Stream</span>
              <span className="font-medium">{video.audioCodec} ({video.audioChannels} ch)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className={`w-4 h-4 ${video.rightsStatus === 'NOT_VERIFIED' ? 'text-rose-500' : 'text-emerald-500'}`} />
            <div>
              <span className="text-[10px] text-slate-500 block">Rights Status</span>
              <span className={`font-semibold ${video.rightsStatus === 'NOT_VERIFIED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {video.rightsStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
