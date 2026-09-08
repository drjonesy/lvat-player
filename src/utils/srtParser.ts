import { SubtitleCue } from '../types';

/**
 * Parses time string (e.g. "00:01:20,500" or "01:20.500" or "80.5") into seconds
 */
export function parseTimestamp(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanStr = timeStr.trim().replace(',', '.');
  
  // Format HH:MM:SS.mmm or MM:SS.mmm
  const parts = cleanStr.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else {
    return parseFloat(cleanStr) || 0;
  }
}

/**
 * Formats seconds into "HH:MM:SS" or "MM:SS"
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const minsStr = String(mins).padStart(2, '0');
  const secsStr = String(secs).padStart(2, '0');

  if (hrs > 0) {
    const hrsStr = String(hrs).padStart(2, '0');
    return `${hrsStr}:${minsStr}:${secsStr}`;
  }
  return `${minsStr}:${secsStr}`;
}

/**
 * Helper to strip HTML tags like <i>, <b>, <font> from subtitles
 */
export function cleanSubtitleText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\{[^}]*\}/g, '')
    .trim();
}

/**
 * Main parser for subtitle/transcript files (.srt, .vtt, .lrc, .txt)
 */
export function parseSubtitleContent(content: string, fileName?: string): SubtitleCue[] {
  const isVtt = content.trim().startsWith('WEBVTT') || (fileName && fileName.endsWith('.vtt'));
  const isLrc = (fileName && fileName.endsWith('.lrc')) || /\[\d{2}:\d{2}\.\d{2}\]/.test(content);

  if (isLrc) {
    return parseLRC(content);
  }

  if (isVtt || content.includes('-->')) {
    return parseSrtOrVtt(content);
  }

  // Fallback for plain TXT file without standard subtitle timestamps
  return parsePlainText(content);
}

function parseSrtOrVtt(content: string): SubtitleCue[] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const cues: SubtitleCue[] = [];

  let currentCue: Partial<SubtitleCue> | null = null;
  let textBuffer: string[] = [];
  let cueIdCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip WEBVTT header and NOTE lines
    if (line.startsWith('WEBVTT') || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      continue;
    }

    // Timestamp arrow line detection (e.g. 00:00:01.000 --> 00:00:04.000)
    if (line.includes('-->')) {
      // If we had a previous cue, commit it
      if (currentCue && currentCue.start !== undefined && textBuffer.length > 0) {
        cues.push({
          id: cueIdCounter++,
          start: currentCue.start,
          end: currentCue.end ?? (currentCue.start + 3),
          text: cleanSubtitleText(textBuffer.join(' ')),
        });
        textBuffer = [];
      }

      const [startStr, endAndRest] = line.split('-->');
      const endStr = endAndRest ? endAndRest.trim().split(' ')[0] : '';

      currentCue = {
        start: parseTimestamp(startStr),
        end: parseTimestamp(endStr),
      };
      textBuffer = [];
      continue;
    }

    // If we're inside a cue block and line is non-empty and not just an index number
    if (currentCue && line !== '') {
      // Check if line is purely digits (index number), skip if textBuffer is empty
      if (/^\d+$/.test(line) && textBuffer.length === 0) {
        continue;
      }
      textBuffer.push(line);
    } else if (line === '' && currentCue && currentCue.start !== undefined) {
      if (textBuffer.length > 0) {
        cues.push({
          id: cueIdCounter++,
          start: currentCue.start,
          end: currentCue.end ?? (currentCue.start + 3),
          text: cleanSubtitleText(textBuffer.join(' ')),
        });
      }
      currentCue = null;
      textBuffer = [];
    }
  }

  // Handle final cue if file doesn't end with a blank line
  if (currentCue && currentCue.start !== undefined && textBuffer.length > 0) {
    cues.push({
      id: cueIdCounter++,
      start: currentCue.start,
      end: currentCue.end ?? (currentCue.start + 3),
      text: cleanSubtitleText(textBuffer.join(' ')),
    });
  }

  return cues.filter(c => c.text.length > 0);
}

function parseLRC(content: string): SubtitleCue[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const rawEntries: { time: number; text: string }[] = [];

  const lrcRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  lines.forEach(line => {
    let match;
    const matches: number[] = [];
    let text = line;

    while ((match = lrcRegex.exec(line)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const timeInSec = min * 60 + sec + ms / 1000;
      matches.push(timeInSec);
      text = text.replace(match[0], '');
    }

    const cleanText = cleanSubtitleText(text);
    if (matches.length > 0 && cleanText) {
      matches.forEach(t => rawEntries.push({ time: t, text: cleanText }));
    }
  });

  rawEntries.sort((a, b) => a.time - b.time);

  return rawEntries.map((entry, idx) => {
    const nextTime = rawEntries[idx + 1] ? rawEntries[idx + 1].time : entry.time + 4;
    return {
      id: idx + 1,
      start: entry.time,
      end: Math.max(entry.time + 1, nextTime),
      text: entry.text,
    };
  });
}

function parsePlainText(content: string): SubtitleCue[] {
  // Split content into paragraphs or sentences
  const paragraphs = content
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const cues: SubtitleCue[] = [];
  let currentTime = 0;
  let id = 1;

  paragraphs.forEach(p => {
    // Break very long paragraphs into ~25 word chunks
    const words = p.split(/\s+/);
    const chunkSize = 25;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkText = words.slice(i, i + chunkSize).join(' ');
      const wordCount = words.slice(i, i + chunkSize).length;
      // Estimate 2.5 words per second
      const duration = Math.max(2.5, wordCount / 2.5);

      cues.push({
        id: id++,
        start: currentTime,
        end: currentTime + duration,
        text: chunkText,
      });

      currentTime += duration;
    }
  });

  return cues;
}
