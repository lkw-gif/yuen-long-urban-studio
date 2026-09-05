'use client';
import { lazy, Suspense, useState } from 'react';
import { Box, ArrowLeft, ArrowRight, Layers3, Eye } from 'lucide-react';
import { StudioNav } from '@/components/studio-nav';
import { BRIDGE_STEPS } from '@/lib/bridge-lesson';
import { sitePath } from '@/lib/site-path';
const BridgeLessonViewer = lazy(() => import('@/components/bridge-lesson-viewer'));

export default function BridgeWorkshop() {
  const [step, setStep] = useState(0);
  const [exploded, setExploded] = useState(false), [highlight, setHighlight] = useState(false);
  return <main className="bridge-workshop">
    <header className="main-header"><a className="brand" href={sitePath('/')} aria-label="回到元朗街區"><Box size={30}/><strong>街區<span>URBAN<br/>STUDIO</span></strong></a><StudioNav current="bridge"/></header>
    <div className="bridge-step-header"><h1>香港天橋製作</h1><div className="bridge-display-options">
      <button aria-pressed={exploded} onClick={() => setExploded(!exploded)}><Layers3 size={16}/>分解視圖</button>
      <button aria-pressed={highlight} onClick={() => setHighlight(!highlight)}><Eye size={16}/>本步重點</button>
    </div></div>
    <nav className="lesson-steps" aria-label="天橋建模步驟">{BRIDGE_STEPS.map((item, i) => <button key={item.title} aria-current={step === i ? 'step' : undefined} aria-label={`第 ${i + 1} 步：${item.title}`} onClick={() => setStep(i)}><span>{String(i + 1).padStart(2, '0')}</span><strong>{item.title}</strong></button>)}</nav>
    <section className="lesson-model-panel" aria-label="天橋步驟模型"><Suspense fallback={<output className="bridge-viewer bridge-loading-shell">正在準備 3D 模型…</output>}><BridgeLessonViewer step={step} exploded={exploded} highlight={highlight} title={BRIDGE_STEPS[step].title}/></Suspense></section>
    <nav className="lesson-pagination" aria-label="切換建模步驟"><button disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={17}/>上一步</button><span aria-live="polite">{String(step + 1).padStart(2, '0')} / 08</span><button disabled={step === 7} onClick={() => setStep(step + 1)}>下一步<ArrowRight size={17}/></button></nav>
  </main>;
}
