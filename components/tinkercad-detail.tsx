'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- These labelled SVG diagrams cannot be represented by an img element. */
/* oxlint-disable next/no-img-element -- These are unaltered historical reference crops with explicit provenance. */
import { useState } from 'react';
import { TowerStep, TINKERCAD_SOURCES } from '@/lib/tower-lesson';
import { sitePath } from '@/lib/site-path';

export function TinkercadDetail({ step }: { step: TowerStep }) {
  const [height, setHeight] = useState<'H' | 'Z'>(
    step.diagram === 'position' ? 'Z' : 'H',
  );
  const kind = step.diagram;
  const example =
    kind === 'dimensions'
      ? ['official-box-dimensions.png', '白色小方點 → 顯示尺寸數字']
      : kind === 'selection'
        ? ['official-align-selected.png', '先多選，才可對齊／群組']
        : kind === 'hole'
          ? ['official-solid-hole-panel.png', 'Solid 是實體，Hole 是挖空工具']
          : null;
  return (
    <div className="tc-detail">
      <div className="tc-detail-label">操作示意 · 配合本步數值使用</div>
      {(kind === 'dimensions' || kind === 'position') && (
        <>
          <div className="tc-height-tabs">
            <button
              aria-pressed={height === 'H'}
              onClick={() => setHeight('H')}
            >
              H 物件有多高
            </button>
            <button
              aria-pressed={height === 'Z'}
              onClick={() => setHeight('Z')}
            >
              Z 底部離地多高
            </button>
          </div>
          <svg
            className="tc-dimension-diagram"
            viewBox="0 0 570 280"
            role="img"
            aria-label={
              height === 'H'
                ? '尺寸示意：H 是物件頂到底的高度，W 是左右寬，D 是前後深'
                : '位置示意：Z 是物件底部到工作平面的距離；X 向右，Y 向後'
            }
          >
            <defs>
              <marker
                id="tc-arrow"
                markerWidth="6"
                markerHeight="6"
                refX="3"
                refY="3"
                orient="auto-start-reverse"
              >
                <path d="M6 3 0 0 0 6z" fill="#cf8126" />
              </marker>
            </defs>
            <path
              d="M50 226 368 226 508 136 190 136z"
              fill="#e6f1fa"
              stroke="#b4cddd"
            />
            <path
              d="M207 69 329 69 380 39 259 39z"
              fill="#89abeb"
              stroke="#456cb4"
            />
            <path d="M207 69 329 69 329 181 207 181z" fill="#315eaf" />
            <path d="M329 69 380 39 380 152 329 181z" fill="#214891" />
            <path
              d="M207 181V211M329 181V211"
              stroke="#859db9"
              strokeDasharray="4 3"
            />
            {height === 'H' ? (
              <>
                <path
                  d="M176 75V177"
                  stroke="#cf8126"
                  strokeWidth="3"
                  markerStart="url(#tc-arrow)"
                  markerEnd="url(#tc-arrow)"
                />
                <text x="43" y="119">
                  H 物件高度
                </text>
                <text x="43" y="141" className="tc-svg-small">
                  頂部 → 底部
                </text>
                <path
                  d="M214 201H321"
                  stroke="#cf8126"
                  strokeWidth="2"
                  markerStart="url(#tc-arrow)"
                  markerEnd="url(#tc-arrow)"
                />
                <text x="245" y="222">
                  W 寬
                </text>
                <path
                  d="M346 189 395 160"
                  stroke="#cf8126"
                  strokeWidth="2"
                  markerStart="url(#tc-arrow)"
                  markerEnd="url(#tc-arrow)"
                />
                <text x="397" y="187">
                  D 深
                </text>
              </>
            ) : (
              <>
                <path
                  d="M175 183V216"
                  stroke="#cf8126"
                  strokeWidth="3"
                  markerStart="url(#tc-arrow)"
                  markerEnd="url(#tc-arrow)"
                />
                <text x="33" y="178">
                  Z 底部離地
                </text>
                <text x="33" y="198" className="tc-svg-small">
                  整件升起
                </text>
                <path
                  d="M78 224H169M78 224 149 180"
                  stroke="#7193ae"
                  strokeWidth="2"
                />
                <circle cx="78" cy="224" r="4" fill="#cf8126" />
                <text x="83" y="249">
                  尺規原點
                </text>
                <text x="174" y="238">
                  X 向右
                </text>
                <text x="93" y="171">
                  Y 向後
                </text>
              </>
            )}
            <text x="391" y="238" className="tc-svg-small">
              工作平面（Z=0）
            </text>
          </svg>
          <p className="tc-diagram-note">
            點白色控制點，再點數字輸入尺寸。尺規連到原點的數字是位置距離；先看清標示，再按
            Enter。
          </p>
        </>
      )}
      {kind === 'rotation' && (
        <>
          <svg
            className="tc-rotation-diagram"
            viewBox="0 0 570 265"
            role="img"
            aria-label="俯視旋轉示意：在工作平面上轉90度，12乘16變成16乘12，高度不變"
          >
            <path d="M20 30H550V222H20z" fill="#e9f1f8" stroke="#c4d5e4" />
            <text x="33" y="54">
              TOP 俯視
            </text>
            <rect x="88" y="76" width="72" height="104" fill="#285cba" />
            <rect x="364" y="92" width="104" height="72" fill="#285cba" />
            <path
              d="M204 162C200 50 344 49 342 126"
              fill="none"
              stroke="#cc842d"
              strokeWidth="5"
            />
            <path
              d="m326 110 17 21 17-22"
              fill="none"
              stroke="#cc842d"
              strokeWidth="5"
            />
            <text x="249" y="142">
              90°
            </text>
            <text x="78" y="207">
              旋轉前
            </text>
            <text x="369" y="207">
              旋轉後
            </text>
            <text x="111" y="248">
              用底部彎箭頭；保持大樓直立，先轉再輸入 X／Y。
            </text>
          </svg>
          <p className="tc-diagram-note">
            這是方向示意。住宅翼的 12 × 16 會變成 16 × 12；孔洞群組則由 13.2 ×
            1.1 變成 1.1 × 13.2。
          </p>
        </>
      )}
      {kind === 'export' && (
        <div className="tc-export-diagram">
          <div>
            <span>1</span>
            <strong>選中自己的大樓</strong>
            <small>只匯出完成模型</small>
          </div>
          <b>↓</b>
          <div>
            <span>2</span>
            <strong>Export → .STL</strong>
            <small>在 Tinkercad 右上開啟匯出</small>
          </div>
          <b>↓</b>
          <div>
            <span>3</span>
            <strong>下載 → 老師檢查</strong>
            <small>毫米 · 底座朝下 · 114.3 mm 高</small>
          </div>
        </div>
      )}
      {example && (
        <figure className="tc-official-example">
          <img src={sitePath('/tinkercad/' + example[0])} alt={example[1]} />
          <figcaption>
            <strong>{example[1]}</strong>
            <span>較早版本的官方操作示例；圖中數字不是本課尺寸。</span>
            <a href={TINKERCAD_SOURCES.guide} target="_blank" rel="noreferrer">
              來源：Tinkercad 官方指南，第 7 頁 ↗
            </a>
          </figcaption>
        </figure>
      )}
      {kind === 'selection' && (
        <p className="tc-diagram-note">
          先點空白處取消選取，再按住 Shift
          逐件點選。只在需要「全部一起」的步驟用 Ctrl+A／⌘A。Align
          只按本步要求方向的中央黑點。
        </p>
      )}
      {kind === 'hole' && (
        <p className="tc-diagram-note">
          Hole 先保留為切割工具；與 Solid 一起做 Union group
          才挖空。選藍色時，請打開 Solid 色圓。
        </p>
      )}
    </div>
  );
}
