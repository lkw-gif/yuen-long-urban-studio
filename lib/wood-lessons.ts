import { SCHOOL_PANELS, SCHOOL_STAGES, SCHOOL_UI, type Bilingual, type SchoolPanelGroup, type SchoolStage } from './wood-school-lesson';
import { MALL_PANELS, MALL_STAGES, MALL_UI } from './wood-mall-lesson';

export type WoodLessonId = 'school' | 'mall';
export type WoodLesson = {
  id: WoodLessonId;
  modelId: 'W4' | 'W3';
  name: Bilingual;
  ui: Record<keyof typeof SCHOOL_UI, Bilingual>;
  panels: SchoolPanelGroup[];
  stages: SchoolStage[];
  modules: Partial<Record<'A' | 'B' | 'C', Bilingual>>;
};

export const WOOD_LESSONS: Record<WoodLessonId, WoodLesson> = {
  school: {
    id: 'school', modelId: 'W4', name: { zh: 'L 形學校', en: 'L-shaped school' },
    ui: SCHOOL_UI, panels: SCHOOL_PANELS,
    stages: [SCHOOL_STAGES[0], SCHOOL_STAGES[3], SCHOOL_STAGES[1], SCHOOL_STAGES[2], SCHOOL_STAGES[4], SCHOOL_STAGES[5]],
    modules: { A: SCHOOL_UI.rear, B: SCHOOL_UI.wing },
  },
  mall: {
    id: 'mall', modelId: 'W3', name: { zh: '三層商場', en: 'Three-level shopping mall' },
    ui: MALL_UI, panels: MALL_PANELS, stages: MALL_STAGES,
    modules: { A: { zh: 'A 下層', en: 'A Lower level' }, B: { zh: 'B 中層', en: 'B Middle level' }, C: { zh: 'C 上層', en: 'C Upper level' } },
  },
};

export const WOOD_UI = {
  boxCount: { zh: '6 塊木板', en: '6 panels' },
  choose: { zh: '選擇木板建築教學', en: 'Choose a wooden-building lesson' },
  viewerLabel: { zh: '木板建築 3D 組裝模型。拖曳旋轉，滾輪縮放，按 Home 重設。', en: 'Wooden-building 3D assembly model. Drag to rotate, scroll to zoom, Home to reset.' },
  inventoryHelp: { zh: '按下區塊名稱，在拆件模型中查看該組板件。尺寸為單件切割尺寸。', en: 'Select a block name to view that panel group in the exploded model. Dimensions are for one cut piece.' },
};
