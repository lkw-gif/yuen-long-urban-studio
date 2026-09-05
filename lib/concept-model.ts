import * as THREE from 'three';
import { world } from './model-data';
import { CONCEPT_BY_ID, type ConceptId, type ConceptBuilding } from './concept-data';
import type { LayerName } from './urban-model';

export function createConceptModel(id:ConceptId){
 const concept=CONCEPT_BY_ID[id],root=new THREE.Group();root.name='Concept_'+concept.en.replaceAll(' ','_');root.userData={source:concept.image,reconstruction:'Illustrative reconstruction from a single user-provided concept image; not a measured replica',units:'illustrative units',concept:id};
 const layers=Object.fromEntries(['buildings','parks','roads','curbs'].map(n=>{const g=new THREE.Group();g.name=n;root.add(g);return[n,g];})) as Record<LayerName,THREE.Group>;
 const connections=new THREE.Group();connections.name=id==='vibrant'?'Riverside_bridges':'Elevated_walkway_network';root.add(connections);
 const material=(color:string,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.84,...extra});
 const mats={white:material('#d8dad3'),blue:material('#103cb8'),wood:material('#bf9761'),woodLight:material('#d5b47e'),brown:material('#765338'),glass:material('#697e81',{roughness:.35}),window:material('#a1adb0'),road:material('#626b6b'),curb:material('#d5d1bc'),base:material('#b2a489'),grass:material('#9dab69'),water:material('#398dc1',{roughness:.32,metalness:.12}),ripple:material('#66accb'),purple:material('#a295b0'),zoneBlue:material('#839fb4'),yellow:material('#c6b581'),whiteLine:material('#edece0'),court:material('#b67b58'),deck:material('#dfddd0'),rail:material('#c4cecb'),bridgeGlass:material('#afc8d0',{transparent:true,opacity:.22,roughness:.2,depthWrite:false}),trunk:material('#746044'),foliage:material('#708453')};
 const cube=new THREE.BoxGeometry(1,1,1);
 function box(g:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material,name=''){const o=new THREE.Mesh(cube,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.name=name;o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
 function rect(g:THREE.Group,x:number,z:number,w:number,d:number,m:THREE.Material,y=.42,h=.18){const [wx,wz]=world(x,z);return box(g,wx,y,wz,w*.4,h,d*.4,m);}
 function polygon(g:THREE.Group,points:number[][],m:THREE.Material,y=.25,depth=.25){const s=new THREE.Shape();points.forEach(([x,z],i)=>{const [wx,wz]=world(x,z);if(i)s.lineTo(wx,-wz);else s.moveTo(wx,-wz);});s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,m);mesh.position.y=y;mesh.receiveShadow=true;mesh.castShadow=true;g.add(mesh);return mesh;}
 function segment(g:THREE.Group,a:number[],b:number[],w:number,h:number,m:THREE.Material,name=''){const aa=new THREE.Vector3(...world3(a)),bb=new THREE.Vector3(...world3(b));const delta=bb.clone().sub(aa);const mesh=box(g,0,0,0,w,h,delta.length(),m,name);mesh.position.copy(aa.add(bb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),delta.normalize());return mesh;}
 function world3(p:number[]):[number,number,number]{const [x,z]=world(p[0],p[1]);return[x,p[2],z];}
 function path(points:number[][],width:number,m:THREE.Material,y=.5,g=layers.roads){for(let i=1;i<points.length;i++)segment(g,[...points[i-1],y],[...points[i],y],width*.4,.15,m);}
 rect(root,500,325,1000,650,mats.base,-1.8,3.6).name='Clean_model_base';
 rect(layers.roads,500,325,990,640,mats.curb,.1,.2);
 rect(layers.roads,500,325,978,628,mats.road,.25,.15);
 rect(layers.parks,587,325,740,557,mats.grass,.44,.22);
 // Continuous neutral road edge, without a colored perimeter outline.
 path([[10,10],[990,10],[990,640],[10,640],[10,10]],2.2,mats.curb,.45,layers.curbs);
 for(let x=32;x<977;x+=23){rect(layers.roads,x,25,11,1.2,mats.whiteLine,.43,.06);rect(layers.roads,x,624,11,1.2,mats.whiteLine,.43,.06);}
 for(let z=65;z<612;z+=23)rect(layers.roads,975,z,1.2,11,mats.whiteLine,.43,.06);
 const riverRight=id==='vibrant'?154:142;
 if(id==='vibrant')polygon(layers.parks,[[65,45],[151,45],[158,140],[146,255],[158,359],[144,468],[150,604],[64,604],[72,480],[61,390],[71,260],[61,145]],mats.water,.4,.09).name='Riverside_water';
 else rect(layers.parks,83,325,118,558,mats.water,.44,.15).name='River';
 rect(layers.parks,id==='vibrant'?39:17,325,id==='vibrant'?40:12,558,mats.woodLight,.5,.2).name='West_riverwalk';
 rect(layers.parks,id==='vibrant'?185:157,325,id==='vibrant'?52:23,558,mats.woodLight,.5,.2).name='East_riverwalk';
 for(let z=53;z<600;z+=12){rect(layers.parks,id==='vibrant'?39:157,z,id==='vibrant'?40:22,.6,mats.wood,.63,.05);}
 for(let z=61;z<599;z+=19)for(let x=80;x<riverRight-10;x+=23){path([[x,z],[x+5,z+2],[x+10,z]],.6,mats.ripple,.53,layers.parks);}
 const zones=(items:[number,number,number,number,keyof typeof mats][])=>items.forEach(([x,z,w,d,m])=>rect(layers.parks,x,z,w,d,mats[m],.55,.16));
 if(id==='vibrant'){
  zones([[385,291,243,174,'purple'],[392,502,227,196,'grass'],[613,156,135,215,'zoneBlue'],[801,179,289,264,'zoneBlue'],[779,385,340,124,'zoneBlue'],[777,530,345,140,'zoneBlue'],[624,520,146,160,'zoneBlue'],[599,337,98,94,'yellow']]);
  path([[235,47],[235,604]],24,mats.road);path([[520,47],[520,604]],27,mats.road);path([[236,211],[520,211]],20,mats.road);path([[235,390],[951,390]],24,mats.road);path([[535,295],[690,320],[949,320]],23,mats.road);path([[686,321],[686,604]],24,mats.road);path([[687,458],[949,458]],20,mats.road);path([[690,526],[950,526]],20,mats.road);
 }else if(id==='skybridge'){
  zones([[238,158,139,216,'zoneBlue'],[237,394,139,226,'grass'],[409,184,143,136,'grass'],[407,377,158,137,'yellow'],[409,534,159,139,'yellow'],[627,100,260,108,'purple'],[592,194,175,132,'purple'],[557,353,133,145,'yellow'],[783,252,329,169,'yellow'],[810,485,299,224,'purple'],[578,534,121,134,'zoneBlue'],[864,93,171,98,'purple'],[860,170,172,68,'grass']]);
  path([[321,46],[321,606]],24,mats.road);path([[496,47],[496,271],[505,308],[490,602]],25,mats.road);path([[730,45],[730,175]],23,mats.road);path([[315,296],[486,296]],18,mats.road);path([[324,446],[958,446]],24,mats.road);path([[628,339],[633,605]],24,mats.road);path([[733,213],[953,213]],20,mats.road);path([[658,325],[955,325]],25,mats.road);path([[954,45],[954,600]],21,mats.road);
 }else{
  zones([[270,180,165,263,'yellow'],[260,459,174,280,'zoneBlue'],[417,311,117,514,'zoneBlue'],[590,333,182,230,'purple'],[559,542,126,129,'grass'],[745,548,161,111,'purple'],[799,159,289,208,'zoneBlue'],[836,423,220,311,'grass'],[620,133,246,166,'yellow']]);
  path([[174,47],[174,604]],24,mats.road);path([[350,47],[350,604]],24,mats.road);path([[488,46],[488,248],[461,295],[483,375],[482,604]],21,mats.road);path([[610,51],[610,218],[690,278],[689,417],[666,478],[666,601]],23,mats.road);path([[173,242],[480,242],[690,265],[951,265]],21,mats.road);path([[175,421],[346,421],[482,401],[690,421],[952,441]],21,mats.road);path([[824,265],[824,603]],20,mats.road);
 }
 // Crossing markings remain flush with the road surfaces.
 for(const [x,z] of id==='vibrant'?[[235,207],[520,382],[686,449],[235,589]]:id==='skybridge'?[[320,431],[496,282],[631,432],[954,313]]:[[174,412],[350,230],[482,394],[689,414]])for(let i=-3;i<=3;i++)rect(layers.roads,x+i*2.7,z,1.5,12,mats.whiteLine,.64,.07);
 function court(x:number,z:number,w:number,d:number,basket=false){rect(layers.parks,x,z,w+7,d+7,basket?mats.court:mats.grass,.8,.1);const line=(p:number[][])=>path(p,.7,mats.whiteLine,.93,layers.parks);line([[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2],[x-w/2,z-d/2]]);line([[x-w/2,z],[x+w/2,z]]);const circle=new THREE.Mesh(new THREE.RingGeometry(w*.045,w*.045+.17,32),mats.whiteLine);const [wx,wz]=world(x,z);circle.rotation.x=-Math.PI/2;circle.position.set(wx,1,wz);layers.parks.add(circle);for(const s of [-1,1])line([[x-w*.22,z+s*d/2],[x-w*.22,z+s*d*.3],[x+w*.22,z+s*d*.3],[x+w*.22,z+s*d/2]]);}
 if(id==='vibrant'){court(365,567,115,52);court(466,467,37,70,true);}if(id==='skybridge')court(416,190,132,119);
 let trees=0;function tree(x:number,z:number){const [wx,wz]=world(x,z);box(layers.parks,wx,1.7,wz,.5,3,.5,mats.trunk);const m=new THREE.Mesh(new THREE.IcosahedronGeometry(2.4,1),mats.foliage);m.position.set(wx,4,wz);m.scale.y=1.2;m.castShadow=true;layers.parks.add(m);trees++;}
 if(id==='vibrant'){for(let z=67;z<600;z+=29)tree(210,z);for(let x=269;x<500;x+=24)tree(x,590);}else if(id==='skybridge'){for(let z=290;z<430;z+=28)tree(294,z);for(let x=356;x<460;x+=24)tree(x,246);}else for(let z=66;z<595;z+=31)tree(164,z);
 const buildingGroups=new Map<string,THREE.Group>(),buildingMaterials:THREE.MeshStandardMaterial[]=[];
 function facade(g:THREE.Group,w:number,d:number,h:number){const rows=Math.max(2,Math.floor((h-3)/3.3)),columns=Math.max(2,Math.floor(w/2.7)),side=Math.max(2,Math.floor(d/2.7));const mesh=new THREE.InstancedMesh(cube,mats.window,rows*(columns+side)*2);const o=new THREE.Object3D();let i=0;for(let r=0;r<rows;r++)for(const sign of [-1,1]){for(let c=0;c<columns;c++){o.position.set((c-(columns-1)/2)*(w-.9)/columns,2.8+r*3.3,sign*(d/2+.025));o.scale.set((w-.9)/columns*.62,1.65,.07);o.updateMatrix();mesh.setMatrixAt(i++,o.matrix);}for(let c=0;c<side;c++){o.position.set(sign*(w/2+.025),2.8+r*3.3,(c-(side-1)/2)*(d-.9)/side);o.scale.set(.07,1.65,(d-.9)/side*.62);o.updateMatrix();mesh.setMatrixAt(i++,o.matrix);}}mesh.name='Facade_windows';g.add(mesh);}
 function createBuilding(b:ConceptBuilding){const g=new THREE.Group();g.name=b.id;g.userData={id:b.id,label:b.name,illustrativeHeight:b.h};const [x,z]=world(b.x,b.z);g.position.set(x,.72,z);layers.buildings.add(g);buildingGroups.set(b.id,g);const w=b.w*.4,d=b.d*.4,h=b.h;const m=mats[b.kind==='station'||b.kind==='cylinder'?'white':b.kind];buildingMaterials.push(m);
  if(b.kind==='white'){box(g,0,h/2,0,w,h,d,m,'Tower');box(g,0,h+1,0,w*.47,2,d*.54,m,'Roof_core');box(g,0,1,0,w+.7,2,d+.7,m,'Podium');facade(g,w,d,h);for(const side of [-1,1]){box(g,side*w/2,h+.4,0,.3,.8,d,m);box(g,0,h+.4,side*d/2,w,.8,.3,m);}}
  else if(b.kind==='blue'){box(g,0,h/2,0,w*.54,h,d,m,'Cross_tower_spine');box(g,0,h/2,0,w,h,d*.54,m,'Cross_tower_wings');box(g,0,h+1,0,w*.44,2,d*.44,m);const rib=material('#174aad');for(const sign of [-1,1]){box(g,sign*w*.35,h/2,0,w*.12,h+2,d*.65,rib,'Vertical_fin');box(g,0,h/2,sign*d*.34,w*.62,h+1,d*.12,rib,'Vertical_fin');}}
  else if(b.kind==='brown'){for(let xx=-1;xx<=1;xx++)for(let zz=-1;zz<=1;zz++){const bh=h*(.57+((xx+zz+4)%3)*.19);box(g,xx*w*.31,bh/2,zz*d*.31,w*.3,bh,d*.3,m,'Modular_volume');}}
  else if(b.kind==='cylinder'){const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2,h,32),mats.white);cylinder.position.y=h/2;cylinder.castShadow=true;g.add(cylinder);for(let y=3;y<h;y+=3){const band=new THREE.Mesh(new THREE.TorusGeometry(w/2+.04,.18,4,32),mats.window);band.rotation.x=Math.PI/2;band.position.y=y;g.add(band);}const hole=new THREE.Mesh(new THREE.CylinderGeometry(w*.18,w*.18,.15,24),mats.glass);hole.position.y=h+.1;g.add(hole);}
  else if(b.kind==='station'){box(g,0,3,0,w,6,d,mats.glass,'Station_concourse');const sh=new THREE.Shape();sh.absarc(0,0,w/2,Math.PI,0,true);sh.lineTo(w/2-.65,0);sh.absarc(0,0,w/2-.65,0,Math.PI,false);sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false,curveSegments:24});const roof=new THREE.Mesh(geo,material('#547fae',{roughness:.35,transparent:true,opacity:.74}));roof.position.set(0,6,-d/2);roof.name='Arched_station_roof';roof.castShadow=true;g.add(roof);for(let zz=-d/2;zz<=d/2;zz+=d/7){const rib=new THREE.Mesh(new THREE.TorusGeometry(w/2,.25,5,32,Math.PI),mats.white);rib.position.set(0,6,zz);g.add(rib);}for(let xx=-w*.45;xx<w*.5;xx+=w*.3)box(g,xx,3,d/2,.5,6,.5,mats.white);}
  else{
   if(b.id==='s-hub'){const shell=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2,h,8),mats.wood);shell.position.y=h/2;shell.rotation.y=Math.PI/8;shell.castShadow=true;g.add(shell);const roof=new THREE.Mesh(new THREE.CylinderGeometry(w*.56,w*.56,1.2,8),mats.woodLight);roof.position.y=h+.5;roof.rotation.y=Math.PI/8;roof.name='Octagonal_hub_roof';g.add(roof);for(const side of [-1,1])box(g,0,h*.4,side*d*.465,w*.52,h*.5,.2,mats.glass,'Hub_entrance');}
   else {box(g,0,h*.46,0,w*.94,h*.89,d*.94,mats.glass,'Glazed_civic_building');box(g,0,.8,0,w+1.3,1.6,d+1.3,mats.wood,'Timber_base');box(g,0,h,0,w+1.1,1.2,d+1.1,mats.woodLight,'Timber_roof');for(const sign of [-1,1]){for(let xx=-w/2;xx<=w/2+.1;xx+=w/4)box(g,xx,h/2,sign*d/2,.65,h,.65,mats.wood,'Timber_column');for(let zz=-d/2;zz<=d/2+.1;zz+=d/3)box(g,sign*w/2,h/2,zz,.65,h,.65,mats.wood);}box(g,0,h*.47,d/2,w,.65,.7,mats.wood,'Facade_beam');box(g,0,h*.47,-d/2,w,.65,.7,mats.wood);}
   if(b.id==='v-mall'){box(g,0,h+.7,0,w*.72,.15,d*.65,mats.glass,'Roof_skylight');for(let xx=-w*.36;xx<=w*.37;xx+=w*.18)box(g,xx,h+.9,0,.25,.25,d*.65,mats.woodLight);}
  }
 }
 concept.buildings.forEach(createBuilding);
 // Transparent pedestrian bridges: deck, balustrades, roof ribs and repeated supporting columns.
 concept.bridges.forEach((bridge,index)=>{const group=new THREE.Group();group.name='Walkway_'+String(index+1).padStart(2,'0');connections.add(group);for(let i=1;i<bridge.points.length;i++){const a=bridge.points[i-1],b=bridge.points[i];const aa=new THREE.Vector3(...world3(a)),bb=new THREE.Vector3(...world3(b));const length=aa.distanceTo(bb);const local=new THREE.Group();local.position.copy(aa.clone().add(bb).multiplyScalar(.5));local.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),bb.clone().sub(aa).normalize());group.add(local);const width=bridge.width*.4;box(local,0,0,0,width,.7,length,id==='vibrant'?mats.wood:mats.deck,'Walkway_deck');for(const side of [-1,1]){box(local,side*width/2,1.35,0,.18,.18,length,mats.rail,'Handrail');if(bridge.covered){box(local,side*width/2,1.7,0,.08,3.4,length,mats.bridgeGlass,'Glass_balustrade');box(local,side*width/2,3.6,0,.18,.18,length,mats.rail,'Roof_rail');}}if(bridge.covered)box(local,0,3.65,0,width,.08,length,mats.bridgeGlass,'Transparent_walkway_roof');
  const bays=Math.max(1,Math.ceil(length/9));for(let j=0;j<=bays;j++){const zz=-length/2+length*j/bays;for(const s of [-1,1])box(local,s*width/2,bridge.covered?1.8:.8,zz,.16,bridge.covered?3.6:1.6,.16,mats.rail,'Balustrade_post');if(bridge.covered)box(local,0,3.65,zz,width,.16,.16,mats.rail,'Roof_rib');}
  const supportCount=Math.max(1,Math.ceil(length/24));for(let j=0;j<=supportCount;j++){const p=aa.clone().lerp(bb,j/supportCount);if(p.y>2)box(group,p.x,p.y/2-.1,p.z,.75,p.y-.6,.75,id==='vibrant'?mats.wood:mats.curb,'Bridge_support');}
 }});
 // Indoor recreation enclosure in the two denser proposals.
 if(id!=='vibrant'){const x=id==='skybridge'?235:262,z=id==='skybridge'?361:475;const h=id==='skybridge'?19:38;const w=76,d=72;rect(layers.parks,x,z,w,d,mats.yellow,.76,.18);rect(layers.parks,x,z,w,d,mats.bridgeGlass,h,.1);for(const sx of [-1,1])for(const sz of [-1,1]){const [wx,wz]=world(x+sx*w/2,z+sz*d/2);box(layers.parks,wx,h/2,wz,.65,h,.65,mats.rail);}for(const sign of [-1,1]){const [wx,wz]=world(x,z+sign*d/2);box(layers.parks,wx,h/2,wz,w*.4,h,.09,mats.bridgeGlass);const [xx,zz]=world(x+sign*w/2,z);box(layers.parks,xx,h/2,zz,.09,h,d*.4,mats.bridgeGlass);}}
 root.updateMatrixWorld(true);
 return {root,layers,connections,buildingGroups,buildingMaterials,stats:{buildings:concept.buildings.length,trees}};
}

