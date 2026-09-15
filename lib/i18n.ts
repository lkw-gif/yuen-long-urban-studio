import ui from './ui-en.json';
import { TOWER_STEPS, TOWER_STEP_SOURCE_INDICES } from './tower-lesson';
import { TOWER_STEP_EN } from './tower-lesson.en';

export type Language = 'zh-Hant' | 'en';
export const english: Record<string, string> = { ...ui };
const fields = ['title', 'where', 'action', 'expect', 'help'] as const;
const cleanEnglish: Record<number, Partial<Record<(typeof fields)[number], string>>> = {
  6: {
    help: 'You can also enter Width (W), Length (D) and Height (H) in the Box panel, as in the live screenshot. H is the height of the object; keep dimensions separate from ruler distances.',
  },
  7: {
    expect: 'Selecting an object now displays its dimensions and ruler distances.',
    help: 'Keep the default endpoint measurement mode. Dimensions sit near the object; distances connect it to the ruler.',
  },
  9: {
    action: 'Drag in a new Box. Set only its dimensions: W=20, D=20, H=108.',
  },
  10: { expect: 'The two horizontal directions are aligned.' },
  12: {
    where: 'The Box on the right and its dimension values.',
    action: 'Drag in a Box. Set only its dimensions: W=12, D=16, H=104.',
    help: 'The wing should touch the tower and rest on the thin base.',
  },
  13: {
    action: 'Select only the left wing and duplicate it once. Keep the new copy selected, move it to the right and keep the same height.',
    help: 'A narrow window may put the button in the top ⋯ menu. Widen the window or use Ctrl+D / ⌘D. Copies initially overlap: move the copy; if you move the original, Undo and duplicate again.',
  },
  14: {
    action: 'Deselect, select the right wing and duplicate it once. Hold Shift while dragging the bottom rotation arrow in 45° increments to 90°.',
    help: 'Turn it on the workplane; do not lay the tall column down. Undo if you use the wrong axis. Check the completed direction in the 3D demonstration.',
  },
  15: {
    action: 'Deselect and reselect the front wing to break the previous repeat transformation. Duplicate once, move the copy to the rear and keep the same height.',
    help: 'If an object sticks beyond the base, check each wing individually; do not move the entire building.',
  },
  16: {
    where: 'The Box on the right; enter its dimensions after selecting it.',
    action: 'Add a Box. Set only W=10, D=10 and H=4.3, then place it on the central tower roof.',
    help: 'The service room height is H=4.3. If you cannot see it, click Home and zoom towards the roof.',
  },
  20: {
    action: 'Add a Hole Box. Set only W=3.2, D=1.1 and H=2.',
  },
  21: {
    action: 'Duplicate once, move the new copy to the right and keep the same height. Leave the new copy selected.',
    expect: 'Two windows sit at the same height, with a 5 mm horizontal gap.',
  },
  22: {
    expect: 'A row of three holes is complete.',
    help: 'If the copy overlaps, move it to the right. Repeating a transformation requires the last copy to remain selected; selecting another object breaks the sequence.',
  },
  25: {
    where: 'Select the whole hole row, then duplicate it upwards.',
    action: 'Duplicate the row and move the new copy upwards by 4 mm. Leave the copy selected.',
    help: 'Change the bottom elevation, not the hole height H; H stays at 2. If the row gets taller, Undo and adjust its elevation.',
  },
  26: {
    action: 'Duplicate once to make sure the third row is separated, then repeat 23 times without deselecting. Finish with 26 rows in total.',
    expect: 'The front facade has 26 rows of three holes: 78 holes.',
    help: 'If there is an extra row, Undo once. If the third row overlaps, adjust the second row height. Do not repeat many times before checking.',
  },
  27: {
    expect: 'All 78 holes form one selectable facade group.',
    help: 'If 27 objects appear, the building may still be visible. Deselect, hide the building and select all again.',
  },
  28: {
    action: 'Deselect, reselect the front hole group and duplicate it once. Rotate 90° on the workplane (−90° also works). Click Show all to compare with the building.',
    help: 'Check the result in the 3D demonstration. If the windows lie horizontally, you used the wrong axis; Undo.',
  },
  29: {
    action: 'Select the blue building and hide it again with Hide selected. Deselect, select the right hole group, duplicate it and move it to the left. Do not rotate again.',
    help: 'Both sides use the same rectangular holes, so duplication and movement are enough.',
  },
  30: {
    action: 'Keep the building hidden. Deselect, select the front hole group and duplicate it once; move it to the rear. Click Show all to reveal the building again.',
  },
  32: {
    action: 'Check W=48, D=48 and H=114.3. Rotate to confirm all four window facades, the rooftop room and base remain.',
    help: 'An oversized bounding box may mean an extra copy was left outside. Undo to before grouping, check each facade and group again. The basic version has the same overall dimensions.',
  },
};
TOWER_STEPS.forEach((step, index) => fields.forEach((field, column) => {
  const sourceIndex = TOWER_STEP_SOURCE_INDICES[index];
  const source = TOWER_STEP_EN[sourceIndex];
  const value = cleanEnglish[sourceIndex]?.[field] ?? source[column];
  english[step[field].replace(/\s+/g, ' ').trim()] = value;
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
