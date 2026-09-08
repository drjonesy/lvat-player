import React, { useState } from 'react';
import {
  Video,
  BookOpen,
  Menu
} from 'lucide-react';
import { PlaybackMode, MediaItem, MediaGroup, PrimarySource, ThemeMode, ReaderSettings } from '../types';
import { getThemeConfig } from '../utils/theme';
import { MobileDrawer } from './MobileDrawer';

interface HeaderProps {
  mode: PlaybackMode;
  setMode: (mode: PlaybackMode) => void;
  activeMedia: MediaItem | null;
  /** The active group itself - needed for the video/audio source switch. */
  activeGroup: MediaGroup | null;
  onSetPrimary: (primary: PrimarySource) => void;
  mediaList: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  onOpenUploadModal: () => void;
  onOpenBookmarksModal: () => void;
  onOpenSettingsModal: () => void;
  bookmarkCount: number;
  themeMode: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  readerSettings?: ReaderSettings;
  onUpdateSettings?: (newSettings: Partial<ReaderSettings>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  activeMedia,
  activeGroup,
  onSetPrimary,
  mediaList,
  onSelectMedia,
  onOpenUploadModal,
  onOpenBookmarksModal,
  onOpenSettingsModal,
  bookmarkCount,
  themeMode,
  onSelectTheme,
  readerSettings,
  onUpdateSettings,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const themeConfig = getThemeConfig(themeMode);

  return (
    <>
      <header className={`${themeConfig.headerBg} border-b ${themeConfig.headerBorder} ${themeConfig.headerText} sticky top-0 z-30 shadow-md transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Brand & App Title */}
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${themeConfig.accentBg} flex items-center justify-center text-white shadow-md`}>
              {mode === 'video' ? <Video className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className={`font-bold text-base sm:text-lg tracking-tight ${themeConfig.headerText}`}>
                LVAT Player
              </h1>
              <span className={`text-[10px] sm:text-[11px] font-medium tracking-wide opacity-60 ${themeConfig.headerText}`}>
                Local Video + Audio + Text
              </span>
            </div>
          </div>

          {/* Action Controls — every control lives in the slide-out menu at all sizes */}
          <div className="flex items-center gap-2">

            {/* Hamburger Slide-out Menu Trigger */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`p-2 rounded-xl ${themeConfig.cardBg} border ${themeConfig.cardBorder} ${themeConfig.headerText} hover:opacity-80 transition-all shadow-sm flex items-center gap-1.5`}
              title="Open Navigation & Settings Menu"
            >
              <Menu className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-bold text-blue-500">Menu</span>
            </button>

          </div>
        </div>
      </header>

      {/* Slide-Out Drawer holding all navigation, modes, themes & actions */}
      <MobileDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        mode={mode}
        setMode={setMode}
        themeMode={themeMode}
        onSelectTheme={onSelectTheme}
        activeMedia={activeMedia}
        activeGroup={activeGroup}
        onSetPrimary={onSetPrimary}
        mediaList={mediaList}
        onSelectMedia={onSelectMedia}
        onOpenUploadModal={onOpenUploadModal}
        onOpenBookmarksModal={onOpenBookmarksModal}
        onOpenSettingsModal={onOpenSettingsModal}
        bookmarkCount={bookmarkCount}
        readerSettings={readerSettings}
        onUpdateSettings={onUpdateSettings}
      />
    </>
  );
};
