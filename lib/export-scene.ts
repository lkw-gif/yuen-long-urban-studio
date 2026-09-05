import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Expand instancing for compatibility with Blender importers; preserve named building groups.
export async function exportSceneBinary(root:THREE.Group):Promise<ArrayBuffer> {
 const clone=root.clone(true);
 const conversions:THREE.InstancedMesh[]=[];
 const exportMaterials=new Map<THREE.Material,THREE.Material>();
 const generated:THREE.BufferGeometry[]=[];
 clone.traverse(o=>{
  if(o instanceof THREE.InstancedMesh)conversions.push(o);
  if(o instanceof THREE.Mesh){
   const source=Array.isArray(o.material)?o.material:[o.material];
   const replaced=source.map(m=>{if(!exportMaterials.has(m)){const cp=m.clone();if(cp instanceof THREE.MeshStandardMaterial)cp.wireframe=false;exportMaterials.set(m,cp);}return exportMaterials.get(m)!;});
   o.material=Array.isArray(o.material)?replaced:replaced[0];
  }
 });
 try {
  for(const inst of conversions){
   const geos=[];
   for(let i=0;i<inst.count;i++){const matrix=new THREE.Matrix4();inst.getMatrixAt(i,matrix);geos.push(inst.geometry.clone().applyMatrix4(matrix));}
   const combined=mergeGeometries(geos);geos.forEach(g=>g.dispose());
   if(combined){generated.push(combined);const m=new THREE.Mesh(combined,inst.material);m.name=inst.name;m.position.copy(inst.position);m.quaternion.copy(inst.quaternion);m.scale.copy(inst.scale);inst.parent?.add(m);inst.removeFromParent();}
  }
  const result=await new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:true,trs:false});
  if(!(result instanceof ArrayBuffer))throw new Error('Invalid binary model output');
  return result;
 } finally {generated.forEach(g=>g.dispose());exportMaterials.forEach(m=>m.dispose());}
}
