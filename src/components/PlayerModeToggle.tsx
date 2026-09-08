import React from 'react';
import { Video, BookOpen } from 'lucide-react';
import { PlaybackMode } from '../types';

interface PlayerModeToggleProps {
  mode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
  /** The video segment is a dead end when the active group holds no video track. */
  canUseVideo?: boolean;
}

/**
 * Compact Video / Audio + Text switch for the fixed player bars. Styled for the
 * accent-filled bar rather than a card, so it uses white-on-accent like the
 * transport buttons beside it.
 */
export const PlayerModeToggle: React.FC<PlayerModeToggleProps> = ({
  mode,
  onModeChange,
  canUseVideo = true,
}) => {
  const options: {
    kind: PlaybackMode;
    label: string;
    icon: React.ReactNode;
    disabled: boolean;
    title: string;
  }[] = [
    {
      kind: 'video',
      label: 'Video mode',
      icon: <Video className="w-4 h-4" />,
      disabled: !canUseVideo,
      title: canUseVideo ? 'Switch to Video mode' : 'This title has no video track',
    },
    {
      kind: 'audiobook',
      label: 'Audio + Text mode',
      icon: <BookOpen className="w-4 h-4" />,
      disabled: false,
      title: 'Switch to Audio + Text mode',
    },
  ];

  return (
    <div className="flex gap-0.5 p-0.5 rounded-xl bg-black/20 border border-white/20 shrink-0">
      {options.map(({ kind, label, icon, disabled, title }) => (
        <button
          key={kind}
          onClick={() => onModeChange(kind)}
          disabled={disabled}
          className={`p-1.5 rounded-lg transition-all active:scale-95 ${
            mode === kind
              ? 'bg-white text-slate-800 shadow-sm'
              : disabled
                ? 'text-white/30 cursor-not-allowed'
                : 'text-white/80 hover:bg-white/15'
          }`}
          title={title}
          aria-label={label}
          aria-pressed={mode === kind}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};
