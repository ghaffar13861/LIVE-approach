import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, Check, X, FileCheck, Scale } from 'lucide-react';
import { VideoItem, RightsStatus } from '../types';

interface RightsConfirmationModalProps {
  video: VideoItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (videoId: string, status: RightsStatus, notes: string) => void;
}

export const RightsConfirmationModal: React.FC<RightsConfirmationModalProps> = ({
  video,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<RightsStatus>(
    video.rightsStatus === 'NOT_VERIFIED' ? 'OWNED' : video.rightsStatus
  );
  const [hasCheckedNotice, setHasCheckedNotice] = useState(false);
  const [notes, setNotes] = useState(video.rightsNotes || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (selectedStatus !== 'NOT_VERIFIED' && !hasCheckedNotice) {
      alert('You must check the confirmation checkbox verifying your commercial rights before saving.');
      return;
    }
    onConfirm(video.id, selectedStatus, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Original Content & Rights Verification</h3>
              <p className="text-xs text-slate-400">Strict policy verification for YouTube Live compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Info Summary */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-16 h-10 bg-slate-900 rounded overflow-hidden relative shrink-0">
            <img
              src={video.thumbnailUrl || '/sample-thumb.jpg'}
              alt={video.originalName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="overflow-hidden text-xs">
            <p className="font-semibold text-slate-200 truncate">{video.originalName}</p>
            <p className="text-slate-400 mt-0.5">
              {Math.floor(video.durationSeconds / 60)}m {Math.floor(video.durationSeconds % 60)}s • {video.width}x{video.height} • {video.videoCodec}
            </p>
          </div>
        </div>

        {/* Rights Type Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Select Content Ownership Status</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedStatus('OWNED')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                selectedStatus === 'OWNED'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">OWNED</span>
                {selectedStatus === 'OWNED' && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[10px] text-slate-400">Created 100% by you (visuals & audio)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('LICENSED')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                selectedStatus === 'LICENSED'
                  ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">LICENSED</span>
                {selectedStatus === 'LICENSED' && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[10px] text-slate-400">Commercial streaming license held</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('NOT_VERIFIED')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                selectedStatus === 'NOT_VERIFIED'
                  ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">NOT VERIFIED</span>
                {selectedStatus === 'NOT_VERIFIED' && <AlertOctagon className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[10px] text-rose-400 font-medium">Blocked from streaming</span>
            </button>
          </div>
        </div>

        {/* License Notes */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Ownership / License Documentation Details
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. In-house original master, or Creative Commons License #CC-BY-4029"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Mandatory Policy Confirmation Checkbox */}
        {selectedStatus !== 'NOT_VERIFIED' ? (
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                id="checkbox-rights-confirm"
                type="checkbox"
                checked={hasCheckedNotice}
                onChange={(e) => setHasCheckedNotice(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900 w-4 h-4"
              />
              <span className="text-xs text-slate-200 font-medium leading-tight">
                “I confirm that I own this content or have the necessary rights to livestream and commercially use it on YouTube.”
              </span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
              Only stream content that you own or have the necessary commercial streaming rights to. You are legally responsible for any content broadcast under your YouTube channel credentials.
            </p>
          </div>
        ) : (
          <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>This video will remain <strong>blocked</strong> from playlists and broadcasting until rights are verified.</span>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-save-rights-verification"
            onClick={handleSave}
            disabled={selectedStatus !== 'NOT_VERIFIED' && !hasCheckedNotice}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedStatus !== 'NOT_VERIFIED' && !hasCheckedNotice
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm & Update Rights</span>
          </button>
        </div>
      </div>
    </div>
  );
};
