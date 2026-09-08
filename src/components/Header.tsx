import React, { useState } from 'react';
import {
  Video,
  BookOpen,
  FolderPlus,
  Settings,
  Menu
} from 'lucide-react';
import { PlaybackMode, MediaItem, MediaGroup, PrimarySource, ThemeMode, ReaderSettings } from '../types';
import { getThemeConfig } from '../utils/theme';
import { MobileDrawer } from './MobileDrawer';
import { SourceSwitcher } from './SourceSwitcher';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

          {/* Action Controls */}
          <div className="flex items-center gap-2">

            {/* Video <-> Audio source switch (only when the group has both) */}
            <div className="hidden sm:block">
              <SourceSwitcher
                group={activeGroup}
                onSetPrimary={onSetPrimary}
                themeMode={themeMode}
              />
            </div>

            {/* Load Files/Folder Button */}
            <button
              onClick={onOpenUploadModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold ${themeConfig.accentBg} text-white hover:opacity-90 transition-all shadow-sm`}
              title="Load media files or entire folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Files</span>
            </button>

            {/* Reader Settings */}
            {mode === 'audiobook' && (
              <button
                onClick={onOpenSettingsModal}
                className={`p-2 rounded-lg ${themeConfig.headerMuted} hover:${themeConfig.headerText} transition-colors hidden sm:block`}
                title="Reader Settings (Font, Auto-scroll, Theme Colors)"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Hamburger Slide-out Menu Trigger (Mobile View) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-2 rounded-xl ${themeConfig.cardBg} border ${themeConfig.cardBorder} ${themeConfig.headerText} hover:opacity-80 transition-all shadow-sm md:hidden flex items-center gap-1.5`}
              title="Open Navigation & Settings Menu"
            >
              <Menu className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-bold text-blue-500">Menu</span>
            </button>

          </div>
        </div>
      </header>

      {/* Slide-Out Drawer for Mobile Navigation, Modes & Color Themes */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
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
