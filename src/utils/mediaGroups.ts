import {
  MediaGroup,
  MediaItem,
  MediaTrack,
  PrimarySource,
  SubtitleTrack,
} from '../types';
import { parseSubtitleContent } from './srtParser';

const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'mkv', 'm4v', 'ogv'];
const AUDIO_EXTS = ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'oga', 'flac', 'opus'];
const SUBTITLE_EXTS = ['srt', 'vtt', 'txt', 'lrc'];

export const ACCEPTED_EXTENSIONS = [
  ...VIDEO_EXTS,
  ...AUDIO_EXTS,
  ...SUBTITLE_EXTS,
];

export type FileKind = 'video' | 'audio' | 'subtitle' | 'unsupported';

const extensionOf = (filename: string) =>
  filename.split('.').pop()?.toLowerCase() ?? '';

export const getBaseName = (filename: string) =>
  filename.substring(0, filename.lastIndexOf('.')) || filename;

export const classifyFile = (filename: string): FileKind => {
  const ext = extensionOf(filename);
  if (VIDEO_EXTS.includes(ext)) return 'video';
  if (AUDIO_EXTS.includes(ext)) return 'audio';
  if (SUBTITLE_EXTS.includes(ext)) return 'subtitle';
  return 'unsupported';
};

let idCounter = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

/**
 * Strip the noise that stops two files for the same title from matching:
 * language/quality suffixes, separators, bracketed tags.
 */
const normalizeTitleKey = (name: string) =>
  getBaseName(name)
    .toLowerCase()
    .replace(/[\[(].*?[\])]/g, ' ')
    .replace(/\b(1080p|720p|480p|2160p|4k|hd|sd|hevc|x26[45]|aac|mp3)\b/g, ' ')
    .replace(/\b(en|eng|english|es|spa|spanish|fr|fre|french|de|ger|german|jp|jpn|japanese)\b$/g, ' ')
    .replace(/[._\-\s]+/g, ' ')
    .trim();

// ---------------------------------------------------------------------------
// Track construction
// ---------------------------------------------------------------------------

export const createMediaTrack = (file: File, kind: PrimarySource): MediaTrack => ({
  id: nextId(`track-${kind}`),
  kind,
  label: getBaseName(file.name),
  src: URL.createObjectURL(file),
  fileName: file.name,
});

export const createSubtitleTrack = async (file: File): Promise<SubtitleTrack> => {
  const text = await file.text();
  return {
    id: nextId('track-sub'),
    label: getBaseName(file.name),
    cues: parseSubtitleContent(text, file.name),
    fileName: file.name,
  };
};

export const createEmptyGroup = (title: string): MediaGroup => ({
  id: nextId('group'),
  title,
  videoTracks: [],
  audioTracks: [],
  subtitleTracks: [],
  primary: 'video',
  activeVideoId: null,
  activeAudioId: null,
  activeSubtitleId: null,
});

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

/**
 * Force a group back into a coherent state: every `active*Id` points at a
 * track that exists, and `primary` points at a slot that has one. Call this
 * after any structural edit rather than fixing ids at each call site.
 */
export const normalizeGroup = (group: MediaGroup): MediaGroup => {
  const pick = (id: string | null, tracks: { id: string }[]) =>
    tracks.find(t => t.id === id)?.id ?? tracks[0]?.id ?? null;

  const activeVideoId = pick(group.activeVideoId, group.videoTracks);
  const activeAudioId = pick(group.activeAudioId, group.audioTracks);
  const activeSubtitleId = pick(group.activeSubtitleId, group.subtitleTracks);

  let primary = group.primary;
  if (primary === 'video' && !activeVideoId && activeAudioId) primary = 'audio';
  if (primary === 'audio' && !activeAudioId && activeVideoId) primary = 'video';

  return { ...group, primary, activeVideoId, activeAudioId, activeSubtitleId };
};

// ---------------------------------------------------------------------------
// Reading a group
// ---------------------------------------------------------------------------

export const getActiveTrack = (group: MediaGroup): MediaTrack | null => {
  const tracks = group.primary === 'video' ? group.videoTracks : group.audioTracks;
  const activeId = group.primary === 'video' ? group.activeVideoId : group.activeAudioId;
  return tracks.find(t => t.id === activeId) ?? tracks[0] ?? null;
};

export const getActiveSubtitleTrack = (group: MediaGroup): SubtitleTrack | null =>
  group.subtitleTracks.find(t => t.id === group.activeSubtitleId) ?? null;

/** True when the group can meaningfully switch between video and audio. */
export const canSwitchPrimary = (group: MediaGroup): boolean =>
  group.videoTracks.length > 0 && group.audioTracks.length > 0;

export const groupTrackCount = (group: MediaGroup): number =>
  group.videoTracks.length + group.audioTracks.length + group.subtitleTracks.length;

/**
 * Flatten a group into the `MediaItem` every player/reader component already
 * understands. The id stays the *group* id so selection, bookmarks and the
 * playlist dropdown keep working unchanged.
 */
export const resolveGroup = (group: MediaGroup): MediaItem => {
  const track = getActiveTrack(group);
  const subtitle = getActiveSubtitleTrack(group);

  return {
    id: group.id,
    title: group.title,
    author: group.author,
    thumbnailUrl: group.thumbnailUrl,
    mediaType: track?.kind ?? group.primary,
    src: track?.src ?? '',
    fileName: track?.fileName,
    subtitles: subtitle?.cues ?? [],
    subtitleFileName: subtitle?.fileName,
  };
};

// ---------------------------------------------------------------------------
// Writing to a group
// ---------------------------------------------------------------------------

export const setPrimary = (group: MediaGroup, primary: PrimarySource): MediaGroup =>
  normalizeGroup({ ...group, primary });

export const selectTrack = (
  group: MediaGroup,
  kind: 'video' | 'audio' | 'subtitle',
  trackId: string | null,
): MediaGroup => {
  if (kind === 'video') return normalizeGroup({ ...group, activeVideoId: trackId });
  if (kind === 'audio') return normalizeGroup({ ...group, activeAudioId: trackId });
  // Subtitles are the one slot allowed to be empty, so keep the explicit null.
  return { ...group, activeSubtitleId: trackId };
};

export const removeTrack = (
  group: MediaGroup,
  kind: 'video' | 'audio' | 'subtitle',
  trackId: string,
): MediaGroup => {
  const revoke = (src?: string) => {
    if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
  };

  if (kind === 'subtitle') {
    const next = {
      ...group,
      subtitleTracks: group.subtitleTracks.filter(t => t.id !== trackId),
    };
    // Dropping the selected transcript falls back to another one, or to none.
    return group.activeSubtitleId === trackId
      ? { ...next, activeSubtitleId: next.subtitleTracks[0]?.id ?? null }
      : next;
  }

  const key = kind === 'video' ? 'videoTracks' : 'audioTracks';
  revoke(group[key].find(t => t.id === trackId)?.src);
  return normalizeGroup({ ...group, [key]: group[key].filter(t => t.id !== trackId) });
};

/** Release every blob URL a group owns. Call before dropping the group. */
export const releaseGroup = (group: MediaGroup) => {
  [...group.videoTracks, ...group.audioTracks].forEach(t => {
    if (t.src.startsWith('blob:')) URL.revokeObjectURL(t.src);
  });
};

// ---------------------------------------------------------------------------
// Turning dropped files into groups
// ---------------------------------------------------------------------------

interface SortedFiles {
  videos: File[];
  audios: File[];
  subtitles: File[];
  ignored: File[];
}

const sortFiles = (files: File[]): SortedFiles => {
  const sorted: SortedFiles = { videos: [], audios: [], subtitles: [], ignored: [] };
  files.forEach(file => {
    switch (classifyFile(file.name)) {
      case 'video': sorted.videos.push(file); break;
      case 'audio': sorted.audios.push(file); break;
      case 'subtitle': sorted.subtitles.push(file); break;
      default: sorted.ignored.push(file);
    }
  });
  return sorted;
};

export interface BuildResult {
  groups: MediaGroup[];
  ignoredCount: number;
}

/**
 * `single` strategy — every supported file lands in one group. This is what
 * you want when a title's files don't share a naming convention.
 */
export const buildSingleGroup = async (
  files: File[],
  title?: string,
): Promise<BuildResult> => {
  const { videos, audios, subtitles, ignored } = sortFiles(files);
  if (!videos.length && !audios.length && !subtitles.length) {
    return { groups: [], ignoredCount: ignored.length };
  }

  const seed = videos[0] ?? audios[0] ?? subtitles[0];
  const group: MediaGroup = {
    ...createEmptyGroup(title?.trim() || getBaseName(seed.name)),
    videoTracks: videos.map(f => createMediaTrack(f, 'video')),
    audioTracks: audios.map(f => createMediaTrack(f, 'audio')),
    subtitleTracks: await Promise.all(subtitles.map(createSubtitleTrack)),
    // Prefer video when both exist — matches the app's default view.
    primary: videos.length ? 'video' : 'audio',
  };

  return { groups: [normalizeGroup(group)], ignoredCount: ignored.length };
};

/**
 * `auto` strategy — bucket files by normalized base name so `lecture.mp4`,
 * `lecture.mp3` and `lecture.en.srt` land in one group while an unrelated
 * `intro.mp4` gets its own.
 */
export const buildAutoGroups = async (files: File[]): Promise<BuildResult> => {
  const { videos, audios, subtitles, ignored } = sortFiles(files);

  const buckets = new Map<string, { title: string; files: File[] }>();
  const addToBucket = (file: File) => {
    const key = normalizeTitleKey(file.name) || getBaseName(file.name).toLowerCase();
    const bucket = buckets.get(key);
    if (bucket) bucket.files.push(file);
    else buckets.set(key, { title: getBaseName(file.name), files: [file] });
  };

  // Media first so each bucket's title comes from a playable file, not a .srt.
  [...videos, ...audios].forEach(addToBucket);

  const mediaKeys = [...buckets.keys()];
  subtitles.forEach(sub => {
    const key = normalizeTitleKey(sub.name);
    // Fall back to a substring match — `lecture.en.srt` vs `lecture.mp4`.
    const match =
      buckets.has(key)
        ? key
        : mediaKeys.find(k => k && (k.includes(key) || key.includes(k)));
    if (match) buckets.get(match)!.files.push(sub);
    else addToBucket(sub);
  });

  const groups: MediaGroup[] = [];
  for (const { title, files: bucketFiles } of buckets.values()) {
    const built = await buildSingleGroup(bucketFiles, title);
    groups.push(...built.groups);
  }

  return { groups, ignoredCount: ignored.length };
};

/** `append` strategy — fold new files into a group that already exists. */
export const appendFilesToGroup = async (
  group: MediaGroup,
  files: File[],
): Promise<{ group: MediaGroup; added: number; ignoredCount: number }> => {
  const { videos, audios, subtitles, ignored } = sortFiles(files);
  const added = videos.length + audios.length + subtitles.length;

  const next: MediaGroup = {
    ...group,
    videoTracks: [...group.videoTracks, ...videos.map(f => createMediaTrack(f, 'video'))],
    audioTracks: [...group.audioTracks, ...audios.map(f => createMediaTrack(f, 'audio'))],
    subtitleTracks: [
      ...group.subtitleTracks,
      ...(await Promise.all(subtitles.map(createSubtitleTrack))),
    ],
  };

  return { group: normalizeGroup(next), added, ignoredCount: ignored.length };
};

export const buildGroupsFromFiles = async (
  files: File[],
  strategy: 'auto' | 'single',
  title?: string,
): Promise<BuildResult> =>
  strategy === 'auto' ? buildAutoGroups(files) : buildSingleGroup(files, title);
