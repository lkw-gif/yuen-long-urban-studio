import { BUILDINGS } from './model-data';
export type SceneConfiguration = { view?: 'iso'|'top'; selectedBuilding?:string; heightScale?:number; };
export function validateSceneConfiguration(input:unknown):SceneConfiguration {
 if(!input || typeof input!=='object' || Array.isArray(input))throw new Error('Expected a configuration object.');
 const v=input as Record<string,unknown>;
 if(Object.keys(v).some(k=>!['view','selectedBuilding','heightScale'].includes(k)))throw new Error('Unknown configuration property.');
 if(v.view!==undefined && v.view!=='iso' && v.view!=='top')throw new Error('view must be iso or top.');
 if(v.selectedBuilding!==undefined && !BUILDINGS.some(b=>b.id===v.selectedBuilding))throw new Error('Unknown building ID.');
 if(v.heightScale!==undefined && (typeof v.heightScale!=='number'||!Number.isFinite(v.heightScale)||v.heightScale<.4||v.heightScale>2))throw new Error('heightScale must be between 0.4 and 2.');
 return v as SceneConfiguration;
}
type Tool = { name:string; title:string; description:string; inputSchema:object; annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown; };
type ToolContext = { registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>; };
export function registerSceneTools(context:ToolContext|undefined,configure:(v:SceneConfiguration)=>unknown,inspect:()=>unknown){
 if(!context?.registerTool)return()=>{};
 const lifecycle=new AbortController();
 const registrations:Tool[]=[{name:'inspect_urban_scene',title:'Inspect urban scene',description:'Read the current camera view, selected building and illustrative height scale, and available building IDs.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>inspect()},{name:'configure_urban_scene',title:'Configure urban scene',description:'Change the visible camera view, selected building or illustrative height multiplier. Does not export files.',inputSchema:{type:'object',properties:{view:{type:'string',enum:['iso','top']},selectedBuilding:{type:'string',enum:BUILDINGS.map(b=>b.id)},heightScale:{type:'number',minimum:.4,maximum:2}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(v)=>configure(validateSceneConfiguration(v))}];
 for(const tool of registrations){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser API: the interface remains fully functional. */}}
 return()=>lifecycle.abort();
}
export function getSceneToolContext(){return typeof document==='undefined'?undefined:(document as Document & {modelContext?:ToolContext}).modelContext;}
