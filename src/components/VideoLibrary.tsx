import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Play, 
  Trash2, 
  Edit2, 
  Check, 
  ShieldCheck, 
  AlertOctagon, 
  Upload, 
  Film, 
  Clock, 
  Monitor, 
  HardDrive, 
  Volume2,
  FileCheck,
  Scale
} from 'lucide-react';
import { VideoItem, RightsStatus, PlaylistItem } from '../types';
import { RightsConfirmationModal } from './RightsConfirmationModal';
import { VideoPlayerModal } from './VideoPlayerModal';
import { YouTubeLinkImporter } from './YouTubeLinkImporter';
import { Youtube } from 'lucide-react';

interface VideoLibraryProps {
  videos: VideoItem[];
  playlists?: PlaylistItem[];
  activePlaylistId?: string | null;
  onUploadVideo: (formData: FormData) => Promise<void>;
  onUpdateVideo: (id: string, updates: Partial<VideoItem>) => Promise<void>;
  onDeleteVideo: (id: string) => Promise<void>;
  onAddToPlaylist?: (videoId: string) => void;
  onImportYouTubeSuccess?: (video: VideoItem, playlist?: PlaylistItem | null) => void;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({
  videos,
  playlists = [],
  activePlaylistId = null,
  onUploadVideo,
  onUpdateVideo,
  onDeleteVideo,
  onAddToPlaylist,
  onImportYouTubeSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rightsFilter, setRightsFilter] = useState<'ALL' | RightsStatus>('ALL');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showYouTubeImporter, setShowYouTubeImporter] = useState(true);

  // Modals state
  const [verifyingVideo, setVerifyingVideo] = useState<VideoItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  // Add video modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadRightsStatus, setUploadRightsStatus] = useState<RightsStatus>('OWNED');
  const [uploadRightsConfirmed, setUploadRightsConfirmed] = useState(false);
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredVideos = videos.filter((v) => {
    const matchesSearch = v.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRights = rightsFilter === 'ALL' || v.rightsStatus === rightsFilter;
    return matchesSearch && matchesRights;
  });

  const handleStartRename = (video: VideoItem) => {
    setEditingVideoId(video.id);
    setEditedName(video.originalName);
  };

  const handleSaveRename = async (id: string) => {
    if (editedName.trim()) {
      await onUpdateVideo(id, { originalName: editedName.trim() });
    }
    setEditingVideoId(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setShowAddModal(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setShowAddModal(true);
    }
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (uploadRightsStatus !== 'NOT_VERIFIED' && !uploadRightsConfirmed) {
      alert('You must confirm your commercial rights before adding an OWNED or LICENSED video.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('rightsStatus', uploadRightsStatus);
    formData.append('rightsConfirmed', String(uploadRightsConfirmed));
    formData.append('rightsNotes', uploadNotes);

    try {
      await onUploadVideo(formData);
      setShowAddModal(false);
      setSelectedFile(null);
      setUploadNotes('');
      setUploadRightsConfirmed(false);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-5">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            <span>Local Video Library</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Supported formats: MP4, MOV, MKV, WebM. Strict copyright verification required for streaming.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-paste-youtube-toggle"
            onClick={() => setShowYouTubeImporter(!showYouTubeImporter)}
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              showYouTubeImporter
                ? 'bg-rose-600/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Youtube className="w-4 h-4 text-rose-500" />
            <span>Paste YouTube Link</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".mp4,.mov,.mkv,.webm"
            className="hidden"
          />
          <button
            id="btn-add-video"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Video File</span>
          </button>
        </div>
      </div>

      {/* Prominent YouTube Link Importer */}
      {showYouTubeImporter && (
        <YouTubeLinkImporter
          playlists={playlists}
          activePlaylistId={activePlaylistId}
          onImportSuccess={(video, playlist) => {
            if (onImportYouTubeSuccess) {
              onImportYouTubeSuccess(video, playlist);
            }
          }}
        />
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search video library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Rights filter pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Rights:</span>
          {(['ALL', 'OWNED', 'LICENSED', 'NOT_VERIFIED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setRightsFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                rightsFilter === status
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {status === 'ALL' ? 'All Videos' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Drop Zone Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          dragOver 
            ? 'border-rose-500 bg-rose-500/5' 
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
        }`}
      >
        <Upload className="w-7 h-7 mx-auto text-slate-500 mb-2" />
        <p className="text-xs font-medium text-slate-300">
          Drag and drop original or licensed video files here, or <span className="text-rose-400 underline">browse your files</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-1">MP4, MOV, MKV, WebM up to 500MB</p>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <Film className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-medium text-slate-400">No videos found matching your filters</p>
          <p className="text-xs">Add your original video files to build your livestream library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const isEditing = editingVideoId === video.id;
            const isOwned = video.rightsStatus === 'OWNED';
            const isLicensed = video.rightsStatus === 'LICENSED';
            const isUnverified = video.rightsStatus === 'NOT_VERIFIED';

            return (
              <div
                key={video.id}
                id={`video-card-${video.id}`}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col shadow-md"
              >
                {/* Thumbnail & Quick Play */}
                <div className="relative aspect-video bg-black group overflow-hidden">
                  <img
                    src={video.thumbnailUrl || '/sample-thumb.jpg'}
                    alt={video.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => setPreviewVideo(video)}
                      className="p-2.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow-lg transform hover:scale-110 transition-all"
                      title="Preview Video"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  </div>

                  {/* Duration Pill */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-slate-200 backdrop-blur-xs">
                    {Math.floor(video.durationSeconds / 60)}:{(Math.floor(video.durationSeconds % 60)).toString().padStart(2, '0')}
                  </div>

                  {/* Rights Status Badge */}
                  <div className="absolute top-2 left-2">
                    <button
                      onClick={() => setVerifyingVideo(video)}
                      title="Click to review or verify copyright and streaming rights"
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md shadow-sm transition-transform hover:scale-105 ${
                        isOwned
                          ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400'
                          : isLicensed
                          ? 'bg-sky-950/80 border-sky-500/60 text-sky-400'
                          : 'bg-rose-950/90 border-rose-500/80 text-rose-400 animate-pulse'
                      }`}
                    >
                      {isOwned && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                      {isLicensed && <FileCheck className="w-3 h-3 text-sky-400" />}
                      {isUnverified && <AlertOctagon className="w-3 h-3 text-rose-400" />}
                      <span>{video.rightsStatus.replace('_', ' ')}</span>
                    </button>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title / Renaming */}
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1 px-2 py-1 bg-slate-950 border border-rose-500 rounded text-xs text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(video.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-semibold text-slate-200 text-xs truncate hover:text-rose-400 cursor-pointer"
                          onClick={() => setPreviewVideo(video)}
                          title={video.originalName}
                        >
                          {video.originalName}
                        </h3>
                        <button
                          onClick={() => handleStartRename(video)}
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                          title="Rename file"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Metadata tags */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3 h-3 text-slate-500" />
                        <span>{video.width}x{video.height} ({video.fps}fps)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>{formatFileSize(video.sizeBytes)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="w-3 h-3 text-slate-500" />
                        <span>{video.audioCodec} ({video.audioChannels}ch)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{video.addedDate}</span>
                      </div>
                    </div>

                    {/* Rights notes if available */}
                    {video.rightsNotes && (
                      <p className="text-[10px] text-slate-500 mt-1.5 italic truncate" title={video.rightsNotes}>
                        Note: {video.rightsNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setVerifyingVideo(video)}
                      className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800/60 hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Scale className="w-3 h-3 text-amber-400" />
                      <span>Verify Rights</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {isUnverified ? (
                        <span
                          className="text-[10px] text-rose-400 font-semibold px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 cursor-not-allowed"
                          title="Unverified content cannot be added to playlists or streams"
                        >
                          BLOCKED
                        </span>
                      ) : (
                        onAddToPlaylist && (
                          <button
                            onClick={() => onAddToPlaylist(video.id)}
                            className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition-colors"
                          >
                            + Playlist
                          </button>
                        )
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Remove "${video.originalName}" from your library?`)) {
                            onDeleteVideo(video.id);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Delete video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Upload Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-rose-500" />
              <span>Add Video File & Confirm Rights</span>
            </h3>

            {selectedFile && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <p className="font-semibold text-slate-200 truncate">{selectedFile.name}</p>
                <p className="text-slate-400 mt-0.5">{formatFileSize(selectedFile.size)}</p>
              </div>
            )}

            <form onSubmit={handleSubmitUpload} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-slate-300 block mb-1.5">Copyright / Rights Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadRightsStatus('OWNED')}
                    className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                      uploadRightsStatus === 'OWNED'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    OWNED
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadRightsStatus('LICENSED')}
                    className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                      uploadRightsStatus === 'LICENSED'
                        ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    LICENSED
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadRightsStatus('NOT_VERIFIED')}
                    className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                      uploadRightsStatus === 'NOT_VERIFIED'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    NOT VERIFIED
                  </button>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-300 block mb-1">License Details or Production Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Created with Blender/Premiere, or License Ref #CC-BY-4029"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {uploadRightsStatus !== 'NOT_VERIFIED' && (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={uploadRightsConfirmed}
                      onChange={(e) => setUploadRightsConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900 w-4 h-4"
                    />
                    <span className="text-slate-200 font-medium leading-tight">
                      “I confirm that I own this content or have the necessary rights to livestream and commercially use it on YouTube.”
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (uploadRightsStatus !== 'NOT_VERIFIED' && !uploadRightsConfirmed)}
                  className={`px-5 py-2 rounded-xl font-semibold text-white transition-all ${
                    isUploading || (uploadRightsStatus !== 'NOT_VERIFIED' && !uploadRightsConfirmed)
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/40'
                  }`}
                >
                  {isUploading ? 'Processing & Probing...' : 'Save to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rights Verification Modal */}
      {verifyingVideo && (
        <RightsConfirmationModal
          video={verifyingVideo}
          isOpen={Boolean(verifyingVideo)}
          onClose={() => setVerifyingVideo(null)}
          onConfirm={async (videoId, status, notes) => {
            await onUpdateVideo(videoId, {
              rightsStatus: status,
              rightsNotes: notes,
            });
            setVerifyingVideo(null);
          }}
        />
      )}

      {/* Video Preview Player Modal */}
      {previewVideo && (
        <VideoPlayerModal
          video={previewVideo}
          isOpen={Boolean(previewVideo)}
          onClose={() => setPreviewVideo(null)}
        />
      )}
    </div>
  );
};
