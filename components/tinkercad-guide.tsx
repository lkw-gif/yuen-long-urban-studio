'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG contains an image and an annotated locator, labelled as a single graphic. */
/* oxlint-disable next/no-img-element -- Display the user's original editor reference without image transformations. */
import { useState } from 'react';
import { TowerStep, TOOL_SPOTS } from '@/lib/tower-lesson';
import { TinkercadDetail } from '@/components/tinkercad-detail';
import { sitePath } from '@/lib/site-path';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
export function TinkercadGuide({
  step,
  stepNumber,
}: {
  step: TowerStep;
  stepNumber: number;
}) {
  const tool = step.tool;
  const [live, setLive] = useState(true);
  const [open, setOpen] = useState(false);
  const capture = sitePath(
    `/tinkercad/live/step-${String(stepNumber).padStart(2, '0')}.jpg`,
  );
  const caption = [24, 25, 26, 27, 28, 30].includes(stepNumber)
    ? '大樓暫時隱藏，方便選取及複製窗洞。'
    : stepNumber === 36
      ? 'Tinkercad 完成模型；STL 已匯出，尚未實體打印。'
      : '點圖片放大，查看實際按鈕、選取狀態與尺寸。';
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
        <span>① {live ? 'Tinkercad 實作截圖' : '按鈕位置參考'}</span>
        <div>
          <button aria-pressed={live} onClick={() => setLive(!live)}>
            {live ? '找按鈕' : '實作截圖'}
          </button>
          {live && <button onClick={() => setOpen(true)}>放大查看</button>}
          {!live && step.diagram && (
            <button aria-pressed={detail} onClick={() => setDetail(!detail)}>
              {detail ? '工具位置' : '操作近鏡'}
            </button>
          )}
          {!live && !detail && (
            <button onClick={() => setZoom(!zoom)}>
              {zoom ? '顯示全圖' : '放大位置'}
            </button>
          )}
        </div>
      </div>
      {live ? (
        <>
          <button
            className="tc-live-capture"
            onClick={() => setOpen(true)}
            aria-label={`放大步驟 ${stepNumber}：${step.title}的實作截圖`}
          >
            <img
              src={capture}
              alt={`步驟 ${stepNumber}：${step.title}，Tinkercad 真實操作畫面`}
            />
          </button>
          <div className="tc-spot-label">
            <strong>
              STEP {String(stepNumber).padStart(2, '0')} · {step.title}
            </strong>
            <span>{caption}</span>
          </div>
        </>
      ) : detail && step.diagram ? (
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="tc-capture-dialog">
          <DialogTitle>
            STEP {String(stepNumber).padStart(2, '0')} · {step.title}
          </DialogTitle>
          <DialogDescription>
            {caption} 截圖中的數字請配合下方操作指示辨認。
          </DialogDescription>
          <img src={capture} alt={`${step.title}的完整 Tinkercad 實作截圖`} />
          <a href={capture} target="_blank" rel="noreferrer">
            開啟原始截圖 ↗
          </a>
        </DialogContent>
      </Dialog>
    </div>
  );
}
