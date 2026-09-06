import * as THREE from 'three';

// Design coordinates and STL vertices are millimetres. X/Y are on the
// Tinkercad workplane; Z is elevation. The scene maps these to Three's Y-up.
export type TowerBox = {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
};
export const FINAL_TOWER_STAGE = 21;
export function towerSolids(stage: number): TowerBox[] {
  if (stage === 0) return [];
  if (stage === 1) return [{ x: 14, y: 14, z: 0, w: 20, d: 20, h: 20 }];
  const boxes: TowerBox[] = [{ x: 0, y: 0, z: 0, w: 48, d: 48, h: 2 }];
  if (stage >= 3)
    boxes.push({
      x: stage === 3 ? 8 : 14,
      y: stage === 3 ? 10 : 14,
      z: stage >= 5 ? 2 : 0,
      w: 20,
      d: 20,
      h: 108,
    });
  if (stage >= 6) boxes.push({ x: 4, y: 16, z: 2, w: 12, d: 16, h: 104 });
  if (stage >= 7) boxes.push({ x: 32, y: 16, z: 2, w: 12, d: 16, h: 104 });
  if (stage >= 8) boxes.push({ x: 16, y: 4, z: 2, w: 16, d: 12, h: 104 });
  if (stage >= 9) boxes.push({ x: 16, y: 32, z: 2, w: 16, d: 12, h: 104 });
  if (stage >= 10) boxes.push({ x: 19, y: 19, z: 110, w: 10, d: 10, h: 4.3 });
  return boxes;
}
export function towerHoles(stage: number): TowerBox[] {
  if (stage < 12) return [];
  const columns = stage === 12 ? 1 : stage === 13 ? 2 : 3,
    rows = stage < 15 ? 1 : stage === 15 ? 2 : 26;
  const holes: TowerBox[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++) {
      const p = 17.4 + c * 5,
        z = 3.5 + r * 4;
      holes.push({ x: p, y: 3.8, z, w: 3.2, d: 1.1, h: 2 });
      if (stage >= 17) holes.push({ x: 43.1, y: p, z, w: 1.1, d: 3.2, h: 2 });
      if (stage >= 18) holes.push({ x: 3.8, y: p, z, w: 1.1, d: 3.2, h: 2 });
      if (stage >= 19) holes.push({ x: p, y: 43.1, z, w: 3.2, d: 1.1, h: 2 });
    }
  return holes;
}

/** Axis-aligned union/difference split at every box boundary. Shared lattice
 * vertices stitch neighbouring faces; interior faces are eliminated. */
export function towerGeometry(solids: TowerBox[], holes: TowerBox[] = []) {
  const all = [...solids, ...holes],
    g = new THREE.BufferGeometry();
  if (!solids.length) return g;
  const values = (a: 'x' | 'y' | 'z', s: 'w' | 'd' | 'h') =>
    Array.from(
      new Set(all.flatMap((b) => [b[a], Number((b[a] + b[s]).toFixed(5))])),
    ).sort((a, b) => a - b);
  const xs = values('x', 'w'),
    ys = values('y', 'd'),
    zs = values('z', 'h');
  const nx = xs.length - 1,
    ny = ys.length - 1,
    nz = zs.length - 1;
  const occupied = new Uint8Array(nx * ny * nz),
    key = (i: number, j: number, k: number) => (i * ny + j) * nz + k;
  const fill = (boxes: TowerBox[], value: number) => {
    for (const b of boxes) {
      const ix = xs.indexOf(b.x),
        jx = xs.indexOf(Number((b.x + b.w).toFixed(5))),
        iy = ys.indexOf(b.y),
        jy = ys.indexOf(Number((b.y + b.d).toFixed(5))),
        iz = zs.indexOf(b.z),
        jz = zs.indexOf(Number((b.z + b.h).toFixed(5)));
      for (let i = ix; i < jx; i++)
        for (let j = iy; j < jy; j++)
          for (let k = iz; k < jz; k++) occupied[key(i, j, k)] = value;
    }
  };
  fill(solids, 1);
  fill(holes, 0);
  const positions: number[] = [],
    indices: number[] = [],
    vertices = new Map<string, number>();
  const vertex = (i: number, j: number, k: number) => {
    const id = i + ',' + j + ',' + k;
    const found = vertices.get(id);
    if (found !== undefined) return found;
    const n = positions.length / 3;
    positions.push(xs[i] - 24, zs[k], 24 - ys[j]);
    vertices.set(id, n);
    return n;
  };
  const face = (corners: number[][]) => {
    const v = corners.map(([i, j, k]) => vertex(i, j, k));
    indices.push(v[0], v[1], v[2], v[0], v[2], v[3]);
  };
  const has = (i: number, j: number, k: number) =>
    i >= 0 &&
    i < nx &&
    j >= 0 &&
    j < ny &&
    k >= 0 &&
    k < nz &&
    occupied[key(i, j, k)];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++)
      for (let k = 0; k < nz; k++)
        if (has(i, j, k)) {
          if (!has(i - 1, j, k))
            face([
              [i, j, k],
              [i, j, k + 1],
              [i, j + 1, k + 1],
              [i, j + 1, k],
            ]);
          if (!has(i + 1, j, k))
            face([
              [i + 1, j, k],
              [i + 1, j + 1, k],
              [i + 1, j + 1, k + 1],
              [i + 1, j, k + 1],
            ]);
          if (!has(i, j - 1, k))
            face([
              [i, j, k],
              [i + 1, j, k],
              [i + 1, j, k + 1],
              [i, j, k + 1],
            ]);
          if (!has(i, j + 1, k))
            face([
              [i, j + 1, k],
              [i, j + 1, k + 1],
              [i + 1, j + 1, k + 1],
              [i + 1, j + 1, k],
            ]);
          if (!has(i, j, k - 1))
            face([
              [i, j, k],
              [i, j + 1, k],
              [i + 1, j + 1, k],
              [i + 1, j, k],
            ]);
          if (!has(i, j, k + 1))
            face([
              [i, j, k + 1],
              [i + 1, j, k + 1],
              [i + 1, j + 1, k + 1],
              [i, j + 1, k + 1],
            ]);
        }
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}
export function createTowerModel(stage: number) {
  const root = new THREE.Group();
  root.name = 'Tinkercad-residential-tower-mm';
  root.userData.units = 'mm';
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: stage >= 11 ? '#1247c5' : '#cb483b',
    roughness: 0.55,
    flatShading: true,
  });
  const materials: THREE.Material[] = [bodyMaterial];
  const solids = towerSolids(stage),
    holes = towerHoles(stage);
  if (solids.length) {
    const body = new THREE.Mesh(
      towerGeometry(solids, stage >= 20 ? holes : []),
      bodyMaterial,
    );
    body.name = stage >= 20 ? 'Completed-watertight-tower' : 'Solid-building';
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);
  }
  if (stage >= 12 && stage < 20) {
    const holeMaterial = new THREE.MeshStandardMaterial({
      color: '#f6b44d',
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      roughness: 0.8,
    });
    materials.push(holeMaterial);
    const cutter = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      holeMaterial,
      holes.length,
    );
    cutter.name = 'Hole-preview-not-yet-subtracted';
    const matrix = new THREE.Matrix4();
    holes.forEach((b, i) => {
      matrix.compose(
        new THREE.Vector3(
          b.x + b.w / 2 - 24,
          b.z + b.h / 2,
          24 - b.y - b.d / 2,
        ),
        new THREE.Quaternion(),
        new THREE.Vector3(b.w, b.h, b.d),
      );
      cutter.setMatrixAt(i, matrix);
    });
    root.add(cutter);
  }
  return { root, materials };
}
