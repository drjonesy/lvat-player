import { BuiltInThemeMode, CustomTheme, ThemeMode } from '../types';
import { mixHex, readableTextOn, rgba } from './color';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  description: string;
  previewBg: string;
  previewText: string;
  previewAccent: string;
  
  // Outer Container & Body
  bg: string;
  text: string;
  textMuted: string;
  
  // Header & Navigation
  headerBg: string;
  headerBorder: string;
  headerText: string;
  headerMuted: string;
  
  // Main Cards & Panels
  cardBg: string;
  cardBorder: string;

  /** Hairline rule between stacked sections. Colour only — `cardBorder` bundles a
   *  shadow, which paints on all four sides even with a single-edge border. */
  divider: string;

  // Active Cue Highlight
  activeCueBg: string;
  activeCueBorder: string;
  activeCueText: string;
  activeCueBadge: string;

  // Player Bar
  playerBg: string;
  playerBorder: string;
  playerText: string;
  playerMuted: string;

  // Inputs & Controls
  inputBg: string;
  inputBorder: string;
  inputText: string;
  
  // Accent Color (Matches Logo)
  accentBg: string;
  accentText: string;
  accentIcon: string;
  accentHoverBg: string;
  accentBorder: string;
}

export const classNameThemeMap: Record<BuiltInThemeMode, ThemeConfig> = {
  light: {
    id: 'light',
    name: 'Crisp Light',
    description: 'Clean paper white with crisp typography',
    previewBg: '#ffffff',
    previewText: '#0f172a',
    previewAccent: '#2563eb',
    
    bg: 'bg-slate-100 text-slate-900',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
    
    headerBg: 'bg-white/90 backdrop-blur-md',
    headerBorder: 'border-slate-200/80 shadow-sm',
    headerText: 'text-slate-900',
    headerMuted: 'text-slate-500',
    
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200 shadow-sm',
    divider: 'divide-slate-200',

    activeCueBg: 'bg-blue-50/90',
    activeCueBorder: 'border-blue-500 shadow-md ring-1 ring-blue-500/30',
    activeCueText: 'text-blue-950 font-medium',
    activeCueBadge: 'bg-blue-600 text-white',

    playerBg: 'bg-white/90 backdrop-blur-xl',
    playerBorder: 'border-slate-200 shadow-2xl',
    playerText: 'text-slate-900',
    playerMuted: 'text-slate-500',

    inputBg: 'bg-slate-50',
    inputBorder: 'border-slate-200 focus:border-blue-600',
    inputText: 'text-slate-900 placeholder-slate-400',

    accentBg: 'bg-blue-600 hover:bg-blue-500',
    accentText: 'text-white',
    accentIcon: 'text-blue-600 hover:text-blue-700',
    accentHoverBg: 'hover:bg-blue-50',
    accentBorder: 'border-blue-200'
  },

  sepia: {
    id: 'sepia',
    name: 'Kindle Sepia',
    description: 'Warm cream parchment, gentle on eyes',
    previewBg: '#fbf0d9',
    previewText: '#2c1d11',
    previewAccent: '#b45309',
    
    bg: 'bg-[#fbf0d9] text-[#2c1d11]',
    text: 'text-[#2c1d11]',
    textMuted: 'text-[#8c7355]',
    
    headerBg: 'bg-[#f4ecd8]/90 backdrop-blur-md',
    headerBorder: 'border-[#e6dcb8]',
    headerText: 'text-[#2c1d11]',
    headerMuted: 'text-[#8c7355]',
    
    cardBg: 'bg-[#f4ecd8]',
    cardBorder: 'border-[#e6dcb8] shadow-sm',
    divider: 'divide-[#e6dcb8]',

    activeCueBg: 'bg-[#fef08a]/80',
    activeCueBorder: 'border-[#b45309] shadow-md ring-1 ring-[#b45309]/30',
    activeCueText: 'text-[#451a03] font-semibold',
    activeCueBadge: 'bg-[#b45309] text-white',

    playerBg: 'bg-[#f4ecd8]/95 backdrop-blur-xl',
    playerBorder: 'border-[#e6dcb8] shadow-2xl',
    playerText: 'text-[#2c1d11]',
    playerMuted: 'text-[#8c7355]',

    inputBg: 'bg-[#fbf0d9]',
    inputBorder: 'border-[#e6dcb8] focus:border-[#b45309]',
    inputText: 'text-[#2c1d11] placeholder-[#8c7355]',

    accentBg: 'bg-[#b45309] hover:bg-[#d97706]',
    accentText: 'text-white',
    accentIcon: 'text-[#b45309] hover:text-[#92400e]',
    accentHoverBg: 'hover:bg-[#b45309]/10',
    accentBorder: 'border-[#b45309]/30'
  },

  dark: {
    id: 'dark',
    name: 'Sleek Dark',
    description: 'Deep contrast canvas with modern blue accents',
    previewBg: '#090d16',
    previewText: '#f8fafc',
    previewAccent: '#3b82f6',
    
    bg: 'bg-slate-950 text-slate-100',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    
    headerBg: 'bg-slate-900/90 backdrop-blur-md',
    headerBorder: 'border-slate-800',
    headerText: 'text-slate-100',
    headerMuted: 'text-slate-400',
    
    cardBg: 'bg-slate-900',
    cardBorder: 'border-slate-800',
    divider: 'divide-slate-800',

    activeCueBg: 'bg-blue-600/15',
    activeCueBorder: 'border-blue-500 shadow-md ring-1 ring-blue-500/40',
    activeCueText: 'text-blue-100 font-medium',
    activeCueBadge: 'bg-blue-600 text-white',

    playerBg: 'bg-slate-900/90 backdrop-blur-xl',
    playerBorder: 'border-slate-800 shadow-2xl',
    playerText: 'text-slate-100',
    playerMuted: 'text-slate-400',

    inputBg: 'bg-slate-950',
    inputBorder: 'border-slate-800 focus:border-blue-500',
    inputText: 'text-slate-200 placeholder-slate-500',

    accentBg: 'bg-blue-600 hover:bg-blue-500',
    accentText: 'text-white',
    accentIcon: 'text-blue-400 hover:text-blue-300',
    accentHoverBg: 'hover:bg-blue-500/15',
    accentBorder: 'border-blue-500/30'
  },

  slate: {
    id: 'slate',
    name: 'Midnight Navy',
    description: 'Nordic navy blue palette for night reading',
    previewBg: '#0f172a',
    previewText: '#f1f5f9',
    previewAccent: '#6366f1',
    
    bg: 'bg-[#0b1329] text-slate-100',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    
    headerBg: 'bg-[#15203e]/90 backdrop-blur-md',
    headerBorder: 'border-[#22335c]',
    headerText: 'text-slate-100',
    headerMuted: 'text-slate-400',
    
    cardBg: 'bg-[#15203e]',
    cardBorder: 'border-[#22335c]',
    divider: 'divide-[#22335c]',

    activeCueBg: 'bg-indigo-600/25',
    activeCueBorder: 'border-indigo-400 shadow-md ring-1 ring-indigo-400/40',
    activeCueText: 'text-indigo-100 font-medium',
    activeCueBadge: 'bg-indigo-600 text-white',

    playerBg: 'bg-[#15203e]/95 backdrop-blur-xl',
    playerBorder: 'border-[#22335c] shadow-2xl',
    playerText: 'text-slate-100',
    playerMuted: 'text-slate-400',

    inputBg: 'bg-[#0b1329]',
    inputBorder: 'border-[#22335c] focus:border-indigo-400',
    inputText: 'text-slate-200 placeholder-slate-500',

    accentBg: 'bg-indigo-600 hover:bg-indigo-500',
    accentText: 'text-white',
    accentIcon: 'text-indigo-400 hover:text-indigo-300',
    accentHoverBg: 'hover:bg-indigo-500/15',
    accentBorder: 'border-indigo-500/30'
  },

  mint: {
    id: 'mint',
    name: 'Paper Mint',
    description: 'Soothing sage forest paper for relaxed reading',
    previewBg: '#eaf4ed',
    previewText: '#0f382c',
    previewAccent: '#059669',
    
    bg: 'bg-[#eaf4ed] text-[#0f382c]',
    text: 'text-[#0f382c]',
    textMuted: 'text-[#487363]',
    
    headerBg: 'bg-[#f4fbf6]/90 backdrop-blur-md',
    headerBorder: 'border-[#c8e6c9]',
    headerText: 'text-[#0f382c]',
    headerMuted: 'text-[#487363]',
    
    cardBg: 'bg-[#f4fbf6]',
    cardBorder: 'border-[#c8e6c9] shadow-sm',
    divider: 'divide-[#c8e6c9]',

    activeCueBg: 'bg-[#a7f3d0]/60',
    activeCueBorder: 'border-[#059669] shadow-md ring-1 ring-[#059669]/40',
    activeCueText: 'text-[#064e3b] font-semibold',
    activeCueBadge: 'bg-[#059669] text-white',

    playerBg: 'bg-[#f4fbf6]/95 backdrop-blur-xl',
    playerBorder: 'border-[#c8e6c9] shadow-2xl',
    playerText: 'text-[#0f382c]',
    playerMuted: 'text-[#487363]',

    inputBg: 'bg-[#eaf4ed]',
    inputBorder: 'border-[#c8e6c9] focus:border-[#059669]',
    inputText: 'text-[#0f382c] placeholder-[#487363]',

    accentBg: 'bg-[#059669] hover:bg-[#047857]',
    accentText: 'text-white',
    accentIcon: 'text-[#059669] hover:text-[#047857]',
    accentHoverBg: 'hover:bg-[#059669]/10',
    accentBorder: 'border-[#059669]/30'
  }
};

export const BUILT_IN_THEME_IDS = Object.keys(classNameThemeMap) as BuiltInThemeMode[];

export function isBuiltInTheme(mode: ThemeMode): mode is BuiltInThemeMode {
  return Object.prototype.hasOwnProperty.call(classNameThemeMap, mode);
}

/* ------------------------------------------------------------------ *
 * Custom themes
 *
 * Tailwind compiles class names at build time, so a user-picked hex can
 * never become a `bg-[#abc123]` class at runtime. Instead every custom
 * theme shares one static set of classes that read CSS variables; only
 * the variable values change per theme. The class strings below are
 * literals so Tailwind emits the matching rules into the bundle.
 * ------------------------------------------------------------------ */

/** Class template shared by every custom theme. Values come from `buildCustomThemeVars`. */
const CUSTOM_THEME_CLASSES = {
  bg: 'bg-[color:var(--lt-bg)] text-[color:var(--lt-text)]',
  text: 'text-[color:var(--lt-text)]',
  textMuted: 'text-[color:var(--lt-text-muted)]',

  headerBg: 'bg-[color:var(--lt-surface-translucent)] backdrop-blur-md',
  headerBorder: 'border-[color:var(--lt-border)] shadow-sm',
  headerText: 'text-[color:var(--lt-text)]',
  headerMuted: 'text-[color:var(--lt-text-muted)]',

  cardBg: 'bg-[color:var(--lt-surface)]',
  cardBorder: 'border-[color:var(--lt-border)] shadow-sm',
  divider: 'divide-[color:var(--lt-border)]',

  activeCueBg: 'bg-[color:var(--lt-highlight)]',
  activeCueBorder: 'border-[color:var(--lt-accent)] shadow-md ring-1 ring-[color:var(--lt-highlight-ring)]',
  activeCueText: 'text-[color:var(--lt-highlight-text)] font-semibold',
  activeCueBadge: 'bg-[color:var(--lt-accent)] text-[color:var(--lt-accent-text)]',

  playerBg: 'bg-[color:var(--lt-surface-translucent)] backdrop-blur-xl',
  playerBorder: 'border-[color:var(--lt-border)] shadow-2xl',
  playerText: 'text-[color:var(--lt-text)]',
  playerMuted: 'text-[color:var(--lt-text-muted)]',

  inputBg: 'bg-[color:var(--lt-input-bg)]',
  inputBorder: 'border-[color:var(--lt-border)] focus:border-[color:var(--lt-accent)]',
  inputText: 'text-[color:var(--lt-text)] placeholder-[color:var(--lt-text-muted)]',

  accentBg: 'bg-[color:var(--lt-accent)] hover:bg-[color:var(--lt-accent-hover)]',
  accentText: 'text-[color:var(--lt-accent-text)]',
  accentIcon: 'text-[color:var(--lt-accent)] hover:text-[color:var(--lt-accent-hover)]',
  accentHoverBg: 'hover:bg-[color:var(--lt-accent-soft)]',
  accentBorder: 'border-[color:var(--lt-accent-border)]',
} as const;

/** CSS custom properties for a theme, applied to the document root while it is active. */
export function buildCustomThemeVars(theme: CustomTheme): Record<string, string> {
  const p = theme.palette;
  const accentHover = theme.isDark
    ? mixHex(p.accent, '#ffffff', 0.18)
    : mixHex(p.accent, '#000000', 0.14);
  const inputBg = theme.isDark
    ? mixHex(p.surface, '#000000', 0.35)
    : mixHex(p.surface, p.bg, 0.65);

  return {
    '--lt-bg': p.bg,
    '--lt-surface': p.surface,
    '--lt-surface-translucent': rgba(p.surface, 0.92),
    '--lt-border': p.border,
    '--lt-text': p.text,
    '--lt-text-muted': p.textMuted,
    '--lt-accent': p.accent,
    '--lt-accent-hover': accentHover,
    '--lt-accent-text': p.accentText,
    '--lt-accent-soft': rgba(p.accent, 0.12),
    '--lt-accent-border': rgba(p.accent, 0.35),
    '--lt-highlight': p.highlight,
    '--lt-highlight-ring': rgba(p.accent, 0.4),
    '--lt-highlight-text': readableTextOn(p.highlight),
    '--lt-input-bg': inputBg,
  };
}

export function buildCustomThemeConfig(theme: CustomTheme): ThemeConfig {
  return {
    ...CUSTOM_THEME_CLASSES,
    id: theme.id,
    name: theme.name,
    description: theme.description,
    previewBg: theme.palette.bg,
    previewText: theme.palette.text,
    previewAccent: theme.palette.accent,
  };
}

/**
 * Custom themes live in App state, but a dozen components call `getThemeConfig(mode)`
 * with only an id. This registry lets those lookups resolve without prop drilling;
 * `CustomThemeProvider` keeps it in sync during render.
 */
let customThemeRegistry: Record<string, CustomTheme> = {};

export function setCustomThemeRegistry(themes: CustomTheme[]): void {
  customThemeRegistry = Object.fromEntries(themes.map(t => [t.id, t]));
}

export function getCustomTheme(id: ThemeMode): CustomTheme | undefined {
  return customThemeRegistry[id];
}

export function getThemeConfig(mode: ThemeMode): ThemeConfig {
  if (isBuiltInTheme(mode)) return classNameThemeMap[mode];

  const custom = customThemeRegistry[mode];
  if (custom) return buildCustomThemeConfig(custom);

  return classNameThemeMap.light;
}

/** Display name for any theme id, including ones that no longer exist. */
export function getThemeName(mode: ThemeMode): string {
  if (isBuiltInTheme(mode)) return classNameThemeMap[mode].name;
  return customThemeRegistry[mode]?.name || 'Crisp Light';
}
