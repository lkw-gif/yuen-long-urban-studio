'use client';
/* oxlint-disable react/react-compiler -- This effect owns a mutable Three.js runtime outside React's rendering model. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The labelled 3D application supports keyboard navigation via its native keydown handler. */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTowerModel, FINAL_TOWER_STAGE } from '@/lib/tower-model';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { disposeScene } from '@/lib/three-disposal';
import { RotateCcw, Plus, Minus, Grid2X2, Box, Download } from 'lucide-react';

type Props = { stage: number; title: string; allowDownload?: boolean };
type Runtime = {
  scene: THREE.Scene;
  model: ReturnType<typeof createTowerModel>;
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  controls: OrbitControls;
  invalidate: () => void;
  reset: (top?: boolean) => void;
};

export default function TowerViewer(props: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [top, setTop] = useState(false);
  const [notice, setNotice] = useState('');

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setError('');
    setReady(false);
    let renderer: THREE.WebGLRenderer | undefined;
    let model: ReturnType<typeof createTowerModel> | undefined;
    let controls: OrbitControls | undefined;
    let observer: ResizeObserver | undefined;
    let frame = 0,
      disposed = false,
      lost = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e8eff7');
    const invalidate = () => {
      if (!disposed && !lost && !document.hidden && !frame)
        frame = requestAnimationFrame(draw);
    };
    const camera = new THREE.OrthographicCamera(
      -230,
      230,
      180,
      -180,
      0.1,
      2000,
    );
    function draw() {
      frame = 0;
      if (disposed || lost || document.hidden || !renderer) return;
      controls?.update();
      renderer.render(scene, camera);
    }
    function reset(isTop = false) {
      const early = latest.current.stage < 3;
      const target = new THREE.Vector3(
        0,
        early ? (latest.current.stage === 1 ? 10 : 0) : 52,
        0,
      );
      controls?.target.copy(target);
      camera.zoom = early ? 1.5 : 1;
      camera.position
        .copy(target)
        .add(
          isTop
            ? new THREE.Vector3(0, 650, 0.1)
            : new THREE.Vector3(145, 94, 180),
        );
      if (controls) controls.enableRotate = !isTop;
      camera.updateProjectionMatrix();
      controls?.update();
      invalidate();
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Home') {
        event.preventDefault();
        reset();
        setTop(false);
      }
      if (['+', '=', '-'].includes(event.key)) {
        event.preventDefault();
        camera.zoom = THREE.MathUtils.clamp(
          camera.zoom * (event.key === '-' ? 1 / 1.15 : 1.15),
          0.5,
          4,
        );
        camera.updateProjectionMatrix();
        invalidate();
      }
      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        const delta = new THREE.Vector3(
          event.key === 'ArrowLeft' ? -8 : event.key === 'ArrowRight' ? 8 : 0,
          0,
          event.key === 'ArrowUp' ? -8 : event.key === 'ArrowDown' ? 8 : 0,
        );
        camera.position.add(delta);
        controls?.target.add(delta);
        controls?.update();
        invalidate();
      }
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      frame = 0;
      setReady(false);
      setError('3D 顯示暫時中斷，請重新載入模型。');
    };
    const contextRestored = () => {
      lost = false;
      setError('');
      setReady(true);
      if (renderer) renderer.shadowMap.needsUpdate = true;
      invalidate();
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else invalidate();
    };
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      host.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight('#ffffff', '#7c8074', 2.1));
      const sun = new THREE.DirectionalLight('#fff1dc', 2.6);
      sun.position.set(-100, 200, 120);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, {
        left: -95,
        right: 95,
        top: 160,
        bottom: -100,
        near: 10,
        far: 500,
      });
      sun.shadow.normalBias = 0.05;
      scene.add(sun);
      model = createTowerModel(latest.current.stage);
      scene.add(model.root);
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(1800, 1800),
        new THREE.MeshStandardMaterial({ color: '#e1eaf3', roughness: 1 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.15;
      floor.receiveShadow = true;
      scene.add(floor);
      const grid = new THREE.GridHelper(150, 30, '#a6bacd', '#c5d5e2');
      grid.position.y = -0.08;
      scene.add(grid);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.12;
      controls.minZoom = 0.5;
      controls.maxZoom = 4;
      controls.maxPolarAngle = Math.PI / 2.05;
      controls.addEventListener('change', invalidate);
      const resize = () => {
        if (!host.clientWidth || !host.clientHeight || !renderer) return;
        const aspect = host.clientWidth / host.clientHeight;
        const span = Math.max(165, 120 / aspect);
        camera.left = (-span * aspect) / 2;
        camera.right = (span * aspect) / 2;
        camera.top = span / 2;
        camera.bottom = -span / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(host.clientWidth, host.clientHeight);
        invalidate();
      };
      observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();
      reset();
      runtime.current = {
        scene,
        model,
        renderer,
        camera,
        controls,
        invalidate,
        reset,
      };
      host.addEventListener('keydown', onKey);
      renderer.domElement.addEventListener('webglcontextlost', contextLost);
      renderer.domElement.addEventListener(
        'webglcontextrestored',
        contextRestored,
      );
      document.addEventListener('visibilitychange', visibility);
      setReady(true);
    } catch {
      setError('這個瀏覽器未能開啟 3D 模型。請重試或換用支援 WebGL 的瀏覽器。');
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      controls?.dispose();
      document.removeEventListener('visibilitychange', visibility);
      host.removeEventListener('keydown', onKey);
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer?.domElement.removeEventListener(
        'webglcontextrestored',
        contextRestored,
      );
      const currentModel = runtime.current?.model ?? model;
      disposeScene(scene);
      currentModel?.materials.forEach((material) => material.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
      runtime.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    const r = runtime.current;
    if (!r) return;
    disposeScene(r.model.root);
    r.model.materials.forEach((m) => m.dispose());
    r.model.root.removeFromParent();
    r.model = createTowerModel(props.stage);
    r.scene.add(r.model.root);
    r.renderer.shadowMap.needsUpdate = true;
    r.reset(top);
  }, [props.stage, top]);
  function zoom(factor: number) {
    const r = runtime.current;
    if (!r) return;
    r.camera.zoom = THREE.MathUtils.clamp(r.camera.zoom * factor, 0.5, 4);
    r.camera.updateProjectionMatrix();
    r.invalidate();
  }
  function downloadExample() {
    const example = createTowerModel(FINAL_TOWER_STAGE);
    try {
      // STL uses Z-up in the slicer: undo the display's X/Z/-Y rotation.
      example.root.rotation.x = Math.PI / 2;
      example.root.updateMatrixWorld(true);
      const buffer = new STLExporter().parse(example.root, { binary: true });
      const url = URL.createObjectURL(
        new Blob([buffer.buffer as ArrayBuffer], { type: 'model/stl' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'blue-residential-tower-114.3mm.stl';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('示範 STL 已下載。自己的作品請從 Tinkercad 匯出。');
    } catch {
      setNotice('未能下載示範，請再試一次。');
    } finally {
      disposeScene(example.root);
      example.materials.forEach((m) => m.dispose());
    }
  }
  return (
    <div className="tower-viewer">
      <div
        ref={hostRef}
        className="tower-canvas"
        role="application"
        tabIndex={0}
        aria-label={`${props.title} 3D 模型。拖曳旋轉，雙指平移縮放，方向鍵平移，Home 重設。`}
      />
      <div className="tower-scene-caption">
        <strong>{props.title}</strong>
      </div>
      <div className="tower-view-hint">
        拖曳旋轉 · 滾輪縮放 · 右鍵平移
        {props.stage >= 12 && props.stage < 20 && <span>橙色＝待切孔洞</span>}
      </div>
      {props.allowDownload && (
        <button className="tower-example-download" onClick={downloadExample}>
          <Download size={15} />
          下載完成示範 STL
        </button>
      )}
      {notice && props.allowDownload && (
        <output className="tower-download-notice">{notice}</output>
      )}
      <div className="tower-view-tools">
        <button
          aria-label="放大教學模型"
          title="放大"
          disabled={!ready}
          onClick={() => zoom(1.2)}
        >
          <Plus size={18} />
        </button>
        <button
          aria-label="縮小教學模型"
          title="縮小"
          disabled={!ready}
          onClick={() => zoom(1 / 1.2)}
        >
          <Minus size={18} />
        </button>
        <button
          aria-label={top ? '切換立體視圖' : '切換俯視圖'}
          title={top ? '立體視圖' : '俯視圖'}
          disabled={!ready}
          onClick={() => {
            runtime.current?.reset(!top);
            setTop(!top);
          }}
        >
          {top ? <Box size={18} /> : <Grid2X2 size={18} />}
        </button>
        <button
          aria-label="重設教學視角"
          title="重設視角"
          disabled={!ready}
          onClick={() => {
            runtime.current?.reset();
            setTop(false);
          }}
        >
          <RotateCcw size={18} />
        </button>
      </div>
      {!ready && !error && (
        <output className="tower-loading">正在組裝本步驟的 3D 示範…</output>
      )}
      {error && (
        <div className="tower-error" role="alert">
          <p>{error}</p>
          <button onClick={() => setAttempt((a) => a + 1)}>重新載入模型</button>
        </div>
      )}
    </div>
  );
}
