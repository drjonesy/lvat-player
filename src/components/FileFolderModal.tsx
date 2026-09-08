import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  FolderPlus,
  FileVideo,
  FileAudio,
  FileText,
  Check,
  Upload,
  Sparkles,
  Plus,
  Trash2,
  FolderOpen,
  ChevronRight,
  Layers,
  Film,
  Headphones,
  Ban,
} from 'lucide-react';
import { MediaGroup, PrimarySource, ThemeMode } from '../types';
import { getThemeConfig } from '../utils/theme';
import {
  ACCEPTED_EXTENSIONS,
  appendFilesToGroup,
  buildGroupsFromFiles,
  canSwitchPrimary,
  getBaseName,
  removeTrack,
  selectTrack,
  setPrimary,
} from '../utils/mediaGroups';

/** How the next dropped batch of files should be turned into groups. */
type AddMode = 'auto' | 'single';

interface FileFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: MediaGroup[];
  activeGroupId: string | null;
  onAddGroups: (groups: MediaGroup[]) => void;
  onUpdateGroup: (group: MediaGroup) => void;
  onDeleteGroup: (id: string) => void;
  onSelectGroup: (group: MediaGroup) => void;
  themeMode: ThemeMode;
}

export const FileFolderModal: React.FC<FileFolderModalProps> = ({
  isOpen,
  onClose,
  groups,
  activeGroupId,
  onAddGroups,
  onUpdateGroup,
  onDeleteGroup,
  onSelectGroup,
  themeMode,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>('auto');
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(activeGroupId);

  const themeConfig = getThemeConfig(themeMode);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const appendInputRef = useRef<HTMLInputElement | null>(null);
  /** Set right before opening the append picker; read when it fires back. */
  const appendTargetRef = useRef<string | null>(null);

  const acceptAttr = useMemo(
    () => ACCEPTED_EXTENSIONS.map(e => `.${e}`).join(','),
    [],
  );

  if (!isOpen) return null;

  // -------------------------------------------------------------------------
  // File intake
  // -------------------------------------------------------------------------

  const processNewFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setStatus('Analyzing files…');

    const { groups: built, ignoredCount } = await buildGroupsFromFiles(
      Array.from(files),
      addMode,
      newGroupTitle,
    );

    if (built.length === 0) {
      setStatus('No supported video, audio, or subtitle files found.');
      setIsProcessing(false);
      return;
    }

    onAddGroups(built);
    onSelectGroup(built[0]);
    setExpandedGroupId(built[0].id);
    setNewGroupTitle('');
    setStatus(
      `Created ${built.length} group${built.length === 1 ? '' : 's'}` +
        (ignoredCount ? ` — skipped ${ignoredCount} unsupported file(s).` : '.'),
    );
    setIsProcessing(false);
  };

  const processAppendedFiles = async (files: FileList | File[]) => {
    const target = groups.find(g => g.id === appendTargetRef.current);
    appendTargetRef.current = null;
    if (!target) return;

    setIsProcessing(true);
    setStatus(`Adding files to “${target.title}”…`);

    const { group, added, ignoredCount } = await appendFilesToGroup(
      target,
      Array.from(files),
    );

    onUpdateGroup(group);
    setStatus(
      added
        ? `Added ${added} track(s) to “${group.title}”` +
            (ignoredCount ? ` — skipped ${ignoredCount} unsupported file(s).` : '.')
        : 'No supported files in that selection.',
    );
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) processNewFiles(e.dataTransfer.files);
  };

  const openAppendPicker = (groupId: string) => {
    appendTargetRef.current = groupId;
    appendInputRef.current?.click();
  };

  // -------------------------------------------------------------------------
  // Shared row styles
  // -------------------------------------------------------------------------

  const trackRowClass = (selected: boolean) =>
    `w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] text-left transition-colors ${
      selected
        ? `${themeConfig.activeCueBg} ${themeConfig.activeCueText} font-semibold`
        : `${themeConfig.text} ${themeConfig.accentHoverBg}`
    }`;

  const slotLabelClass = `text-[10px] font-bold uppercase tracking-wider ${themeConfig.textMuted} px-1 pt-2 pb-1 flex items-center gap-1.5`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`${themeConfig.cardBg} border ${themeConfig.cardBorder} ${themeConfig.text} rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] transition-colors`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b ${themeConfig.cardBorder} flex items-center justify-between ${themeConfig.cardBg}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl ${themeConfig.inputBg} border ${themeConfig.accentBorder} flex items-center justify-center ${themeConfig.accentIcon}`}
            >
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-base ${themeConfig.text}`}>Media Groups</h3>
              <p className={`text-xs ${themeConfig.textMuted}`}>
                Bundle a title's video, audio and subtitle files, then switch between them
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 ${themeConfig.textMuted} ${themeConfig.accentHoverBg} rounded-lg transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Grouping strategy */}
          <div>
            <h4 className={`font-bold text-[11px] ${themeConfig.textMuted} uppercase tracking-wider mb-2`}>
              How should dropped files be grouped?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => setAddMode('auto')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  addMode === 'auto'
                    ? `${themeConfig.accentBorder} ${themeConfig.activeCueBg} ${themeConfig.activeCueText}`
                    : `${themeConfig.cardBorder} ${themeConfig.inputBg} ${themeConfig.text} ${themeConfig.accentHoverBg}`
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-group by name
                </div>
                <p className="text-[10px] mt-1 opacity-75 leading-snug">
                  One group per title. <span className="font-mono">talk.mp4</span> +{' '}
                  <span className="font-mono">talk.mp3</span> + <span className="font-mono">talk.en.srt</span> land
                  together.
                </p>
              </button>

              <button
                onClick={() => setAddMode('single')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  addMode === 'single'
                    ? `${themeConfig.accentBorder} ${themeConfig.activeCueBg} ${themeConfig.activeCueText}`
                    : `${themeConfig.cardBorder} ${themeConfig.inputBg} ${themeConfig.text} ${themeConfig.accentHoverBg}`
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Layers className="w-3.5 h-3.5" />
                  One new group
                </div>
                <p className="text-[10px] mt-1 opacity-75 leading-snug">
                  Everything you select goes into a single group, whatever the file names are.
                </p>
              </button>
            </div>

            {addMode === 'single' && (
              <input
                value={newGroupTitle}
                onChange={e => setNewGroupTitle(e.target.value)}
                placeholder="Group name (optional — defaults to the first file's name)"
                className={`mt-2 w-full px-3 py-2 rounded-xl text-xs ${themeConfig.inputBg} border ${themeConfig.cardBorder} ${themeConfig.text} outline-none focus:${themeConfig.accentBorder}`}
              />
            )}
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging
                ? `${themeConfig.accentBorder} ${themeConfig.accentHoverBg} scale-[1.01]`
                : `${themeConfig.cardBorder} ${themeConfig.inputBg}`
            }`}
          >
            <div
              className={`w-12 h-12 mx-auto mb-3 rounded-full ${themeConfig.cardBg} border ${themeConfig.cardBorder} flex items-center justify-center ${themeConfig.accentIcon}`}
            >
              <Upload className="w-6 h-6" />
            </div>
            <p className={`text-sm font-semibold ${themeConfig.text}`}>
              Drop video, audio and subtitle files here
            </p>
            <p className={`text-xs ${themeConfig.textMuted} mt-1 max-w-md mx-auto`}>
              Supports{' '}
              <span className={`${themeConfig.accentIcon} font-mono`}>
                .mp4, .webm, .mov, .mp3, .m4a, .wav, .flac, .srt, .vtt, .txt, .lrc
              </span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl ${themeConfig.accentBg} ${themeConfig.accentText} text-xs font-semibold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50`}
              >
                <Plus className="w-4 h-4" />
                Select Files
              </button>

              <button
                onClick={() => folderInputRef.current?.click()}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl ${themeConfig.cardBg} ${themeConfig.text} border ${themeConfig.cardBorder} ${themeConfig.accentHoverBg} text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50`}
              >
                <FolderOpen className={`w-4 h-4 ${themeConfig.accentIcon}`} />
                Select Folder
              </button>
            </div>

            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptAttr}
              onChange={e => {
                if (e.target.files) processNewFiles(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              /* @ts-ignore -- non-standard, Chromium/WebKit only */
              webkitdirectory=""
              directory=""
              multiple
              onChange={e => {
                if (e.target.files) processNewFiles(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
            <input
              ref={appendInputRef}
              type="file"
              multiple
              accept={acceptAttr}
              onChange={e => {
                if (e.target.files) processAppendedFiles(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>

          {status && (
            <div
              className={`p-3 ${themeConfig.inputBg} border ${themeConfig.accentBorder} rounded-xl text-xs ${themeConfig.text} flex items-center gap-2`}
            >
              <Sparkles className={`w-4 h-4 ${themeConfig.accentIcon}`} />
              <span>{status}</span>
            </div>
          )}

          {/* Group library */}
          <div>
            <h4 className={`font-bold text-xs ${themeConfig.textMuted} uppercase tracking-wider mb-3`}>
              Groups ({groups.length})
            </h4>

            <div className="space-y-2">
              {groups.map(group => {
                const isActive = group.id === activeGroupId;
                const isExpanded = group.id === expandedGroupId;
                const counts = [
                  group.videoTracks.length && `${group.videoTracks.length} video`,
                  group.audioTracks.length && `${group.audioTracks.length} audio`,
                  group.subtitleTracks.length && `${group.subtitleTracks.length} transcript`,
                ].filter(Boolean).join(' · ') || 'empty';

                return (
                  <div
                    key={group.id}
                    className={`rounded-xl border transition-colors ${
                      isActive
                        ? `${themeConfig.accentBorder} ${themeConfig.inputBg}`
                        : `${themeConfig.cardBorder} ${themeConfig.inputBg}`
                    }`}
                  >
                    {/* Group summary row */}
                    <div className="p-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left"
                      >
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ${themeConfig.textMuted} transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                        <div
                          className={`p-2 rounded-lg ${themeConfig.cardBg} border ${themeConfig.cardBorder} ${themeConfig.accentIcon} shrink-0`}
                        >
                          {group.primary === 'video' ? (
                            <FileVideo className="w-4 h-4" />
                          ) : (
                            <FileAudio className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-semibold text-xs truncate ${themeConfig.text}`}>
                            {group.title}
                          </div>
                          <div className={`text-[11px] ${themeConfig.textMuted} truncate`}>{counts}</div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {isActive ? (
                          <span
                            className={`${themeConfig.activeCueBadge} text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm`}
                          >
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectGroup(group);
                              onClose();
                            }}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${themeConfig.accentBg} ${themeConfig.accentText} transition-colors`}
                          >
                            Play
                          </button>
                        )}
                        {groups.length > 1 && (
                          <button
                            onClick={() => onDeleteGroup(group.id)}
                            className={`p-1 ${themeConfig.textMuted} hover:text-rose-500 rounded transition-colors`}
                            title="Remove group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded track manager */}
                    {isExpanded && (
                      <div className={`px-3 pb-3 border-t ${themeConfig.cardBorder} pt-1`}>
                        {/* Primary source switch */}
                        {canSwitchPrimary(group) && (
                          <>
                            <div className={slotLabelClass}>Primary source</div>
                            <div className={`flex gap-1 p-1 rounded-xl ${themeConfig.cardBg} border ${themeConfig.cardBorder}`}>
                              {(['video', 'audio'] as PrimarySource[]).map(kind => (
                                <button
                                  key={kind}
                                  onClick={() => onUpdateGroup(setPrimary(group, kind))}
                                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                                    group.primary === kind
                                      ? `${themeConfig.accentBg} ${themeConfig.accentText} shadow-sm`
                                      : `${themeConfig.textMuted} ${themeConfig.accentHoverBg}`
                                  }`}
                                >
                                  {kind === 'video' ? (
                                    <Film className="w-3.5 h-3.5" />
                                  ) : (
                                    <Headphones className="w-3.5 h-3.5" />
                                  )}
                                  {kind}
                                </button>
                              ))}
                            </div>
                            <p className={`text-[10px] ${themeConfig.textMuted} mt-1.5 px-1 leading-snug`}>
                              Only the primary source plays. Switching keeps your current timestamp.
                            </p>
                          </>
                        )}

                        {/* Video tracks */}
                        {group.videoTracks.length > 0 && (
                          <>
                            <div className={slotLabelClass}>
                              <Film className="w-3 h-3" /> Video ({group.videoTracks.length})
                            </div>
                            {group.videoTracks.map(track => (
                              <div key={track.id} className="flex items-center gap-1">
                                <button
                                  onClick={() => onUpdateGroup(selectTrack(group, 'video', track.id))}
                                  className={trackRowClass(group.activeVideoId === track.id)}
                                >
                                  <FileVideo className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate flex-1">{track.label}</span>
                                  {group.activeVideoId === track.id && (
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                </button>
                                <button
                                  onClick={() => onUpdateGroup(removeTrack(group, 'video', track.id))}
                                  className={`p-1 ${themeConfig.textMuted} hover:text-rose-500 rounded transition-colors shrink-0`}
                                  title="Remove track"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Audio tracks */}
                        {group.audioTracks.length > 0 && (
                          <>
                            <div className={slotLabelClass}>
                              <Headphones className="w-3 h-3" /> Audio ({group.audioTracks.length})
                            </div>
                            {group.audioTracks.map(track => (
                              <div key={track.id} className="flex items-center gap-1">
                                <button
                                  onClick={() => onUpdateGroup(selectTrack(group, 'audio', track.id))}
                                  className={trackRowClass(group.activeAudioId === track.id)}
                                >
                                  <FileAudio className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate flex-1">{track.label}</span>
                                  {group.activeAudioId === track.id && (
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                </button>
                                <button
                                  onClick={() => onUpdateGroup(removeTrack(group, 'audio', track.id))}
                                  className={`p-1 ${themeConfig.textMuted} hover:text-rose-500 rounded transition-colors shrink-0`}
                                  title="Remove track"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Subtitle tracks */}
                        <div className={slotLabelClass}>
                          <FileText className="w-3 h-3" /> Subtitles ({group.subtitleTracks.length})
                        </div>
                        {group.subtitleTracks.length > 0 && (
                          <button
                            onClick={() => onUpdateGroup(selectTrack(group, 'subtitle', null))}
                            className={trackRowClass(group.activeSubtitleId === null)}
                          >
                            <Ban className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate flex-1">None</span>
                            {group.activeSubtitleId === null && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        )}
                        {group.subtitleTracks.map(track => (
                          <div key={track.id} className="flex items-center gap-1">
                            <button
                              onClick={() => onUpdateGroup(selectTrack(group, 'subtitle', track.id))}
                              className={trackRowClass(group.activeSubtitleId === track.id)}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate flex-1">{track.label}</span>
                              <span className="opacity-60 shrink-0">{track.cues.length} cues</span>
                              {group.activeSubtitleId === track.id && (
                                <Check className="w-3.5 h-3.5 shrink-0" />
                              )}
                            </button>
                            <button
                              onClick={() => onUpdateGroup(removeTrack(group, 'subtitle', track.id))}
                              className={`p-1 ${themeConfig.textMuted} hover:text-rose-500 rounded transition-colors shrink-0`}
                              title="Remove transcript"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {group.subtitleTracks.length === 0 && (
                          <p className={`text-[11px] ${themeConfig.textMuted} px-2.5 py-1.5`}>
                            No transcript loaded for this group.
                          </p>
                        )}

                        <button
                          onClick={() => openAppendPicker(group.id)}
                          disabled={isProcessing}
                          className={`mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed ${themeConfig.cardBorder} ${themeConfig.textMuted} ${themeConfig.accentHoverBg} text-[11px] font-semibold transition-colors disabled:opacity-50`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add files to “{getBaseName(group.title)}”
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t ${themeConfig.cardBorder} ${themeConfig.cardBg} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl ${themeConfig.accentBg} ${themeConfig.accentText} text-xs font-semibold transition-colors`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
