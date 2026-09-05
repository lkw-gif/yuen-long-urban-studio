import * as THREE from 'three';
import { BUILDINGS, BOUNDARY, STREET_INNER_EDGE, world } from './model-data';
import { insetContour } from './road-contour';

export type LayerName = 'buildings' | 'parks' | 'roads' | 'curbs';
export function createUrbanModel() {
 const root = new THREE.Group(); root.name = 'Yuen_Long_Urban_Study';
 root.userData = { source:'User-provided map screenshots', accuracy:'Illustrative heights and dimensions; not a survey', axis:'Y up, north -Z' };
 const layers = Object.fromEntries(['buildings','parks','roads','curbs'].map(n=>{const g=new THREE.Group();g.name=n;root.add(g);return [n,g];})) as Record<LayerName,THREE.Group>;
 const material = (color:string, extra={})=>new THREE.MeshStandardMaterial({color,roughness:.88,...extra});
 const mats={base:material('#697374'),paving:material('#b6b8a9'),road:material('#596469'),line:material('#e5e5d9'),grass:material('#889c72'),court:material('#b37e68'),field:material('#788d73'),roof:material('#a3a79a'),trim:material('#b2b5a7'),glass:material('#647978'),trunk:material('#766b56'),water:material('#79a6a3'),curb:material('#c8cbbf')};
 const cube = new THREE.BoxGeometry(1,1,1);
 function box(g:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material,name='') {const o=new THREE.Mesh(cube,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;o.name=name;g.add(o);return o;}
 function rect(g:THREE.Group,x:number,z:number,w:number,d:number,m:THREE.Material,y=.5,h=.3){const [wx,wz]=world(x,z);return box(g,wx,y,wz,w*.4,h,d*.4,m);}
 function polygon(points:[number,number][],depth:number,mat:THREE.Material,y:number,g:THREE.Group,holes:[number,number][][]=[]){const sh=new THREE.Shape();const trace=(path:THREE.Path,contour:[number,number][])=>{contour.forEach(([x,z],i)=>{const [wx,wz]=world(x,z);if(i===0)path.moveTo(wx,-wz);else path.lineTo(wx,-wz);});path.closePath();};trace(sh,points);for(const hole of holes){const path=new THREE.Path();trace(path,hole);sh.holes.push(path);}const geo=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false});geo.rotateX(-Math.PI/2);const o=new THREE.Mesh(geo,mat);o.position.y=y;o.receiveShadow=true;o.castShadow=true;g.add(o);return o;}
 const plinth=polygon(BOUNDARY,3.5,mats.base,-3.5,root);plinth.name='Study_area_plinth';
 polygon(BOUNDARY,.18,mats.road,0,layers.roads).name='Continuous_perimeter_road';
 polygon(STREET_INNER_EDGE,.18,mats.paving,.18,layers.roads).name='Inner_street_block';
 polygon(BOUNDARY,.38,mats.curb,.18,layers.curbs,[insetContour(BOUNDARY,1.8)]).name='Outer_road_curb';
 polygon(insetContour(STREET_INNER_EDGE,-1.6),.3,mats.curb,.18,layers.curbs,[STREET_INNER_EDGE]).name='Inner_road_curb';
 polygon(insetContour(BOUNDARY,5),.025,mats.line,.195,layers.curbs,[insetContour(BOUNDARY,5.8)]).name='Road_edge_markings';
 const roads:[number,number][][]=[[[16,48],[840,48],[977,63]],[[19,482],[795,482]],[[450,91],[449,205],[445,330],[440,478]],[[100,89],[98,269],[94,393],[96,478]],[[448,329],[625,327],[676,241],[700,233],[873,238]],[[448,200],[552,202],[576,216],[590,326]],[[625,327],[674,327],[695,308],[724,249]],[[978,104],[937,173],[895,224],[859,279],[831,359],[812,424],[799,478]],[[443,341],[400,346],[281,344],[261,350],[246,383],[246,469]]];
 const roadWidths=[67,22,22,12,17,16,12,26,13];
 function strip(points:number[][],width:number,mat:THREE.Material,y:number,g:THREE.Group){for(let i=1;i<points.length;i++){const [ax,az]=world(points[i-1][0],points[i-1][1]);const [bx,bz]=world(points[i][0],points[i][1]);const dx=bx-ax,dz=bz-az;const o=box(g,(ax+bx)/2,y,(az+bz)/2,width*.4,.15,Math.hypot(dx,dz)+width*.12,mat);o.rotation.y=Math.atan2(dx,dz);}}
 // Perimeter streets use the closed contour above, so no road segments project beyond the base.
 roads.forEach((p,i)=>{if(![0,1,7].includes(i))strip(p,roadWidths[i],mats.road,.4,layers.roads);});
 for(let x=26;x<950;x+=21)rect(layers.roads,x,48,10,1.4,mats.line,.43,.08);
 for(let x=28;x<790;x+=19)rect(layers.roads,x,482,8,1,mats.line,.43,.08);
 for(let z=99;z<470;z+=22)rect(layers.roads,447,z,1,8,mats.line,.44,.08);
 strip([[447,25],[817,25],[959,40]],2,mats.line,.44,layers.roads);
 strip([[447,71],[837,71],[959,79]],2,mats.line,.44,layers.roads);
 // Narrow channel at the western edge.
 strip([[37,90],[49,121],[52,161],[44,249],[45,364],[51,419],[66,470]],10,mats.water,.34,layers.roads);
 [[446,87],[444,462],[806,455],[100,85]].forEach(([x,z])=>{for(let i=-3;i<=3;i++)rect(layers.roads,x+i*3.4,z,1.8,13,mats.line,.5,.08);});
 rect(layers.parks,374,237,133,175,mats.grass,.55,.4);
 rect(layers.parks,167,331,125,127,mats.grass,.55,.4);
 rect(layers.parks,367,205,104,89,mats.court,.8,.12);
 rect(layers.parks,365,204,75,74,mats.field,.9,.09);
 rect(layers.parks,166,330,88,91,mats.court,.8,.12);
 rect(layers.parks,164,330,66,74,mats.field,.9,.09);
 function court(x:number,z:number,w:number,d:number){strip([[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2],[x-w/2,z-d/2]],.75,mats.line,1,layers.parks);strip([[x-w/2,z],[x+w/2,z]],.75,mats.line,1,layers.parks);const [wx,wz]=world(x,z);const r=new THREE.Mesh(new THREE.RingGeometry(2.5,2.7,32),mats.line);r.rotation.x=-Math.PI/2;r.position.set(wx,1.08,wz);layers.parks.add(r);for(const sign of [-1,1]){strip([[x-14,z+sign*(d/2-1)],[x-14,z+sign*(d/2-17)],[x+14,z+sign*(d/2-17)],[x+14,z+sign*(d/2-1)]],.7,mats.line,1,layers.parks);rect(layers.parks,x,z+sign*(d/2+3),11,1.5,mats.trim,2.5,2);}}
 court(365,204,70,69);court(164,330,60,68);
 rect(layers.parks,371,274,120,6,mats.paving,.83,.15);
 rect(layers.parks,336,292,5,51,mats.paving,.83,.15);
 rect(layers.parks,397,292,5,51,mats.paving,.83,.15);
 // Faceted trees placed around the parks, paths and street corners.
 const treeLocations:number[][]=[];
 for(let x=314;x<=432;x+=15){treeLocations.push([x,155],[x,316]);}
 for(let z=166;z<316;z+=16){treeLocations.push([314,z],[432,z]);}
 for(let x=112;x<229;x+=15){treeLocations.push([x,274],[x,389]);}
 for(let z=286;z<389;z+=17){treeLocations.push([110,z],[224,z]);}
 for(let x=337;x<410;x+=16)for(let z=285;z<309;z+=16)treeLocations.push([x,z]);
 for(let z=117;z<458;z+=25)treeLocations.push([78,z]);
 treeLocations.push([663,210],[682,213],[692,264],[678,287],[716,218],[742,220],[264,290],[285,273],[285,308]);
 const foliageMats=['#728963','#829969','#657e5d'].map(c=>material(c));
 treeLocations.forEach(([x,z],i)=>{const [wx,wz]=world(x,z);const h=3.6+(i%5)*.35;box(layers.parks,wx,1.9,wz,.5,3.7,.5,mats.trunk);const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(2.3+(i%3)*.25,1),foliageMats[i%3]);tree.position.set(wx,h,wz);tree.scale.set(1,1.25,1);tree.rotation.y=i;tree.castShadow=true;tree.receiveShadow=true;tree.name='Tree_'+i;layers.parks.add(tree);});
 const buildingGroups=new Map<string,THREE.Group>();
 const buildingMaterials:THREE.MeshStandardMaterial[]=[];
 const tones=['#c9c8b9','#d2cfc0','#bfc2b7','#c4c4b5','#d1cbb9'];
 BUILDINGS.forEach((b,i)=>{const g=new THREE.Group();g.name=b.en==='Context building'?b.id:b.en.replaceAll(' ','_');g.userData={id:b.id,label:b.name,height:'illustrative',heightValue:b.h};const [x,z]=world(b.x,b.z);g.position.set(x,.5,z);g.rotation.y=(b.rotation||0)*Math.PI/180;layers.buildings.add(g);buildingGroups.set(b.id,g);const w=b.w*.4,d=b.d*.4,h=b.h;const m=material(tones[i%tones.length]);buildingMaterials.push(m);box(g,0,1.7,0,w+1,3.4,d+1,m,'Podium');box(g,0,h/2,0,w,h,d,m,'Building_mass');box(g,0,h+.24,0,w+.4,.5,d+.4,mats.trim,'Roof_coping');box(g,0,h+.52,0,w-1,.15,d-1,mats.roof,'Roof');
 const setback=i%3===0?3.8:2.6;box(g,-w*.16,h+setback/2+.5,0,w*.4,setback,d*.62,m,'Roof_access');
 for(const side of [-1,1]){box(g,0,h+.85,side*d/2,w,.85,.32,mats.trim);box(g,side*w/2,h+.85,0,.32,.85,d,mats.trim);}
 const equipment=Math.max(1,Math.floor(w/10));for(let a=0;a<equipment;a++){box(g,-w*.31+a*6,h+1.1,d*.28,2.3,1.1,2.1,mats.roof,'Rooftop_equipment');}
 // Repeating facade panels are batched per building for a responsive viewer.
 const rows=Math.max(2,Math.floor((h-4)/3)),cols=Math.max(2,Math.floor((w-2)/3.1)),sideCols=Math.max(1,Math.floor((d-2)/3.1));const panels=new THREE.InstancedMesh(cube,mats.glass,rows*(cols+sideCols)*2);let n=0;const dummy=new THREE.Object3D();for(let r=0;r<rows;r++){for(const s of [-1,1]){for(let c=0;c<cols;c++){dummy.position.set((c-(cols-1)/2)*((w-2)/cols),4+r*3,s*(d/2+.04));dummy.scale.set(Math.min(1.45,(w-2)/cols*.56),1.4,.07);dummy.rotation.set(0,0,0);dummy.updateMatrix();panels.setMatrixAt(n++,dummy.matrix);}for(let c=0;c<sideCols;c++){dummy.position.set(s*(w/2+.04),4+r*3,(c-(sideCols-1)/2)*((d-2)/sideCols));dummy.scale.set(.07,1.4,Math.min(1.45,(d-2)/sideCols*.56));dummy.updateMatrix();panels.setMatrixAt(n++,dummy.matrix);}}}panels.name='Facade_windows';g.add(panels);
 for(let floor=6;floor<h-1;floor+=6){box(g,0,floor,0,w+.15,.2,d+.15,mats.trim,'Floor_band');}
 });
 // Light-rail track and modest street furniture along the northern road.
 for(const off of [-6,6]){strip([[30,48+off],[850,48+off]],.65,mats.trim,.58,layers.roads);}
 for(let x=35;x<850;x+=11)rect(layers.roads,x,48,.6,15,mats.roof,.49,.1);
 [[238,66],[531,67],[657,67]].forEach(([x,z])=>{rect(layers.roads,x,z,38,6,mats.paving,.8,1);rect(layers.roads,x,z,28,5,mats.trim,3.4,.35);});
 return {root,layers,buildingGroups,buildingMaterials,stats:{buildings:BUILDINGS.length,trees:treeLocations.length}};
}
