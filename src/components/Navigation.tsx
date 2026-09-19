import React from 'react';
import { 
  Radio, 
  Film, 
  ListOrdered, 
  Tv, 
  Calendar, 
  ScrollText, 
  Settings as SettingsIcon, 
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { StreamMetrics, YouTubeChannelInfo } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  metrics: StreamMetrics;
  channel: YouTubeChannelInfo;
  onOpenWizard: () => void;
  onEmergencyStop: () => void;
  testMode: boolean;
  setTestMode: (val: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  channel,
  onOpenWizard,
  onEmergencyStop,
  testMode,
  setTestMode,
}) => {
  const isLive = metrics.state === 'LIVE';
  const isPaused = metrics.state === 'PAUSED';
  const isReconnecting = metrics.state === 'RECONNECTING';

  const navItems = [
    { id: 'simple', label: '1-Click Live', icon: Zap, highlight: true },
    { id: 'dashboard', label: 'Dashboard', icon: Radio },
    { id: 'videos', label: 'Video Library', icon: Film },
    { id: 'playlist', label: 'Playlist', icon: ListOrdered },
    { id: 'livestream', label: 'Live Stream', icon: Tv },
    { id: 'scheduler', label: 'Scheduler', icon: Calendar },
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & App Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center shadow-md shadow-rose-950/40">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">Original Live Stream Manager</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold tracking-wider uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Policy Certified
              </span>
            </div>
            <p className="text-xs text-slate-400">Desktop YouTube Live Broadcasting Suite</p>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Test Mode Switch */}
          <button
            id="toggle-test-mode"
            onClick={() => setTestMode(!testMode)}
            title="When active, streams to local test sink to verify playback and transitions without broadcasting publicly"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              testMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test Mode: {testMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* First Run Wizard Button */}
          <button
            id="btn-open-wizard"
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Setup Wizard</span>
          </button>

          {/* Connected Channel Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            {channel.connected ? (
              <>
                <img
                  src={channel.thumbnailUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={channel.title}
                  className="w-5 h-5 rounded-full object-cover border border-slate-700"
                />
                <div className="flex flex-col text-left">
                  <span className="text-slate-200 font-medium truncate max-w-[110px]">{channel.title}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Connected" />
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Not Connected</span>
              </div>
            )}
          </div>

          {/* Live Status Pill */}
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-600/20 border border-rose-600/50 text-rose-400 text-xs font-bold tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse-live" />
                <span>LIVE</span>
              </div>
            )}
            {isPaused && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-600/20 border border-amber-600/50 text-amber-400 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>PAUSED</span>
              </div>
            )}
            {isReconnecting && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-600/20 border border-yellow-600/50 text-yellow-400 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-spin" />
                <span>RECONNECTING ({metrics.reconnectCountdownSeconds}s)</span>
              </div>
            )}
            {!isLive && !isPaused && !isReconnecting && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span>OFFLINE</span>
              </div>
            )}
          </div>

          {/* Quick Emergency Stop if active */}
          {(isLive || isPaused || isReconnecting) && (
            <button
              id="nav-emergency-stop"
              onClick={onEmergencyStop}
              title="Immediate Emergency Kill to all streaming processes"
              className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-600/60 text-red-400 hover:bg-red-800 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>KILL</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
