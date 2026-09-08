import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  PlaybackMode,
  MediaItem,
  MediaGroup,
  PrimarySource,
  SubtitleCue,
  ReaderSettings,
  Bookmark,
  ThemeMode
} from './types';
import {
  releaseGroup,
  resolveGroup,
  setPrimary as setGroupPrimary,
} from './utils/mediaGroups';
import { getThemeConfig } from './utils/theme';
import { loadActiveThemeMode, saveActiveThemeMode } from './utils/customThemes';
import { CustomThemeProvider } from './context/CustomThemeContext';
import { Header } from './components/Header';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { VideoPlayerView } from './components/VideoPlayerView';
import { AudioBookReaderView } from './components/AudioBookReaderView';
import { FileFolderModal } from './components/FileFolderModal';
import { BookmarkModal } from './components/BookmarkModal';
import { ReaderSettingsModal } from './components/ReaderSettingsModal';

export default function App() {
  // Mode state: 'video' or 'audiobook' - default to 'audiobook' (Audio + Text) on mobile screens
  const [mode, setMode] = useState<PlaybackMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'audiobook';
    }
    return 'video';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMode('audiobook');
    }
  }, []);

  // Library & active group - starts empty; the user loads their own files.
  // A group bundles one title's video / audio / subtitle files. Sources are
  // alternatives: exactly one track feeds the media element at a time.
  const [groups, setGroups] = useState<MediaGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>('');

  // Core Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Reader Settings - Default to LIGHT mode, or the theme chosen on a previous visit
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => ({
    themeMode: loadActiveThemeMode() || 'light',
    fontSize: 'lg',
    fontFamily: 'sans',
    autoScroll: true,
    highlightStyle: 'soft',
    lineSpacing: 'comfortable',
    showTimestamps: true,
    searchQuery: '',
  }));

  const activeThemeConfig = getThemeConfig(readerSettings.themeMode || 'light');

  const handleSelectTheme = useCallback((theme: ThemeMode) => {
    setReaderSettings(prev => ({ ...prev, themeMode: theme }));
  }, []);

  // Persist here rather than in the handler so every path that changes the
  // theme (drawer, settings modal, studio) is remembered.
  useEffect(() => {
    saveActiveThemeMode(readerSettings.themeMode || 'light');
  }, [readerSettings.themeMode]);

  // Master Video/Audio Element Reference
  const mediaRef = useRef<HTMLVideoElement | null>(null);

  /**
   * Position to restore after the media element is remounted or re-sourced —
   * switching primary source, picking another track, or flipping view mode all
   * swap the element out from under us. Mirrors `currentTime`, and is reset to
   * 0 only when a genuinely different group is selected.
   */
  const resumeTimeRef = useRef<number>(0);

  const activeGroup = useMemo(
    () => groups.find(g => g.id === activeGroupId) || groups[0] || null,
    [groups, activeGroupId],
  );

  /** Flattened view of the active group, in the shape every player consumes. */
  const activeMedia = useMemo(
    () => (activeGroup ? resolveGroup(activeGroup) : null),
    [activeGroup],
  );

  /** Playlist dropdowns still work off a flat list — derive it. */
  const mediaList = useMemo(() => groups.map(resolveGroup), [groups]);

  // Compute active subtitle cue based on currentTime
  const activeCue = useMemo(() => {
    if (!activeMedia || !activeMedia.subtitles) return null;
    return activeMedia.subtitles.find(
      c => currentTime >= c.start && currentTime <= c.end
    ) || null;
  }, [activeMedia, currentTime]);

  /** Select a group. A different title always starts from the beginning. */
  const handleSelectGroup = (group: MediaGroup) => {
    if (group.id !== activeGroupId) {
      resumeTimeRef.current = 0;
      setCurrentTime(0);
    }
    setActiveGroupId(group.id);
    setIsPlaying(false);
    // The video view has nothing to render for an audio-primary group.
    if (group.primary === 'audio') setMode('audiobook');
  };

  /** Bridges the existing playlist dropdowns, which hand back a `MediaItem`. */
  const handleSelectMedia = (item: MediaItem) => {
    const group = groups.find(g => g.id === item.id);
    if (group) handleSelectGroup(group);
  };

  const handleAddGroups = (incoming: MediaGroup[]) => {
    setGroups(prev => [...incoming, ...prev]);
    if (!activeGroupId && incoming.length > 0) {
      setActiveGroupId(incoming[0].id);
    }
  };

  /**
   * Replace a group in place — used for every structural edit (primary
   * switch, track selection, track removal, appended files).
   */
  const handleUpdateGroup = (next: MediaGroup) => {
    setGroups(prev => prev.map(g => (g.id === next.id ? next : g)));
  };

  const handleDeleteGroup = (id: string) => {
    const doomed = groups.find(g => g.id === id);
    if (doomed) releaseGroup(doomed);

    const remaining = groups.filter(g => g.id !== id);
    setGroups(remaining);
    if (activeGroupId === id) {
      resumeTimeRef.current = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      setActiveGroupId(remaining[0]?.id || '');
    }
  };

  /**
   * Flip the active group between its video and audio source. The position is
   * carried across by `resumeTimeRef`, and the view follows the source so you
   * never end up staring at a video surface playing an audio file.
   */
  const handleSetPrimary = (primary: PrimarySource) => {
    if (!activeGroup || activeGroup.primary === primary) return;
    handleUpdateGroup(setGroupPrimary(activeGroup, primary));
    setMode(primary === 'video' ? 'video' : 'audiobook');
  };

  /**
   * The view toggle and the source are linked in one direction only: entering
   * video view requires a video source, but the reader view happily renders a
   * transcript alongside either.
   */
  const handleModeChange = (next: PlaybackMode) => {
    if (next === 'video' && activeGroup?.primary === 'audio') {
      if (activeGroup.videoTracks.length === 0) return; // nothing to show
      handleUpdateGroup(setGroupPrimary(activeGroup, 'video'));
    }
    setMode(next);
  };

  const activeSrc = activeMedia?.src || '';

  // Sync HTML5 media element events. `activeSrc` and `mode` are dependencies
  // because both swap the underlying element - without them the listeners stay
  // bound to a detached node and playback appears frozen.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    const handleTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      resumeTimeRef.current = el.currentTime;
    };

    const handleLoadedMetadata = () => {
      setDuration(el.duration || 0);
    };

    const handleEnded = () => {
      if (isLooping) {
        el.currentTime = 0;
        el.play();
      } else {
        setIsPlaying(false);
      }
    };

    el.addEventListener('timeupdate', handleTimeUpdate);
    el.addEventListener('loadedmetadata', handleLoadedMetadata);
    el.addEventListener('ended', handleEnded);

    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate);
      el.removeEventListener('loadedmetadata', handleLoadedMetadata);
      el.removeEventListener('ended', handleEnded);
    };
  }, [isLooping, activeSrc, mode]);

  // Restore the playback position onto whatever element is now mounted. The
  // target is captured up front, before the fresh element can fire a
  // `timeupdate` at 0 and overwrite the ref.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !activeSrc) return;

    const target = resumeTimeRef.current;
    if (target <= 0) return;

    const restore = () => {
      el.currentTime = el.duration ? Math.min(target, el.duration) : target;
      setCurrentTime(el.currentTime);
    };

    if (el.readyState >= 1) {
      restore();
      return;
    }
    el.addEventListener('loadedmetadata', restore, { once: true });
    return () => el.removeEventListener('loadedmetadata', restore);
  }, [activeSrc, mode]);

  // Volume and speed live in React state but belong to the element, so they
  // have to be re-applied every time a new element takes over.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    el.volume = volume;
    el.playbackRate = playbackRate;
  }, [activeSrc, mode, volume, playbackRate]);

  // Play / Pause Toggle
  const handleTogglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Playback error:", err);
      });
    }
  };

  // Seek
  const handleSeek = (time: number) => {
    resumeTimeRef.current = time;
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Jump 10s
  const handleJumpForward = () => {
    handleSeek(Math.min(duration, currentTime + 10));
  };

  const handleJumpBackward = () => {
    handleSeek(Math.max(0, currentTime - 10));
  };

  // Click on cue to jump directly
  const handleCueClick = (cue: SubtitleCue) => {
    handleSeek(cue.start);
    if (!isPlaying && mediaRef.current) {
      mediaRef.current.play().then(() => setIsPlaying(true));
    }
  };

  // Update volume & speed
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (mediaRef.current) {
      mediaRef.current.volume = vol;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = rate;
    }
  };

  // Bookmarking
  const handleAddBookmark = (cue?: SubtitleCue) => {
    const textToBookmark = cue ? cue.text : activeCue ? activeCue.text : 'Bookmark at position';
    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      mediaId: activeGroupId,
      timestamp: cue ? cue.start : currentTime,
      cueText: textToBookmark,
      note: '',
      createdAt: Date.now(),
    };
    setBookmarks(prev => [newBookmark, ...prev]);
  };

  // Keyboard shortcut listener (Spacebar for play/pause, Left/Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleJumpBackward();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleJumpForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration]);

  return (
    <CustomThemeProvider
      activeThemeMode={readerSettings.themeMode || 'light'}
      onSelectTheme={handleSelectTheme}
    >
      <div className={`min-h-screen ${activeThemeConfig.bg} transition-colors flex flex-col font-sans`}>
      
      {/* App Header */}
      <Header
        mode={mode}
        setMode={handleModeChange}
        activeGroup={activeGroup}
        onSetPrimary={handleSetPrimary}
        activeMedia={activeMedia}
        mediaList={mediaList}
        onSelectMedia={handleSelectMedia}
        onOpenUploadModal={() => setShowUploadModal(true)}
        onOpenBookmarksModal={() => setShowBookmarksModal(true)}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        bookmarkCount={bookmarks.length}
        themeMode={readerSettings.themeMode || 'light'}
        onSelectTheme={handleSelectTheme}
        readerSettings={readerSettings}
        onUpdateSettings={(newSet) => setReaderSettings(prev => ({ ...prev, ...newSet }))}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {mode === 'video' ? (
          <VideoPlayerView
            activeMedia={activeMedia}
            mediaList={mediaList}
            onSelectMedia={handleSelectMedia}
            videoRef={mediaRef}
            currentTime={currentTime}
            duration={duration}
            activeCue={activeCue}
            onCueClick={handleCueClick}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
            isLooping={isLooping}
            onToggleLoop={() => setIsLooping(!isLooping)}
            onAddBookmark={() => handleAddBookmark()}
            onJumpForward={handleJumpForward}
            onJumpBackward={handleJumpBackward}
            themeMode={readerSettings.themeMode || 'light'}
            onSelectTheme={handleSelectTheme}
            mode={mode}
            onModeChange={handleModeChange}
          />
        ) : (
          <AudioBookReaderView
            activeMedia={activeMedia}
            mediaList={mediaList}
            onSelectMedia={handleSelectMedia}
            currentTime={currentTime}
            duration={duration}
            activeCue={activeCue}
            onCueClick={handleCueClick}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            settings={readerSettings}
            onUpdateSettings={(newSet) => setReaderSettings(prev => ({ ...prev, ...newSet }))}
            onAddBookmarkAtCue={handleAddBookmark}
            mode={mode}
            onModeChange={handleModeChange}
            onSelectTheme={handleSelectTheme}
          />
        )}
      </main>

      {/* Persistent Media Element for Audio Read Mode */}
      {mode === 'audiobook' && (
        <video
          ref={mediaRef}
          src={activeMedia?.src}
          className="hidden"
          playsInline
        />
      )}

      {/* Audio & Media Control Bar (Fixed Bottom for Audiobook Mode) */}
      {mode === 'audiobook' && (
        <AudioPlayerBar
          activeMedia={activeMedia}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          playbackRate={playbackRate}
          isLooping={isLooping}
          activeCue={activeCue}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onPlaybackRateChange={handlePlaybackRateChange}
          onToggleLoop={() => setIsLooping(!isLooping)}
          onAddBookmark={() => handleAddBookmark()}
          onJumpForward={handleJumpForward}
          onJumpBackward={handleJumpBackward}
          themeMode={readerSettings.themeMode || 'light'}
        />
      )}

      {/* Modals */}
      <FileFolderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        groups={groups}
        activeGroupId={activeGroupId}
        onAddGroups={handleAddGroups}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onSelectGroup={handleSelectGroup}
        themeMode={readerSettings.themeMode || 'light'}
      />

      <BookmarkModal
        isOpen={showBookmarksModal}
        onClose={() => setShowBookmarksModal(false)}
        bookmarks={bookmarks}
        onSeekToBookmark={(bm) => handleSeek(bm.timestamp)}
        onDeleteBookmark={(id) => setBookmarks(prev => prev.filter(b => b.id !== id))}
      />

      <ReaderSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={readerSettings}
        onUpdateSettings={(newSet) => setReaderSettings(prev => ({ ...prev, ...newSet }))}
      />

      </div>
    </CustomThemeProvider>
  );
}
