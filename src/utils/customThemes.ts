import {
  BuiltInThemeMode,
  CustomTheme,
  CustomThemeFile,
  CustomThemePalette,
  ThemeMode,
} from '../types';
import { isValidHex, mixHex, normalizeHex, readableTextOn } from './color';

export const CUSTOM_THEMES_STORAGE_KEY = 'lumina.customThemes.v1';
export const ACTIVE_THEME_STORAGE_KEY = 'lumina.activeTheme.v1';

export const THEME_FILE_FORMAT = 'lumina-theme';
export const THEME_FILE_VERSION = 1;
export const THEME_FILE_EXTENSION = '.lumina-theme.json';

const CUSTOM_THEME_PREFIX = 'custom-';

export function isCustomThemeId(id: ThemeMode): boolean {
  return typeof id === 'string' && id.startsWith(CUSTOM_THEME_PREFIX);
}

export function createThemeId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${CUSTOM_THEME_PREFIX}${Date.now().toString(36)}-${random}`;
}

/** Hex equivalents of each built-in theme, used as starting points in the editor. */
export const BUILT_IN_PALETTES: Record<BuiltInThemeMode, CustomThemePalette> = {
  light: {
    bg: '#f1f5f9',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    accent: '#2563eb',
    accentText: '#ffffff',
    highlight: '#dbeafe',
  },
  sepia: {
    bg: '#fbf0d9',
    surface: '#f4ecd8',
    border: '#e6dcb8',
    text: '#2c1d11',
    textMuted: '#8c7355',
    accent: '#b45309',
    accentText: '#ffffff',
    highlight: '#fef08a',
  },
  dark: {
    bg: '#020617',
    surface: '#0f172a',
    border: '#1e293b',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    accent: '#2563eb',
    accentText: '#ffffff',
    highlight: '#1e3a5f',
  },
  slate: {
    bg: '#0b1329',
    surface: '#15203e',
    border: '#22335c',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    accent: '#4f46e5',
    accentText: '#ffffff',
    highlight: '#312e81',
  },
  mint: {
    bg: '#eaf4ed',
    surface: '#f4fbf6',
    border: '#c8e6c9',
    text: '#0f382c',
    textMuted: '#487363',
    accent: '#059669',
    accentText: '#ffffff',
    highlight: '#a7f3d0',
  },
};

/** Field metadata driving the color picker list in the theme studio. */
export const PALETTE_FIELDS: {
  key: keyof CustomThemePalette;
  label: string;
  hint: string;
}[] = [
  { key: 'bg', label: 'Page Background', hint: 'Canvas behind every card' },
  { key: 'surface', label: 'Surface', hint: 'Cards, header and player bar' },
  { key: 'border', label: 'Borders', hint: 'Outlines and dividers' },
  { key: 'text', label: 'Body Text', hint: 'Main transcript text' },
  { key: 'textMuted', label: 'Muted Text', hint: 'Timestamps and captions' },
  { key: 'accent', label: 'Accent', hint: 'Buttons and active controls' },
  { key: 'accentText', label: 'Accent Text', hint: 'Label drawn on accent color' },
  { key: 'highlight', label: 'Active Line', hint: 'Currently spoken transcript line' },
];

export function createCustomTheme(
  name: string,
  basedOn: BuiltInThemeMode = 'light',
): CustomTheme {
  const now = Date.now();
  return {
    id: createThemeId(),
    name: name.trim() || 'My Theme',
    description: `Custom theme based on ${basedOn}`,
    isDark: basedOn === 'dark' || basedOn === 'slate',
    palette: { ...BUILT_IN_PALETTES[basedOn] },
    createdAt: now,
    updatedAt: now,
  };
}

/** Re-derives accent text and highlight so a hand-edited palette stays readable. */
export function suggestReadableAccentText(palette: CustomThemePalette): string {
  return readableTextOn(palette.accent);
}

export function suggestHighlight(palette: CustomThemePalette, isDark: boolean): string {
  return mixHex(palette.surface, palette.accent, isDark ? 0.3 : 0.22);
}

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */

function hasStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadCustomThemes(): CustomTheme[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeTheme).filter((t): t is CustomTheme => t !== null);
  } catch (err) {
    console.warn('Could not read saved themes:', err);
    return [];
  }
}

export function saveCustomThemes(themes: CustomTheme[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch (err) {
    console.warn('Could not save themes:', err);
  }
}

export function loadActiveThemeMode(): ThemeMode | null {
  if (!hasStorage()) return null;
  try {
    return window.localStorage.getItem(ACTIVE_THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveThemeMode(mode: ThemeMode): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(ACTIVE_THEME_STORAGE_KEY, mode);
  } catch {
    /* quota or private mode — theme choice simply won't persist */
  }
}

/* ------------------------------------------------------------------ *
 * Import / export
 * ------------------------------------------------------------------ */

/** Coerces unknown JSON into a `CustomTheme`, or returns null if it isn't one. */
function sanitizeTheme(input: unknown): CustomTheme | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const rawPalette = raw.palette;
  if (!rawPalette || typeof rawPalette !== 'object') return null;

  const source = rawPalette as Record<string, unknown>;
  const palette = {} as CustomThemePalette;

  for (const { key } of PALETTE_FIELDS) {
    const value = source[key];
    if (typeof value !== 'string') return null;
    const hex = normalizeHex(value);
    if (!hex) return null;
    palette[key] = hex;
  }

  const now = Date.now();
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Imported Theme';

  return {
    id: typeof raw.id === 'string' && isCustomThemeId(raw.id) ? raw.id : createThemeId(),
    name: name.slice(0, 60),
    description:
      typeof raw.description === 'string' ? raw.description.slice(0, 140) : 'Imported theme',
    isDark: typeof raw.isDark === 'boolean' ? raw.isDark : false,
    palette,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now,
  };
}

export function serializeTheme(theme: CustomTheme): string {
  const file: CustomThemeFile = {
    format: THEME_FILE_FORMAT,
    version: THEME_FILE_VERSION,
    theme,
  };
  return JSON.stringify(file, null, 2);
}

export interface ParseResult {
  ok: boolean;
  themes: CustomTheme[];
  /** Present when `ok` is false. */
  error?: string;
}

/**
 * Parses an uploaded theme file. Accepts the wrapped export format, a bare
 * theme object, or an array of either — so hand-written files still load.
 */
export function parseThemeFile(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, themes: [], error: 'That file is not valid JSON.' };
  }

  const candidates: unknown[] = [];
  const collect = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (record.format === THEME_FILE_FORMAT && record.theme) {
        collect(record.theme);
        return;
      }
      if (Array.isArray(record.themes)) {
        collect(record.themes);
        return;
      }
      candidates.push(value);
    }
  };
  collect(data);

  const themes = candidates
    .map(sanitizeTheme)
    .filter((t): t is CustomTheme => t !== null);

  if (themes.length === 0) {
    return {
      ok: false,
      themes: [],
      error: 'No theme found. A theme file needs a "palette" with valid hex colors.',
    };
  }

  return { ok: true, themes };
}

export function readThemeFile(file: File): Promise<ParseResult> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(parseThemeFile(String(reader.result || '')));
    reader.onerror = () => resolve({ ok: false, themes: [], error: 'Could not read that file.' });
    reader.readAsText(file);
  });
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theme';
}

/** Triggers a browser download of the theme as a `.lumina-theme.json` file. */
export function downloadTheme(theme: CustomTheme): void {
  const blob = new Blob([serializeTheme(theme)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(theme.name)}${THEME_FILE_EXTENSION}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function isPaletteComplete(palette: CustomThemePalette): boolean {
  return PALETTE_FIELDS.every(({ key }) => isValidHex(palette[key]));
}
