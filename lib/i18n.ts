import ui from './ui-en.json';
import { TOWER_STEPS } from './tower-lesson';
import { TOWER_STEP_EN } from './tower-lesson.en';

export type Language = 'zh-Hant' | 'en';
export const english: Record<string, string> = { ...ui };
const fields = ['title', 'where', 'action', 'expect', 'help'] as const;
TOWER_STEPS.forEach((step, index) => fields.forEach((field, column) => {
  english[step[field].replace(/\s+/g, ' ').trim()] = TOWER_STEP_EN[index][column];
}));
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fragments = new RegExp(Object.keys(english).sort((a, b) => b.length - a.length).map(escape).join('|'), 'g');

/** Translate authored text, including names within dynamic labels; never change IDs or data. */
export function translateText(value: string, language: Language): string {
  if (language !== 'en' || !/[\u3400-\u9fff]/.test(value)) return value;
  const normalized = value.replace(/\s+/g, ' ').trim();
  const leading = /^\s/.test(value) ? ' ' : '';
  const trailing = /\s$/.test(value) ? ' ' : '';
  if (english[normalized]) return leading + english[normalized] + trailing;
  return leading + normalized.replace(fragments, (match, offset: number) => {
    const before = normalized[offset - 1] ?? '';
    const after = normalized[offset + match.length] ?? '';
    return (/[\p{L}\p{N}]/u.test(before) ? ' ' : '') + english[match] + (/[\p{L}\p{N}]/u.test(after) ? ' ' : '');
  }).replace(/「/g, '“').replace(/」/g, '”').replace(/：/g, ': ').replace(/，/g, ', ').replace(/。/g, '. ').replace(/\s+/g, ' ') + trailing;
}
