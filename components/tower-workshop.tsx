'use client';
import { lazy, Suspense, useState } from 'react';
import {
  Box,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { StudioNav } from '@/components/studio-nav';
import { TinkercadGuide } from '@/components/tinkercad-guide';
import {
  TOWER_CHAPTERS,
  TOWER_STEPS,
  TINKERCAD_SOURCES,
} from '@/lib/tower-lesson';
import { sitePath } from '@/lib/site-path';
const TowerViewer = lazy(() => import('@/components/tower-viewer'));
export default function TowerWorkshop() {
  const [index, setIndex] = useState(0),
    [finished, setFinished] = useState(true);
  const step = TOWER_STEPS[index];
  const select = (next: number) => {
    setIndex(next);
    setFinished(false);
  };
  return (
    <main className="tower-workshop">
      <header className="main-header">
        <a className="brand" href={sitePath('/')}>
          <Box size={28} />
          <strong>
            街區
            <span>
              URBAN
              <br />
              STUDIO
            </span>
          </strong>
        </a>
        <StudioNav current="design" />
      </header>
      <div className="tc-content">
        <div className="tc-heading">
          <div>
            <span>3D DESIGN / TINKERCAD</span>
            <h1>從第一個方塊，到藍色住宅大樓</h1>
            <p>
              8 個階段 · 36 個小步驟 · 在 Tinkercad 動手做，與本頁 3D
              示範逐步對照。
            </p>
          </div>
          <a href="https://www.tinkercad.com/" target="_blank" rel="noreferrer">
            開啟 Tinkercad
            <ExternalLink size={16} />
          </a>
        </div>
        <nav className="tc-chapters" aria-label="建模階段">
          {TOWER_CHAPTERS.map((name, i) => (
            <button
              key={name}
              aria-current={step.chapter === i ? 'step' : undefined}
              onClick={() =>
                select(TOWER_STEPS.findIndex((s) => s.chapter === i))
              }
            >
              <span>0{i + 1}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className="tc-step-navigation">
          <label>
            目前步驟
            <select
              aria-label="選擇教學小步驟"
              value={index}
              onChange={(e) => select(Number(e.target.value))}
            >
              {TOWER_STEPS.map((s, i) => (
                <option key={s.title} value={i}>
                  {String(i + 1).padStart(2, '0')} · {s.title}
                </option>
              ))}
            </select>
          </label>
          <span>
            {index + 1} / {TOWER_STEPS.length}
          </span>
        </div>
        <div className="tc-visuals">
          <TinkercadGuide key={index} step={step} />
          <div className="tc-model-panel">
            <div className="tc-panel-bar">
              <span>② 對照 3D 模型</span>
              <button
                aria-pressed={finished}
                onClick={() => setFinished(!finished)}
              >
                {finished ? '切回本步' : '看完成效果'}
              </button>
            </div>
            <Suspense
              fallback={
                <output className="tc-model-loading">正在建立 3D 模型…</output>
              }
            >
              <TowerViewer
                stage={finished ? 21 : step.stage}
                title={finished ? '完成效果' : step.title}
                allowDownload={index === TOWER_STEPS.length - 1}
              />
            </Suspense>
          </div>
        </div>
        <section className="tc-instruction" aria-labelledby="tc-step-title">
          <div className="tc-instruction-title">
            <span>STEP {String(index + 1).padStart(2, '0')}</span>
            <h2 id="tc-step-title" aria-live="polite">
              {step.title}
            </h2>
          </div>
          <div className="tc-action-grid">
            <div>
              <h3>位置</h3>
              <p>{step.where}</p>
            </div>
            <div>
              <h3>現在做這個動作</h3>
              <p>{step.action}</p>
            </div>
            <div className="tc-result">
              <h3>
                <CheckCircle2 size={18} />
                應有結果
              </h3>
              <p>{step.expect}</p>
            </div>
          </div>
          {step.values && (
            <div className="tc-values">
              {step.values.map((v) => (
                <div key={v.label}>
                  <span>{v.label}</span>
                  <strong>{v.value}</strong>
                </div>
              ))}
            </div>
          )}
          <details className="tc-help" key={index}>
            <summary>我做不到／找不到按鈕</summary>
            <p>{step.help}</p>
          </details>
          <div className="tc-pagination">
            <button disabled={!index} onClick={() => select(index - 1)}>
              <ArrowLeft size={17} />
              上一步
            </button>
            <span>
              {index === TOWER_STEPS.length - 1
                ? '完成！你已走過整個建模流程。'
                : '在 Tinkercad 完成後再繼續'}
            </span>
            <button
              disabled={index === TOWER_STEPS.length - 1}
              onClick={() => select(index + 1)}
            >
              下一步
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
        <footer className="tc-sources">
          <span>介面參考：你上載的截圖及官方示例。操作示意另有標示。</span>
          <a
            href={TINKERCAD_SOURCES.shortcuts}
            target="_blank"
            rel="noreferrer"
          >
            官方快捷鍵 ↗
          </a>
          <a
            href={TINKERCAD_SOURCES.tutorials}
            target="_blank"
            rel="noreferrer"
          >
            官方入門教學 ↗
          </a>
        </footer>
      </div>
    </main>
  );
}
