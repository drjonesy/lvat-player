import React, { useRef, useEffect } from 'react';
import { 
  Type, 
  Search, 
  Bookmark, 
  Sparkles, 
  Play, 
  Pause, 
  Compass, 
  Volume2,
  Video,
  BookOpen
} from 'lucide-react';
import { MediaItem, SubtitleCue, ReaderSettings, ThemeMode } from '../types';
import { formatTime } from '../utils/srtParser';
import { getThemeConfig } from '../utils/theme';
import { ThemeSelector } from './ThemeSelector';
import { MediaSelector } from './MediaSelector';

interface AudioBookReaderViewProps {
  activeMedia: MediaItem | null;
  mediaList?: MediaItem[];
  onSelectMedia?: (media: MediaItem) => void;
  currentTime: number;
  duration: number;
  activeCue: SubtitleCue | null;
  onCueClick: (cue: SubtitleCue) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  onAddBookmarkAtCue: (cue: SubtitleCue) => void;
  mode?: 'video' | 'audiobook';
  onModeChange?: (mode: 'video' | 'audiobook') => void;
  onSelectTheme?: (theme: ThemeMode) => void;
}

export const AudioBookReaderView: React.FC<AudioBookReaderViewProps> = ({
  activeMedia,
  mediaList = [],
  onSelectMedia,
  currentTime,
  duration,
  activeCue,
  onCueClick,
  isPlaying,
  onTogglePlay,
  settings,
  onUpdateSettings,
  onAddBookmarkAtCue,
  mode = 'audiobook',
  onModeChange,
  onSelectTheme,
}) => {
  const activeCueRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const themeConfig = getThemeConfig(settings.themeMode || 'light');

  // Auto scroll active cue into view when playing
  useEffect(() => {
    if (settings.autoScroll && activeCueRef.current) {
      activeCueRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeCue?.id, settings.autoScroll]);

  // Font size mapping
  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose',
    '2xl': 'text-2xl leading-loose',
  };

  // Font family mapping
  const fontFamilyClasses = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  };

  // Filter cues by search query
  const filteredCues = activeMedia?.subtitles.filter(c =>
    c.text.toLowerCase().includes(settings.searchQuery.toLowerCase())
  ) || [];

  const completedCuesCount = activeMedia?.subtitles.filter(c => c.end <= currentTime).length || 0;
  const totalCuesCount = activeMedia?.subtitles.length || 0;
  const progressPercent = totalCuesCount > 0 ? Math.round((completedCuesCount / totalCuesCount) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 flex flex-col gap-4 sm:gap-6 overflow-x-hidden">
      
      {/* Top Control Bar: Mode Switcher, Playlist Selector & Color Theme */}
      <div className="flex flex-wrap items-center justify-between w-full gap-2.5">
        {onModeChange && (
          <div className={`inline-flex items-center ${themeConfig.cardBg} p-1 rounded-xl border ${themeConfig.cardBorder} shadow-sm transition-colors w-full sm:w-auto justify-center sm:justify-start`}>
            <button
              onClick={() => onModeChange('video')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'video'
                  ? `${themeConfig.accentBg} text-white shadow-md`
                  : `${themeConfig.textMuted} hover:${themeConfig.text}`
              }`}
              title="Watch Video with synchronized transcript"
            >
              <Video className="w-4 h-4" />
              <span>Video Mode</span>
            </button>

            <button
              onClick={() => onModeChange('audiobook')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'audiobook'
                  ? `${themeConfig.accentBg} text-white shadow-md`
                  : `${themeConfig.textMuted} hover:${themeConfig.text}`
              }`}
              title="Switch to Audio Read Mode"
            >
              <BookOpen className="w-4 h-4" />
              <span>Audio + Text Mode</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2.5 ml-auto hidden sm:flex">
          {onSelectMedia && mediaList.length > 0 && (
            <MediaSelector
              activeMedia={activeMedia}
              mediaList={mediaList}
              onSelectMedia={onSelectMedia}
              themeMode={settings.themeMode || 'light'}
            />
          )}

          {onSelectTheme && (
            <ThemeSelector
              themeMode={settings.themeMode || 'light'}
              onSelectTheme={onSelectTheme}
            />
          )}
        </div>
      </div>

      {/* Search Bar (Under video and audio toggle mode) */}
      <div className={`${themeConfig.cardBg} border ${themeConfig.cardBorder} rounded-xl p-2.5 sm:p-3 flex items-center gap-3 shadow-md transition-colors`}>
        <div className="relative flex-1">
          <Search className={`w-4 h-4 ${themeConfig.textMuted} absolute left-3 top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            value={settings.searchQuery}
            onChange={(e) => onUpdateSettings({ searchQuery: e.target.value })}
            placeholder="Search words or phrase in transcript..."
            className={`w-full ${themeConfig.inputBg} border ${themeConfig.inputBorder} ${themeConfig.inputText} rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none`}
          />
        </div>
      </div>

      {/* Synchronized Reader Canvas (Main Content) */}
      <div 
        ref={containerRef}
        className={`${themeConfig.cardBg} border ${themeConfig.cardBorder} rounded-2xl p-6 sm:p-10 shadow-2xl min-h-[50vh] transition-all ${fontFamilyClasses[settings.fontFamily]}`}
      >
        {filteredCues.length === 0 ? (
          <div className={`text-center py-16 ${themeConfig.textMuted}`}>
            <p className="text-sm">
              {!activeMedia
                ? 'No media loaded yet. Use the Files button to add your MP4, MP3 and SRT files.'
                : 'No transcript cues match your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCues.map((cue) => {
              const isActive = activeCue?.id === cue.id;
              const isPast = cue.end < currentTime;

              return (
                <div
                  key={cue.id}
                  ref={isActive ? activeCueRef : null}
                  onClick={() => onCueClick(cue)}
                  className={`group relative p-4.5 rounded-xl border transition-all cursor-pointer select-text ${
                    isActive
                      ? `${themeConfig.activeCueBg} ${themeConfig.activeCueBorder} ${themeConfig.activeCueText} scale-[1.01]`
                      : isPast
                      ? `opacity-75 ${themeConfig.cardBorder} ${themeConfig.textMuted} hover:opacity-100`
                      : `${themeConfig.cardBorder} ${themeConfig.text} hover:opacity-100`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 select-none">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-lg ${
                        isActive 
                          ? `${themeConfig.activeCueBadge} font-bold shadow-sm` 
                          : `${themeConfig.inputBg} ${themeConfig.textMuted} border ${themeConfig.cardBorder}`
                      }`}>
                        {formatTime(cue.start)}
                      </span>

                      {isActive && (
                        <span className="text-[11px] font-semibold flex items-center gap-1 animate-pulse">
                          <Volume2 className="w-3.5 h-3.5" />
                          Reading Now
                        </span>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddBookmarkAtCue(cue);
                        }}
                        className="text-xs text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1"
                        title="Bookmark this line"
                      >
                        <Bookmark className="w-3 h-3" />
                        <span>Bookmark</span>
                      </button>
                    </div>
                  </div>

                  <p className={`font-normal transition-colors ${fontSizeClasses[settings.fontSize]} ${
                    isActive ? 'font-medium' : ''
                  }`}>
                    {cue.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
