import React, { useState } from 'react';
import {
  X,
  ChevronDown,
  Video, 
  BookOpen, 
  FolderPlus, 
  Bookmark as BookmarkIcon, 
  Settings,
  Sun,
  Moon, 
  Book, 
  Eye, 
  Leaf, 
  Check, 
  ListVideo,
  Palette,
  Film,
  Headphones,
  Type,
  Plus,
  Pencil
} from 'lucide-react';
import { PlaybackMode, MediaItem, MediaGroup, PrimarySource, ThemeMode, BuiltInThemeMode, ReaderSettings } from '../types';
import { getThemeConfig, getThemeName, classNameThemeMap } from '../utils/theme';
import { getThemeIcon } from './ThemeSelector';
import { useCustomThemes } from '../context/CustomThemeContext';
import { SourceSwitcher } from './SourceSwitcher';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: PlaybackMode;
  setMode: (mode: PlaybackMode) => void;
  themeMode: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  activeMedia: MediaItem | null;
  activeGroup: MediaGroup | null;
  onSetPrimary: (primary: PrimarySource) => void;
  mediaList: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  onOpenUploadModal: () => void;
  onOpenBookmarksModal: () => void;
  onOpenSettingsModal: () => void;
  bookmarkCount: number;
  readerSettings?: ReaderSettings;
  onUpdateSettings?: (newSettings: Partial<ReaderSettings>) => void;
}

export const themeIcons: Record<BuiltInThemeMode, React.ReactNode> = {
  light: <Sun className="w-4 h-4 text-amber-500" />,
  sepia: <Book className="w-4 h-4 text-amber-700" />,
  dark: <Moon className="w-4 h-4 text-blue-400" />,
  slate: <Eye className="w-4 h-4 text-indigo-400" />,
  mint: <Leaf className="w-4 h-4 text-emerald-600" />,
};

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  setMode,
  themeMode,
  onSelectTheme,
  activeMedia,
  activeGroup,
  onSetPrimary,
  mediaList,
  onSelectMedia,
  onOpenUploadModal,
  onOpenBookmarksModal,
  onOpenSettingsModal,
  bookmarkCount,
  readerSettings,
  onUpdateSettings,
}) => {
  const { customThemes, openThemeStudio } = useCustomThemes();
  const [isThemeListOpen, setIsThemeListOpen] = useState(false);

  if (!isOpen) return null;

  const themeConfig = getThemeConfig(themeMode);

  const themeEntries: {
    id: ThemeMode;
    name: string;
    previewBg: string;
    accentBg: string;
    isCustom: boolean;
  }[] = [
    ...(Object.keys(classNameThemeMap) as BuiltInThemeMode[]).map((id) => ({
      id: id as ThemeMode,
      name: classNameThemeMap[id].name,
      previewBg: classNameThemeMap[id].previewBg,
      accentBg: classNameThemeMap[id].accentBg,
      isCustom: false,
    })),
    ...customThemes.map((t) => ({
      id: t.id as ThemeMode,
      name: t.name,
      previewBg: t.palette.bg,
      accentBg: getThemeConfig(t.id).accentBg,
      isCustom: true,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className={`relative w-full max-w-xs sm:max-w-sm h-full ${themeConfig.cardBg} border-l ${themeConfig.cardBorder} shadow-2xl flex flex-col z-10 transition-transform duration-300 overflow-y-auto`}>
        
        {/* Drawer Header */}
        <div className={`p-4 border-b ${themeConfig.cardBorder} flex items-center justify-between sticky top-0 ${themeConfig.cardBg} z-20`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${themeConfig.accentBg} text-white flex items-center justify-center font-bold text-sm shadow`}>
              {mode === 'video' ? <Video className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            </div>
            <div>
              <h2 className={`font-bold text-sm ${themeConfig.text}`}>Lumina Menu</h2>
              <p className={`text-[11px] ${themeConfig.textMuted}`}>Modes, Colors & Playlist</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl ${themeConfig.textMuted} hover:${themeConfig.text} hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content Body — `divide-y` rules only between sections that actually
            render, so the conditional ones can't leave a dangling line. */}
        <div className={`p-4 flex-1 divide-y ${themeConfig.divider} [&>*]:py-5 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0`}>
          
          {/* SECTION 1: PLAYBACK MODE */}
          <div>
            <label className={`text-[11px] font-bold uppercase tracking-wider ${themeConfig.textMuted} block mb-2.5`}>
              Reader Display Mode
            </label>
            <div className={`flex gap-0.5 p-0.5 rounded-xl ${themeConfig.inputBg} border ${themeConfig.cardBorder}`}>
              {([
                { kind: 'video', label: 'Video', icon: <Video className="w-4 h-4" />, title: 'Watch Video with synced transcript' },
                { kind: 'audiobook', label: 'Audio + Text', icon: <BookOpen className="w-4 h-4" />, title: 'Audiobook view centered on SRT text' },
              ] as const).map(({ kind, label, icon, title }) => (
                <button
                  key={kind}
                  onClick={() => {
                    setMode(kind);
                    onClose();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                    mode === kind
                      ? `${themeConfig.accentBg} text-white shadow-sm`
                      : `${themeConfig.textMuted} hover:bg-black/5 dark:hover:bg-white/10`
                  }`}
                  title={title}
                >
                  {icon}
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: COLOR THEME */}
          <div>
            <label className={`text-[11px] font-bold uppercase tracking-wider ${themeConfig.textMuted} flex items-center gap-1.5 mb-2.5`}>
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              Color Theme
            </label>

            {/* Collapsed trigger showing the active theme. The drawer scrolls, so the
                list expands inline rather than floating over it. */}
            <button
              onClick={() => setIsThemeListOpen(!isThemeListOpen)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.text} hover:bg-black/5 dark:hover:bg-white/10`}
              aria-expanded={isThemeListOpen}
              title="Change Reader Color Theme"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                {getThemeIcon(themeMode)}
                <span className="truncate font-semibold">{getThemeName(themeMode)}</span>
              </span>

              <span className="flex items-center gap-2 shrink-0">
                <span
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ backgroundColor: themeConfig.previewBg }}
                />
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isThemeListOpen ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            {isThemeListOpen && (
              <div className={`mt-1.5 grid grid-cols-1 gap-1.5 p-1.5 rounded-xl border ${themeConfig.cardBorder} ${themeConfig.cardBg} shadow-inner`}>
                {themeEntries.map((entry) => {
                  const isSelected = themeMode === entry.id;
                  const rowClasses = isSelected
                    ? `${entry.accentBg} text-white border-transparent shadow-sm font-bold`
                    : `${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.text} hover:bg-black/5 dark:hover:bg-white/10`;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center rounded-xl border text-xs font-medium transition-all overflow-hidden ${rowClasses}`}
                    >
                      <button
                        onClick={() => {
                          onSelectTheme(entry.id);
                          setIsThemeListOpen(false);
                        }}
                        className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 min-w-0 text-left"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          {getThemeIcon(entry.id)}
                          <span className="truncate">{entry.name}</span>
                        </span>

                        <span className="flex items-center gap-2 shrink-0">
                          <span
                            className="w-4 h-4 rounded-full border border-black/20"
                            style={{ backgroundColor: entry.previewBg }}
                          />
                          {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                        </span>
                      </button>

                      {entry.isCustom && (
                        <button
                          onClick={() => {
                            onClose();
                            openThemeStudio(entry.id);
                          }}
                          className={`px-2.5 py-2.5 shrink-0 ${
                            isSelected ? 'text-white/80 hover:text-white' : themeConfig.textMuted
                          } hover:bg-black/10`}
                          title={`Edit ${entry.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    onClose();
                    openThemeStudio();
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-dashed ${themeConfig.cardBorder} ${themeConfig.text} hover:bg-black/5 dark:hover:bg-white/10 transition-all`}
                >
                  <Plus className="w-4 h-4 text-fuchsia-500" />
                  <span>Create / Upload Theme</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3: PRIMARY SOURCE (groups holding both video and audio) */}
          {activeGroup && (
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider ${themeConfig.textMuted} block mb-2.5`}>
                Primary Source
              </label>
              <SourceSwitcher
                group={activeGroup}
                onSetPrimary={onSetPrimary}
                themeMode={themeMode}
                fullWidth
              />
            </div>
          )}

          {/* SECTION 4: MEDIA PLAYLIST */}
          {mediaList && mediaList.length > 0 && (
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider ${themeConfig.textMuted} block mb-2.5`}>
                Media Playlist ({mediaList.length})
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {mediaList.map((item) => {
                  const isSelected = activeMedia?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectMedia(item);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs border text-left transition-all ${
                        isSelected
                          ? `${themeConfig.accentBg} text-white border-transparent shadow-sm font-semibold`
                          : `${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.text} hover:opacity-90`
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-white/20' : 'bg-slate-500/10'}`}>
                        {item.mediaType === 'video' ? <Film className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium leading-tight">{item.title}</p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-white/80' : themeConfig.textMuted}`}>
                          {item.subtitles?.length || 0} transcript lines
                        </p>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: TEXT & FONT SETTINGS */}
          {readerSettings && onUpdateSettings && (
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider ${themeConfig.textMuted} flex items-center gap-1.5 mb-2.5`}>
                <Type className="w-3.5 h-3.5 text-blue-500" />
                Text & Font Settings
              </label>

              <div className="space-y-3">
                {/* Font Size Buttons */}
                <div>
                  <span className={`text-[11px] ${themeConfig.textMuted} block mb-1.5 font-medium`}>Font Size</span>
                  <div className="grid grid-cols-5 gap-1">
                    {(['sm', 'base', 'lg', 'xl', '2xl'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => onUpdateSettings({ fontSize: size })}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                          readerSettings.fontSize === size 
                            ? `${themeConfig.accentBg} text-white border-transparent shadow-sm` 
                            : `${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.textMuted}`
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family Buttons */}
                <div>
                  <span className={`text-[11px] ${themeConfig.textMuted} block mb-1.5 font-medium`}>Font Family</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['sans', 'serif', 'mono'] as const).map(font => (
                      <button
                        key={font}
                        onClick={() => onUpdateSettings({ fontFamily: font })}
                        className={`py-1.5 rounded-lg text-xs capitalize border font-medium transition-all ${
                          readerSettings.fontFamily === font 
                            ? `${themeConfig.accentBg} text-white border-transparent shadow-sm` 
                            : `${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.textMuted}`
                        }`}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-Scroll Toggle */}
                <button
                  onClick={() => onUpdateSettings({ autoScroll: !readerSettings.autoScroll })}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    readerSettings.autoScroll 
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-300 font-semibold' 
                      : `${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.textMuted}`
                  }`}
                >
                  <span className="text-xs">Auto-scroll transcript to active audio</span>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${readerSettings.autoScroll ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.25 transition-transform ${readerSettings.autoScroll ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: ACTIONS & TOOLS */}
          <div className="space-y-2">
            <label className={`text-[11px] font-bold uppercase tracking-wider ${themeConfig.textMuted} block mb-2`}>
              Actions & Settings
            </label>

            <button
              onClick={() => {
                onOpenUploadModal();
                onClose();
              }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border ${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.text} text-xs font-medium hover:opacity-90 transition-all`}
            >
              <FolderPlus className="w-4 h-4 text-blue-500" />
              <span>Open Files / Folder</span>
            </button>

            <button
              onClick={() => {
                onOpenBookmarksModal();
                onClose();
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border ${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.text} text-xs font-medium hover:opacity-90 transition-all`}
            >
              <div className="flex items-center gap-3">
                <BookmarkIcon className="w-4 h-4 text-amber-500" />
                <span>Saved Bookmarks</span>
              </div>
              {bookmarkCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {bookmarkCount}
                </span>
              )}
            </button>

            {mode === 'audiobook' && (
              <button
                onClick={() => {
                  onOpenSettingsModal();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border ${themeConfig.inputBg} ${themeConfig.cardBorder} ${themeConfig.text} text-xs font-medium hover:opacity-90 transition-all`}
              >
                <Settings className="w-4 h-4 text-purple-500" />
                <span>Reader Settings (Fonts, Scroll)</span>
              </button>
            )}

          </div>

        </div>

        {/* Drawer Footer */}
        <div className={`p-4 border-t ${themeConfig.cardBorder} text-center text-[11px] ${themeConfig.textMuted}`}>
          LVAT Player • Local Video + Audio + Text
        </div>

      </div>
    </div>
  );
};
