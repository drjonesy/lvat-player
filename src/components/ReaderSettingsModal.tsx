import React from 'react';
import { X, Type, Compass, Sparkles, Sliders, Sun, Moon, Book, Eye, Leaf, Check, Palette, Plus, Pencil } from 'lucide-react';
import { ReaderSettings, ThemeMode } from '../types';
import { getThemeConfig, getThemeName } from '../utils/theme';
import { useCustomThemes } from '../context/CustomThemeContext';

interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const { customThemes, openThemeStudio } = useCustomThemes();

  if (!isOpen) return null;

  const currentTheme = getThemeConfig(settings.themeMode || 'light');

  const builtInOptions: { id: ThemeMode; name: string; icon: React.ReactNode; bg: string; text: string; border: string; accent: string }[] = [
    {
      id: 'light',
      name: 'Crisp Light',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      bg: '#ffffff',
      text: '#0f172a',
      border: '#cbd5e1',
      accent: '#2563eb',
    },
    {
      id: 'sepia',
      name: 'Kindle Sepia',
      icon: <Book className="w-4 h-4 text-amber-700" />,
      bg: '#fbf0d9',
      text: '#2c1d11',
      border: '#d97706',
      accent: '#b45309',
    },
    {
      id: 'dark',
      name: 'Sleek Dark',
      icon: <Moon className="w-4 h-4 text-blue-400" />,
      bg: '#0f172a',
      text: '#f8fafc',
      border: '#3b82f6',
      accent: '#2563eb',
    },
    {
      id: 'slate',
      name: 'Midnight Navy',
      icon: <Eye className="w-4 h-4 text-indigo-400" />,
      bg: '#0b1329',
      text: '#f1f5f9',
      border: '#6366f1',
      accent: '#4f46e5',
    },
    {
      id: 'mint',
      name: 'Paper Mint',
      icon: <Leaf className="w-4 h-4 text-emerald-600" />,
      bg: '#eaf4ed',
      text: '#0f382c',
      border: '#059669',
      accent: '#059669',
    },
  ];

  // Custom themes join the same grid; their swatch colors come straight from the palette.
  const themeOptions = [
    ...builtInOptions.map(o => ({ ...o, isCustom: false })),
    ...customThemes.map(t => ({
      id: t.id as ThemeMode,
      name: t.name,
      icon: <Palette className="w-4 h-4 text-fuchsia-500" />,
      bg: t.palette.bg,
      text: t.palette.text,
      border: t.palette.accent,
      accent: t.palette.accent,
      isCustom: true,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${currentTheme.cardBg} ${currentTheme.cardBorder} rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col transition-colors border`}>
        
        {/* Header */}
        <div className={`p-4 border-b ${currentTheme.headerBorder} flex items-center justify-between ${currentTheme.headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${currentTheme.accentBg} flex items-center justify-center text-white shadow-sm`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-base ${currentTheme.text}`}>Reader Display & Preferences</h3>
              <p className={`text-xs ${currentTheme.textMuted}`}>Customize theme mode, fonts, and scrolling</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 ${currentTheme.textMuted} hover:${currentTheme.text} rounded-lg`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`p-5 space-y-6 text-xs ${currentTheme.text}`}>
          
          {/* Theme Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className={`font-bold text-sm ${currentTheme.text}`}>Reading Theme Mode</label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${settings.themeMode === 'light' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'}`}>
                Current: {getThemeName(settings.themeMode || 'light')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themeOptions.map((t) => {
                const isSelected = (settings.themeMode || 'light') === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onUpdateSettings({ themeMode: t.id })}
                    style={{ backgroundColor: t.bg, color: t.text, borderColor: isSelected ? t.border : 'transparent' }}
                    className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between h-20 transition-all shadow-sm relative group hover:scale-[1.02] ${
                      isSelected ? 'ring-2 ring-offset-2 ring-blue-500 shadow-md font-semibold' : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        {t.icon}
                        <span className="text-xs font-bold">{t.name}</span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                      <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: t.text, opacity: 0.7 }} />
                      <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: t.accent }} />
                    </div>
                  </button>
                );
              })}

              {/* Build-your-own tile */}
              <button
                onClick={() => openThemeStudio()}
                className={`p-3 rounded-xl border-2 border-dashed ${currentTheme.cardBorder} ${currentTheme.inputBg} ${currentTheme.text} text-left flex flex-col justify-center items-center gap-1.5 h-20 transition-all hover:scale-[1.02]`}
              >
                <Plus className="w-4 h-4 text-fuchsia-500" />
                <span className="text-[11px] font-bold text-center leading-tight">
                  Create / Upload Theme
                </span>
              </button>
            </div>

            {/* Edit the applied custom theme without hunting for it in the studio list */}
            {customThemes.some(t => t.id === settings.themeMode) && (
              <button
                onClick={() => openThemeStudio(settings.themeMode)}
                className={`mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border ${currentTheme.cardBorder} ${currentTheme.inputBg} ${currentTheme.text} text-[11px] font-semibold hover:opacity-90`}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit "{getThemeName(settings.themeMode)}" in Theme Studio
              </button>
            )}
          </div>

          {/* Font Size */}
          <div>
            <label className={`block font-bold mb-2 ${currentTheme.text}`}>Text Size</label>
            <div className="grid grid-cols-5 gap-2">
              {(['sm', 'base', 'lg', 'xl', '2xl'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`py-2 rounded-xl border font-mono text-center uppercase transition-colors ${
                    settings.fontSize === size 
                      ? `${currentTheme.accentBg} text-white font-bold border-transparent shadow-sm` 
                      : `${currentTheme.inputBg} ${currentTheme.cardBorder} ${currentTheme.textMuted} hover:${currentTheme.text}`
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className={`block font-bold mb-2 ${currentTheme.text}`}>Typography Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(['sans', 'serif', 'mono'] as const).map(font => (
                <button
                  key={font}
                  onClick={() => onUpdateSettings({ fontFamily: font })}
                  className={`py-2.5 rounded-xl border text-center capitalize transition-colors ${
                    settings.fontFamily === font 
                      ? `${currentTheme.accentBg} text-white font-bold border-transparent shadow-sm` 
                      : `${currentTheme.inputBg} ${currentTheme.cardBorder} ${currentTheme.textMuted} hover:${currentTheme.text}`
                  }`}
                >
                  {font === 'serif' ? 'Serif (Book)' : font === 'mono' ? 'Monospace' : 'Sans Modern'}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Scroll Toggle */}
          <div className={`pt-3 border-t ${currentTheme.cardBorder} flex items-center justify-between`}>
            <div>
              <span className={`font-bold ${currentTheme.text} block`}>Auto-Scroll Active Sentence</span>
              <span className={`text-[11px] ${currentTheme.textMuted}`}>Keep currently reading audio/video line centered in reader</span>
            </div>

            <button
              onClick={() => onUpdateSettings({ autoScroll: !settings.autoScroll })}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                settings.autoScroll ? currentTheme.accentBg : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                settings.autoScroll ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${currentTheme.cardBorder} ${currentTheme.headerBg} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl ${currentTheme.accentBg} text-white text-xs font-semibold shadow-md`}
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
};
