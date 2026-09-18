import React, { useState } from 'react';
import { ShieldCheck, Info, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export const PolicyBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="font-medium text-slate-200">
            <span className="text-emerald-400 font-semibold">Policy Requirement: </span>
            Only stream content that you own or have the necessary commercial streaming rights to.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <span className="text-[11px] text-slate-400 hidden lg:inline">
            Zero fake engagement, no loops, strict copyright verification.
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors font-medium bg-slate-800/70 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50"
          >
            <Info className="w-3 h-3 text-rose-400" />
            <span>Monetization & Rights Notice</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400 animate-fadeIn">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
            <h4 className="font-semibold text-rose-400 flex items-center gap-1 mb-1">
              <AlertCircle className="w-3 h-3" /> Monetization Safety Notice
            </h4>
            <p className="leading-relaxed">
              Using this tool does not guarantee YouTube monetization. YouTube reviews channels and content according to its current monetization policies. Repetitive, mass-produced, reused or insufficiently original content may be ineligible for monetization. Only livestream content that you own or have the necessary rights to use.
            </p>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
            <h4 className="font-semibold text-slate-300 flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Compliance & Quality Architecture
            </h4>
            <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
              <li>No automated artificial loops: streams stop cleanly upon playlist conclusion.</li>
              <li>Strict Rights System: unverified video assets are strictly blocked from broadcasting.</li>
              <li>Official YouTube Live Streaming API integration with clean FFmpeg encoding.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
