import React, { useState } from 'react';
import { 
  ListOrdered, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  ShieldCheck, 
  AlertOctagon, 
  Play, 
  Check, 
  Film,
  Sparkles,
  Info
} from 'lucide-react';
import { VideoItem, PlaylistItem } from '../types';

interface PlaylistManagerProps {
  playlists: PlaylistItem[];
  videos: VideoItem[];
  activePlaylistId: string | null;
  onSelectActivePlaylist: (id: string) => void;
  onSavePlaylist: (playlist: PlaylistItem) => Promise<void>;
  onDeletePlaylist: (id: string) => Promise<void>;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  videos,
  activePlaylistId,
  onSelectActivePlaylist,
  onSavePlaylist,
  onDeletePlaylist,
}) => {
  const currentPlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0] || null;

  const [name, setName] = useState(currentPlaylist?.name || 'My Broadcast Playlist');
  const [description, setDescription] = useState(currentPlaylist?.description || '');
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>(currentPlaylist?.videoIds || []);
  const [showAddPicker, setShowAddPicker] = useState(false);

  // Sync when playlist changes
  React.useEffect(() => {
    if (currentPlaylist) {
      setName(currentPlaylist.name);
      setDescription(currentPlaylist.description || '');
      setSelectedVideoIds(currentPlaylist.videoIds);
    }
  }, [currentPlaylist?.id]);

  // Video lookup helper
  const getVideo = (id: string) => videos.find(v => v.id === id);

  // Move video up/down
  const moveVideo = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedVideoIds.length) return;
    const copy = [...selectedVideoIds];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setSelectedVideoIds(copy);
  };

  const removeVideoFromPlaylist = (index: number) => {
    const copy = [...selectedVideoIds];
    copy.splice(index, 1);
    setSelectedVideoIds(copy);
  };

  const addVideoToPlaylist = (video: VideoItem) => {
    // ENFORCE POLICY REQUIREMENT: NOT VERIFIED videos are blocked
    if (video.rightsStatus === 'NOT_VERIFIED' || !video.rightsConfirmed) {
      alert(`Cannot add "${video.originalName}". Video rights status is NOT VERIFIED. Please verify rights in the Video Library first.`);
      return;
    }
    setSelectedVideoIds([...selectedVideoIds, video.id]);
    setShowAddPicker(false);
  };

  // Calculate total playlist duration
  const totalDurationSeconds = selectedVideoIds.reduce((acc, id) => {
    const v = getVideo(id);
    return acc + (v ? v.durationSeconds : 0);
  }, 0);

  const formatDuration = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const handleSaveCurrentPlaylist = async () => {
    if (!name.trim()) {
      alert('Playlist must have a name.');
      return;
    }
    const id = currentPlaylist?.id || 'pl_' + Date.now().toString(36);
    await onSavePlaylist({
      id,
      name: name.trim(),
      description: description.trim(),
      videoIds: selectedVideoIds,
      createdAt: currentPlaylist?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    alert('Playlist saved successfully.');
  };

  const handleCreateNewPlaylist = () => {
    const newId = 'pl_' + Date.now().toString(36);
    const authorizedDefaultIds = videos
      .filter(v => v.rightsStatus !== 'NOT_VERIFIED' && v.rightsConfirmed)
      .slice(0, 2)
      .map(v => v.id);

    const newPl: PlaylistItem = {
      id: newId,
      name: `Broadcast Playlist ${playlists.length + 1}`,
      description: 'Original and licensed video sequence for live stream.',
      videoIds: authorizedDefaultIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSavePlaylist(newPl);
    onSelectActivePlaylist(newId);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-rose-500" />
            <span>Playlist Builder</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequence original authorized videos. Reorders seamlessly without looping artificially.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCreateNewPlaylist}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
          <button
            id="btn-save-playlist"
            onClick={handleSaveCurrentPlaylist}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-950/40 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save Playlist</span>
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Playlist selection & details */}
        <div className="space-y-4">
          {/* Playlist selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Available Playlists</h3>
            <div className="space-y-1.5">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => onSelectActivePlaylist(pl.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    (currentPlaylist?.id === pl.id)
                      ? 'bg-rose-600/10 border-rose-500/60 text-white shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold truncate">{pl.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{pl.videoIds.length} video(s)</p>
                  </div>
                  {currentPlaylist?.id === pl.id && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Playlist Metadata Edit */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-xs">Playlist Settings</h3>
            <div>
              <label className="text-slate-400 block mb-1">Playlist Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Total Duration Card */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>Total Duration</span>
              </div>
              <span className="font-bold text-slate-200">{formatDuration(totalDurationSeconds)}</span>
            </div>

            {/* Anti-Loop Policy Notice */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <p>
                When all videos finish, the stream displays <span className="text-slate-200 font-semibold">“Playlist completed. Start a new playlist or manually restart.”</span> No artificial endless loops are injected.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Sequenced Video Track */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Track Sequence</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                    {selectedVideoIds.length} Items
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Drag or use arrow controls to reorder playlist playback order</p>
              </div>

              <button
                id="btn-add-video-to-playlist"
                onClick={() => setShowAddPicker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Video</span>
              </button>
            </div>

            {/* Video List */}
            {selectedVideoIds.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 space-y-2">
                <Film className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-medium">This playlist is empty</p>
                <p className="text-[11px]">Click "Add Video" above to insert verified original videos from your library.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedVideoIds.map((id, index) => {
                  const video = getVideo(id);
                  if (!video) return null;

                  const isFirst = index === 0;
                  const isNext = index === 1;

                  return (
                    <div
                      key={`${id}-${index}`}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Sequence Index Number */}
                        <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0 text-[11px]">
                          {index + 1}
                        </div>

                        {/* Thumbnail */}
                        <div className="w-14 h-9 bg-slate-900 rounded overflow-hidden relative shrink-0">
                          <img
                            src={video.thumbnailUrl || '/sample-thumb.jpg'}
                            alt={video.originalName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Video Info */}
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-200 truncate">{video.originalName}</p>
                            {isFirst && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold uppercase tracking-wider shrink-0">
                                Current
                              </span>
                            )}
                            {isNext && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold uppercase tracking-wider shrink-0">
                                Up Next
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{Math.floor(video.durationSeconds / 60)}:{(Math.floor(video.durationSeconds % 60)).toString().padStart(2, '0')}</span>
                            <span>•</span>
                            <span>{video.width}x{video.height}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> {video.rightsStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reorder and Delete Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={index === 0}
                          onClick={() => moveVideo(index, 'up')}
                          className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={index === selectedVideoIds.length - 1}
                          onClick={() => moveVideo(index, 'down')}
                          className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeVideoFromPlaylist(index)}
                          className="p-1 rounded bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
                          title="Remove from playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Video from Library Modal */}
      {showAddPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Select Verified Video from Library</h3>
                <p className="text-xs text-slate-400">Only OWNED or LICENSED videos can be added</p>
              </div>
              <button
                onClick={() => setShowAddPicker(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {videos.map((video) => {
                const isBlocked = video.rightsStatus === 'NOT_VERIFIED' || !video.rightsConfirmed;

                return (
                  <div
                    key={video.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                      isBlocked
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-8 bg-slate-900 rounded overflow-hidden shrink-0">
                        <img
                          src={video.thumbnailUrl || '/sample-thumb.jpg'}
                          alt={video.originalName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-slate-200 truncate">{video.originalName}</p>
                        <p className="text-slate-500 text-[11px]">
                          {Math.floor(video.durationSeconds / 60)}:{(Math.floor(video.durationSeconds % 60)).toString().padStart(2, '0')} • {video.rightsStatus}
                        </p>
                      </div>
                    </div>

                    {isBlocked ? (
                      <span className="text-[10px] text-rose-400 font-bold px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 shrink-0">
                        NOT VERIFIED (BLOCKED)
                      </span>
                    ) : (
                      <button
                        onClick={() => addVideoToPlaylist(video)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shrink-0 transition-all"
                      >
                        + Add to Track
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
