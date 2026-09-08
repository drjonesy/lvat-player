export type PlaybackMode = 'video' | 'audiobook';

/** Themes that ship with the app and are always available. */
export type BuiltInThemeMode = 'light' | 'sepia' | 'dark' | 'slate' | 'mint';

/**
 * A theme identifier: either a built-in mode, or a user-created theme id
 * (always prefixed `custom-`). `string & {}` keeps editor autocomplete for
 * the built-ins while still allowing arbitrary custom ids.
 */
export type ThemeMode = BuiltInThemeMode | (string & {});

/** The colors a user actually picks when building a theme. Everything else is derived. */
export interface CustomThemePalette {
  /** Page background behind all cards. */
  bg: string;
  /** Cards, header and player bar background. */
  surface: string;
  /** Borders and dividers. */
  border: string;
  /** Primary body text. */
  text: string;
  /** Secondary / metadata text. */
  textMuted: string;
  /** Buttons, active states, logo tile. */
  accent: string;
  /** Text drawn on top of `accent`. */
  accentText: string;
  /** Background of the currently-spoken transcript line. */
  highlight: string;
}

export interface CustomTheme {
  /** Unique id, always `custom-…`. Doubles as the `ThemeMode` value. */
  id: string;
  name: string;
  description: string;
  /** Drives derived colors (hover shades, input backgrounds). */
  isDark: boolean;
  palette: CustomThemePalette;
  createdAt: number;
  updatedAt: number;
}

/** Shape of an exported `.json` theme file. */
export interface CustomThemeFile {
  format: 'lumina-theme';
  version: number;
  theme: CustomTheme;
}

export interface SubtitleCue {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

/**
 * The flattened, ready-to-play shape every player/reader component consumes.
 * Derived from a `MediaGroup` by `resolveGroup()` — not stored directly.
 */
export interface MediaItem {
  id: string;
  title: string;
  mediaType: 'video' | 'audio';
  src: string; // URL or Blob URL
  fileName?: string;
  subtitles: SubtitleCue[];
  subtitleFileName?: string;
  duration?: number;
  author?: string;
  thumbnailUrl?: string;
}

/** Which slot of a group currently feeds the media element. */
export type PrimarySource = 'video' | 'audio';

/** One playable file inside a group. Video and audio tracks share this shape. */
export interface MediaTrack {
  id: string;
  kind: PrimarySource;
  /** Shown in the track picker — defaults to the file's base name. */
  label: string;
  src: string; // URL or Blob URL
  fileName?: string;
}

/** One parsed subtitle/transcript file inside a group. */
export interface SubtitleTrack {
  id: string;
  /** Shown in the track picker — defaults to the file's base name. */
  label: string;
  cues: SubtitleCue[];
  fileName?: string;
}

/**
 * A title that bundles every file belonging to it: video cuts, audio
 * renditions and subtitle/transcript files.
 *
 * Sources are *alternatives*, never simultaneous — exactly one track plays at
 * a time, chosen by `primary` plus the matching `active*Id`. Switching primary
 * carries the current playback position across (see `App.handleSetPrimary`).
 */
export interface MediaGroup {
  id: string;
  title: string;
  author?: string;
  thumbnailUrl?: string;
  videoTracks: MediaTrack[];
  audioTracks: MediaTrack[];
  subtitleTracks: SubtitleTrack[];
  /** Which kind of track drives playback. */
  primary: PrimarySource;
  activeVideoId: string | null;
  activeAudioId: string | null;
  /** `null` means "no transcript" — a valid state, not an error. */
  activeSubtitleId: string | null;
}

/** How dropped/selected files are turned into groups. */
export type GroupingStrategy =
  /** One group per media file, subtitles matched by base name. */
  | 'auto'
  /** Everything in the drop lands in a single new group. */
  | 'single'
  /** Everything is appended to an existing group. */
  | 'append';

export interface ReaderSettings {
  themeMode: ThemeMode;
  fontSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  fontFamily: 'sans' | 'serif' | 'mono';
  autoScroll: boolean;
  highlightStyle: 'soft' | 'bold' | 'minimal';
  lineSpacing: 'compact' | 'comfortable' | 'spacious';
  showTimestamps: boolean;
  searchQuery: string;
}

export interface Bookmark {
  id: string;
  mediaId: string;
  timestamp: number;
  cueText: string;
  note: string;
  createdAt: number;
}

export interface FolderPairing {
  id: string;
  title: string;
  mediaFile?: File;
  subtitleFile?: File;
  mediaType?: 'video' | 'audio';
}
