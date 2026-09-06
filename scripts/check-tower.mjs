import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import {
  createTowerModel,
  towerSolids,
  towerHoles,
  FINAL_TOWER_STAGE,
} from '../lib/tower-model.ts';
import {
  TOWER_STEPS,
  TOWER_CHAPTERS,
  TOOL_SPOTS,
} from '../lib/tower-lesson.ts';
import { disposeScene } from '../lib/three-disposal.ts';

const near = (a, b, tol = 1e-3) =>
  assert.ok(Math.abs(a - b) < tol, `${a} ≈ ${b}`);
assert.equal(TOWER_CHAPTERS.length, 8);
assert.equal(TOWER_STEPS.length, 36);
assert.equal(new Set(TOWER_STEPS.map((s) => s.title)).size, TOWER_STEPS.length);
for (let chapter = 0; chapter < 8; chapter++)
  assert.ok(TOWER_STEPS.some((s) => s.chapter === chapter));
let previous = 0;
for (const step of TOWER_STEPS) {
  assert.ok(step.stage >= previous && step.stage <= FINAL_TOWER_STAGE);
  previous = step.stage;
  for (const key of ['title', 'where', 'action', 'expect', 'help'])
    assert.ok(step[key].length > 3);
  assert.ok(TOOL_SPOTS[step.tool]);
}
for (const {
  rect: [x, y, w, h],
} of Object.values(TOOL_SPOTS))
  assert.ok(
    x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 1912 && y + h <= 901,
  );
for (const file of [
  'editor.png',
  'official-box-dimensions.png',
  'official-solid-hole-panel.png',
  'official-align-selected.png',
])
  assert.ok(existsSync('public/tinkercad/' + file));

// Keep screenshot bytes untouched and serve them with their actual JPEG extension.
for (let n = 1; n <= TOWER_STEPS.length; n++) {
  const jpeg = readFileSync(
    `public/tinkercad/live/step-${String(n).padStart(2, '0')}.jpg`,
  );
  assert.equal(jpeg.readUInt16BE(0), 0xffd8);
  assert.equal(jpeg.readUInt16BE(jpeg.length - 2), 0xffd9);
  let foundSize = false;
  for (let offset = 2; offset < jpeg.length - 9;) {
    const marker = jpeg.readUInt16BE(offset);
    const length = jpeg.readUInt16BE(offset + 2);
    if ([0xffc0, 0xffc1, 0xffc2].includes(marker)) {
      assert.ok(jpeg.readUInt16BE(offset + 5) >= 600);
      assert.ok(jpeg.readUInt16BE(offset + 7) >= 800);
      foundSize = true;
      break;
    }
    assert.ok(length >= 2);
    offset += length + 2;
  }
  assert.ok(foundSize, 'JPEG must contain a valid size header');
}

// Validate the actual Tinkercad download independently of the viewer factory.
const liveStl = readFileSync(
  'public/tinkercad/blue-residential-tower-tinkercad.stl',
);
const liveCount = liveStl.readUInt32LE(80);
assert.equal(liveStl.length, 84 + 50 * liveCount);
const liveMin = [Infinity, Infinity, Infinity],
  liveMax = [-Infinity, -Infinity, -Infinity];
const liveEdges = new Map();
for (let i = 0; i < liveCount; i++) {
  const vertices = [];
  for (let v = 0; v < 3; v++) {
    const point = [0, 1, 2].map((axis) =>
      liveStl.readFloatLE(84 + i * 50 + 12 + v * 12 + axis * 4),
    );
    point.forEach((n, axis) => {
      assert.ok(Number.isFinite(n));
      liveMin[axis] = Math.min(liveMin[axis], n);
      liveMax[axis] = Math.max(liveMax[axis], n);
    });
    vertices.push(point.map((n) => n.toFixed(4)).join(','));
  }
  for (let e = 0; e < 3; e++) {
    const key = [vertices[e], vertices[(e + 1) % 3]].sort().join('|');
    liveEdges.set(key, (liveEdges.get(key) || 0) + 1);
  }
}
[48, 48, 114.3].forEach((n, axis) => near(liveMax[axis] - liveMin[axis], n));
near(liveMin[2], 0);
for (const count of liveEdges.values())
  assert.equal(count, 2, 'Actual Tinkercad STL has closed edges');
console.log(
  `Live assets passed: 36 JPEG screenshots, Tinkercad STL ${liveCount} triangles, closed edges and correct dimensions.`,
);

// Forward and reverse navigation must produce self-contained, finite stages.
for (const stage of [...new Set(TOWER_STEPS.map((s) => s.stage))].concat([
  19, 12, 0, 21,
])) {
  const model = createTowerModel(stage);
  if (!stage) assert.equal(model.root.children.length, 0);
  model.root.traverse((o) => {
    if (o.geometry) {
      for (const n of o.geometry.attributes.position.array)
        assert.ok(Number.isFinite(n));
    }
  });
  if (stage >= 12 && stage < 20) {
    const preview = model.root.getObjectByName(
      'Hole-preview-not-yet-subtracted',
    );
    assert.equal(preview.count, towerHoles(stage).length);
    assert.ok(preview.material.transparent);
  }
  if (stage >= 20) assert.equal(model.root.children.length, 1);
  disposeScene(model.root);
  model.materials.forEach((m) => m.dispose());
}
assert.equal(towerHoles(12).length, 1);
assert.equal(towerHoles(14).length, 3);
assert.equal(towerHoles(15).length, 6);
assert.equal(towerHoles(16).length, 78);
assert.equal(towerHoles(19).length, 312);
assert.equal(towerSolids(21).length, 7);
for (const hole of towerHoles(21)) {
  assert.ok(hole.z >= 3.5 && hole.z + hole.h <= 105.5);
}

const model = createTowerModel(21),
  mesh = model.root.children[0];
const box = new THREE.Box3().setFromObject(model.root),
  size = box.getSize(new THREE.Vector3());
near(size.x, 48);
near(size.z, 48);
near(size.y, 114.3);
near(box.min.y, 0);
assert.equal(mesh.material.color.getHexString(), '1247c5');
const g = mesh.geometry,
  indices = g.index.array,
  p = g.attributes.position;
const edges = new Map(),
  neighbours = Array.from({ length: p.count }, () => new Set());
const a = new THREE.Vector3(),
  b = new THREE.Vector3(),
  c = new THREE.Vector3();
let volume = 0;
for (let i = 0; i < indices.length; i += 3) {
  const face = [indices[i], indices[i + 1], indices[i + 2]];
  for (let n = 0; n < 3; n++) {
    const u = face[n],
      v = face[(n + 1) % 3],
      key = u < v ? u + ',' + v : v + ',' + u;
    edges.set(key, (edges.get(key) || 0) + 1);
    neighbours[u].add(v);
    neighbours[v].add(u);
  }
  a.fromBufferAttribute(p, face[0]);
  b.fromBufferAttribute(p, face[1]);
  c.fromBufferAttribute(p, face[2]);
  assert.ok(
    b.clone().sub(a).cross(c.clone().sub(a)).length() > 1e-6,
    'No degenerate faces',
  );
  volume += a.dot(b.cross(c)) / 6;
}
for (const count of edges.values())
  assert.equal(count, 2, 'Watertight: exactly two triangles per edge');
const visited = new Set([0]),
  queue = [0];
for (let q = 0; q < queue.length; q++)
  for (const v of neighbours[queue[q]])
    if (!visited.has(v)) {
      visited.add(v);
      queue.push(v);
    }
assert.equal(
  visited.size,
  p.count,
  'Single connected surface; no floating pieces',
);
// 48²×2 base + 20²×108 core + four overlapping wings + 10²×4.3 roof.
near(volume, 114798 - 312 * 3.2 * 0.9 * 2, 0.05);
model.root.updateMatrixWorld(true);
const ray = new THREE.Raycaster(
  new THREE.Vector3(19 - 24, 4.5, 60),
  new THREE.Vector3(0, 0, -1),
);
near(ray.intersectObject(mesh)[0].point.z, 19.1); // Window recess is 0.9 mm deep.
ray.ray.origin.x = 21.5 - 24;
near(ray.intersectObject(mesh)[0].point.z, 20); // Wall between windows stays intact.

// The illustrative factory can also rotate from Y-up into a Z-up millimetre STL.
model.root.rotation.x = Math.PI / 2;
model.root.updateMatrixWorld(true);
const stl = new STLExporter().parse(model.root, { binary: true }),
  triangles = stl.getUint32(80, true);
assert.equal(triangles, indices.length / 3);
assert.equal(stl.byteLength, 84 + triangles * 50);
let minZ = Infinity,
  maxZ = -Infinity;
for (let i = 0; i < triangles; i++)
  for (let v = 0; v < 3; v++) {
    const offset = 84 + i * 50 + 12 + v * 12;
    for (let axis = 0; axis < 3; axis++)
      assert.ok(Number.isFinite(stl.getFloat32(offset + axis * 4, true)));
    const z = stl.getFloat32(offset + 8, true);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
near(minZ, 0);
near(maxZ, 114.3);
disposeScene(model.root);
console.log(
  `Tower passed: 36 steps, 8 chapters, 312 recesses, watertight connected solid, ${triangles} triangles, millimetre STL.`,
);
