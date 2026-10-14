'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, CheckCircle2, Layers3, MousePointer2, Ruler, Scissors } from 'lucide-react';
import { Localized, useLanguage } from '@/components/language-provider';
import { StudioNav } from '@/components/studio-nav';
import { sitePath } from '@/lib/site-path';
import { schoolWords } from '@/lib/wood-school-lesson';
import { WOOD_LESSONS, WOOD_UI, type WoodLessonId } from '@/lib/wood-lessons';
import WoodPanelPlan from '@/components/wood-panel-plan';
import { WOOD_PLAN_UI } from '@/lib/wood-panel-plan';

const WoodBuildingViewer = lazy(() => import('@/components/wood-building-viewer'));

export default function WoodWorkshop() {
  const language = useLanguage();
  const say = (value: { zh: string; en: string }) => schoolWords(value, language);
  const [stage, setStage] = useState(0);
  const [lessonId, setLessonId] = useState<WoodLessonId>('school');
  const [highlight, setHighlight] = useState<string | undefined>();
  const viewRef = useRef<HTMLElement>(null);
  const lesson = WOOD_LESSONS[lessonId];
  const SCHOOL_UI = lesson.ui;
  const SCHOOL_PANELS = lesson.panels;
  const lessonStages = lesson.stages;
  const current = lessonStages[stage];
  useEffect(() => {
    const restore = () => {
      setLessonId(new URLSearchParams(window.location.search).get('building') === 'mall' ? 'mall' : 'school');
      setStage(0);
      setHighlight(undefined);
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  const selectLesson = (id: WoodLessonId) => {
    setLessonId(id);
    setStage(0);
    setHighlight(undefined);
    const url = new URL(window.location.href);
    url.searchParams.set('building', id);
    window.history.replaceState(window.history.state, '', url);
  };
  const selectStage = (next: number) => {
    setStage(next);
    setHighlight(undefined);
  };
  const selectPanel = (id: string) => {
    setStage(0);
    setHighlight(id === highlight ? undefined : id);
    viewRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return <main className="ls-workshop">
    <header className="main-header">
      <Localized><a className="brand" href={sitePath('/')}><Box size={28} /><strong>元朗街區<span>URBAN<br />STUDIO</span></strong></a></Localized>
      <StudioNav current="wood" />
    </header>
    <div className="ls-page">
      <nav className="ls-lesson-switcher" aria-label={say(WOOD_UI.choose)}>
        {Object.values(WOOD_LESSONS).map(item => <button key={item.id} type="button" aria-pressed={lessonId === item.id} onClick={() => selectLesson(item.id)}>
          <Box size={19} /><span>{say(item.name)}</span><small>{say(item.ui.count)}</small>
        </button>)}
      </nav>
      <section className="ls-intro" aria-labelledby="ls-title">
        <div>
          <span className="ls-kicker">{say(SCHOOL_UI.heroTag)}</span>
          <h1 id="ls-title">{say(SCHOOL_UI.title)}</h1>
          <p>{say(SCHOOL_UI.subtitle)}</p>
        </div>
        <div className="ls-facts" aria-label={say(SCHOOL_UI.size)}>
          <span><Layers3 size={17} />{say(SCHOOL_UI.count)}</span>
          <span><Scissors size={17} />{say(SCHOOL_UI.thickness)}</span>
          <span><Ruler size={17} />{say(SCHOOL_UI.size)}</span>
        </div>
      </section>

      <nav className="ls-stage-nav" data-stage-count={lessonStages.length} aria-label={say(SCHOOL_UI.nav)}>
        {lessonStages.map((item, index) => <button type="button" key={index}
          className={index === stage ? 'active' : ''}
          aria-current={index === stage ? 'step' : undefined}
          onClick={() => selectStage(index)}>
          <span className="ls-stage-number">{String(index + 1).padStart(2, '0')}</span>
          <span>{say(item.title)}</span>
        </button>)}
      </nav>

      <div className={`ls-main-grid${stage === 1 ? ' has-panel-plan' : ''}`}>
        <section className="ls-view-card" ref={viewRef} aria-labelledby="ls-view-title">
          <div className="ls-view-heading">
            <div><span className="ls-overline">{stage === 1 ? 'LASER CUT' : '3D MODEL'} / {String(stage + 1).padStart(2, '0')}</span><h2 id="ls-view-title">{say(stage === 1 ? WOOD_PLAN_UI.title : SCHOOL_UI.viewTitle)}</h2></div>
            <span className="ls-view-step">{say(current.title)}</span>
          </div>
          <div className={`ls-viewer-area${stage === 1 ? ' ls-panel-area' : ''}`}>
            {stage === 1 ? <WoodPanelPlan lessonId={lessonId}/> : <Suspense fallback={<div className="ls-viewer-loading">3D…</div>}>
              <WoodBuildingViewer key={lessonId} lessonId={lessonId} stage={stage} highlight={highlight} />
            </Suspense>}
          </div>
          <div className="ls-view-footer">{stage === 1 ? <Scissors size={16}/> : <MousePointer2 size={16} />}{say(stage === 1 ? WOOD_PLAN_UI.help : SCHOOL_UI.viewHelp)}</div>
        </section>

        <aside className="ls-instructions" aria-live="polite">
          <div className="ls-step-counter">{String(stage + 1).padStart(2, '0')} / {String(lessonStages.length).padStart(2, '0')}</div>
          <h2>{say(current.title)}</h2>
          <p className="ls-step-lead">{say(current.lead)}</p>
          <h3>{say(SCHOOL_UI.actionTitle)}</h3>
          <ol>{current.actions.map((action, index) => <li key={index}>{say(action)}</li>)}</ol>
          <div className="ls-check"><CheckCircle2 size={19} /><div><strong>{say(SCHOOL_UI.checkTitle)}</strong><p>{say(current.check)}</p></div></div>
          <div className="ls-controls">
            <button type="button" disabled={stage === 0} onClick={() => selectStage(stage - 1)}><ArrowLeft size={16} />{say(SCHOOL_UI.previous)}</button>
            <button type="button" disabled={stage === lessonStages.length - 1} onClick={() => selectStage(stage + 1)}>{say(SCHOOL_UI.next)}<ArrowRight size={16} /></button>
          </div>
        </aside>
      </div>

      <section className="ls-inventory" aria-labelledby="ls-inventory-title">
        <div className="ls-inventory-head"><div><span className="ls-overline">CUT LIST · 2 MM PLYWOOD</span><h2 id="ls-inventory-title">{say(SCHOOL_UI.inventory)}</h2><p>{say(WOOD_UI.inventoryHelp)}</p></div><div className="ls-legend"><span><i className="cut" />{say(SCHOOL_UI.cut)}</span><span><i className="engrave" />{say(SCHOOL_UI.engrave)}</span></div></div>
        <div className="ls-table-wrap"><table><thead><tr><th>{say(SCHOOL_UI.module)}</th><th>{say(SCHOOL_UI.face)}</th><th>{say(SCHOOL_UI.dimensions)}</th><th>{say(SCHOOL_UI.quantity)}</th></tr></thead>
          <tbody>{SCHOOL_PANELS.map(panel => <tr key={panel.id} className={highlight === panel.id ? 'selected' : ''}>
            <td><button type="button" onClick={() => selectPanel(panel.id)} aria-label={`${say(lesson.modules[panel.module]!)} · ${say(panel.face)}`} aria-pressed={highlight === panel.id}><span className="ls-module-icon" aria-hidden="true">{panel.module}</span>{say(lesson.modules[panel.module]!)}</button></td>
            <td>{say(panel.face)}</td><td className="ls-size-cell">{panel.width} × {panel.depth} mm</td><td>× {panel.quantity}</td>
          </tr>)}</tbody>
        </table></div>
        <div className="ls-inventory-notes"><p><strong>{say(SCHOOL_UI.assembly)}:</strong> {say(SCHOOL_UI.position)}</p><p>{say(SCHOOL_UI.thicknessNote)}</p></div>
      </section>
      <p className="ls-source">{say(SCHOOL_UI.source)}</p>
    </div>
  </main>;
}
