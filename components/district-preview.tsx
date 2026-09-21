'use client';
/* oxlint-disable react/react-compiler -- This component owns an imperative Three.js renderer. */
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {BOARD,SITE,MODEL_MAP,ZONES,bridgeGeometry,round,type Design} from '@/lib/district-design';

export type PreviewApi={image:()=>string|undefined;reset:()=>void;zoom:(factor:number)=>void};
export const DistrictPreview=forwardRef<PreviewApi,{design:Design;dimensions:boolean;errorText:string}>(function DistrictPreview({design,dimensions,errorText},ref){
 const host=useRef<HTMLDivElement>(null),api=useRef<PreviewApi>({image:()=>undefined,reset:()=>{},zoom:()=>{}});const [error,setError]=useState(false);
 useImperativeHandle(ref,()=>({image:()=>api.current.image(),reset:()=>api.current.reset(),zoom:factor=>api.current.zoom(factor)}),[]);
 useEffect(()=>{
  const el=host.current;if(!el)return;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch{setError(true);return;}
  setError(false);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#35433b');renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,1,2400),controls=new OrbitControls(camera,renderer.domElement);
  controls.maxPolarAngle=Math.PI/2-.04;controls.minDistance=150;controls.maxDistance=1400;controls.enableDamping=false;
  const reset=()=>{camera.position.set(420,440,500);controls.target.set(0,15,0);controls.update();render();};
  scene.add(new THREE.HemisphereLight('#e8f2ff','#586647',2.3));const sun=new THREE.DirectionalLight('#fff4df',3.2);sun.position.set(-260,550,-220);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-430,right:430,top:430,bottom:-430,near:1,far:1100});sun.shadow.normalBias=1;scene.add(sun);
  const materials=new Map<string,THREE.MeshStandardMaterial>();const mat=(color:string)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.85}));return materials.get(color)!;};
  const cube=new THREE.BoxGeometry(1,1,1);
  function box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,color:string){const mesh=new THREE.Mesh(cube,mat(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  const root=new THREE.Group();root.position.set(-BOARD.width/2,0,-BOARD.depth/2);scene.add(root);
  box(root,297,-2,210,594,4,420,'#e8e9df');
  const shape=new THREE.Shape();SITE.forEach((p,i)=>i?shape.lineTo(p.x,-p.y):shape.moveTo(p.x,-p.y));shape.closePath();const area=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat('#c4cebd'));area.rotation.x=-Math.PI/2;area.position.y=.1;area.receiveShadow=true;root.add(area);
  const boundary=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(SITE.map(p=>new THREE.Vector3(p.x,.3,p.y))),new THREE.LineBasicMaterial({color:'#5b765b'}));root.add(boundary);
  function label(text:string,x:number,y:number,z:number,width=80){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=100;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#1b2e29e8';ctx.fillRect(0,0,768,100);ctx.fillStyle='#fff';ctx.font='500 38px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,50,740);const texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.position.set(x,y,z);sprite.scale.set(width,width*100/768,1);sprite.renderOrder=10;root.add(sprite);}
  design.zones.forEach(z=>box(root,z.x+z.w/2,.28,z.y+z.d/2,z.w,.2,z.d,ZONES[z.kind]));
  function segment(a:{x:number;y:number},b:{x:number;y:number},width:number,height:number,thick:number,color:string){const length=Math.hypot(b.x-a.x,b.y-a.y);const obj=box(root,(a.x+b.x)/2,height,(a.y+b.y)/2,length,thick,width,color);obj.rotation.y=-Math.atan2(b.y-a.y,b.x-a.x);return obj;}
  design.roads.forEach(r=>r.points.slice(1).forEach((b,i)=>{const a=r.points[i];segment(a,b,r.width,.55,.45,r.kind==='road'?'#586269':'#d2bb88');if(r.kind==='road'){const n=Math.floor(Math.hypot(b.x-a.x,b.y-a.y)/12);for(let j=0;j<n;j++){const p={x:a.x+(b.x-a.x)*(j+.2)/n,y:a.y+(b.y-a.y)*(j+.2)/n},q={x:a.x+(b.x-a.x)*(j+.65)/n,y:a.y+(b.y-a.y)*(j+.65)/n};segment(p,q,.8,.82,.1,'#edf0df');}}}));
  design.buildings.forEach(b=>{const m=MODEL_MAP[b.modelId],g=new THREE.Group();g.position.set(b.x,.85,b.y);g.rotation.y=-b.rotation*Math.PI/180;root.add(g);
   (m.panels??m.boxes).forEach(p=>box(g,p.x+p.w/2-m.width/2,p.z+p.h/2,p.y+p.d/2-m.depth/2,p.w,p.h,p.d,m.kind==='wood'?(p.h===2?'#c39860':'#dfb87d'):(p.role==='base'?'#b1c2d4':'#438ae0')));
   const windows=new THREE.InstancedMesh(cube,mat(m.kind==='wood'?'#755537':'#174d7e'),m.windows.length),dummy=new THREE.Object3D();m.windows.forEach((p,i)=>{dummy.position.set(p.x+p.w/2-m.width/2,p.z+p.h/2,p.y+p.d/2-m.depth/2);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();windows.setMatrixAt(i,dummy.matrix);});g.add(windows);
   if(dimensions)label(`${m.id}  ${m.width} × ${m.depth} × ${m.height} mm`,b.x,m.height+12,b.y,Math.max(85,m.width));
  });
  design.bridges.forEach(b=>{const g=bridgeGeometry(design,b);if(!g)return;segment(g.start,g.end,b.width,b.height-1.5,3,'#f3df98');const normal={x:-(g.end.y-g.start.y)/g.length,y:(g.end.x-g.start.x)/g.length};[-1,1].forEach(s=>{const off=(p:{x:number;y:number})=>({x:p.x+normal.x*s*(b.width/2-.7),y:p.y+normal.y*s*(b.width/2-.7)});segment(off(g.start),off(g.end),1.2,b.height+6,12,'#b99c59');});const n=Math.floor(g.length/80);for(let i=1;i<=n;i++){const k=i/(n+1);box(root,g.start.x+(g.end.x-g.start.x)*k,(b.height-3)/2,g.start.y+(g.end.y-g.start.y)*k,3,b.height-3,3,'#9b8355');}if(dimensions)label(`${round(g.length)} × ${b.width} mm · H ${b.height}`, (g.start.x+g.end.x)/2,b.height+22,(g.start.y+g.end.y)/2,105);});
  const treeGeo=new THREE.IcosahedronGeometry(5,1);design.decorations.forEach(p=>{if(p.kind==='tree'){box(root,p.x,4,p.y,1.8,8,1.8,'#92794e');const tree=new THREE.Mesh(treeGeo,mat('#4c8a58'));tree.position.set(p.x,11,p.y);tree.castShadow=true;root.add(tree);}else{const group=new THREE.Group();group.position.set(p.x,0,p.y);group.rotation.y=-p.rotation*Math.PI/180;root.add(group);box(group,0,3,0,10,1.4,4,'#b18b55');[-3,3].forEach(x=>box(group,x,1.3,0,1.5,2.6,3,'#565b53'));}});
  if(dimensions){label('594 mm',297,1,435,80);label('420 mm',612,1,210,80);}
  function render(){renderer.render(scene,camera);}const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();};const observer=new ResizeObserver(resize);observer.observe(el);controls.addEventListener('change',render);reset();resize();
  api.current={image:()=>{render();return renderer.domElement.toDataURL('image/png');},reset,zoom:factor=>{const offset=camera.position.clone().sub(controls.target);offset.multiplyScalar(factor);offset.clampLength(150,1400);camera.position.copy(controls.target).add(offset);controls.update();render();}};const lost=(e:Event)=>{e.preventDefault();setError(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
  return()=>{observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);const geometries=new Set<THREE.BufferGeometry>();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line)geometries.add(o.geometry);if(o instanceof THREE.Sprite){o.material.map?.dispose();o.material.dispose();}if(o instanceof THREE.Line)(o.material as THREE.Material).dispose();});geometries.forEach(g=>g.dispose());treeGeo.dispose();materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();api.current={image:()=>undefined,reset:()=>{},zoom:()=>{}};};
 },[design,dimensions]);
 return <div className="dd-three" ref={host}>{error&&<p className="dd-three-error">{errorText}</p>}</div>;
});
