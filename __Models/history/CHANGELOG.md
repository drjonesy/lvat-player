# Changelog

Newest entries on top.

---

## 2026-08-05 — Media Groups: bundle video + audio + subtitles, switch primary source

**Files touched**
- `src/types.ts`
- `src/utils/mediaGroups.ts` (new)
- `src/utils/sampleData.ts`
- `src/components/FileFolderModal.tsx`
- `src/components/SourceSwitcher.tsx` (new)
- `src/components/Header.tsx`
- `src/components/MobileDrawer.tsx`
- `src/App.tsx`

**What**
- New `MediaGroup` storage model: one title holds `videoTracks[]`, `audioTracks[]` and
  `subtitleTracks[]`, plus a `primary: 'video' | 'audio'` and an active id per slot.
- Sources are *alternatives*, never simultaneous — exactly one track feeds the media
  element. Switching primary carries the current playback position across.
- Open Files modal rewritten: pick a grouping strategy (auto-group by name, or one new
  group), expand any group to pick which video / audio / subtitle track is active,
  remove individual tracks, or append more files to an existing group.
- `SourceSwitcher` — a Video/Audio segmented control in the header and mobile drawer.
  Renders only when the active group actually holds both kinds of track.
- Subtitles can be set to "None" explicitly; the other two slots always resolve to a
  track when one exists.

**Why**
`MediaItem` was one file + one subtitle track, so a title's video cut and its audio-only
rendition were two unrelated library rows with no way to move between them.

**Key locations**
- `src/utils/mediaGroups.ts` — `resolveGroup()` flattens a group into the `MediaItem`
  shape every player/reader component already consumes, so `VideoPlayerView`,
  `AudioBookReaderView`, `AudioPlayerBar` and `MediaSelector` needed no changes. The
  resolved id is the *group* id, keeping selection and bookmarks working.
- `src/utils/mediaGroups.ts` — `normalizeGroup()` is the single place group invariants
  are enforced (every `active*Id` points at a real track; `primary` points at a slot
  that has one). Every structural edit funnels through it.
- `src/utils/mediaGroups.ts` — `normalizeTitleKey()` strips quality/language suffixes and
  separators so `talk.mp4`, `talk.mp3` and `talk.en.srt` bucket together under `auto`.
- `src/App.tsx` — `resumeTimeRef` mirrors `currentTime` and restores it whenever the
  media element is remounted or re-sourced. Reset to 0 only when a different group is
  selected.
- `src/App.tsx` — the element-event effect now depends on `activeSrc` and `mode`. Both
  swap the underlying node; without those deps the listeners stayed bound to a detached
  element (pre-existing bug, surfaced by source switching). Volume/rate are re-applied on
  the same trigger for the same reason.
- `src/App.tsx` — `handleModeChange()` links view and source one way: entering video view
  requires a video source, but the reader view renders against either.

---

## 2026-08-05 — Custom Theme Studio (create, save, export, upload)

**Files touched**
- `src/types.ts`
- `src/utils/color.ts` (new)
- `src/utils/customThemes.ts` (new)
- `src/utils/theme.ts`
- `src/context/CustomThemeContext.tsx` (new)
- `src/components/ThemeStudioModal.tsx` (new)
- `src/components/ThemeSelector.tsx`
- `src/components/MobileDrawer.tsx`
- `src/components/ReaderSettingsModal.tsx`
- `src/App.tsx`

**What**
- New Theme Studio dialog: pick 8 colors, name/describe a theme, live preview of header,
  transcript, active line and player bar, WCAG contrast warnings, Auto-Balance helper.
- Custom themes save to `localStorage`, appear alongside the 5 built-ins in every theme
  picker (header dropdown, mobile drawer, reader settings grid).
- Export a theme to a `.lumina-theme.json` file; upload one back via file picker or by
  dragging it onto the dialog. Import accepts the wrapped export format, a bare theme
  object, or an array of either.
- Selected theme now persists across reloads.

**Why**
Built-in themes were a closed set — `ThemeMode` was a fixed union and every theme was a
hardcoded map of Tailwind class strings, so users had no way to add their own.

**Key locations**
- `src/utils/theme.ts` — `CUSTOM_THEME_CLASSES` is a static class template referencing
  `--lt-*` CSS variables. Tailwind compiles class names at build time, so a runtime hex
  can never become `bg-[#abc123]`; instead all custom themes share these classes and only
  the variable *values* change. Verified present in the built CSS bundle.
- `src/utils/theme.ts` — `buildCustomThemeVars()` derives hover shades, translucent
  surfaces, ring and input colors from the 8 picked colors.
- `src/utils/theme.ts` — module-level custom theme registry so the dozen components that
  call `getThemeConfig(id)` resolve custom ids without prop drilling.
- `src/context/CustomThemeContext.tsx` — owns theme state, syncs the registry during
  render, writes `--lt-*` onto `:root` for the active theme, and falls back to `light`
  if the stored theme id no longer exists.
- `src/utils/customThemes.ts` — storage, validation (`sanitizeTheme` rejects anything
  without a full valid-hex palette), file parse/serialize, download.
