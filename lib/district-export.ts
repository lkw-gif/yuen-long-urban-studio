import {type Design} from './district-design';
import {sitePath} from './site-path';
export function filename(d:Design){return [d.className,d.group,d.name||'district-design'].filter(Boolean).join('_').replace(/[<>:"/\\|?*]/g,'-');}
export function download(content:Blob|string,name:string){const url=typeof content==='string'?content:URL.createObjectURL(content);const a=document.createElement('a');a.href=url;a.download=name;a.click();if(typeof content!=='string')setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function exportPlan(svg:SVGSVGElement,name:string){const clone=svg.cloneNode(true) as SVGSVGElement;clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('viewBox','-33 -28 660 478');clone.setAttribute('width','1980');clone.setAttribute('height','1434');clone.setAttribute('font-family','Arial, Microsoft JhengHei, sans-serif');clone.querySelectorAll('[data-editor-only]').forEach(e=>e.remove());const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));try{const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=reject;img.src=url;});const canvas=document.createElement('canvas');canvas.width=1980;canvas.height=1434;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#35433b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);download(canvas.toDataURL('image/png'),name+'-plan.png');}finally{URL.revokeObjectURL(url);}}
export async function exportParts(d:Design,language:string){
 const [{buildProductionPlan},response]=await Promise.all([import('./building-plan-docx'),fetch(sitePath('/templates/building-production-plan.docx'))]);
 if(!response.ok)throw new Error('Word template could not be loaded.');
 const bytes=buildProductionPlan(new Uint8Array(await response.arrayBuffer()),d,language);
 download(new Blob([new Uint8Array(bytes)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),filename(d)+'-building-production-plan.docx');
}
