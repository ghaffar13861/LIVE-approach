import React, { useState } from 'react';
import { 
  Youtube, 
  Link2, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Loader2, 
  Plus, 
  CheckCircle2, 
  ShieldCheck,
  Film
} from 'lucide-react';
import { PlaylistItem, VideoItem, RightsStatus } from '../types';

interface YouTubeLinkImporterProps {
  playlists: PlaylistItem[];
  activePlaylistId: string | null;
  onImportSuccess: (video: VideoItem, playlist?: PlaylistItem | null) => void;
  className?: string;
  compact?: boolean;
}

interface YouTubePreviewInfo {
  videoId: string;
  title: string;
  authorName: string;
  authorUrl?: string;
  thumbnailUrl: string;
  originalUrl: string;
}

export const YouTubeLinkImporter: React.FC<YouTubeLinkImporterProps> = ({
  playlists,
  activePlaylistId,
  onImportSuccess,
  className = '',
  compact = false,
}) => {
  const [url, setUrl] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(activePlaylistId || (playlists[0]?.id || ''));
  const [addToPlaylist, setAddToPlaylist] = useState<boolean>(true);
  const [rightsStatus, setRightsStatus] = useState<RightsStatus>('OWNED');
  const [rightsConfirmed, setRightsConfirmed] = useState<boolean>(true);
  const [rightsNotes, setRightsNotes] = useState<string>('');

  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<YouTubePreviewInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick sample links for testing
  const sampleLinks = [
    { label: 'Me at the zoo', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' },
    { label: 'Rick Astley (Remaster)', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  ];

  const handleInspect = async (inputUrl?: string) => {
    const targetUrl = (inputUrl || url).trim();
    if (!targetUrl) {
      setError('Please paste a YouTube link or video ID first.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoadingInfo(true);

    try {
      const res = await fetch(`/api/youtube/info?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to inspect YouTube video.');
      }

      setPreviewInfo({
        videoId: data.videoId,
        title: data.title,
        authorName: data.authorName,
        authorUrl: data.authorUrl,
        thumbnailUrl: data.thumbnailUrl,
        originalUrl: data.originalUrl,
      });
    } catch (err: any) {
      setError(err.message || 'Could not fetch video info. Check link and retry.');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetUrl = url.trim() || previewInfo?.originalUrl;
    if (!targetUrl) {
      setError('Please provide a YouTube video URL.');
      return;
    }

    if (rightsStatus !== 'NOT_VERIFIED' && !rightsConfirmed) {
      setError('Please confirm broadcasting authorization before adding to stream.');
      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      const payload = {
        youtubeUrl: targetUrl,
        playlistId: addToPlaylist ? selectedPlaylistId : undefined,
        rightsStatus,
        rightsConfirmed,
        rightsNotes: rightsNotes || `Imported via YouTube link: ${targetUrl}`,
      };

      const res = await fetch('/api/videos/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import YouTube video.');
      }

      const importedVideo = data.video || data;
      const updatedPlaylist = data.playlist || null;

      onImportSuccess(importedVideo, updatedPlaylist);

      setSuccessMessage(`"${importedVideo.originalName}" added successfully to your library!`);
      setUrl('');
      setPreviewInfo(null);

      // Auto dismiss success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error processing YouTube video.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden ${className}`}>
      {/* Subtle YouTube background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-sm">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Paste YouTube Video Link</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Direct Input
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Paste any YouTube URL or video ID to queue it directly into your stream playlist.
            </p>
          </div>
        </div>

        {/* Quick sample chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 font-medium">Quick Test:</span>
          {sampleLinks.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setUrl(sample.url);
                handleInspect(sample.url);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Link2 className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="input-youtube-link"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInspect();
              }
            }}
            placeholder="Paste YouTube Link (e.g. https://www.youtube.com/watch?v=... or youtu.be/...)"
            className="w-full pl-10 pr-24 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
          />
          {url && (
            <button
              type="button"
              onClick={() => {
                setUrl('');
                setPreviewInfo(null);
                setError(null);
              }}
              className="absolute inset-y-0 right-2 px-2 text-xs text-slate-500 hover:text-slate-300 my-auto h-7"
            >
              Clear
            </button>
          )}
        </div>

        <button
          type="button"
          id="btn-inspect-youtube"
          onClick={() => handleInspect()}
          disabled={isLoadingInfo || !url.trim()}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 ${
            isLoadingInfo || !url.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 cursor-pointer hover:scale-[1.01]'
          }`}
        >
          {isLoadingInfo ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking Link...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Inspect Video</span>
            </>
          )}
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success alert */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between gap-2.5 text-xs text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-[11px] text-emerald-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Preview Card & Confirmation Deck */}
      {previewInfo && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Thumbnail */}
            <div className="w-full sm:w-44 aspect-video rounded-lg overflow-hidden bg-black relative border border-slate-800 shrink-0">
              <img
                src={previewInfo.thumbnailUrl}
                alt={previewInfo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                YouTube
              </div>
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="text-sm font-bold text-white line-clamp-2">
                {previewInfo.title}
              </h4>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Creator / Channel:</span>
                <span className="text-slate-200 font-medium">{previewInfo.authorName}</span>
              </p>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                {previewInfo.originalUrl}
              </p>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            {/* Playlist binding */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={addToPlaylist}
                  onChange={(e) => setAddToPlaylist(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500"
                />
                <span>Add directly to playlist</span>
              </label>
              {addToPlaylist && (
                <select
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} ({pl.videoIds.length} tracks)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Rights confirmation */}
            <div className="space-y-1.5">
              <span className="block font-medium text-slate-300">Broadcast Authorization Status</span>
              <div className="flex items-center gap-2">
                {(['OWNED', 'LICENSED', 'NOT_VERIFIED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setRightsStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      rightsStatus === st
                        ? st === 'OWNED'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : st === 'LICENSED'
                          ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                          : 'bg-rose-500/10 border-rose-500 text-rose-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Legal acknowledgment check */}
          {rightsStatus !== 'NOT_VERIFIED' && (
            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(e) => setRightsConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500"
              />
              <span>
                I confirm that I own or hold valid commercial distribution rights for this video stream in compliance with YouTube Live policies.
              </span>
            </label>
          )}

          {/* Final Add button */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setPreviewInfo(null)}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              id="btn-confirm-import-youtube"
              onClick={() => handleImport()}
              disabled={isImporting || (rightsStatus !== 'NOT_VERIFIED' && !rightsConfirmed)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                isImporting || (rightsStatus !== 'NOT_VERIFIED' && !rightsConfirmed)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-rose-950/50 hover:scale-[1.02] cursor-pointer'
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Encoding & Adding Video...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Video to Stream Library</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
