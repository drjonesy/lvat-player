import React, { useState, useRef, useEffect } from 'react';
import { ListVideo, ChevronDown, Check, Film, Headphones } from 'lucide-react';
import { MediaItem, ThemeMode } from '../types';
import { getThemeConfig } from '../utils/theme';

interface MediaSelectorProps {
  activeMedia: MediaItem | null;
  mediaList: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  themeMode?: ThemeMode;
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({
  activeMedia,
  mediaList,
  onSelectMedia,
  themeMode = 'light',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeConfig = getThemeConfig((themeMode || 'light') as ThemeMode);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mediaList || mediaList.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${themeConfig.cardBg} border ${themeConfig.cardBorder} ${themeConfig.text} hover:opacity-90 transition-all shadow-sm max-w-[200px] sm:max-w-[260px]`}
        title="Select Media Playlist Item"
      >
        <ListVideo className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="truncate flex-1 text-left">
          {activeMedia ? activeMedia.title : 'Select Playlist Item'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${themeConfig.textMuted} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-10 right-0 sm:left-auto ${themeConfig.cardBg} border ${themeConfig.cardBorder} rounded-2xl shadow-2xl p-2 z-50 w-72 sm:w-80 space-y-1`}>
          <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted} flex items-center justify-between`}>
            <span>Media Playlist ({mediaList.length})</span>
            <span className="text-[9px] font-normal normal-case">Switch Media</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
            {mediaList.map((item) => {
              const isSelected = activeMedia?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectMedia(item);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                    isSelected
                      ? `${themeConfig.accentBg} text-white font-semibold shadow-sm`
                      : `${themeConfig.text} hover:bg-black/5 dark:hover:bg-white/10`
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-white/20' : 'bg-slate-500/10'}`}>
                    {item.mediaType === 'video' ? (
                      <Film className="w-3.5 h-3.5" />
                    ) : (
                      <Headphones className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-xs leading-snug">{item.title}</p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-white/80' : themeConfig.textMuted}`}>
                      {item.author || (item.mediaType === 'video' ? 'Video' : 'Audio')} • {item.subtitles?.length || 0} transcript cues
                    </p>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 shrink-0 text-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
