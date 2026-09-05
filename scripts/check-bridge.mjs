import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createBridgeLessonModel, BRIDGE_SIZE, BRIDGE_LAYOUT } from '../lib/bridge-model.ts';
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
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} ≈ ${expected}`);
for (const name of ['Acrylic_main_deck', 'Acrylic_branch_deck', ...['A', 'B', 'C'].map(id => `Acrylic_building_${id}_landing`)]) {
  near(bounds(name).min.y, BRIDGE_SIZE.deckBottom);
  near(bounds(name).max.y, BRIDGE_SIZE.deckTop);
  const mesh = model.root.getObjectByName(name);
  assert.ok(mesh.material.transparent && mesh.material.opacity < .5, `${name}: transparent acrylic`);
}
near(bounds('Bamboo_crossbearer').max.y, BRIDGE_SIZE.deckBottom);
near(bounds('Bamboo_support_column').max.y, 67.8);
near(bounds('Bamboo_support_column').min.y, 0);
near(bounds('Acrylic_building_A_landing').min.x, -140);
near(bounds('Acrylic_building_B_landing').max.x, 128);
near(bounds('Acrylic_building_C_landing').max.z, 87);
assert.ok(!model.root.getObjectByName('Clear_roof_220x80x1'), 'No canopy or plywood deck in the new design');
// Walk each route's centreline. Ray intersections prove decks remain continuous
// through both bends, the three-way junction and all three building thresholds.
const decks = [];
model.root.traverse(o => { if (o.isMesh && /Acrylic_(main_deck|branch_deck|building_.*_landing)/.test(o.name)) decks.push(o); });
const routes = [[[-139.99,-24],[-20,-24],[56,-85],[127.99,-85]], [[-20,-24],[42,26],[42,86.99]]];
for (const route of routes) for (let i = 0; i < route.length - 1; i++) {
  const a = route[i], b = route[i+1];
  for (let t = .001; t < 1; t += .025) {
    const x = a[0]+(b[0]-a[0])*t, z = a[1]+(b[1]-a[1])*t;
    const ray = new THREE.Raycaster(new THREE.Vector3(x, 100, z), new THREE.Vector3(0,-1,0));
    assert.ok(ray.intersectObjects(decks).length, `Connected walkway at ${x}, ${z}`);
  }
}
function crosses(a,b,c,d) {
  const u=[b[0]-a[0],b[1]-a[1]], v=[d[0]-c[0],d[1]-c[1]], determinant=u[0]*v[1]-u[1]*v[0];
  if (Math.abs(determinant)<1e-6) return false;
  const t=((c[0]-a[0])*v[1]-(c[1]-a[1])*v[0])/determinant;
  const s=((c[0]-a[0])*u[1]-(c[1]-a[1])*u[0])/determinant;
  return t>0 && t<1 && s>=0 && s<=1;
}
for (const run of [...BRIDGE_LAYOUT.guardRuns, ...BRIDGE_LAYOUT.entrances.flatMap(e => e.rails)]) for (let i=0;i<run.length-1;i++) {
  for (const route of routes) for (let j=0;j<route.length-1;j++) assert.ok(!crosses(route[j],route[j+1],run[i],run[i+1]), 'Side panels do not block an entrance or the junction');
}
const originalMaterials = new Map();
model.root.traverse(o => { if (o.isMesh) originalMaterials.set(o, o.material); });
model.update(3, true, true);
assert.equal(model.stages[3].position.y, 26);
assert.ok(model.root.getObjectByName('Acrylic_main_deck').material.transparent, 'Highlight preserves transparency');
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
assert.ok(!first.includes('Acrylic_main_deck'));
assert.ok(last.includes('Acrylic_side_panel'));
assert.ok(last.includes('Bamboo_support_column'));
model.update(0, false, false);
assert.ok(!visibleNames().includes('Acrylic_main_deck'), 'Going backward hides later stages');
const scene = new THREE.Group();
const instance = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial(), 1);
let disposedInstance = false, disposedShadow = false;
instance.addEventListener('dispose', () => { disposedInstance = true; });
const sun = new THREE.DirectionalLight(); sun.shadow.dispose = () => { disposedShadow = true; };
scene.add(instance, sun, model.root);
disposeScene(scene);
assert.ok(disposedInstance && disposedShadow, 'Instance buffers and shadow targets are released');
model.materials.forEach(material => material.dispose());
console.log('Passed: 8 stages, connected routes, open junction, bamboo supports, transparent acrylic, GLB units/visibility and GPU cleanup.');
