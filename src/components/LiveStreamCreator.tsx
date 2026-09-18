import React, { useState } from 'react';
import { 
  Tv, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  Code, 
  Send, 
  Radio,
  Lock,
  Eye,
  Globe,
  HelpCircle
} from 'lucide-react';
import { LiveBroadcastConfig, YouTubeChannelInfo } from '../types';

interface LiveStreamCreatorProps {
  channel: YouTubeChannelInfo;
  onCreateBroadcast: (config: LiveBroadcastConfig) => Promise<any>;
  onStartStreamDirectly?: (config: LiveBroadcastConfig) => void;
  testMode: boolean;
}

export const LiveStreamCreator: React.FC<LiveStreamCreatorProps> = ({
  channel,
  onCreateBroadcast,
  onStartStreamDirectly,
  testMode,
}) => {
  const [title, setTitle] = useState('Official Live Showcase - Original Creations');
  const [description, setDescription] = useState('Welcome to our verified original content livestream. All footage, animations, and audio tracks are created or licensed for commercial broadcasting on YouTube.');
  const [category, setCategory] = useState('28'); // Science & Technology / Creator
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>(testMode ? 'unlisted' : 'unlisted');
  const [tagsInput, setTagsInput] = useState('original content, creator studio, live broadcast, verified');
  const [madeForKids, setMadeForKids] = useState(false);
  const [enableDvr, setEnableDvr] = useState(true);
  const [recordFromStart, setRecordFromStart] = useState(true);
  const [autoStart, setAutoStart] = useState(true);
  const [autoStop, setAutoStop] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API response viewer
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Duplicate stream confirmation
  const [activeStreamWarning, setActiveStreamWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Broadcast title is required.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    setActiveStreamWarning(null);

    const config: LiveBroadcastConfig = {
      title: title.trim(),
      description: description.trim(),
      category,
      privacy: testMode ? 'unlisted' : privacy,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      madeForKids,
      enableDvr,
      recordFromStart,
      autoStart,
      autoStop,
      testMode,
    };

    try {
      // Check active broadcast check first
      const checkRes = await fetch('/api/youtube/active-broadcast').then(r => r.json());
      if (checkRes.hasActive && checkRes.activeBroadcast) {
        setActiveStreamWarning(`An active livestream already exists ("${checkRes.activeBroadcast.title}"). Do you want to continue creating another broadcast?`);
      }

      const res = await onCreateBroadcast(config);
      setApiResponse(res);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create YouTube Live broadcast.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-rose-500" />
            <span>YouTube Live Broadcast Setup</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create an official YouTube Live broadcast event via the YouTube Live Streaming API.
          </p>
        </div>

        {testMode && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>TEST MODE ACTIVE (Unlisted / Safe Local Ingestion)</span>
          </div>
        )}
      </div>

      {/* Duplicate Stream Warning Banner */}
      {activeStreamWarning && (
        <div className="bg-amber-500/10 border border-amber-500/40 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{activeStreamWarning}</p>
            <p className="text-slate-400">
              YouTube limits channels to one active broadcast per stream key. Ensure previous broadcasts are finalized.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left, API response on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Live Stream Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My 24/7 Original Lo-Fi Beats Livestream"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 text-xs font-medium"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 text-xs"
            />
          </div>

          {/* Category & Privacy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">YouTube Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="28">Science & Technology</option>
                <option value="24">Entertainment</option>
                <option value="10">Music</option>
                <option value="20">Gaming</option>
                <option value="27">Education</option>
                <option value="22">People & Blogs</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Privacy Level</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPrivacy('public')}
                  className={`py-2 px-2 rounded-lg border flex flex-col items-center gap-1 font-semibold transition-all ${
                    privacy === 'public'
                      ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Public</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacy('unlisted')}
                  className={`py-2 px-2 rounded-lg border flex flex-col items-center gap-1 font-semibold transition-all ${
                    privacy === 'unlisted'
                      ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Unlisted</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacy('private')}
                  className={`py-2 px-2 rounded-lg border flex flex-col items-center gap-1 font-semibold transition-all ${
                    privacy === 'private'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Private</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="original, live, music, tech"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 text-xs"
            />
          </div>

          {/* Broadcast Options Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Made for Kids</span>
              <input
                type="checkbox"
                checked={madeForKids}
                onChange={(e) => setMadeForKids(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-rose-600 bg-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Enable DVR (Rewind)</span>
              <input
                type="checkbox"
                checked={enableDvr}
                onChange={(e) => setEnableDvr(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-rose-600 bg-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Record from Start</span>
              <input
                type="checkbox"
                checked={recordFromStart}
                onChange={(e) => setRecordFromStart(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-rose-600 bg-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Auto-Start on RTMP</span>
              <input
                type="checkbox"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-rose-600 bg-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer sm:col-span-2">
              <span className="text-slate-300">Auto-Stop Broadcast when Stream Finishes</span>
              <input
                type="checkbox"
                checked={autoStop}
                onChange={(e) => setAutoStop(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-rose-600 bg-slate-900"
              />
            </label>
          </div>

          {/* Submit button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              id="btn-create-broadcast"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-950/40 transition-all text-xs"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Broadcast...' : 'Create YouTube Broadcast Event'}</span>
            </button>
          </div>
        </form>

        {/* Right side: API Status & JSON Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Code className="w-4 h-4 text-sky-400" />
                <span>YouTube Live API Response</span>
              </h3>
              {apiResponse ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  HTTP 200 OK
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Awaiting Request</span>
              )}
            </div>

            {apiError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 space-y-1">
                <p className="font-bold">API Error</p>
                <p className="text-[11px]">{apiError}</p>
              </div>
            )}

            {apiResponse ? (
              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Broadcast ID:</span>
                    <span className="text-sky-300">{apiResponse.broadcast?.id || apiResponse.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-emerald-400 font-bold uppercase">{apiResponse.broadcast?.status || 'READY'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Privacy:</span>
                    <span className="text-slate-300 capitalize">{apiResponse.broadcast?.privacy || privacy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RTMP Server:</span>
                    <span className="text-slate-400 truncate max-w-[180px]">{apiResponse.broadcast?.ingestionUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stream Key:</span>
                    <span className="text-amber-400">••••••••••••••••</span>
                  </div>
                </div>

                <details className="text-[11px] text-slate-400">
                  <summary className="cursor-pointer hover:text-slate-200">View Raw API JSON</summary>
                  <pre className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] overflow-x-auto text-emerald-400 max-h-60">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Tv className="w-8 h-8 mx-auto text-slate-700" />
                <p>Fill in broadcast metadata and click "Create YouTube Broadcast Event".</p>
                <p className="text-[11px] text-slate-600">
                  Integrates with YouTube Live Streaming API (`liveBroadcasts.insert` and `liveStreams.bind`).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
