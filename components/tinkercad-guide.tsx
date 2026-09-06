'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG contains an image and an annotated locator, labelled as a single graphic. */
/* oxlint-disable next/no-img-element -- Display the user's original editor reference without image transformations. */
import { useState } from 'react';
import { TowerStep, TOOL_SPOTS } from '@/lib/tower-lesson';
import { TinkercadDetail } from '@/components/tinkercad-detail';
import { sitePath } from '@/lib/site-path';
export function TinkercadGuide({ step }: { step: TowerStep }) {
  const tool = step.tool;
  const [zoom, setZoom] = useState(false),
    [detail, setDetail] = useState(
      Boolean(step.diagram && ['rotate', 'color', 'workplane'].includes(tool)),
    );
  const spot = TOOL_SPOTS[tool],
    [x, y, w, h] = spot.rect;
  const contextual = ['rotate', 'color'].includes(tool);
  const width = Math.max(w + 190, 560),
    height = Math.max(h + 100, 260);
  const vx = Math.max(0, Math.min(1912 - width, x + w / 2 - width / 2)),
    vy = Math.max(0, Math.min(901 - height, y + h / 2 - height / 2));
  return (
    <div className="tc-guide">
      <div className="tc-panel-bar">
        <span>① 在 Tinkercad 找這裡</span>
        <div>
          {step.diagram && (
            <button aria-pressed={detail} onClick={() => setDetail(!detail)}>
              {detail ? '工具位置' : '操作近鏡'}
            </button>
          )}
          {!detail && (
            <button onClick={() => setZoom(!zoom)}>
              {zoom ? '顯示全圖' : '放大位置'}
            </button>
          )}
        </div>
      </div>
      {detail && step.diagram ? (
        <TinkercadDetail step={step} />
      ) : (
        <>
          <svg
            className="tc-editor-map"
            viewBox={zoom ? `${vx} ${vy} ${width} ${height}` : '0 0 1912 901'}
            role="img"
            aria-label={`使用者提供的 Tinkercad 截圖；${spot.label}的位置`}
          >
            <image
              href={sitePath('/tinkercad/editor.png')}
              width="1912"
              height="901"
            />
            {!contextual && (
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="9"
                fill="#f6b95126"
                stroke="#d88915"
                strokeWidth="8"
              />
            )}
          </svg>
          <div className="tc-spot-label">
            <strong>{spot.label}</strong>
            <span>
              {contextual
                ? '選取物件後才出現；按「操作近鏡」看說明。'
                : '以你提供的介面截圖標示；其他螢幕請按名稱找工具。'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
