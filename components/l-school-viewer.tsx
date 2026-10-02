'use client';
/* oxlint-disable react/react-compiler -- Three.js owns mutable scene objects outside React's render cycle. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The labelled viewer accepts keyboard camera controls. */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Box, Grid2X2, Minus, Plus, RotateCcw } from 'lucide-react';
import catalog from '@/lib/district-catalog.json';
import { disposeScene } from '@/lib/three-disposal';
import { useLanguage } from '@/components/language-provider';

type Face = 'base' | 'roof' | 'front' | 'back' | 'left' | 'right';
type Module = 'A' | 'B';
type Panel = { name: string; moduleId: Module; face: Face; x: number; y: number; z: number; w: number; d: number; h: number };
type Engraving = { name: 'window' | 'door'; moduleId: Module; face: Face; x: number; y: number; z: number; w: number; d: number; h: number };
type PanelScene = { panel: Panel; mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>; outline: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>; home: THREE.Vector3 };
type EngravingScene = { engraving: Engraving; lines: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial> };
type Runtime = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  controls: OrbitControls;
  panels: PanelScene[];
  engravings: EngravingScene[];
  invalidate: () => void;
  update: (stage: number, highlight: string) => void;
  reset: (top?: boolean) => void;
};

const school = catalog.models.find(model => model.id === 'W4') as unknown as {
  width: number; depth: number; height: number; panels: Panel[]; windows: Engraving[];
};
const wood = '#d2a96f';
const activeWood = '#f1b451';
const panelEdges = '#7f5935';

function highlightMatches(panel: Panel, highlight: string) {
  if (!highlight) return false;
  const key = highlight.toLowerCase();
  const groupCode = panel.moduleId.toLowerCase();
  if (key === groupCode || key === (groupCode === 'a' ? 'rear' : 'wing')) return true;
  if (key === `${groupCode}-base`) return panel.face === 'base' || panel.face === 'roof';
  if (key === `${groupCode}-long`) return groupCode === 'a' ? ['front', 'back'].includes(panel.face) : ['left', 'right'].includes(panel.face);
  if (key === `${groupCode}-short`) return groupCode === 'a' ? ['left', 'right'].includes(panel.face) : ['front', 'back'].includes(panel.face);
  return key === panel.face || key === panel.name.toLowerCase() || key === `${groupCode}-${panel.face}`;
}

function engravingGeometry(item: Engraving) {
  // The catalogue stores engraving marks just outside the panel surface.
  // Four thin blue segments describe a laser-engraved outline, never a cut-out.
  const x = item.x - school.width / 2;
  const z = item.y - school.depth / 2;
  const bottom = item.z;
  const top = item.z + item.h;
  let corners: [number, number, number][];
  if (item.face === 'front' || item.face === 'back') {
    corners = [[x, bottom, z], [x + item.w, bottom, z], [x + item.w, top, z], [x, top, z]];
  } else {
    corners = [[x, bottom, z], [x, bottom, z + item.d], [x, top, z + item.d], [x, top, z]];
  }
  const positions: number[] = [];
  for (let index = 0; index < 4; index++) {
    positions.push(...corners[index], ...corners[(index + 1) % 4]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function explodedPosition(panel: Panel, home: THREE.Vector3) {
  const position = home.clone();
  position.x += panel.moduleId === 'A' ? 19 : -19;
  position.z += panel.moduleId === 'A' ? 15 : -15;
  if (panel.face === 'base') position.y -= 7;
  if (panel.face === 'roof') position.y += 45;
  if (panel.face === 'front') position.z -= 17;
  if (panel.face === 'back') position.z += 17;
  if (panel.face === 'left') position.x -= 17;
  if (panel.face === 'right') position.x += 17;
  return position;
}

function flatPosition(panel: Panel) {
  const faces: Face[] = ['base', 'roof', 'front', 'back', 'left', 'right'];
  const index = faces.indexOf(panel.face) + (panel.moduleId === 'B' ? 6 : 0);
  return new THREE.Vector3([-120, 0, 120][index % 3], -0.2, [-90, -25, 40, 105][Math.floor(index / 3)]);
}

function flatRotation(face: Face) {
  if (face === 'front') return new THREE.Euler(Math.PI / 2, 0, 0);
  if (face === 'back') return new THREE.Euler(-Math.PI / 2, 0, 0);
  if (face === 'left') return new THREE.Euler(0, 0, -Math.PI / 2);
  if (face === 'right') return new THREE.Euler(0, 0, Math.PI / 2);
  return new THREE.Euler();
}

export default function LSchoolViewer({ stage, highlight = '' }: { stage: number; highlight?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const latest = useRef({ stage, highlight });
  latest.current = { stage, highlight };
  const language = useLanguage();
  const en = language === 'en';
  const [top, setTop] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const previousStage = useRef<number | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let observer: ResizeObserver | undefined;
    let frame = 0;
    let disposed = false;
    let lost = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f2e9db');
    const camera = new THREE.OrthographicCamera(-150, 150, 110, -110, 0.1, 1500);
    const panels: PanelScene[] = [];
    const engravings: EngravingScene[] = [];
    let plinth: THREE.Mesh | undefined;
    const invalidate = () => {
      if (!disposed && !lost && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    };
    function draw() {
      frame = 0;
      if (disposed || lost || document.hidden || !renderer) return;
      controls?.update();
      renderer.render(scene, camera);
    }
    function reset(isTop = false) {
      scene.scale.x = isTop ? -1 : 1;
      const target = new THREE.Vector3(0, latest.current.stage === 1 ? 0 : 24, 0);
      controls?.target.copy(target);
      camera.up.set(0, isTop ? 0 : 1, isTop ? 1 : 0);
      camera.position.copy(target).add(isTop ? new THREE.Vector3(0, 400, 0.01) : new THREE.Vector3(175, 140, -180));
      camera.zoom = 1;
      if (controls) controls.enableRotate = !isTop;
      resize();
      camera.updateProjectionMatrix();
      controls?.update();
      invalidate();
    }
    function update(nextStage: number, selected: string) {
      const current = THREE.MathUtils.clamp(Math.round(nextStage), 0, 5);
      const emphasis = selected.trim();
      if (plinth) plinth.scale.set(current === 1 ? 3.1 : 1, 1, current === 1 ? 2.2 : 1);
      for (const item of panels) {
        const { panel, mesh, outline, home } = item;
        mesh.visible = current <= 1 || (panel.moduleId === 'A' || current >= 3) && (panel.face !== 'roof' || current >= 4);
        mesh.rotation.copy(current === 1 ? flatRotation(panel.face) : new THREE.Euler());
        if (current === 0) mesh.position.copy(explodedPosition(panel, home));
        else if (current === 1) mesh.position.copy(flatPosition(panel));
        else mesh.position.copy(home).add(new THREE.Vector3(0, current === 4 && panel.face === 'roof' ? 19 : 0, 0));
        const selectedPanel = highlightMatches(panel, emphasis);
        mesh.material.color.set(emphasis ? selectedPanel ? activeWood : wood : panel.face === 'roof' ? '#c39257' : panel.face === 'base' ? '#c6a576' : wood);
        mesh.material.emissive.set(selectedPanel ? '#693200' : '#000000');
        mesh.material.emissiveIntensity = selectedPanel ? 0.15 : 0;
        outline.material.color.set(current === 1 ? '#c6463c' : panelEdges);
        outline.material.opacity = current === 1 ? 1 : 0.65;
        outline.visible = mesh.visible;
      }
      for (const item of engravings) {
        item.lines.visible = current >= 1;
        const selectedMark = emphasis === 'engraving' || emphasis === 'windows' || emphasis === item.engraving.name;
        item.lines.material.color.set(selectedMark ? '#0479d2' : '#376c9a');
        item.lines.material.opacity = selectedMark ? 1 : 0.88;
      }
      if (renderer) renderer.shadowMap.needsUpdate = true;
      resize();
      invalidate();
    }
    function resize() {
      const surface = hostRef.current;
      if (!surface?.clientWidth || !surface.clientHeight || !renderer) return;
      const aspect = surface.clientWidth / surface.clientHeight;
      const vertical = latest.current.stage === 1 ? Math.max(305, 430 / aspect) : Math.max(210, 275 / aspect);
      camera.left = -vertical * aspect / 2;
      camera.right = vertical * aspect / 2;
      camera.top = vertical / 2;
      camera.bottom = -vertical / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(surface.clientWidth, surface.clientHeight);
      invalidate();
    }
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else invalidate();
    };
    const contextLost = (event: Event) => {
      event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0; setReady(false); setError(true);
    };
    const contextRestored = () => { lost = false; setError(false); setReady(true); invalidate(); };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Home') { event.preventDefault(); reset(latest.current.stage === 1); setTop(latest.current.stage === 1); }
      if (['+', '=', '-'].includes(event.key)) {
        event.preventDefault();
        camera.zoom = THREE.MathUtils.clamp(camera.zoom * (event.key === '-' ? 1 / 1.2 : 1.2), 0.55, 4);
        camera.updateProjectionMatrix(); invalidate();
      }
    };
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = false;
      host.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight('#fff7e9', '#896d51', 2.25));
      const sun = new THREE.DirectionalLight('#fff6e8', 2.4);
      sun.position.set(-130, 250, -165);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 1, far: 550 });
      sun.shadow.normalBias = 0.16;
      scene.add(sun);

      plinth = new THREE.Mesh(new THREE.BoxGeometry(132, 1, 132), new THREE.MeshStandardMaterial({ color: '#faf6ef', roughness: 1 }));
      plinth.position.y = -1.7; plinth.receiveShadow = true; scene.add(plinth);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: '#e8dfd1', roughness: 1 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -2.4; floor.receiveShadow = true; scene.add(floor);

      for (const panel of school.panels) {
        const geometry = new THREE.BoxGeometry(panel.w, panel.h, panel.d);
        const material = new THREE.MeshStandardMaterial({ color: wood, roughness: 0.87, metalness: 0 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true; mesh.receiveShadow = true;
        const home = new THREE.Vector3(panel.x + panel.w / 2 - school.width / 2, panel.z + panel.h / 2, panel.y + panel.d / 2 - school.depth / 2);
        mesh.position.copy(home);
        const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: panelEdges, transparent: true, opacity: 0.65 }));
        mesh.add(outline); scene.add(mesh);
        panels.push({ panel, mesh, outline, home });
      }
      for (const engraving of school.windows) {
        const panel = panels.find(item => item.panel.moduleId === engraving.moduleId && item.panel.face === engraving.face);
        if (!panel) continue;
        const geometry = engravingGeometry(engraving);
        geometry.translate(-panel.home.x, -panel.home.y, -panel.home.z);
        const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: '#376c9a', transparent: true, opacity: 0.88, depthTest: true }));
        lines.renderOrder = 2; panel.mesh.add(lines); engravings.push({ engraving, lines });
      }

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
      controls.enablePan = true;
      controls.minZoom = 0.55;
      controls.maxZoom = 4;
      controls.maxPolarAngle = Math.PI / 2.02;
      controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      controls.addEventListener('change', invalidate);
      observer = new ResizeObserver(resize); observer.observe(host);
      resize(); reset(latest.current.stage === 1); update(latest.current.stage, latest.current.highlight);
      runtime.current = { renderer, camera, controls, panels, engravings, invalidate, update, reset };
      host.addEventListener('keydown', keydown);
      renderer.domElement.addEventListener('webglcontextlost', contextLost);
      renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
      document.addEventListener('visibilitychange', visibility);
      setError(false); setReady(true); setTop(latest.current.stage === 1);
    } catch {
      setError(true); setReady(false);
    }
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer?.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      host.removeEventListener('keydown', keydown);
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer?.domElement.removeEventListener('webglcontextrestored', contextRestored);
      controls?.dispose(); disposeScene(scene);
      renderer?.dispose(); renderer?.domElement.remove();
      runtime.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    const r = runtime.current;
    if (!r) return;
    r.update(stage, highlight);
    if (previousStage.current !== stage) {
      if (stage === 1) { r.reset(true); setTop(true); }
      else if (previousStage.current === 1) { r.reset(false); setTop(false); }
    }
    previousStage.current = stage;
  }, [stage, highlight]);
  function zoom(factor: number) {
    const r = runtime.current; if (!r) return;
    r.camera.zoom = THREE.MathUtils.clamp(r.camera.zoom * factor, 0.55, 4);
    r.camera.updateProjectionMatrix(); r.invalidate();
  }

  const controlsStyle = { background: '#fffaf4ec', border: '1px solid #cbb69a', borderRadius: 10, padding: 7, color: '#503b29', cursor: 'pointer' } as const;
  return <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 360, overflow: 'hidden', borderRadius: 18, background: '#f2e9db' }}>
    <div ref={hostRef} role="application" tabIndex={0} aria-label={en ? 'L-shaped school three-dimensional assembly model. Drag to rotate, scroll to zoom, Home to reset.' : 'L 形學校 3D 組裝模型。拖曳旋轉，滾輪縮放，按 Home 重設。'} style={{ width: '100%', height: '100%', minHeight: 360, outlineOffset: -3 }} />
    <div style={{ position: 'absolute', top: 14, left: 14, display: 'grid', gap: 3, padding: '9px 12px', borderRadius: 10, background: '#fffaf4e8', border: '1px solid #d5bea0', color: '#4d3523', pointerEvents: 'none', boxShadow: '0 3px 12px #6d49201a' }}>
      <strong style={{ fontSize: 13 }}>W4 · {en ? 'L-shaped school' : 'L 形學校'}</strong>
      <span style={{ fontSize: 11 }}>100 × 100 × 40 mm · {en ? '12 plywood panels · 2 mm' : '12 塊木板 · 厚 2 mm'}</span>
    </div>
    <div style={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', gap: 5 }}>
      <button type="button" style={controlsStyle} aria-label={en ? 'Zoom in' : '放大模型'} title={en ? 'Zoom in' : '放大'} disabled={!ready} onClick={() => zoom(1.2)}><Plus size={17}/></button>
      <button type="button" style={controlsStyle} aria-label={en ? 'Zoom out' : '縮小模型'} title={en ? 'Zoom out' : '縮小'} disabled={!ready} onClick={() => zoom(1 / 1.2)}><Minus size={17}/></button>
      <button type="button" style={controlsStyle} aria-label={top ? en ? '3D view' : '立體視圖' : en ? 'Top view' : '俯視圖'} title={top ? en ? '3D view' : '立體視圖' : en ? 'Top view' : '俯視圖'} disabled={!ready} onClick={() => { runtime.current?.reset(!top); setTop(!top); }}>{top ? <Box size={17}/> : <Grid2X2 size={17}/>}</button>
      <button type="button" style={controlsStyle} aria-label={en ? 'Reset view' : '重設視角'} title={en ? 'Reset view' : '重設視角'} disabled={!ready} onClick={() => { runtime.current?.reset(stage === 1); setTop(stage === 1); }}><RotateCcw size={17}/></button>
    </div>
    {error && <div role="alert" style={{ position: 'absolute', inset: '35% 10% auto', padding: 18, borderRadius: 12, background: '#fffaf4', border: '1px solid #c99c70', color: '#503b29', textAlign: 'center' }}>
      <p>{en ? 'The 3D model could not be displayed.' : '暫時未能顯示 3D 模型。'}</p>
      <button type="button" onClick={() => setAttempt(n => n + 1)}>{en ? 'Reload model' : '重新載入模型'}</button>
    </div>}
  </div>;
}
