import catalog from './district-catalog.json';
import { BOUNDARY } from './model-data';

export type Point = {x:number;y:number};
export type ModelBox = {x:number;y:number;z:number;w:number;d:number;h:number;role?:string;name?:string};
export type Model = {id:string;kind:'print'|'wood';nameZh:string;nameEn:string;width:number;depth:number;height:number;boxes:ModelBox[];windows:ModelBox[];panels?:ModelBox[]};
export const MODELS = catalog.models as Model[];
export const MODEL_MAP = Object.fromEntries(MODELS.map(m=>[m.id,m]));
export const BOARD = {width:594,depth:420};
const fit=574/982;
export const SITE:Point[]=BOUNDARY.map(([x,y])=>({x:10+(x-12)*fit,y:(420-480*fit)/2+(y-14)*fit}));
export const ZONES = {residential:'#75a8ed',commercial:'#e9ac67',community:'#b79ce6',green:'#7ebd88',plaza:'#d4c89c'};
export type ZoneKind=keyof typeof ZONES;
export type Building = Point & {id:string;modelId:string;rotation:number};
export type Zone = Point & {id:string;kind:ZoneKind;w:number;d:number};
export type Road = {id:string;kind:'road'|'path';width:number;points:Point[]};
export type Bridge = {id:string;from:string;to:string;width:number;height:number};
export type Decoration = Point & {id:string;kind:'tree'|'bench';rotation:number};
export type Design = {version:1;board:typeof BOARD;name:string;className:string;group:string;buildings:Building[];zones:Zone[];roads:Road[];bridges:Bridge[];decorations:Decoration[]};
export const emptyDesign=():Design=>({version:1,board:{...BOARD},name:'',className:'',group:'',buildings:[],zones:[],roads:[],bridges:[],decorations:[]});
export const uid=()=>globalThis.crypto?.randomUUID?.()??`item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const snap=(n:number,grid=true)=>Math.round(n/(grid?5:1))*(grid?5:1);
export const round=(n:number)=>Math.round(n*10)/10;
export function localToWorld(b:Building,p:Point):Point {const a=b.rotation*Math.PI/180;return {x:b.x+p.x*Math.cos(a)-p.y*Math.sin(a),y:b.y+p.x*Math.sin(a)+p.y*Math.cos(a)};}
export function footprint(b:Building):Point[] {const m=MODEL_MAP[b.modelId];return [[-m.width/2,-m.depth/2],[m.width/2,-m.depth/2],[m.width/2,m.depth/2],[-m.width/2,m.depth/2]].map(([x,y])=>localToWorld(b,{x,y}));}
export function inside(p:Point,polygon=SITE):boolean {let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];const cross=(p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x);if(Math.abs(cross)<1e-6&&p.x>=Math.min(a.x,b.x)-1e-6&&p.x<=Math.max(a.x,b.x)+1e-6&&p.y>=Math.min(a.y,b.y)-1e-6&&p.y<=Math.max(a.y,b.y)+1e-6)return true;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;}return result;}
export function polygonInside(points:Point[]):boolean {return points.every((p,i)=>{const q=points[(i+1)%points.length];const steps=Math.max(1,Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)));return Array.from({length:steps+1},(_,k)=>inside({x:p.x+(q.x-p.x)*k/steps,y:p.y+(q.y-p.y)*k/steps})).every(Boolean);});}
export function zonePoints(z:Zone):Point[]{return [{x:z.x,y:z.y},{x:z.x+z.w,y:z.y},{x:z.x+z.w,y:z.y+z.d},{x:z.x,y:z.y+z.d}];}
function pointSegmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function segmentDistance(a:Point,b:Point,c:Point,d:Point){const cross=(p:Point,q:Point,r:Point)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);const c1=cross(a,b,c),c2=cross(a,b,d),c3=cross(c,d,a),c4=cross(c,d,b);if(c1*c2<0&&c3*c4<0)return 0;return Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b));}
export function roadInside(r:Road):boolean {return r.points.every((p,i)=>{const q=r.points[Math.min(i+1,r.points.length-1)];return inside(p)&&inside(q)&&SITE.every((a,j)=>segmentDistance(p,q,a,SITE[(j+1)%SITE.length])+1e-7>=r.width/2);});}
export function overlaps(a:Point[],b:Point[]):boolean {for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],axis={x:p.y-q.y,y:q.x-p.x};const aa=a.map(v=>v.x*axis.x+v.y*axis.y),bb=b.map(v=>v.x*axis.x+v.y*axis.y);if(Math.max(...aa)<=Math.min(...bb)+.01||Math.max(...bb)<=Math.min(...aa)+.01)return false;}return true;}
export function counts(d:Design){return {print:d.buildings.filter(b=>MODEL_MAP[b.modelId].kind==='print').length,wood:d.buildings.filter(b=>MODEL_MAP[b.modelId].kind==='wood').length};}
// Aim at actual solid modules at deck height, not the edge of a teaching base plate.
function anchor(b:Building,target:Point,height:number):Point|null {const m=MODEL_MAP[b.modelId];const solids=m.boxes.filter(box=>box.z<=height&&box.z+box.h>=height&&box.role!=='base');let best:Point|null=null,dist=Infinity;for(const box of solids){const center=localToWorld(b,{x:box.x+box.w/2-m.width/2,y:box.y+box.d/2-m.depth/2});const a=-b.rotation*Math.PI/180,dx=target.x-center.x,dy=target.y-center.y;const lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);const scale=1/Math.max(Math.abs(lx)/(box.w/2),Math.abs(ly)/(box.d/2),1e-9);const p=localToWorld(b,{x:box.x+box.w/2-m.width/2+lx*scale,y:box.y+box.d/2-m.depth/2+ly*scale});const d=Math.hypot(p.x-target.x,p.y-target.y);if(d<dist){best=p;dist=d;}}return best;}
export function bridgeGeometry(d:Design,bridge:Bridge){const a=d.buildings.find(b=>b.id===bridge.from),b=d.buildings.find(b=>b.id===bridge.to);if(!a||!b||a===b)return null;let start=anchor(a,b,bridge.height),end=anchor(b,a,bridge.height);if(!start||!end)return null;start=anchor(a,end,bridge.height);if(!start)return null;end=anchor(b,start,bridge.height);if(!end)return null;const length=Math.hypot(end.x-start.x,end.y-start.y);return {start,end,length,angle:Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI};}
export function validate(d:Design):string|null {
 const c=counts(d);if(c.print>6)return 'Maximum 6 printed buildings.';if(c.wood>4)return 'Maximum 4 wooden buildings.';
 if(d.buildings.some(b=>!polygonInside(footprint(b)))||d.zones.some(z=>!polygonInside(zonePoints(z)))||d.decorations.some(p=>!polygonInside([{x:p.x-5,y:p.y-5},{x:p.x+5,y:p.y-5},{x:p.x+5,y:p.y+5},{x:p.x-5,y:p.y+5}]))||d.roads.some(r=>!roadInside(r)))return 'Keep the whole object inside the site boundary.';
 for(const b of d.bridges){const g=bridgeGeometry(d,b);if(!g||g.length<2)return 'Choose two separated buildings with walls at this deck height.';if(!roadInside({id:b.id,kind:'path',width:b.width,points:[g.start,g.end]}))return 'The bridge must stay inside the site boundary.';}
 return null;
}
export function warnings(d:Design):string[]{const result:string[]=[];for(let i=0;i<d.buildings.length;i++)for(let j=i+1;j<d.buildings.length;j++)if(overlaps(footprint(d.buildings[i]),footprint(d.buildings[j])))result.push(`${d.buildings[i].modelId} / ${d.buildings[j].modelId}`);return result;}
export function blockedRoutes(d:Design):string[]{return d.buildings.filter(b=>d.roads.some(r=>r.points.slice(1).some((q,i)=>{const p=r.points[i],length=Math.hypot(q.x-p.x,q.y-p.y);if(!length)return false;const nx=-(q.y-p.y)/length*r.width/2,ny=(q.x-p.x)/length*r.width/2;return overlaps(footprint(b),[{x:p.x+nx,y:p.y+ny},{x:q.x+nx,y:q.y+ny},{x:q.x-nx,y:q.y-ny},{x:p.x-nx,y:p.y-ny}]);}))).map(b=>b.modelId);}
export function roadLength(r:Road):number{return r.points.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-r.points[i].x,p.y-r.points[i].y),0);}
export function parseDesign(input:unknown):Design {
 const fail=()=>{throw new Error('Invalid design file. Your current design is unchanged.');};
 if(!input||typeof input!=='object')return fail();const d=input as Design;
 const num=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
 const point=(p:Point)=>p&&num(p.x,0,594)&&num(p.y,0,420);
 const str=(s:unknown,max=100)=>typeof s==='string'&&s.length<=max;
 if(d.version!==1||d.board?.width!==594||d.board.depth!==420||!str(d.name)||!str(d.className)||!str(d.group))return fail();
 if(!['buildings','zones','roads','bridges','decorations'].every(k=>Array.isArray(d[k as keyof Design])))return fail();
 const objects=[...d.buildings,...d.zones,...d.roads,...d.bridges,...d.decorations];if(objects.some(o=>!o||!str(o.id,80)||!o.id)||new Set(objects.map(o=>o.id)).size!==objects.length)return fail();
 if(d.buildings.some(b=>!point(b)||!Object.hasOwn(MODEL_MAP,b.modelId)||!num(b.rotation,0,359)))return fail();
 if(d.zones.some(z=>!point(z)||!Object.hasOwn(ZONES,z.kind)||!num(z.w,5,594)||!num(z.d,5,420)))return fail();
 if(d.roads.some(r=>!['road','path'].includes(r.kind)||!num(r.width,4,50)||!Array.isArray(r.points)||r.points.length<2||r.points.some(p=>!point(p))))return fail();
 if(d.decorations.some(p=>!point(p)||!['tree','bench'].includes(p.kind)||!num(p.rotation,0,359)))return fail();
 if(d.bridges.some(b=>!num(b.width,8,30)||!num(b.height,8,120)||b.from===b.to||![b.from,b.to].every(id=>d.buildings.some(x=>x.id===id))))return fail();
 const error=validate(d);if(error)throw new Error(error);
 // Rebuild through a schema whitelist. Imported data can never supply markup or geometry.
 return {version:1,board:{...BOARD},name:d.name,className:d.className,group:d.group,buildings:d.buildings.map(({id,modelId,x,y,rotation})=>({id,modelId,x,y,rotation})),zones:d.zones.map(({id,kind,x,y,w,d})=>({id,kind,x,y,w,d})),roads:d.roads.map(({id,kind,width,points})=>({id,kind,width,points:points.map(({x,y})=>({x,y}))})),bridges:d.bridges.map(({id,from,to,width,height})=>({id,from,to,width,height})),decorations:d.decorations.map(({id,kind,x,y,rotation})=>({id,kind,x,y,rotation}))};
}
