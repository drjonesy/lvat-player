import React from 'react';
import { Film, Headphones } from 'lucide-react';
import { MediaGroup, PrimarySource, ThemeMode } from '../types';
import { getThemeConfig } from '../utils/theme';
import { canSwitchPrimary } from '../utils/mediaGroups';

interface SourceSwitcherProps {
  group: MediaGroup | null;
  onSetPrimary: (primary: PrimarySource) => void;
  themeMode: ThemeMode;
  /** Stretch to fill its container — used inside the mobile drawer. */
  fullWidth?: boolean;
}

/**
 * Segmented video/audio toggle for the active group. Renders nothing unless
 * the group actually holds both kinds of track, so single-source groups don't
 * get a control that can't do anything.
 */
export const SourceSwitcher: React.FC<SourceSwitcherProps> = ({
  group,
  onSetPrimary,
  themeMode,
  fullWidth = false,
}) => {
  const themeConfig = getThemeConfig(themeMode);

  if (!group || !canSwitchPrimary(group)) return null;

  const options: { kind: PrimarySource; label: string; icon: React.ReactNode }[] = [
    { kind: 'video', label: 'Video', icon: <Film className="w-3.5 h-3.5" /> },
    { kind: 'audio', label: 'Audio', icon: <Headphones className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className={`flex gap-0.5 p-0.5 rounded-xl ${themeConfig.cardBg} border ${themeConfig.cardBorder} shadow-sm ${
        fullWidth ? 'w-full' : ''
      }`}
      title="Switch the primary source for this group — playback position is kept"
    >
      {options.map(({ kind, label, icon }) => (
        <button
          key={kind}
          onClick={() => onSetPrimary(kind)}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
            fullWidth ? 'flex-1' : ''
          } ${
            group.primary === kind
              ? `${themeConfig.accentBg} ${themeConfig.accentText} shadow-sm`
              : `${themeConfig.textMuted} ${themeConfig.accentHoverBg}`
          }`}
        >
          {icon}
          <span className={fullWidth ? '' : 'hidden sm:inline'}>{label}</span>
        </button>
      ))}
    </div>
  );
};
