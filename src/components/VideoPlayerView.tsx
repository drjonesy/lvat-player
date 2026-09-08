import React, { useRef, useState, useEffect } from 'react';
import { 
  Subtitles, 
  Search, 
  Maximize, 
  PictureInPicture, 
  Sparkles,
  ListFilter,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Repeat,
  Bookmark,
  Volume2,
  VolumeX,
  FileText,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MediaItem, SubtitleCue, ThemeMode } from '../types';
import { formatTime } from '../utils/srtParser';
import { getThemeConfig } from '../utils/theme';
import { MediaSelector } from './MediaSelector';

interface VideoPlayerViewProps {
  activeMedia: MediaItem | null;
  mediaList?: MediaItem[];
  onSelectMedia?: (media: MediaItem) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
  activeCue: SubtitleCue | null;
  onCueClick: (cue: SubtitleCue) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  onAddBookmark: () => void;
  onJumpForward: () => void;
  onJumpBackward: () => void;
  themeMode?: ThemeMode;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  activeMedia,
  mediaList = [],
  onSelectMedia,
  videoRef,
  currentTime,
  duration,
  activeCue,
  onCueClick,
  isPlaying,
  onTogglePlay,
  onSeek,
  volume,
  onVolumeChange,
  playbackRate,
  onPlaybackRateChange,
  isLooping,
  onToggleLoop,
  onAddBookmark,
  onJumpForward,
  onJumpBackward,
  themeMode = 'light',
}) => {
  const [showSubtitlesOnVideo, setShowSubtitlesOnVideo] = useState(true);
  const [isControlsExpandedOnMobile, setIsControlsExpandedOnMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const activeCueRef = useRef<HTMLDivElement | null>(null);

  const themeConfig = getThemeConfig(themeMode as ThemeMode);

  // Auto-scroll transcript sidebar to keep active cue centered
  useEffect(() => {
    if (activeCueRef.current) {
      activeCueRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeCue?.id]);

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

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handlePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.error("PiP error:", err);
      }
    }
  };

  const filteredCues = activeMedia?.subtitles.filter(c =>
    c.text.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="w-full px-0 sm:px-4 py-2 sm:py-4 pb-36 md:pb-28 max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 sm:gap-6 items-start overflow-x-hidden">
      
      {/* Video Player Screen, Title Box & Controls (Left Panel) */}
      <div className="flex-1 w-full flex flex-col gap-3 sm:gap-4 min-w-0">
        
        {/* Top Control Bar: Playlist Selector (mode & theme live in the header menu) */}
        {onSelectMedia && mediaList.length > 0 && (
          <div className="px-3 sm:px-0 flex flex-wrap items-center justify-between w-full gap-2.5">
            <div className="ml-auto hidden sm:flex items-center gap-2.5">
              <MediaSelector
                activeMedia={activeMedia}
                mediaList={mediaList}
                onSelectMedia={onSelectMedia}
                themeMode={themeMode}
              />
            </div>
          </div>
        )}

        {/* Widescreen 16:9 Video Canvas & Title Card */}
        <div className={`${themeConfig.cardBg} w-full rounded-none sm:rounded-2xl overflow-hidden border-y sm:border ${themeConfig.cardBorder} flex flex-col shadow-xl transition-colors`}>
          
          {/* 16:9 Video Canvas */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
            <video
              ref={videoRef}
              src={activeMedia?.src}
              className="w-full h-full object-contain cursor-pointer"
              onClick={onTogglePlay}
              playsInline
            />

            {/* Subtitle CC Overlay on Video */}
            {showSubtitlesOnVideo && activeCue && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 sm:px-5 sm:py-2 bg-black/85 backdrop-blur-md rounded-xl text-white text-xs sm:text-sm md:text-base font-medium text-center max-w-[90%] shadow-xl border border-white/10 transition-all pointer-events-none leading-relaxed break-words">
                {activeCue.text}
              </div>
            )}

            {/* Video Control Bar Overlays (Top Right) */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
              {/* Toggle On-Video Subtitles */}
              <button
                onClick={() => setShowSubtitlesOnVideo(!showSubtitlesOnVideo)}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  showSubtitlesOnVideo 
                    ? `${themeConfig.accentBg} text-white shadow-md` 
                    : 'text-slate-300 hover:bg-white/10'
                }`}
                title="Toggle Subtitle CC Overlay on Video"
              >
                <Subtitles className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">CC</span>
              </button>

              {/* Picture-in-Picture */}
              <button
                onClick={handlePiP}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Picture in Picture"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Title Banner */}
          <div className={`${themeConfig.cardBg} border-t ${themeConfig.cardBorder} p-3 sm:p-4 flex items-center justify-end sm:justify-between gap-2.5 transition-colors min-w-0`}>
            <div className="hidden sm:block min-w-0 flex-1">
              <h2 className={`font-bold text-sm sm:text-base md:text-lg leading-snug ${themeConfig.text} break-words line-clamp-2`}>
                {activeMedia?.title || 'Video Player'}
              </h2>
              <p className={`text-[11px] sm:text-xs ${themeConfig.textMuted} truncate mt-0.5`}>
                {activeMedia?.author ? `${activeMedia.author} • ` : ''}{activeMedia?.subtitles.length || 0} transcript cues parsed
              </p>
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl shrink-0 ${
                sidebarOpen 
                  ? `${themeConfig.inputBg} ${themeConfig.text} border ${themeConfig.cardBorder} hover:opacity-80` 
                  : `${themeConfig.accentBg} text-white shadow-md hover:opacity-90`
              } transition-all`}
              title={sidebarOpen ? "Hide script transcript" : "Show script transcript"}
            >
              <FileText className="w-4 h-4" />
              <span>{sidebarOpen ? 'Hide Script' : 'Show Script'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video Controls Bar (Fixed to bottom, locked like Audio + Text mode) */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 ${themeConfig.accentBg} text-white border-t border-white/20 shadow-[0_-8px_24px_rgba(0,0,0,0.25)] px-3 sm:px-4 py-2.5 sm:py-3 transition-colors`}>
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          
          {/* Media Title Display */}
          {activeMedia && (
            <div className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/20 text-xs">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-white/50'} shrink-0 mt-0.5`} />
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] sm:text-xs font-bold leading-tight truncate text-white">
                    {activeMedia.title}
                  </h4>
                  {activeMedia.author && (
                    <p className="text-[10px] sm:text-[11px] leading-tight truncate text-white/80 font-medium">
                      {activeMedia.author}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress / Seek Bar */}
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

          {/* Buttons Row (Light controls inside accent container) */}
          <div className="flex items-center justify-between gap-1 sm:gap-3">
            
            {/* Playback Controls (Play, Jump, Loop, Bookmark) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button
                onClick={onJumpBackward}
                className="p-2 rounded-xl bg-white text-slate-800 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
                title="Jump 10 seconds backward"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={onTogglePlay}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white ${themeConfig.accentIcon} flex items-center justify-center shadow-md hover:bg-slate-100 hover:scale-105 transition-all active:scale-95 shrink-0`}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={onJumpForward}
                className="p-2 rounded-xl bg-white text-slate-800 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
                title="Jump 10 seconds forward"
              >
                <RotateCw className="w-4 h-4" />
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
            </div>

            {/* Speed & Volume (Right side of control row) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-white text-slate-800 hover:bg-slate-100 shadow-sm transition-all"
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
                            : `${themeConfig.text} hover:bg-black/5 dark:hover:bg-white/10`
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Volume Control with Vertical Popover */}
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
                  <div className={`absolute bottom-full right-0 mb-2 ${themeConfig.cardBg} border ${themeConfig.cardBorder} rounded-2xl shadow-2xl p-3 z-50 flex flex-col items-center gap-2.5 w-12 animate-in fade-in zoom-in-95 duration-150`}>
                    <span className={`text-[10px] font-mono font-bold ${themeConfig.textMuted}`}>
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                    
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

      {/* Synchronized Transcript Sidebar (Right Panel - Matches Theme Color) */}
      {sidebarOpen && (
        <div className={`w-full lg:w-96 ${themeConfig.cardBg} border ${themeConfig.cardBorder} rounded-2xl flex flex-col overflow-hidden shadow-xl transition-colors`}>
          
          {/* Sidebar Header & Search */}
          <div className={`p-4 border-b ${themeConfig.cardBorder} ${themeConfig.headerBg} flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold text-sm ${themeConfig.text} flex items-center gap-2`}>
                <Sparkles className="w-4 h-4 text-blue-500" />
                Synchronized Transcript
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${themeConfig.textMuted} font-mono font-semibold`}>
                  {filteredCues.length} cues
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`p-1 rounded-lg ${themeConfig.textMuted} hover:${themeConfig.text} hover:${themeConfig.inputBg} transition-colors`}
                  title="Hide script transcript"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Transcript */}
            <div className="relative">
              <Search className={`w-4 h-4 ${themeConfig.textMuted} absolute left-3 top-1/2 -translate-y-1/2`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className={`w-full ${themeConfig.inputBg} border ${themeConfig.inputBorder} ${themeConfig.inputText} rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none`}
              />
            </div>
          </div>

          {/* Transcript Cues List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[55vh] lg:max-h-[60vh]">
            {filteredCues.length === 0 ? (
              <div className={`text-center py-8 text-xs ${themeConfig.textMuted}`}>
                {!activeMedia
                  ? 'No media loaded yet. Use the Files button to add your MP4, MP3 and SRT files.'
                  : 'No matching transcript lines found.'}
              </div>
            ) : (
              filteredCues.map((cue) => {
                const isActive = activeCue?.id === cue.id;
                return (
                  <div
                    key={cue.id}
                    ref={isActive ? activeCueRef : null}
                    onClick={() => onCueClick(cue)}
                    className={`p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer group ${
                      isActive
                        ? `${themeConfig.activeCueBg} ${themeConfig.activeCueBorder} ${themeConfig.activeCueText} scale-[1.01]`
                        : `${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.text} opacity-90 hover:opacity-100`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span className={`font-mono ${isActive ? 'font-bold' : themeConfig.textMuted}`}>
                        {formatTime(cue.start)}
                      </span>
                      {isActive && (
                        <span
                          className={`${themeConfig.activeCueBadge} w-2 h-2 rounded-full shadow-sm`}
                          title="Playing now"
                          aria-label="Playing now"
                        />
                      )}
                    </div>
                    <p className="transition-colors">{cue.text}</p>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
};


