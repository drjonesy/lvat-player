import React, { useState } from 'react';
import { X, Bookmark as BookmarkIcon, Trash2, Clock, Play, Plus, Edit2 } from 'lucide-react';
import { Bookmark } from '../types';
import { formatTime } from '../utils/srtParser';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onSeekToBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (id: string) => void;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onSeekToBookmark,
  onDeleteBookmark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <BookmarkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Saved Bookmarks</h3>
              <p className="text-xs text-slate-400">
                Quick jump to saved timestamps and transcript lines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <BookmarkIcon className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
              <p>No saved bookmarks yet.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Click the Bookmark icon on any line or player control to save positions.
              </p>
            </div>
          ) : (
            bookmarks.map(bm => (
              <div
                key={bm.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-start justify-between gap-3 transition-colors text-xs"
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    onSeekToBookmark(bm);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-blue-400 font-bold bg-blue-600/10 px-2 py-0.5 rounded-lg border border-blue-500/30 text-[11px]">
                      {formatTime(bm.timestamp)}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(bm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium italic truncate max-w-xs">
                    "{bm.cueText || 'Bookmark at timestamp'}"
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onSeekToBookmark(bm);
                      onClose();
                    }}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                    title="Jump to bookmark"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    onClick={() => onDeleteBookmark(bm.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
