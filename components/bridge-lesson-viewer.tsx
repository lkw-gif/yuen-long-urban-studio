'use client';
/* oxlint-disable react/react-compiler -- This effect owns a mutable Three.js runtime outside React's rendering model. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The labelled 3D application supports keyboard navigation via its native keydown handler. */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createBridgeLessonModel } from '@/lib/bridge-model';
import { disposeScene } from '@/lib/three-disposal';
import { RotateCcw, Plus, Minus, Grid2X2, Box, Download } from 'lucide-react';

type Props = { step: number; exploded: boolean; highlight: boolean; title: string };
type Runtime = { model: ReturnType<typeof createBridgeLessonModel>; renderer: THREE.WebGLRenderer; camera: THREE.OrthographicCamera; controls: OrbitControls; invalidate: () => void; reset: (top?: boolean) => void };

export default function BridgeLessonViewer(props: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const latest = useRef(props); latest.current = props;
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [top, setTop] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const host = hostRef.current; if (!host) return;
    setError(''); setReady(false);
    let renderer: THREE.WebGLRenderer | undefined;
    let model: ReturnType<typeof createBridgeLessonModel> | undefined;
    let controls: OrbitControls | undefined;
    let observer: ResizeObserver | undefined;
    let frame = 0, disposed = false, lost = false;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#d4d9d4');
    const invalidate = () => { if (!disposed && !lost && !document.hidden && !frame) frame = requestAnimationFrame(draw); };
    const camera = new THREE.OrthographicCamera(-230, 230, 180, -180, .1, 2000);
    function draw() { frame = 0; if (disposed || lost || document.hidden || !renderer) return; controls?.update(); renderer.render(scene, camera); }
    function reset(isTop = false) {
      const target = new THREE.Vector3(0, 48, 0);
      controls?.target.copy(target); camera.zoom = 1;
      camera.position.copy(target).add(isTop ? new THREE.Vector3(0, 600, .1) : new THREE.Vector3(310, 265, 380));
      if (controls) controls.enableRotate = !isTop;
      camera.updateProjectionMatrix(); controls?.update(); invalidate();
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Home') { event.preventDefault(); reset(); setTop(false); }
      if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); camera.zoom = THREE.MathUtils.clamp(camera.zoom * (event.key === '-' ? 1 / 1.15 : 1.15), .5, 4); camera.updateProjectionMatrix(); invalidate(); }
      if (event.key.startsWith('Arrow')) {
        event.preventDefault(); const delta = new THREE.Vector3(event.key === 'ArrowLeft' ? -8 : event.key === 'ArrowRight' ? 8 : 0, 0, event.key === 'ArrowUp' ? -8 : event.key === 'ArrowDown' ? 8 : 0);
        camera.position.add(delta); controls?.target.add(delta); controls?.update(); invalidate();
      }
    };
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0; setReady(false); setError('3D 顯示暫時中斷。可重新載入模型，右方文字教學仍可閱讀。'); };
    const contextRestored = () => { lost = false; setError(''); setReady(true); if (renderer) renderer.shadowMap.needsUpdate = true; invalidate(); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else invalidate(); };
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
      host.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight('#ffffff', '#7c8074', 2.7));
      const sun = new THREE.DirectionalLight('#fff2d8', 3.2); sun.position.set(-160, 330, 180); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -230, right: 230, top: 260, bottom: -180, near: 10, far: 700 }); sun.shadow.normalBias = .5; scene.add(sun);
      model = createBridgeLessonModel(); scene.add(model.root); model.update(latest.current.step, latest.current.exploded, latest.current.highlight);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), new THREE.MeshStandardMaterial({ color: '#bdc5bf', roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -5.1; floor.receiveShadow = true; scene.add(floor);
      controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = .12; controls.minZoom = .5; controls.maxZoom = 4; controls.maxPolarAngle = Math.PI / 2.05; controls.addEventListener('change', invalidate);
      const resize = () => { if (!host.clientWidth || !host.clientHeight || !renderer) return; const aspect = host.clientWidth / host.clientHeight; const span = Math.max(310, 440 / aspect); camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.top = span / 2; camera.bottom = -span / 2; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); invalidate(); };
      observer = new ResizeObserver(resize); observer.observe(host); resize(); reset();
      runtime.current = { model, renderer, camera, controls, invalidate, reset };
      host.addEventListener('keydown', onKey); renderer.domElement.addEventListener('webglcontextlost', contextLost); renderer.domElement.addEventListener('webglcontextrestored', contextRestored); document.addEventListener('visibilitychange', visibility);
      setReady(true);
    } catch { setError('這個瀏覽器未能開啟 3D 模型。請重試或換用支援 WebGL 的瀏覽器；文字教學仍可使用。'); }
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); controls?.dispose();
      document.removeEventListener('visibilitychange', visibility); host.removeEventListener('keydown', onKey);
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost); renderer?.domElement.removeEventListener('webglcontextrestored', contextRestored);
      // Restore highlighted material references before releasing all shared resources.
      model?.update(7, false, false); disposeScene(scene); model?.materials.forEach(material => material.dispose());
      renderer?.dispose(); renderer?.domElement.remove(); runtime.current = null;
    };
  }, [attempt]);

  useEffect(() => { const r = runtime.current; if (!r) return; r.model.update(props.step, props.exploded, props.highlight); r.renderer.shadowMap.needsUpdate = true; r.invalidate(); }, [props.step, props.exploded, props.highlight]);
  function zoom(factor: number) { const r = runtime.current; if (!r) return; r.camera.zoom = THREE.MathUtils.clamp(r.camera.zoom * factor, .5, 4); r.camera.updateProjectionMatrix(); r.invalidate(); }
  async function download() {
    const r = runtime.current; if (!r || exporting) return; setExporting(true); setNotice('');
    try {
      const { exportSceneBinary } = await import('@/lib/export-scene');
      const exported = createBridgeLessonModel(); exported.update(props.step, false, false);
      try {
        // mm → metres for an accurately sized Blender import; live model is untouched.
        exported.root.scale.setScalar(.001);
        const bytes = await exportSceneBinary(exported.root);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
        const link = document.createElement('a'); link.href = url; link.download = `skybridge-step-${props.step + 1}.glb`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 15000);
        setNotice('已下載本步驟的組裝模型，可匯入 Blender。');
      } finally { exported.update(7, false, false); disposeScene(exported.root); exported.materials.forEach(material => material.dispose()); }
    } catch { setNotice('下載未完成，請重試。'); } finally { setExporting(false); }
  }
  return <div className="bridge-viewer">
    <div ref={hostRef} className="bridge-canvas" role="application" tabIndex={0} aria-label={`第 ${props.step + 1} 步：${props.title} 3D 模型。拖曳旋轉，雙指平移縮放，方向鍵平移，Home 重設。`} />
    <div className="bridge-scene-caption"><span>STEP {String(props.step + 1).padStart(2, '0')} / 08</span><strong>{props.title}</strong><small>{props.exploded ? '分解視圖 · 垂直間距已放大' : '組裝視圖 · 尺寸單位 mm'}</small></div>
    <div className="bridge-view-tools">
      <button aria-label="放大教學模型" title="放大" disabled={!ready} onClick={() => zoom(1.2)}><Plus size={18}/></button>
      <button aria-label="縮小教學模型" title="縮小" disabled={!ready} onClick={() => zoom(1 / 1.2)}><Minus size={18}/></button>
      <button aria-label={top ? '切換立體視圖' : '切換俯視圖'} title={top ? '立體視圖' : '俯視圖'} disabled={!ready} onClick={() => { runtime.current?.reset(!top); setTop(!top); }}>{top ? <Box size={18}/> : <Grid2X2 size={18}/>}</button>
      <button aria-label="重設教學視角" title="重設視角" disabled={!ready} onClick={() => { runtime.current?.reset(); setTop(false); }}><RotateCcw size={18}/></button>
    </div>
    {!ready && !error && <output className="bridge-loading">正在組裝本步驟的 3D 示範…</output>}
    {error && <div className="bridge-error" role="alert"><p>{error}</p><button onClick={() => setAttempt(a => a + 1)}>重新載入模型</button></div>}
    <div className="bridge-scene-footer"><span><i/> {props.highlight ? '橙色：本步新增部分' : '材料原色'}</span><button onClick={download} disabled={!ready || exporting}><Download size={15}/>{exporting ? '準備中…' : '下載本步 3D'}</button></div>
    {notice && <output className="bridge-download-notice">{notice}</output>}
  </div>;
}
