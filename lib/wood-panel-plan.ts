import type { Bilingual } from './wood-school-lesson';

export type WoodPanelFace = 'base' | 'roof' | 'front' | 'back' | 'left' | 'right';
export type WoodPanelGeometry = { moduleId: 'A' | 'B' | 'C'; face: WoodPanelFace; x: number; y: number; z: number; w: number; d: number; h: number };
export type WoodEngravingGeometry = WoodPanelGeometry & { name: string };

export const WOOD_PANEL_FACES: WoodPanelFace[] = ['front', 'back', 'left', 'right', 'roof', 'base'];
export const WOOD_PANEL_NAMES: Record<WoodPanelFace, Bilingual> = {
  front: { zh: '前牆', en: 'Front wall' }, back: { zh: '後牆', en: 'Back wall' },
  left: { zh: '左牆', en: 'Left wall' }, right: { zh: '右牆', en: 'Right wall' },
  roof: { zh: '頂板', en: 'Roof' }, base: { zh: '底板', en: 'Base' },
};
export const WOOD_PLAN_UI = {
  title: { zh: '板件切割尺寸圖', en: 'Dimensioned cutting panels' },
  units: { zh: '單位：mm · 板厚：2 mm', en: 'Units: mm · Plywood: 2 mm' },
  help: { zh: '尺寸已計入 2 mm 板厚；紅線切割，藍線刻印。', en: 'Sizes include the 2 mm plywood allowance. Cut red outlines; engrave blue lines.' },
  scale: { zh: '按標示尺寸繪圖；螢幕圖示並非 1:1 切割檔。', en: 'Draw to the labelled dimensions; the screen diagram is not a 1:1 cutting file.' },
} satisfies Record<string, Bilingual>;

// Project the actual 3D panel and its surface marks into an upright cutting face.
export function woodPanelDrawing(panel: WoodPanelGeometry, engravings: WoodEngravingGeometry[]) {
  const horizontal = panel.face === 'base' || panel.face === 'roof';
  const side = panel.face === 'left' || panel.face === 'right';
  const width = side ? panel.d : panel.w;
  const height = horizontal ? panel.d : panel.h;
  const marks = engravings.filter(mark => mark.moduleId === panel.moduleId && mark.face === panel.face).map(mark => ({
    name: mark.name,
    x: side ? mark.y - panel.y : mark.x - panel.x,
    y: horizontal ? mark.y - panel.y : panel.z + panel.h - mark.z - mark.h,
    width: side ? mark.d : mark.w,
    height: horizontal ? mark.d : mark.h,
  }));
  return { width, height, marks };
}
