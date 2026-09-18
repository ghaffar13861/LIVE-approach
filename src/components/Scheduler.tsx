import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle, 
  Radio,
  Lock,
  Eye,
  Globe,
  ListOrdered
} from 'lucide-react';
import { ScheduledStream, PlaylistItem, PrivacyStatus } from '../types';

interface SchedulerProps {
  schedules: ScheduledStream[];
  playlists: PlaylistItem[];
  onAddSchedule: (schedule: Omit<ScheduledStream, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
  onStartScheduledNow: (schedule: ScheduledStream) => void;
}

export const Scheduler: React.FC<SchedulerProps> = ({
  schedules,
  playlists,
  onAddSchedule,
  onDeleteSchedule,
  onStartScheduledNow,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('Scheduled Live Broadcast');
  const [description, setDescription] = useState('Original content scheduled broadcast.');
  const [playlistId, setPlaylistId] = useState(playlists[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00');
  const [privacy, setPrivacy] = useState<PrivacyStatus>('unlisted');
  const [autoStart, setAutoStart] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !playlistId) {
      alert('Title and Playlist are required.');
      return;
    }

    const pl = playlists.find(p => p.id === playlistId);
    const scheduledDateTime = `${date}T${time}:00`;

    await onAddSchedule({
      title: title.trim(),
      description: description.trim(),
      privacy,
      playlistId,
      playlistName: pl?.name || 'Selected Playlist',
      scheduledDateTime,
      autoStart,
    });

    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            <span>Broadcast Scheduler</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Plan and automate your original content livestreams on YouTube at specified dates and times.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Stream</span>
        </button>
      </div>

      {/* Schedules List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Scheduled Broadcast Queue ({schedules.length})
        </h3>

        {schedules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-medium">No upcoming broadcasts scheduled</p>
            <p className="text-[11px]">Click "Schedule New Stream" to reserve an automated transmission slot.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((item) => {
              const dt = new Date(item.scheduledDateTime);
              const formattedDate = dt.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-200 text-sm">{item.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {item.status}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-900 text-slate-400 border border-slate-800">
                        {item.privacy}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        {formattedDate} at {formattedTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                        Playlist: <strong className="text-slate-200">{item.playlistName}</strong>
                      </span>
                      <span>•</span>
                      <span>Auto-Start: {item.autoStart ? 'Enabled' : 'Manual'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onStartScheduledNow(item)}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Launch stream immediately"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Now</span>
                    </button>
                    <button
                      onClick={() => onDeleteSchedule(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                      title="Cancel schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Schedule Live Stream</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Broadcast Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Playlist Track *</label>
                <select
                  value={playlistId}
                  onChange={(e) => setPlaylistId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  required
                >
                  {playlists.map(pl => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} ({pl.videoIds.length} videos)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Privacy Level</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['public', 'unlisted', 'private'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrivacy(p)}
                      className={`p-2 rounded-lg border text-center font-semibold capitalize transition-all ${
                        privacy === p
                          ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 bg-slate-900"
                />
                <span className="text-slate-300">Auto-start broadcast when scheduled time arrives</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-950/40"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
