import React, { useState } from 'react';
import { 
  ScrollText, 
  Download, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle,
  Search
} from 'lucide-react';
import { ActivityLog, LogLevel, LogCategory } from '../types';

interface LogsViewerProps {
  logs: ActivityLog[];
  onClearLogs: () => Promise<void>;
}

export const LogsViewer: React.FC<LogsViewerProps> = ({ logs, onClearLogs }) => {
  const [levelFilter, setLevelFilter] = useState<'ALL' | LogLevel>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | LogCategory>('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    const matchesCat = categoryFilter === 'ALL' || log.category === categoryFilter;
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
                          (log.details && log.details.toLowerCase().includes(search.toLowerCase()));
    return matchesLevel && matchesCat && matchesSearch;
  });

  const handleExportTxt = () => {
    const header = `ORIGINAL LIVE STREAM MANAGER - AUDIT & ACTIVITY LOG\nExported: ${new Date().toLocaleString()}\n` +
      `--------------------------------------------------------------------------------\n\n`;
    const lines = filteredLogs.map(l => 
      `[${l.timestamp}] [${l.level.padEnd(7)}] [${l.category.padEnd(8)}] ${l.message} ${l.details ? `(${l.details})` : ''}`
    ).join('\n');

    const blob = new Blob([header + lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `live_stream_manager_logs_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'SUCCESS':
        return <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">SUCCESS</span>;
      case 'WARN':
        return <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">WARN</span>;
      case 'ERROR':
        return <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">ERROR</span>;
      default:
        return <span className="text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">INFO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-rose-500" />
            <span>Activity & Compliance Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of YouTube connections, rights confirmations, encoder status, and stream telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportTxt}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export as TXT</span>
          </button>
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-semibold rounded-xl border border-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search log messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
            <span className="text-slate-500 mr-1 hidden sm:inline">Level:</span>
            {(['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  levelFilter === lvl
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 mr-1">Category:</span>
          {(['ALL', 'YOUTUBE', 'FFMPEG', 'RIGHTS', 'PLAYLIST', 'NETWORK', 'SYSTEM'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-2.5 px-4 w-28">Timestamp</th>
                <th className="py-2.5 px-4 w-24">Level</th>
                <th className="py-2.5 px-4 w-28">Category</th>
                <th className="py-2.5 px-4">Message & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                    No log entries matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{getLevelBadge(log.level)}</td>
                    <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap font-sans font-semibold text-[11px]">
                      {log.category}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-sans text-slate-200 text-xs font-medium">{log.message}</div>
                      {log.details && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{log.details}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
