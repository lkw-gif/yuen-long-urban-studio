'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG panel diagrams expose their dimensions as accessible images. */
import catalog from '@/lib/district-catalog.json';
import { useLanguage } from '@/components/language-provider';
import { schoolWords } from '@/lib/wood-school-lesson';
import { WOOD_LESSONS, type WoodLessonId } from '@/lib/wood-lessons';
import { WOOD_PANEL_FACES, WOOD_PANEL_NAMES, WOOD_PLAN_UI, woodPanelDrawing, type WoodPanelGeometry, type WoodEngravingGeometry } from '@/lib/wood-panel-plan';

type PlanModel = { panels: WoodPanelGeometry[]; windows: WoodEngravingGeometry[]; boxes: { moduleId: 'A' | 'B' | 'C'; w: number; d: number; h: number }[] };

export default function WoodPanelPlan({ lessonId }: { lessonId: WoodLessonId }) {
  const language = useLanguage();
  const say = (value: { zh: string; en: string }) => schoolWords(value, language);
  const lesson = WOOD_LESSONS[lessonId];
  const model = catalog.models.find(item => item.id === lesson.modelId) as unknown as PlanModel;
  return <div className="wood-panel-plan" aria-label={say(WOOD_PLAN_UI.title)}>
    <p className="wood-plan-units">{say(WOOD_PLAN_UI.units)}</p>
    {model.boxes.map(box => <section className="wood-plan-module" key={box.moduleId} aria-label={say(lesson.modules[box.moduleId]!)}>
      <h3><span>{say(lesson.modules[box.moduleId]!)}</span><small>{box.w} × {box.d} × {box.h} mm</small></h3>
      <div className="wood-plan-grid">{WOOD_PANEL_FACES.map(face => {
        const panel = model.panels.find(item => item.moduleId === box.moduleId && item.face === face)!;
        const { width, height, marks } = woodPanelDrawing(panel, model.windows);
        const scale = 1.55, w = width * scale, h = height * scale;
        const x = (250 - w) / 2 + 9, y = 100 - h / 2;
        const name = `${box.moduleId} · ${say(WOOD_PANEL_NAMES[face])}`;
        const size = `${width} × ${height} mm`;
        return <figure className="wood-plan-panel" key={face}>
          <svg viewBox="0 0 250 185" role="img" aria-label={`${name} · ${size}`}>
            <g className="wood-plan-dimensions" fill="none">
              <path d={`M${x},${y - 17}H${x + w} M${x},${y - 23}V${y - 5} M${x + w},${y - 23}V${y - 5} M${x - 17},${y}V${y + h} M${x - 23},${y}H${x - 5} M${x - 23},${y + h}H${x - 5}`} />
              <path d={`M${x + 6},${y - 20}l-6,3 6,3 M${x + w - 6},${y - 20}l6,3 -6,3 M${x - 20},${y + 6}l3,-6 3,6 M${x - 20},${y + h - 6}l3,6 3,-6`} />
            </g>
            <text x={x + w / 2} y={y - 27} textAnchor="middle">{width} mm</text>
            <text transform={`translate(${x - 28},${y + h / 2}) rotate(-90)`} textAnchor="middle">{height} mm</text>
            <rect x={x} y={y} width={w} height={h} className="wood-plan-board" />
            {marks.map((mark, index) => <rect key={index} x={x + mark.x * scale} y={y + mark.y * scale} width={mark.width * scale} height={mark.height * scale} className="wood-plan-engraving" />)}
          </svg>
          <figcaption><strong>{name}</strong><span>{size}</span></figcaption>
        </figure>;
      })}</div>
    </section>)}
    <p className="wood-plan-note">{say(WOOD_PLAN_UI.scale)}</p>
  </div>;
}
