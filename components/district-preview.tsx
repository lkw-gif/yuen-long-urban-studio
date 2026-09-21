'use client';
/* oxlint-disable react/react-compiler -- This component owns an imperative Three.js renderer. */
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {BOARD,SITE,RIVER,BRIDGE_DECK_THICKNESS,MODEL_MAP,ZONES,bridgeGeometry,round,type Design,type Point} from '@/lib/district-design';

export type PreviewApi={image:()=>string|undefined;reset:()=>void;zoom:(factor:number)=>void};
type CameraPose={position:THREE.Vector3;target:THREE.Vector3;fitted:boolean};
type PreviewProps={design:Design;dimensions:boolean;selected:string;onSelect:(id:string|null)=>void;errorText:string};
export const DistrictPreview=forwardRef<PreviewApi,PreviewProps>(function DistrictPreview({design,dimensions,selected,onSelect,errorText},ref){
 const host=useRef<HTMLDivElement>(null),api=useRef<PreviewApi>({image:()=>undefined,reset:()=>{},zoom:()=>{}});
 const selection=useRef({selected,dimensions,onSelect}),updateSelection=useRef<()=>void>(()=>{}),pose=useRef<CameraPose|null>(null);
 const [error,setError]=useState(false);
 useImperativeHandle(ref,()=>({image:()=>api.current.image(),reset:()=>api.current.reset(),zoom:factor=>api.current.zoom(factor)}),[]);
 useEffect(()=>{selection.current={selected,dimensions,onSelect};updateSelection.current();},[selected,dimensions,onSelect]);
 useEffect(()=>{
  const el=host.current;if(!el)return;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch{setError(true);return;}
  setError(false);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#35433b');renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,1,2600),controls=new OrbitControls(camera,renderer.domElement);
  controls.maxPolarAngle=Math.PI/2-.04;controls.minDistance=80;controls.maxDistance=1800;controls.enableDamping=false;
  let fitted=true;
  scene.add(new THREE.HemisphereLight('#e8f2ff','#586647',2.3));const sun=new THREE.DirectionalLight('#fff4df',3.2);sun.position.set(-260,550,-220);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-430,right:430,top:430,bottom:-430,near:1,far:1100});sun.shadow.normalBias=1;scene.add(sun);
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  const mat=(color:string)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.85}));return materials.get(color)!;};
  const acrylic=new THREE.MeshPhysicalMaterial({color:'#c6e0de',transparent:true,opacity:.25,roughness:.16,metalness:.02,depthWrite:false,side:THREE.DoubleSide});
  const acrylicEdge=new THREE.MeshStandardMaterial({color:'#d3e6e1',transparent:true,opacity:.8,roughness:.4,depthWrite:false});
  const cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,12);
  function box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,color:string|THREE.Material){const material=typeof color==='string'?mat(color):color,mesh=new THREE.Mesh(cube,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=material!==acrylic&&material!==acrylicEdge;mesh.receiveShadow=mesh.castShadow;if(!mesh.castShadow)mesh.renderOrder=2;parent.add(mesh);return mesh;}
  function rod(parent:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,radius:number,color:string|THREE.Material='#c7a574'){const mesh=new THREE.Mesh(cylinder,typeof color==='string'?mat(color):color),delta=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(radius,delta.length(),radius);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=color!==acrylicEdge;parent.add(mesh);return mesh;}
  const root=new THREE.Group();root.position.set(-BOARD.width/2,0,-BOARD.depth/2);scene.add(root);
  box(root,297,-2,210,594,4,420,'#e8e9df');
  function surface(points:Point[],height:number,color:string){const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p.x,-p.y):shape.moveTo(p.x,-p.y));shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat(color));mesh.rotation.x=-Math.PI/2;mesh.position.y=height;mesh.receiveShadow=true;root.add(mesh);return mesh;}
  surface(SITE,.1,'#c4cebd');
  const boundary=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(SITE.map(p=>new THREE.Vector3(p.x,.3,p.y))),new THREE.LineBasicMaterial({color:'#5b765b'}));root.add(boundary);
  design.zones.forEach(z=>box(root,z.x+z.w/2,.28,z.y+z.d/2,z.w,.2,z.d,ZONES[z.kind]));
  surface(RIVER,.42,'#67add2');
  const riverBank=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(RIVER.map(p=>new THREE.Vector3(p.x,.47,p.y))),new THREE.LineBasicMaterial({color:'#b5c8b3'}));root.add(riverBank);
  function segment(parent:THREE.Object3D,a:Point,b:Point,width:number,height:number,thick:number,color:string|THREE.Material){const length=Math.hypot(b.x-a.x,b.y-a.y),obj=box(parent,(a.x+b.x)/2,height,(a.y+b.y)/2,length,thick,width,color);obj.rotation.y=-Math.atan2(b.y-a.y,b.x-a.x);return obj;}
  design.roads.forEach(r=>r.points.slice(1).forEach((b,i)=>{const a=r.points[i];segment(root,a,b,r.width,.55,.45,r.kind==='road'?'#586269':'#aeb4b5');if(r.kind==='road'){const n=Math.floor(Math.hypot(b.x-a.x,b.y-a.y)/12);for(let j=0;j<n;j++){const p={x:a.x+(b.x-a.x)*(j+.2)/n,y:a.y+(b.y-a.y)*(j+.2)/n},q={x:a.x+(b.x-a.x)*(j+.65)/n,y:a.y+(b.y-a.y)*(j+.65)/n};segment(root,p,q,.8,.82,.1,'#edf0df');}}}));
  function label(text:string,x:number,y:number,z:number){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#1b2e29f5';ctx.fillRect(0,0,1024,160);ctx.fillStyle='#fff';ctx.font='500 52px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,80,980);const texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.position.set(x,y,z);sprite.scale.set(180,180*160/1024,1);sprite.renderOrder=10;sprite.visible=false;root.add(sprite);return sprite;}
  const selectable:THREE.Group[]=[],highlights=new Map<string,{helper:THREE.BoxHelper;label:THREE.Sprite}>();
  const fitPoints=SITE.map(p=>new THREE.Vector3(p.x-BOARD.width/2,0,p.y-BOARD.depth/2));
  function register(id:string,group:THREE.Group,sprite:THREE.Sprite){group.updateWorldMatrix(true,true);group.userData.selectId=id;selectable.push(group);const helper=new THREE.BoxHelper(group,'#f3bc76');helper.visible=false;helper.renderOrder=9;(helper.material as THREE.LineBasicMaterial).depthTest=false;scene.add(helper);highlights.set(id,{helper,label:sprite});}
  design.buildings.forEach(b=>{const m=MODEL_MAP[b.modelId],g=new THREE.Group();g.position.set(b.x,.85,b.y);g.rotation.y=-b.rotation*Math.PI/180;root.add(g);
   (m.panels??m.boxes).forEach(p=>box(g,p.x+p.w/2-m.width/2,p.z+p.h/2,p.y+p.d/2-m.depth/2,p.w,p.h,p.d,m.kind==='wood'?(p.h===2?'#c39860':'#dfb87d'):(p.role==='base'?'#b1c2d4':'#438ae0')));
   const windows=new THREE.InstancedMesh(cube,mat(m.kind==='wood'?'#755537':'#174d7e'),m.windows.length),dummy=new THREE.Object3D();m.windows.forEach((p,i)=>{dummy.position.set(p.x+p.w/2-m.width/2,p.z+p.h/2,p.y+p.d/2-m.depth/2);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();windows.setMatrixAt(i,dummy.matrix);});g.add(windows);
   register(b.id,g,label(`${m.id}  ${m.width} × ${m.depth} × ${m.height} mm`,b.x,m.height+22,b.y));
   g.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(g);for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])fitPoints.push(new THREE.Vector3(x,y,z));
  });
  design.bridges.forEach(b=>{const geometry=bridgeGeometry(design,b);if(!geometry||geometry.length<.001)return;const {start,end,length}=geometry,g=new THREE.Group();root.add(g);
   const n={x:-(end.y-start.y)/length,y:(end.x-start.x)/length},at=(t:number,offset=0):Point=>({x:start.x+(end.x-start.x)*t+n.x*offset,y:start.y+(end.y-start.y)*t+n.y*offset});
   const vec=(p:Point,h:number)=>new THREE.Vector3(p.x,h,p.y),half=b.width/2;
   // The lesson uses a 2 mm clear deck, bamboo bearers and 12 mm clear guards.
   segment(g,start,end,b.width,b.height-BRIDGE_DECK_THICKNESS/2,BRIDGE_DECK_THICKNESS,acrylic);
   for(const side of [-1,1]){const a=at(0,side*(half-.4)),z=at(1,side*(half-.4));segment(g,a,z,.65,b.height+6,12,acrylic);segment(g,a,z,.55,b.height+12,.55,acrylicEdge);segment(g,a,z,.45,b.height-1,2,acrylicEdge);rod(g,vec(at(0,side*(half-2.2)),b.height-4.6),vec(at(1,side*(half-2.2)),b.height-4.6),1.05);
    const joints=Math.max(1,Math.ceil(length/28));for(let i=0;i<=joints;i++){const p=at(i/joints,side*(half-.4));rod(g,vec(p,b.height),vec(p,b.height+12),.35,acrylicEdge);}
   }
   const supports=Math.max(1,Math.ceil(length/70));for(let i=1;i<=supports;i++){const t=i/(supports+1),left=at(t,-half+2.2),right=at(t,half-2.2);rod(g,vec(at(t,-half-.7),b.height-3.1),vec(at(t,half+.7),b.height-3.1),1.1);for(const side of [-1,1]){const p=side===-1?left:right;rod(g,vec(p,.6),vec(p,b.height-5.7),1.15);for(let h=12;h<b.height-7;h+=18)rod(g,vec(p,h),vec(p,h+.7),1.3,'#ab8c62');rod(g,vec(p,Math.max(1,b.height-17)),vec(at(t,side*(half-2.2)*.35),b.height-4.5),.8);}}
   register(b.id,g,label(`${round(length)} × ${b.width} mm · H ${b.height}`, (start.x+end.x)/2,b.height+30,(start.y+end.y)/2));
   fitPoints.push(vec(start,b.height+12).add(root.position),vec(end,b.height+12).add(root.position));
  });
  const treeGeo=new THREE.IcosahedronGeometry(5,1);design.decorations.forEach(p=>{if(p.kind==='tree'){box(root,p.x,4,p.y,1.8,8,1.8,'#92794e');const tree=new THREE.Mesh(treeGeo,mat('#4c8a58'));tree.position.set(p.x,11,p.y);tree.castShadow=true;root.add(tree);}else{const group=new THREE.Group();group.position.set(p.x,0,p.y);group.rotation.y=-p.rotation*Math.PI/180;root.add(group);box(group,0,3,0,10,1.4,4,'#b18b55');[-3,3].forEach(x=>box(group,x,1.3,0,1.5,2.6,3,'#565b53'));}});
  function render(){renderer.render(scene,camera);}
  const applySelection=()=>{const current=selection.current;highlights.forEach((item,id)=>{item.helper.visible=id===current.selected;item.label.visible=id===current.selected&&current.dimensions;});render();};updateSelection.current=applySelection;
  const fitBounds=new THREE.Box3().setFromPoints(fitPoints),target=fitBounds.getCenter(new THREE.Vector3());target.y*=.65;
  function reset(){fitted=true;const direction=new THREE.Vector3(.35,.88,1).normalize();controls.target.copy(target);camera.position.copy(target).add(direction);camera.lookAt(target);camera.updateMatrixWorld();const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion),tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect;let distance=0;for(const point of fitPoints){const offset=point.clone().sub(target);distance=Math.max(distance,offset.dot(direction)+Math.max(Math.abs(offset.dot(right))/tanH,Math.abs(offset.dot(up))/tanV));}camera.position.copy(target).addScaledVector(direction,Math.max(80,distance*1.09));controls.update();render();}
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(fitted)reset();else render();};
  if(pose.current){camera.position.copy(pose.current.position);controls.target.copy(pose.current.target);fitted=pose.current.fitted;controls.update();}
  resize();applySelection();const observer=new ResizeObserver(resize);observer.observe(el);controls.addEventListener('change',render);const orbitStart=()=>{fitted=false;};controls.addEventListener('start',orbitStart);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let press:{x:number;y:number;id:number;dragged:boolean}|null=null;
  const down=(e:PointerEvent)=>{if(e.button===0)press={x:e.clientX,y:e.clientY,id:e.pointerId,dragged:false};};
  const move=(e:PointerEvent)=>{if(press&&e.pointerId===press.id&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>5)press.dragged=true;};
  const up=(e:PointerEvent)=>{const begin=press;press=null;if(!begin||begin.id!==e.pointerId||begin.dragged||Math.hypot(e.clientX-begin.x,e.clientY-begin.y)>5)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(selectable,true)[0];let object:THREE.Object3D|null=hit?.object??null;while(object&&!object.userData.selectId)object=object.parent;selection.current.onSelect(object?.userData.selectId??null);};
  const cancel=()=>{press=null;};renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);
  api.current={image:()=>{render();return renderer.domElement.toDataURL('image/png');},reset,zoom:factor=>{fitted=false;const offset=camera.position.clone().sub(controls.target);offset.multiplyScalar(factor);offset.clampLength(80,1800);camera.position.copy(controls.target).add(offset);controls.update();render();}};const lost=(e:Event)=>{e.preventDefault();setError(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
  return()=>{pose.current={position:camera.position.clone(),target:controls.target.clone(),fitted};observer.disconnect();controls.removeEventListener('change',render);controls.removeEventListener('start',orbitStart);controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',cancel);const geometries=new Set<THREE.BufferGeometry>();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line)geometries.add(o.geometry);if(o instanceof THREE.Sprite){o.material.map?.dispose();o.material.dispose();}if(o instanceof THREE.Line)(o.material as THREE.Material).dispose();});geometries.forEach(g=>g.dispose());treeGeo.dispose();cylinder.dispose();materials.forEach(m=>m.dispose());acrylic.dispose();acrylicEdge.dispose();renderer.dispose();renderer.domElement.remove();updateSelection.current=()=>{};api.current={image:()=>undefined,reset:()=>{},zoom:()=>{}};};
 },[design]);
 return <div className="dd-three" ref={host}>{error&&<p className="dd-three-error">{errorText}</p>}</div>;
});
