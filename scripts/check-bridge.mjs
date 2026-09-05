import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createBridgeLessonModel, BRIDGE_SIZE } from '../lib/bridge-model.ts';
import { disposeScene } from '../lib/three-disposal.ts';
import { exportSceneBinary } from '../lib/export-scene.ts';

// The Three.js exporter uses FileReader, which browsers provide natively.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.(); }); }
};
const model = createBridgeLessonModel();
const bounds = name => new THREE.Box3().setFromObject(model.root.getObjectByName(name));
const visibleNames = () => { const names = []; model.root.traverseVisible(o => { if (o.isMesh) names.push(o.name); }); return names; };
let previous = 0;
for (let step = 0; step < 8; step++) {
  model.update(step, false, true);
  assert.ok(visibleNames().length > previous, `Step ${step + 1} adds visible parts`);
  previous = visibleNames().length;
  model.stages.forEach((group, index) => assert.equal(group.visible, index <= step));
}
model.update(7, false, false);
assert.equal(bounds('Plywood_deck_200x60x2').getSize(new THREE.Vector3()).x, BRIDGE_SIZE.deckLength);
assert.equal(bounds('Plywood_deck_200x60x2').min.y, 58);
assert.equal(bounds('Plywood_deck_200x60x2').max.y, BRIDGE_SIZE.deckTop);
assert.ok(Math.abs(bounds('Canopy_crossbeam_60mm').max.y + .2 - bounds('Clear_roof_220x80x1').min.y) < 1e-6, 'Roof rests on 0.2 mm tape above beams');
const originalMaterials = new Map();
model.root.traverse(o => { if (o.isMesh) originalMaterials.set(o, o.material); });
model.update(3, true, true);
assert.equal(model.stages[3].position.y, 38);
model.update(7, false, false);
for (const [mesh, material] of originalMaterials) assert.equal(mesh.material, material, 'Highlight restores materials');
assert.ok(model.stages.every(group => group.position.y === 0), 'Assembly resets exploded offsets');
model.root.traverse(o => {
  assert.ok(o.matrixWorld.elements.every(Number.isFinite), `${o.name}: finite transform`);
  if (o.isMesh) assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));
});
async function glb(step) {
  model.update(step, false, false);
  model.root.scale.setScalar(.001);
  const data = await exportSceneBinary(model.root);
  const view = new DataView(data);
  assert.equal(view.getUint32(0, true), 0x46546c67);
  assert.equal(view.getUint32(4, true), 2);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, view.getUint32(12, true))));
  assert.ok(json.nodes.some(node => node.matrix?.[0] === .001), 'Millimetres exported as metres');
  assert.equal(model.root.children.length, 8, 'Export preserves live model');
  return json.nodes.map(node => node.name);
}
const first = await glb(0), last = await glb(7);
assert.ok(!first.includes('Clear_roof_220x80x1'));
assert.ok(last.includes('Clear_roof_220x80x1'));
assert.ok(last.includes('Toothpick_diagonal_A'));
model.update(0, false, false);
assert.ok(!visibleNames().includes('Plywood_deck_200x60x2'), 'Going backward hides later stages');
const scene = new THREE.Group();
const instance = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial(), 1);
let disposedInstance = false, disposedShadow = false;
instance.addEventListener('dispose', () => { disposedInstance = true; });
const sun = new THREE.DirectionalLight(); sun.shadow.dispose = () => { disposedShadow = true; };
scene.add(instance, sun, model.root);
disposeScene(scene);
assert.ok(disposedInstance && disposedShadow, 'Instance buffers and shadow targets are released');
model.materials.forEach(material => material.dispose());
console.log('Passed: 8 progressive stages, dimensions, assembly, highlights, GLB units/visibility, finite geometry and GPU cleanup.');
