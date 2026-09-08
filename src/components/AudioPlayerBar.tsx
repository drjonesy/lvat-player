import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Bookmark, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MediaItem, PlaybackMode, SubtitleCue, ThemeMode } from '../types';
import { formatTime } from '../utils/srtParser';
import { getThemeConfig } from '../utils/theme';
import { PlayerModeToggle } from './PlayerModeToggle';

interface AudioPlayerBarProps {
  activeMedia: MediaItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isLooping: boolean;
  activeCue: SubtitleCue | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleLoop: () => void;
  onAddBookmark: () => void;
  onJumpForward: () => void;
  onJumpBackward: () => void;
  themeMode: ThemeMode;
  onModeChange?: (mode: PlaybackMode) => void;
  /** False when the active group has no video track to switch to. */
  canUseVideo?: boolean;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  activeMedia,
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  isLooping,
  activeCue,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onToggleLoop,
  onAddBookmark,
  onJumpForward,
  onJumpBackward,
  themeMode = 'light',
  onModeChange,
  canUseVideo = true,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const themeConfig = getThemeConfig(themeMode as ThemeMode);

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume || 0.8);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // MINIMIZED STATE (Slim strip locked to bottom)
  if (isMinimized) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-40 ${themeConfig.accentBg} text-white border-t border-white/20 px-3 py-2 shadow-2xl transition-all`}>
        {/* Progress line along top edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/20">
          <div className="h-full bg-white transition-all" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Media info */}
          <div 
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-white/50'} shrink-0`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate group-hover:opacity-80 transition-opacity">
                {activeMedia?.title || 'Audio Reader'}
              </p>
              {activeMedia?.author && (
                <p className="text-[10px] text-white/80 truncate leading-tight">
                  {activeMedia.author}
                </p>
              )}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onTogglePlay}
              className={`w-8 h-8 rounded-full bg-white ${themeConfig.accentIcon} hover:bg-slate-100 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            {/* Expand Chevron Up */}
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-medium shadow-sm border border-white/20"
              title="Expand audio player"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="hidden sm:inline">Expand</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // NORMAL STATE (Full audio player bar fixed at bottom)
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 ${themeConfig.accentBg} text-white border-t border-white/20 shadow-[0_-8px_24px_rgba(0,0,0,0.25)] px-3 sm:px-4 py-2.5 sm:py-3 transition-colors`}>
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        
        {/* Top Header Row: Active Title & Minimize Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-white/50'} shrink-0`} />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold truncate text-white">
                {activeMedia?.title || 'Audio Reader'}
              </h4>
              {activeMedia?.author && (
                <p className="text-[11px] truncate text-white/80 font-medium">
                  {activeMedia.author}
                </p>
              )}
            </div>
          </div>

          {/* Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-1 shrink-0 text-xs font-medium shadow-sm border border-white/20"
            title="Minimize audio player"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="hidden sm:inline">Minimize</span>
          </button>
        </div>

        {/* Seek Bar with Time Labels */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-white/90 font-semibold w-10 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          
          <div className="relative flex-1 group py-1 cursor-pointer min-w-0">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              style={{ accentColor: '#ffffff' }}
              className="w-full h-1.5 bg-black/20 rounded-full appearance-none cursor-pointer group-hover:h-2 transition-all"
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 group-hover:h-2 bg-white shadow-sm rounded-full pointer-events-none transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-white/90 font-semibold w-10 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Bottom Control Buttons Row */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          
          {/* Main Playback Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onJumpBackward}
              className="p-2 rounded-xl bg-white text-slate-800 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
              title="Jump 10 seconds backward"
            >
              <RotateCcw className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white ${themeConfig.accentIcon} hover:bg-slate-100 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={onJumpForward}
              className="p-2 rounded-xl bg-white text-slate-800 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
              title="Jump 10 seconds forward"
            >
              <RotateCw className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={onToggleLoop}
              className={`p-2 rounded-xl transition-all active:scale-95 ${
                isLooping 
                  ? 'bg-slate-900 text-white ring-2 ring-white/60 shadow-inner' 
                  : 'bg-white text-slate-800 hover:bg-slate-100 shadow-sm'
              }`}
              title={isLooping ? "Looping enabled" : "Enable loop"}
            >
              <Repeat className="w-4 h-4" />
            </button>

            <button
              onClick={onAddBookmark}
              className="p-2 rounded-xl bg-white text-slate-800 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
              title="Bookmark current timestamp"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {onModeChange && (
              <PlayerModeToggle
                mode="audiobook"
                onModeChange={onModeChange}
                canUseVideo={canUseVideo}
              />
            )}
          </div>

          {/* Right Side Tools: Speed & Vertical Volume Slider */}
          <div className="flex items-center gap-2">
            
            {/* Playback Speed Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white text-slate-800 hover:bg-slate-100 shadow-sm transition-all"
                title="Playback speed"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className={`absolute bottom-full right-0 mb-2 ${themeConfig.cardBg} border ${themeConfig.cardBorder} rounded-xl shadow-xl p-1.5 z-50 flex flex-col gap-1 w-20`}>
                  {speedOptions.map(rate => (
                    <button
                      key={rate}
                      onClick={() => {
                        onPlaybackRateChange(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`text-xs py-1 px-2 rounded-lg text-left font-mono ${
                        playbackRate === rate 
                          ? `${themeConfig.accentBg} text-white font-bold` 
                          : `${themeConfig.playerText} hover:bg-black/5 dark:hover:bg-white/10`
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* VERTICAL VOLUME SLIDER POPOVER */}
            <div className="relative">
              <button
                onClick={() => setShowVolumePopover(!showVolumePopover)}
                className="p-2 rounded-xl bg-white text-slate-800 hover:bg-slate-100 shadow-sm transition-all flex items-center gap-1"
                title={isMuted ? "Unmute / Adjust volume" : "Adjust volume"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {showVolumePopover && (
                <div 
                  className={`absolute bottom-full right-0 mb-2 ${themeConfig.cardBg} border ${themeConfig.cardBorder} rounded-2xl shadow-2xl p-3 z-50 flex flex-col items-center gap-2.5 w-12 animate-in fade-in zoom-in-95 duration-150`}
                >
                  <span className={`text-[10px] font-mono font-bold ${themeConfig.textMuted}`}>
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                  
                  {/* Vertical Slider Track */}
                  <div className="h-28 flex items-center justify-center relative py-1">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setIsMuted(false);
                        onVolumeChange(parseFloat(e.target.value));
                      }}
                      style={{ accentColor: themeConfig.previewAccent, WebkitAppearance: 'slider-vertical' }}
                      className="h-24 w-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 [writing-mode:vertical-lr] [direction:rtl]"
                    />
                  </div>

                  <button
                    onClick={handleMuteToggle}
                    className={`p-1 rounded-lg ${isMuted ? 'text-rose-500 bg-rose-500/10' : `${themeConfig.accentIcon} ${themeConfig.accentHoverBg}`}`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
