'use client';

import { lazy, Suspense, useRef, useState } from 'react';
import { Box, ArrowLeft, ArrowRight, Ruler, Clock3, PackageOpen, Layers3, CheckCircle2, Printer, Lightbulb, Eye } from 'lucide-react';
import { StudioNav } from '@/components/studio-nav';
import { BRIDGE_STEPS, BRIDGE_MATERIALS } from '@/lib/bridge-lesson';
import { sitePath } from '@/lib/site-path';
const BridgeLessonViewer = lazy(() => import('@/components/bridge-lesson-viewer'));

export default function BridgeWorkshop() {
  const [step, setStep] = useState(0), [exploded, setExploded] = useState(false), [highlight, setHighlight] = useState(true);
  const modelPanel = useRef<HTMLElement>(null);
  const lesson = BRIDGE_STEPS[step];
  function choose(next: number) {
    setStep(next);
    if (window.matchMedia('(max-width: 980px)').matches) modelPanel.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <main className="bridge-workshop">
    <header className="main-header"><a className="brand" href={sitePath('/')} aria-label="回到元朗街區"><Box size={30}/><strong>街區<span>URBAN<br/>STUDIO</span></strong></a><StudioNav current="bridge"/><a className="workshop-material-link" href="#materials" aria-label="材料清單"><PackageOpen size={17}/><span>材料清單</span></a></header>
    <div className="workshop-content">
      <div className="workshop-intro"><div><div className="eyebrow">MAKER LAB / 01</div><h1>把天橋，親手做出來。</h1><p>牙籤 × 木板 × 透明上蓋。跟著八個步驟，從平面圖走到立體社區。</p></div><div className="workshop-facts"><span><Ruler size={16}/>橋面 200 × 60 mm</span><span><Clock3 size={16}/>建議 3–4 節課＋膠水乾燥</span></div></div>
      <nav className="lesson-steps" aria-label="天橋製作步驟">{BRIDGE_STEPS.map((item, index) => <button key={item.title} aria-current={step === index ? 'step' : undefined} aria-label={`第 ${index + 1} 步：${item.title}`} onClick={() => choose(index)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong></button>)}</nav>
      <div className="lesson-workspace">
        <section ref={modelPanel} className="lesson-model-panel" aria-label="本步驟的 3D 示範">
          <div className="lesson-model-toolbar"><span><Box size={17}/>動手之前，先看模型</span><div><button aria-pressed={exploded} onClick={() => setExploded(!exploded)}><Layers3 size={16}/>分解視圖</button><button aria-pressed={highlight} onClick={() => setHighlight(!highlight)}><Eye size={16}/>本步重點</button></div></div>
          <Suspense fallback={<output className="bridge-viewer bridge-loading-shell">正在準備互動示範…</output>}><BridgeLessonViewer step={step} exploded={exploded} highlight={highlight} title={lesson.title}/></Suspense>
          <div className="lesson-look"><Eye size={18}/><p>{lesson.look}</p></div>
          <p className="lesson-controls">拖曳旋轉 · 滾輪縮放 · 右鍵／雙指平移<br/>點一下模型，可用方向鍵、＋／− 及 Home 操作。</p>
        </section>
        <section className="lesson-instructions" aria-labelledby="lesson-title">
          <div className="lesson-step-heading"><span>第 {step + 1} 步 / 8</span><small><Clock3 size={14}/>{lesson.time}</small></div>
          <h2 id="lesson-title" aria-live="polite">{lesson.title}</h2><p className="lesson-aim">{lesson.aim}</p>
          <div className="lesson-spec"><strong>拿出這些材料</strong><p>{lesson.materials}</p><strong><Ruler size={15}/>尺寸筆記</strong><p>{lesson.dimensions}</p></div>
          <ol className="lesson-actions">{lesson.actions.map(action => <li key={action}>{action}</li>)}</ol>
          <div className="lesson-check"><CheckCircle2 size={20}/><div><strong>做到這樣，才進下一步</strong><p>{lesson.check}</p></div></div>
          <div className="lesson-tip"><Lightbulb size={19}/><p>{lesson.tip}</p></div>
          <div className="lesson-pagination"><button disabled={step === 0} onClick={() => choose(step - 1)}><ArrowLeft size={17}/>上一步</button><span>{step + 1} / 8</span>{step < 7 ? <button className="lesson-next" onClick={() => choose(step + 1)}>下一步<ArrowRight size={17}/></button> : <button className="lesson-next" onClick={() => window.print()}><Printer size={17}/>列印檢查表</button>}</div>
        </section>
      </div>
      <section id="materials" className="workshop-materials"><div className="materials-heading"><div><div className="eyebrow">BEFORE YOU BUILD</div><h2>材料與裁切表</h2></div><button onClick={() => window.print()}><Printer size={17}/>列印整份教學</button></div><p>以一座展示天橋計算。先試拼再上膠；所有尺寸均為 mm，木條與牙籤依實際接合位置微調。</p><div className="materials-table-wrap"><table><caption className="sr-only">一座天橋所需材料、尺寸和替代選擇</caption><thead><tr><th scope="col">材料</th><th scope="col">尺寸與數量</th><th scope="col">準備方法／替代選擇</th></tr></thead><tbody>{BRIDGE_MATERIALS.map(([name, count, note]) => <tr key={name}><th scope="row">{name}</th><td>{count}</td><td>{note}</td></tr>)}</tbody></table></div>
      <div className="workshop-notes"><div><h3>把乾燥時間算進課堂</h3><p>建議第一節備料和橋墩、第二節橋面和側框、第三節頂架和屋頂、第四節連接及檢查；每節約 45 分鐘，另留乾燥時間。以使用的膠水標籤為準，先試黏廢料；可先夾固並留至下一節，未完全乾燥不施力。<a href="https://titebond.com/resources/use/glues" target="_blank" rel="noreferrer">木工膠使用參考 ↗</a></p></div><div><h3>學生製作，老師協助裁切</h3><p>學生可量度、試拼、薄塗膠與修飾。厚卡、木板及亞加力請老師用合適工具處理；牙籤尖端修鈍。透明屋頂首選預裁片，並在課前確認邊緣平滑。<a href="https://www.acrylite.co/resources/fabrication-manuals/cutting-acrylite-acrylic" target="_blank" rel="noreferrer">亞加力廠商加工參考 ↗</a></p></div></div>
      </section>
      <section className="lesson-print-all"><h2>八步製作與檢查表</h2>{BRIDGE_STEPS.map((item, i) => <article key={item.title}><h3>{i + 1}. {item.title}</h3><p>{item.dimensions}</p><ol>{item.actions.map(action => <li key={action}>{action}</li>)}</ol><p>□ {item.check}</p><p>{item.tip}</p></article>)}</section>
      <footer className="workshop-footer">桌面展示模型 · 結構與接點為教學示意 · 3D 顯示不代表承載測試結果</footer>
    </div>
  </main>;
}
