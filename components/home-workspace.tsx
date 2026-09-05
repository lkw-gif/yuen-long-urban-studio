'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { registerSceneTools, getSceneToolContext } from '@/lib/scene-tools';
import { Box, ArrowUpRight, Layers3, ChevronRight, MapPin, CircleHelp, MousePointer2, TreePine, Route, Scan, Sun, Focus, Plus, Minus, RotateCcw, Move, Mouse, Maximize2, Grid2X2, Eye, EyeOff, PanelLeftClose, ChevronDown, Navigation2, Settings2, Circle, Triangle, Download, Check, Compass, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UrbanViewer, type ViewerApi } from '@/components/urban-viewer';
import { BUILDINGS, NAMED_BUILDINGS, MODEL_NOTICE } from '@/lib/model-data';
import type { LayerName } from '@/lib/urban-model';
import { sitePath } from '@/lib/site-path';

export default function HomeWorkspace() {
 const viewer=useRef<ViewerApi>(null);
 const [view,setView]=useState<'iso'|'top'>('iso');
 const [mode,setMode]=useState<'material'|'clay'|'wire'>('material');
 const [selected,setSelected]=useState('lee-king');
 const [visibility,setVisibility]=useState<Record<LayerName,boolean>>({buildings:true,parks:true,roads:true,curbs:true});
 const [labels,setLabels]=useState(true);
 const [heightScale,setHeightScale]=useState(1);
 const [daylight,setDaylight]=useState(13);
 const [ready,setReady]=useState(false);
 const [dialog,setDialog]=useState<'reference'|'export'|'help'|null>(null);
 const [exporting,setExporting]=useState(false);
 const [toast,setToast]=useState('');
 const onReady=useCallback(()=>setReady(true),[]);
 const building=BUILDINGS.find(b=>b.id===selected)!;
 const sceneState=useRef({view,selectedBuilding:selected,heightScale});sceneState.current={view,selectedBuilding:selected,heightScale};
 useEffect(()=>registerSceneTools(getSceneToolContext(),v=>{flushSync(()=>{if(v.view)setView(v.view);if(v.selectedBuilding)setSelected(v.selectedBuilding);if(v.heightScale!==undefined)setHeightScale(v.heightScale);});return {...sceneState.current};},()=>({...sceneState.current,buildings:BUILDINGS.map(b=>({id:b.id,name:b.name}))})),[]);
 useEffect(()=>{if(!toast)return;const timeout=window.setTimeout(()=>setToast(''),5000);return()=>clearTimeout(timeout);},[toast]);
 const toggle=(key:LayerName,value:boolean)=>setVisibility(v=>({...v,[key]:value}));
 async function exportModel(){if(!viewer.current)return;setExporting(true);try{await viewer.current.exportGLB();setDialog(null);setToast('模型已下載，可在 Blender 中匯入 .glb 檔案。');}catch{setToast('匯出未完成，請稍後再試一次。');}finally{setExporting(false);}}
 function reset(){setView('iso');setHeightScale(1);viewer.current?.reset();}
 return <main className="studio">
  <header className="main-header">
   <div className="brand"><Box size={30} strokeWidth={1.55}/><strong>街區<span>URBAN<br/>STUDIO</span></strong></div>
   <nav className="studio-nav" aria-label="工作空間"><a href={sitePath('/')} aria-current="page">街區現況</a><a href={sitePath('/concepts/')}>概念模型<span>03</span></a></nav>
   <div className="header-status"><span className="status-dot"/>{ready?'場景已就緒':'建立場景中'}</div>
   <button className="export-button" aria-label="匯出至 Blender" onClick={()=>setDialog('export')} disabled={!ready}><Download size={15}/><span className="export-label">匯出至 Blender</span><ArrowUpRight size={14}/></button>
  </header>
  <div className="workspace">
   <aside className="left-panel" aria-label="場景圖層">
    <div className="project-heading"><div className="eyebrow">YUEN LONG, HONG KONG</div><h1>元朗・康樂路街區</h1><p><MapPin size={13}/> 教育路 — 大棠路</p></div>
    <div className="panel-heading"><Layers3 size={15}/>場景集合<span className="count">04</span></div>
    <div className="layer-scroll">
     <div className="layer-item"><ChevronDown size={13}/><Box size={16}/><span>建築量體</span><Switch className="layer-switch" size="sm" aria-label="顯示建築量體" checked={visibility.buildings} onCheckedChange={v=>toggle('buildings',v)}/></div>
     <div className="layer-tree">{NAMED_BUILDINGS.map(b=><button key={b.id} className={'building-button '+(selected===b.id?'selected':'')} onClick={()=>setSelected(b.id)} aria-pressed={selected===b.id}><Box size={13}/>{b.name}{selected===b.id&&<span className="tiny-dot"/>}</button>)}<button className={'building-button '+(!building.named?'selected':'')} onClick={()=>setSelected('block-0')} aria-pressed={!building.named}><Layers3 size={13}/>其他街區建物<span style={{marginLeft:'auto',color:'#76838b'}}>{BUILDINGS.length-8}</span></button></div>
     <div className="layer-item"><ChevronDown size={13}/><TreePine size={16} className="green-icon"/><span>公園與綠化</span><Switch className="layer-switch" size="sm" aria-label="顯示公園與綠化" checked={visibility.parks} onCheckedChange={v=>toggle('parks',v)}/></div>
     <div className="park-item">元朗兒童遊樂場<br/>鐘聲徑遊樂場</div>
     <div className="layer-item"><ChevronRight size={13}/><Route size={16}/><span>道路與地面</span><Switch className="layer-switch" size="sm" aria-label="顯示道路與地面" checked={visibility.roads} onCheckedChange={v=>toggle('roads',v)}/></div>
     <div className="layer-item"><ChevronRight size={13}/><Scan size={16} className="curb-icon"/><span>馬路邊線</span><Switch className="layer-switch" size="sm" aria-label="顯示馬路邊線" checked={visibility.curbs} onCheckedChange={v=>toggle('curbs',v)}/></div>
    </div>
    <div className="sidebar-note"><CircleHelp size={15}/><span>依提供地圖描繪。<br/>建築高度與外觀為示意。</span></div>
   </aside>
   <section className="viewport" aria-label="3D 街區視窗">
    <div className="viewport-toolbar">
     <button className="icon-button active" title="選取模式：點擊建築查看屬性" aria-label="選取模式" onClick={()=>setToast('點擊場景中的建築，即可查看物件屬性。')}><MousePointer2 size={16}/></button>
     <span className="toolbar-label">物件模式</span><div className="toolbar-divider"/>
     <button className={'icon-button '+(labels?'active':'')} title="顯示或隱藏地點標籤" aria-label="顯示或隱藏地點標籤" aria-pressed={labels} onClick={()=>setLabels(v=>!v)}>{labels?<Eye size={16}/>:<EyeOff size={16}/>}</button>
     <button className="icon-button toolbar-extra" title="重設視角 (Home)" aria-label="重設視角" onClick={reset}><RotateCcw size={15}/></button>
     <button className="icon-button mobile-controls" title="切換實體或線框" aria-label="切換實體或線框" aria-pressed={mode==='wire'} onClick={()=>setMode(m=>m==='wire'?'material':'wire')}><Box size={15}/></button>
     <Tabs value={view} onValueChange={v=>setView(v as 'iso'|'top')} className="camera-tabs"><TabsList aria-label="視角"><TabsTrigger value="iso"><Box size={13}/>立體視圖</TabsTrigger><TabsTrigger value="top"><Grid2X2 size={13}/>俯視圖</TabsTrigger></TabsList></Tabs>
    </div>
    <div className="scene-shell">
     <UrbanViewer ref={viewer} view={view} mode={mode} selected={selected} visibility={visibility} labels={labels} heightScale={heightScale} daylight={daylight} onSelect={setSelected} onReady={onReady}/>
     <div className="scene-caption"><div className="eyebrow">URBAN MODEL / 01</div><h2>康樂路街區</h2><small>{view==='iso'?'等角視圖':'正上方視圖'}<span style={{padding:'0 7px',opacity:.6}}>/</span>{mode==='material'?'材質預覽':mode==='clay'?'白模預覽':'線框預覽'}</small><br/><div className="scene-tag"><span/>沿街道邊緣建模</div></div>
     <div className="compass"><span>N</span><div className="compass-rose"><Navigation2 data-compass size={24} strokeWidth={1.4} style={{transform:view==='iso'?'rotate(-27deg)':'none'}}/></div></div>
     <div className="navigation-tools"><button className="icon-button" aria-label="放大" title="放大 (+)" onClick={()=>viewer.current?.zoom(1.2)}><Plus size={17}/></button><button className="icon-button" aria-label="縮小" title="縮小 (-)" onClick={()=>viewer.current?.zoom(1/1.2)}><Minus size={17}/></button><button className="icon-button" aria-label="聚焦選取建築" title="聚焦選取建築" onClick={()=>viewer.current?.focus()}><Focus size={16}/></button><button className="icon-button" aria-label="重設全景" title="重設全景 (Home)" onClick={reset}><Maximize2 size={15}/></button></div>
     <button className="reference-map" onClick={()=>setDialog('reference')} aria-label="開啟地圖與衛星圖對照"><img src={sitePath('/reference-map.png?v=20260905-213223')} alt="本次上傳的元朗街區平面地圖"/><span className="map-caption"><span>原始地圖對照</span><Maximize2 size={11}/></span></button>
     <div className="canvas-legend"><span><i className="legend-dot" style={{background:'#bfc4b5'}}/>建築</span><span><i className="legend-dot" style={{background:'#91a47e'}}/>綠化</span><span><i className="legend-dot" style={{background:'#d5d6c9'}}/>馬路邊線</span></div>
     <div className="view-help"><span><Mouse size={12}/>拖曳旋轉</span><span><Move size={12}/>右鍵平移</span><span><Plus size={12}/>滾輪縮放</span></div>
    </div>
   </section>
   <aside className="right-panel" aria-label="物件與場景設定">
    <div className="inspector-heading"><Settings2 size={15}/>屬性面板<small>INSPECTOR</small></div>
    <section className="inspector-section">
     <h3><Box size={14}/>已選取物件</h3>
     <div className="object-heading"><div className="object-icon"><Box size={22} strokeWidth={1.4}/></div><div><strong>{building.name}</strong><p>{building.en}</p></div></div>
     <div className="data-row"><span>物件類型</span><strong>建築量體</strong></div>
     <div className="data-row"><span>示意高度</span><span className="value-chip">{(building.h*heightScale).toFixed(1)} u</span></div>
     <div className="data-row"><span>佔地比例</span><span className="value-chip">{(building.w*.4).toFixed(1)} × {(building.d*.4).toFixed(1)}</span></div>
     <div className="data-row"><span>表面材質</span><strong><i className="swatch"/>{mode==='wire'?'線框':mode==='clay'?'白模':'建築灰'}</strong></div>
     <button className="focus-button" onClick={()=>viewer.current?.focus()} disabled={!visibility.buildings}><Focus size={14}/>聚焦此建築</button>
     <p className="property-note">u 為模型單位，尺寸不代表實際測量值。</p>
    </section>
    <section className="inspector-section">
     <h3><Sun size={14}/>場景外觀</h3>
     <RadioGroup className="mode-buttons" value={mode} onValueChange={v=>setMode(v as typeof mode)} aria-label="模型顯示方式">{([{id:'material',label:'材質',Icon:Circle},{id:'clay',label:'白模',Icon:Circle},{id:'wire',label:'線框',Icon:Triangle}] as const).map(({id,label,Icon})=><label key={id} className={'mode-option '+(mode===id?'active':'')}><RadioGroupItem value={id} className="sr-only"/><Icon size={19} fill={id==='wire'?'none':id==='clay'?'#abb4bb':'#aaa993'} strokeWidth={1.3}/><span>{label}</span></label>)}</RadioGroup>
     <div className="slider-label"><span><Sun size={13}/>日照時間</span><b>{String(daylight).padStart(2,'0')}:00</b></div><Slider min={8} max={17} step={1} value={[daylight]} onValueChange={v=>setDaylight(Array.isArray(v)?v[0]:v)} aria-label="日照時間"/><div className="slider-endpoints"><span>早晨</span><span>傍晚</span></div>
     <div className="slider-label"><span>建築高度倍率</span><b>{heightScale.toFixed(2)} ×</b></div><Slider min={.4} max={2} step={.05} value={[heightScale]} onValueChange={v=>setHeightScale(Array.isArray(v)?v[0]:v)} aria-label="建築高度倍率"/><div className="slider-endpoints"><span>0.4 ×</span><span>2.0 ×</span></div>
    </section>
    <section className="inspector-section"><h3><MapPin size={14}/>研究範圍</h3><p className="reference-detail">北至大棠路，南至教育路。<br/>西沿鐘聲徑，東沿阜財街。</p><div className="boundary-card"><Scan size={25} strokeWidth={1.4}/><div><strong>沿馬路邊緣收齊</strong><p>兩張參考圖片 · 概念量體</p></div></div></section>
   </aside>
  </div>
  <footer className="status-bar"><span><span className="status-dot"/>{ready?'場景就緒':'準備中'}</span><span>{BUILDINGS.length} 組建築</span><span>2 個遊樂場</span><span className="optional-status">Y UP · 概念模型</span><button className="status-end" style={{background:'none',border:0,display:'flex',alignItems:'center',gap:6}} onClick={()=>setDialog('help')}><CircleHelp size={12}/>操作指南</button></footer>
  {toast&&<div className="toast-message" role="status">{toast}</div>}
  <Dialog open={dialog!==null} onOpenChange={open=>{if(!open&&!exporting)setDialog(null);}}><DialogContent className={'dialog-large '+(dialog==='reference'?'':'export-dialog')}>
   {dialog==='reference'?<><DialogTitle>原始地圖對照</DialogTitle><DialogDescription>本次上傳的原始平面地圖與衛星圖。模型沿原定街區的道路外緣收齊。</DialogDescription><Tabs defaultValue="map" className="reference-tabs"><TabsList><TabsTrigger value="map">平面地圖</TabsTrigger><TabsTrigger value="satellite">衛星圖</TabsTrigger></TabsList><TabsContent value="map"><img src={sitePath('/reference-map.png?v=20260905-213223')} alt="本次上傳的平面地圖，顯示元朗康樂路街區"/></TabsContent><TabsContent value="satellite"><img src={sitePath('/reference-satellite.png?v=20260905-213203')} alt="本次上傳的衛星圖，顯示相同街區"/></TabsContent></Tabs><p className="dialog-note">{MODEL_NOTICE}</p></>:dialog==='export'?<><DialogTitle>把街區帶進 Blender</DialogTitle><DialogDescription>匯出目前可見的場景圖層，保留建築名稱、材質及高度倍率。</DialogDescription><div className="export-format"><Box size={36} strokeWidth={1.25}/><div><strong>glTF Binary · .glb</strong><p>單一 3D 檔案，包含模型與材質。<br/>可在 Blender 中繼續編輯及儲存為 .blend。</p></div></div><ol className="export-steps"><li>下載街區模型。</li><li>在 Blender 選擇「檔案 → 匯入 → glTF 2.0」。</li><li>選取下載的 .glb 檔案，開始編輯。</li></ol><p className="dialog-note">尺寸及樓高為示意。匯出不包含參考地圖圖片、操作格線或選取外框。</p><button className="export-button" onClick={exportModel} disabled={exporting||!ready}><Download size={16}/>{exporting?'正在準備模型…':'下載 Blender 相容模型'}</button></>:<><DialogTitle>探索你的街區</DialogTitle><DialogDescription>滑鼠、觸控與鍵盤皆可操作。點選任一建築可查看其屬性。</DialogDescription><div className="help-rows"><div><Mouse size={18}/><span>左鍵拖曳 / 單指拖曳</span><b>旋轉</b></div><div><Move size={18}/><span>右鍵拖曳 / 雙指拖曳</span><b>平移</b></div><div><Plus size={18}/><span>滾輪 / 雙指縮放</span><b>縮放</b></div><div><RotateCcw size={18}/><span>Home</span><b>回到全景</b></div></div><p className="dialog-note">先點一下 3D 視窗，即可使用方向鍵平移及 + / − 縮放。俯視模式會固定旋轉方向。此網站提供 Blender 相容模型，並非 Blender 網頁版。</p></>}
  </DialogContent></Dialog>
 </main>;
}





