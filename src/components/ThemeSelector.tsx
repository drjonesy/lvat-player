import React, { useState } from 'react';
import { Sun, Moon, Book, Eye, Leaf, Palette, Plus } from 'lucide-react';
import { BuiltInThemeMode, ThemeMode } from '../types';
import { getThemeConfig, getThemeName, classNameThemeMap, isBuiltInTheme } from '../utils/theme';
import { useCustomThemes } from '../context/CustomThemeContext';

export const themeIcons: Record<BuiltInThemeMode, React.ReactNode> = {
  light: <Sun className="w-4 h-4 text-amber-500" />,
  sepia: <Book className="w-4 h-4 text-amber-700" />,
  dark: <Moon className="w-4 h-4 text-blue-400" />,
  slate: <Eye className="w-4 h-4 text-indigo-400" />,
  mint: <Leaf className="w-4 h-4 text-emerald-600" />,
};

/** Built-ins keep their bespoke icon; custom themes share the palette glyph. */
export function getThemeIcon(mode: ThemeMode): React.ReactNode {
  return isBuiltInTheme(mode) ? themeIcons[mode] : <Palette className="w-4 h-4 text-fuchsia-500" />;
}

interface ThemeSelectorProps {
  themeMode: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  themeMode,
  onSelectTheme,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { customThemes, openThemeStudio } = useCustomThemes();
  const themeConfig = getThemeConfig(themeMode);

  const entries: { id: ThemeMode; name: string; previewBg: string; accentBg: string }[] = [
    ...(Object.keys(classNameThemeMap) as BuiltInThemeMode[]).map(id => ({
      id: id as ThemeMode,
      name: classNameThemeMap[id].name,
      previewBg: classNameThemeMap[id].previewBg,
      accentBg: classNameThemeMap[id].accentBg,
    })),
    ...customThemes.map(t => ({
      id: t.id as ThemeMode,
      name: t.name,
      previewBg: t.palette.bg,
      accentBg: getThemeConfig(t.id).accentBg,
    })),
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowThemeMenu(!showThemeMenu)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${themeConfig.cardBg} border ${themeConfig.cardBorder} ${themeConfig.text} hover:opacity-90 transition-all shadow-sm`}
        title="Change Reader Color Theme"
      >
        {getThemeIcon(themeMode)}
        <span className="text-xs capitalize">{getThemeName(themeMode)} Mode</span>
      </button>

      {showThemeMenu && (
        <div className={`absolute top-10 right-0 ${themeConfig.cardBg} border ${themeConfig.cardBorder} rounded-2xl shadow-2xl p-2 z-50 w-56 space-y-1 max-h-[70vh] overflow-y-auto`}>
          <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>
            Color Theme
          </div>

          {entries.map(entry => {
            const isSelected = themeMode === entry.id;
            return (
              <button
                key={entry.id}
                onClick={() => {
                  onSelectTheme(entry.id);
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                  isSelected
                    ? `${entry.accentBg} text-white font-bold`
                    : `${themeConfig.text} hover:bg-black/5 dark:hover:bg-white/10`
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getThemeIcon(entry.id)}
                  <span className="truncate">{entry.name}</span>
                </div>
                <div
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: entry.previewBg }}
                />
              </button>
            );
          })}

          <button
            onClick={() => {
              setShowThemeMenu(false);
              openThemeStudio();
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold border border-dashed ${themeConfig.cardBorder} ${themeConfig.text} hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
          >
            <Plus className="w-4 h-4" />
            Create Custom Theme
          </button>
        </div>
      )}
    </div>
  );
};
