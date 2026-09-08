import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Palette,
  Plus,
  Upload,
  Download,
  Trash2,
  Check,
  Copy,
  AlertTriangle,
  Wand2,
  Save,
  Play,
  Pause,
  Bookmark as BookmarkIcon,
} from 'lucide-react';
import { BuiltInThemeMode, CustomTheme, CustomThemePalette } from '../types';
import { useCustomThemes } from '../context/CustomThemeContext';
import {
  BUILT_IN_THEME_IDS,
  classNameThemeMap,
  getThemeConfig,
} from '../utils/theme';
import {
  BUILT_IN_PALETTES,
  PALETTE_FIELDS,
  createCustomTheme,
  createThemeId,
  downloadTheme,
  isPaletteComplete,
  readThemeFile,
  suggestHighlight,
  suggestReadableAccentText,
} from '../utils/customThemes';
import { contrastRatio, isDarkColor, normalizeHex } from '../utils/color';

interface ThemeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingThemeId: string | null;
  onChangeEditingThemeId: (id: string | null) => void;
}

type Notice = { kind: 'ok' | 'error'; text: string } | null;

/** Contrast pairs we surface as warnings — the ones that actually hurt reading. */
const CONTRAST_CHECKS: { label: string; fg: keyof CustomThemePalette; bg: keyof CustomThemePalette; min: number }[] = [
  { label: 'Body text on surface', fg: 'text', bg: 'surface', min: 4.5 },
  { label: 'Muted text on surface', fg: 'textMuted', bg: 'surface', min: 3 },
  { label: 'Accent label on accent', fg: 'accentText', bg: 'accent', min: 4.5 },
  { label: 'Body text on active line', fg: 'text', bg: 'highlight', min: 3 },
];

export const ThemeStudioModal: React.FC<ThemeStudioModalProps> = ({
  isOpen,
  onClose,
  editingThemeId,
  onChangeEditingThemeId,
}) => {
  const {
    customThemes,
    activeThemeMode,
    selectTheme,
    saveTheme,
    deleteTheme,
    importThemes,
  } = useCustomThemes();

  const [draft, setDraft] = useState<CustomTheme>(() => createCustomTheme('My Theme', 'light'));
  const [notice, setNotice] = useState<Notice>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalTheme = getThemeConfig(activeThemeMode);
  const isNewTheme = !customThemes.some(t => t.id === draft.id);

  // Load the requested theme into the draft whenever the studio opens or the
  // selected theme changes.
  useEffect(() => {
    if (!isOpen) return;
    const existing = editingThemeId ? customThemes.find(t => t.id === editingThemeId) : null;
    setDraft(existing ? { ...existing, palette: { ...existing.palette } } : createCustomTheme('My Theme', 'light'));
    setNotice(null);
    // customThemes intentionally omitted: reloading the draft on every save
    // would discard in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingThemeId]);

  const contrastIssues = useMemo(
    () =>
      CONTRAST_CHECKS.filter(
        check => contrastRatio(draft.palette[check.fg], draft.palette[check.bg]) < check.min,
      ),
    [draft.palette],
  );

  if (!isOpen) return null;

  const updatePalette = (key: keyof CustomThemePalette, value: string) => {
    setDraft(prev => ({ ...prev, palette: { ...prev.palette, [key]: value } }));
  };

  const commitPalette = (key: keyof CustomThemePalette, value: string) => {
    const hex = normalizeHex(value);
    if (hex) updatePalette(key, hex);
  };

  const startFrom = (base: BuiltInThemeMode) => {
    setDraft(prev => ({
      ...prev,
      isDark: base === 'dark' || base === 'slate',
      palette: { ...BUILT_IN_PALETTES[base] },
    }));
    setNotice({ kind: 'ok', text: `Loaded ${classNameThemeMap[base].name} as a starting point.` });
  };

  const autoBalance = () => {
    setDraft(prev => {
      const isDark = isDarkColor(prev.palette.bg);
      const palette = { ...prev.palette };
      palette.accentText = suggestReadableAccentText(palette);
      palette.highlight = suggestHighlight(palette, isDark);
      return { ...prev, isDark, palette };
    });
    setNotice({ kind: 'ok', text: 'Adjusted accent text and active-line color for readability.' });
  };

  const handleSave = (andApply: boolean) => {
    if (!draft.name.trim()) {
      setNotice({ kind: 'error', text: 'Give the theme a name first.' });
      return;
    }
    if (!isPaletteComplete(draft.palette)) {
      setNotice({ kind: 'error', text: 'Every color needs a valid hex value.' });
      return;
    }

    const saved: CustomTheme = { ...draft, name: draft.name.trim(), updatedAt: Date.now() };
    saveTheme(saved);
    onChangeEditingThemeId(saved.id);
    setDraft(saved);

    if (andApply) {
      selectTheme(saved.id);
      onClose();
      return;
    }
    setNotice({ kind: 'ok', text: `Saved "${saved.name}".` });
  };

  const handleDuplicate = () => {
    const copy: CustomTheme = {
      ...draft,
      id: createThemeId(),
      name: `${draft.name} Copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      palette: { ...draft.palette },
    };
    saveTheme(copy);
    onChangeEditingThemeId(copy.id);
    setDraft(copy);
    setNotice({ kind: 'ok', text: 'Duplicated. Editing the copy now.' });
  };

  const handleDelete = () => {
    if (isNewTheme) return;
    deleteTheme(draft.id);
    onChangeEditingThemeId(null);
    setDraft(createCustomTheme('My Theme', 'light'));
    setNotice({ kind: 'ok', text: 'Theme deleted.' });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const imported: CustomTheme[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const result = await readThemeFile(file);
      if (result.ok) imported.push(...result.themes);
      else errors.push(`${file.name}: ${result.error}`);
    }

    if (imported.length > 0) {
      const added = importThemes(imported);
      const first = added[0];
      onChangeEditingThemeId(first.id);
      setDraft({ ...first, palette: { ...first.palette } });
      setNotice({
        kind: 'ok',
        text: `Uploaded ${added.length} theme${added.length > 1 ? 's' : ''}.${
          errors.length ? ` ${errors.length} file(s) skipped.` : ''
        }`,
      });
    } else {
      setNotice({ kind: 'error', text: errors[0] || 'Nothing to import.' });
    }
  };

  const p = draft.palette;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onDragOver={e => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={e => {
        e.preventDefault();
        setIsDraggingFile(false);
        void handleFiles(e.dataTransfer.files);
      }}
    >
      <div
        className={`${modalTheme.cardBg} border ${modalTheme.cardBorder} rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col ${
          isDraggingFile ? 'ring-4 ring-blue-500/60' : ''
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b ${modalTheme.cardBorder} ${modalTheme.headerBg} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl ${modalTheme.accentBg} ${modalTheme.accentText} flex items-center justify-center shadow-sm shrink-0`}>
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`font-bold text-base ${modalTheme.text} truncate`}>Theme Studio</h3>
              <p className={`text-xs ${modalTheme.textMuted} truncate`}>
                Build your own colors, save them, export and upload theme files
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${modalTheme.textMuted} hover:bg-black/5 dark:hover:bg-white/10 shrink-0`}
            title="Close Theme Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">

            {/* ---- My Themes sidebar ---- */}
            <aside className={`p-4 border-b lg:border-b-0 lg:border-r ${modalTheme.cardBorder} space-y-2`}>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${modalTheme.textMuted}`}>
                My Themes ({customThemes.length})
              </div>

              <div className="space-y-1.5 max-h-56 lg:max-h-[42vh] overflow-y-auto pr-0.5">
                {customThemes.length === 0 && (
                  <p className={`text-xs ${modalTheme.textMuted} py-2`}>
                    No custom themes yet. Build one on the right, or upload a theme file.
                  </p>
                )}

                {customThemes.map(theme => {
                  const isEditing = theme.id === draft.id;
                  const isApplied = theme.id === activeThemeMode;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onChangeEditingThemeId(theme.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-all ${
                        isEditing
                          ? `${modalTheme.accentBg} ${modalTheme.accentText} border-transparent shadow-sm`
                          : `${modalTheme.inputBg} ${modalTheme.cardBorder} ${modalTheme.text} hover:opacity-90`
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 shrink-0 relative overflow-hidden"
                        style={{ backgroundColor: theme.palette.bg }}
                      >
                        <span
                          className="absolute inset-x-0 bottom-0 h-2"
                          style={{ backgroundColor: theme.palette.accent }}
                        />
                      </span>

                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold truncate">{theme.name}</span>
                        <span className={`block text-[10px] truncate ${isEditing ? 'opacity-80' : modalTheme.textMuted}`}>
                          {isApplied ? 'Currently applied' : theme.isDark ? 'Dark' : 'Light'}
                        </span>
                      </span>

                      {isApplied && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 space-y-1.5">
                <button
                  onClick={() => {
                    onChangeEditingThemeId(null);
                    setDraft(createCustomTheme('My Theme', 'light'));
                    setNotice(null);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border ${modalTheme.inputBg} ${modalTheme.cardBorder} ${modalTheme.text} text-xs font-semibold hover:opacity-90`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Theme
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border ${modalTheme.inputBg} ${modalTheme.cardBorder} ${modalTheme.text} text-xs font-semibold hover:opacity-90`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Theme File
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  multiple
                  className="hidden"
                  onChange={e => {
                    void handleFiles(e.target.files);
                    e.target.value = '';
                  }}
                />

                <p className={`text-[10px] leading-snug ${modalTheme.textMuted}`}>
                  Drag a <code>.lumina-theme.json</code> file anywhere on this dialog to upload it.
                </p>
              </div>
            </aside>

            {/* ---- Editor ---- */}
            <section className="p-4 sm:p-5 space-y-5">

              {notice && (
                <div
                  className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                    notice.kind === 'ok'
                      ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
                      : 'bg-red-500/12 text-red-600 dark:text-red-300'
                  }`}
                >
                  {notice.kind === 'ok' ? (
                    <Check className="w-4 h-4 shrink-0 mt-px" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                  )}
                  <span>{notice.text}</span>
                </div>
              )}

              {/* Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${modalTheme.textMuted} mb-1.5`}>
                    Theme Name
                  </label>
                  <input
                    value={draft.name}
                    maxLength={60}
                    onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Midnight Coffee"
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${modalTheme.inputBg} ${modalTheme.inputBorder} ${modalTheme.inputText} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${modalTheme.textMuted} mb-1.5`}>
                    Description
                  </label>
                  <input
                    value={draft.description}
                    maxLength={140}
                    onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Warm dark palette for late-night reading"
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${modalTheme.inputBg} ${modalTheme.inputBorder} ${modalTheme.inputText} focus:outline-none`}
                  />
                </div>
              </div>

              {/* Start from a built-in */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider ${modalTheme.textMuted} mb-1.5`}>
                  Start From
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BUILT_IN_THEME_IDS.map(id => (
                    <button
                      key={id}
                      onClick={() => startFrom(id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${modalTheme.inputBg} ${modalTheme.cardBorder} ${modalTheme.text} hover:opacity-90`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: BUILT_IN_PALETTES[id].bg }}
                      />
                      {classNameThemeMap[id].name}
                    </button>
                  ))}

                  <button
                    onClick={autoBalance}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${modalTheme.accentBorder} ${modalTheme.accentIcon} hover:opacity-90`}
                    title="Recalculate accent text and active-line color for readability"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Auto-Balance
                  </button>
                </div>
              </div>

              {/* Colors + Preview */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* Color pickers */}
                <div className="space-y-2">
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${modalTheme.textMuted}`}>
                    Colors
                  </div>

                  {PALETTE_FIELDS.map(field => (
                    <div
                      key={field.key}
                      className={`flex items-center gap-3 px-2.5 py-2 rounded-xl border ${modalTheme.inputBg} ${modalTheme.cardBorder}`}
                    >
                      <input
                        type="color"
                        value={normalizeHex(p[field.key]) || '#000000'}
                        onChange={e => updatePalette(field.key, e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer shrink-0 p-0"
                        aria-label={field.label}
                      />

                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-semibold ${modalTheme.text} truncate`}>{field.label}</div>
                        <div className={`text-[10px] ${modalTheme.textMuted} truncate`}>{field.hint}</div>
                      </div>

                      <input
                        value={p[field.key]}
                        onChange={e => updatePalette(field.key, e.target.value)}
                        onBlur={e => commitPalette(field.key, e.target.value)}
                        spellCheck={false}
                        className={`w-24 px-2 py-1.5 rounded-lg border font-mono text-[11px] uppercase ${modalTheme.cardBg} ${modalTheme.inputBorder} ${
                          normalizeHex(p[field.key]) ? modalTheme.inputText : 'text-red-500 border-red-500'
                        } focus:outline-none`}
                      />
                    </div>
                  ))}

                  <label className={`flex items-center justify-between px-2.5 py-2 rounded-xl border ${modalTheme.inputBg} ${modalTheme.cardBorder} cursor-pointer`}>
                    <span className="min-w-0">
                      <span className={`block text-xs font-semibold ${modalTheme.text}`}>Dark Theme</span>
                      <span className={`block text-[10px] ${modalTheme.textMuted}`}>
                        Tunes hover shades and input backgrounds
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={draft.isDark}
                      onChange={e => setDraft(prev => ({ ...prev, isDark: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600 shrink-0"
                    />
                  </label>
                </div>

                {/* Live preview */}
                <div className="space-y-2">
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${modalTheme.textMuted}`}>
                    Live Preview
                  </div>

                  <div
                    className="rounded-2xl border overflow-hidden shadow-inner"
                    style={{ backgroundColor: p.bg, borderColor: p.border }}
                  >
                    {/* Mock header */}
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 border-b"
                      style={{ backgroundColor: p.surface, borderColor: p.border }}
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: p.accent, color: p.accentText }}
                      >
                        VAT
                      </span>
                      <span className="text-xs font-bold" style={{ color: p.text }}>
                        {draft.name || 'Untitled Theme'}
                      </span>
                      <span
                        className="ml-auto px-2 py-1 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: p.accent, color: p.accentText }}
                      >
                        Open Files
                      </span>
                    </div>

                    {/* Mock transcript */}
                    <div className="p-3 space-y-2">
                      <div
                        className="rounded-xl border p-2.5"
                        style={{ backgroundColor: p.surface, borderColor: p.border }}
                      >
                        <p className="text-[11px] leading-relaxed" style={{ color: p.text }}>
                          The quiet hum of the projector filled the empty theater.
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: p.textMuted }}>
                          00:01:12 — 00:01:16
                        </p>
                      </div>

                      <div
                        className="rounded-xl border-2 p-2.5 shadow-sm"
                        style={{ backgroundColor: p.highlight, borderColor: p.accent }}
                      >
                        <p className="text-[11px] leading-relaxed font-semibold" style={{ color: p.text }}>
                          This line is playing right now.
                        </p>
                        <span
                          className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{ backgroundColor: p.accent, color: p.accentText }}
                        >
                          00:01:17
                        </span>
                      </div>

                      <div
                        className="rounded-xl border p-2.5"
                        style={{ backgroundColor: p.surface, borderColor: p.border }}
                      >
                        <p className="text-[11px] leading-relaxed" style={{ color: p.text }}>
                          And the reel kept turning, long after the credits.
                        </p>
                      </div>
                    </div>

                    {/* Mock player bar */}
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 border-t"
                      style={{ backgroundColor: p.surface, borderColor: p.border }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: p.accent, color: p.accentText }}
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </span>
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center border"
                        style={{ borderColor: p.border, color: p.textMuted }}
                      >
                        <Play className="w-3.5 h-3.5" />
                      </span>

                      <span className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: p.border }}>
                        <span className="block h-full w-1/3 rounded-full" style={{ backgroundColor: p.accent }} />
                      </span>

                      <BookmarkIcon className="w-3.5 h-3.5" style={{ color: p.textMuted }} />
                    </div>
                  </div>

                  {/* Readability warnings */}
                  {contrastIssues.length > 0 && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Low contrast
                      </div>
                      {contrastIssues.map(issue => (
                        <p key={issue.label} className="text-[10px] text-amber-700 dark:text-amber-200/90">
                          {issue.label}:{' '}
                          {contrastRatio(draft.palette[issue.fg], draft.palette[issue.bg]).toFixed(1)}:1
                          {' '}(aim for {issue.min}:1)
                        </p>
                      ))}
                      <p className="text-[10px] text-amber-700 dark:text-amber-200/90">
                        Auto-Balance can fix the accent and active-line pairs.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer actions */}
        <div className={`p-3 sm:p-4 border-t ${modalTheme.cardBorder} ${modalTheme.headerBg} flex flex-wrap items-center gap-2`}>
          <button
            onClick={() => downloadTheme({ ...draft, name: draft.name.trim() || 'My Theme' })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${modalTheme.inputBg} ${modalTheme.cardBorder} ${modalTheme.text} text-xs font-semibold hover:opacity-90`}
            title="Download this theme as a shareable .json file"
          >
            <Download className="w-3.5 h-3.5" />
            Export File
          </button>

          {!isNewTheme && (
            <>
              <button
                onClick={handleDuplicate}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${modalTheme.inputBg} ${modalTheme.cardBorder} ${modalTheme.text} text-xs font-semibold hover:opacity-90`}
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/40 text-red-500 text-xs font-semibold hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}

          <div className="flex-1" />

          <button
            onClick={() => handleSave(false)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${modalTheme.inputBg} ${modalTheme.cardBorder} ${modalTheme.text} text-xs font-semibold hover:opacity-90`}
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>

          <button
            onClick={() => handleSave(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl ${modalTheme.accentBg} ${modalTheme.accentText} text-xs font-bold shadow-md`}
          >
            <Check className="w-3.5 h-3.5" />
            Save &amp; Apply
          </button>
        </div>
      </div>
    </div>
  );
};
