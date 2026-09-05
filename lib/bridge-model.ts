import * as THREE from 'three';

type Point = [number, number];
// Millimetres, Y up. Three routes meet at an open junction.
const MAIN: Point[] = [[-128, -24], [-20, -24], [56, -85], [116, -85]];
const BRANCH: Point[] = [[-20, -24], [42, 26], [42, 75]];
export const BRIDGE_SIZE = { width: 26, deckBottom: 74, deckTop: 76, guardTop: 88, baseWidth: 440, baseDepth: 320 };
function intersection(a: Point, b: Point, c: Point, d: Point): Point {
  const ux = b[0] - a[0], uz = b[1] - a[1], vx = d[0] - c[0], vz = d[1] - c[1];
  const t = ((c[0] - a[0]) * vz - (c[1] - a[1]) * vx) / (ux * vz - uz * vx);
  return [a[0] + t * ux, a[1] + t * uz];
}
function banks(points: Point[], width: number) {
  const offset = (side: number) => {
    const lines = points.slice(0, -1).map((a, i) => {
      const b = points[i + 1], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const dx = -(b[1] - a[1]) / length * width / 2 * side, dz = (b[0] - a[0]) / length * width / 2 * side;
      return [[a[0] + dx, a[1] + dz], [b[0] + dx, b[1] + dz]] as [Point, Point];
    });
    return [lines[0][0], ...lines.slice(1).map((line, i) => intersection(...lines[i], ...line)), lines.at(-1)![1]];
  };
  return { left: offset(1), right: offset(-1) };
}
const main = banks(MAIN, 26), branch = banks(BRANCH, 26);
const leftJoin = intersection(branch.left[0], branch.left[1], main.left[0], main.left[1]);
const rightJoin = intersection(branch.right[0], branch.right[1], main.left[1], main.left[2]);
const mainOutline = [...main.left, ...[...main.right].reverse()];
// Shared seam, without overlapping transparent surfaces at the junction.
const branchOutline = [leftJoin, ...branch.left.slice(1), ...branch.right.slice(1).reverse(), rightJoin, main.left[1]];
const guardRuns: Point[][] = [[main.left[0], leftJoin, ...branch.left.slice(1)], [...branch.right.slice(1).reverse(), rightJoin, ...main.left.slice(2)], [...main.right].reverse()];
const entrances = [
  { id: 'A', outline: [[-140, -11], [-128, -11], [-128, -37], [-140, -37]] as Point[], rails: [[[-140, -11], [-128, -11]], [[-140, -37], [-128, -37]]] as Point[][] },
  { id: 'B', outline: [[116, -72], [128, -72], [128, -98], [116, -98]] as Point[], rails: [[[116, -72], [128, -72]], [[116, -98], [128, -98]]] as Point[][] },
  { id: 'C', outline: [[29, 75], [29, 87], [55, 87], [55, 75]] as Point[], rails: [[[29, 75], [29, 87]], [[55, 75], [55, 87]]] as Point[][] },
];
export const BRIDGE_LAYOUT = { main: mainOutline, branch: branchOutline, guardRuns, entrances };

export function createBridgeLessonModel() {
  const root = new THREE.Group(); root.name = 'Hong_Kong_Acrylic_Skybridge';
  root.userData = { units: 'millimetres', buildingsConnected: 3, purpose: 'Architectural display model' };
  const stages = Array.from({ length: 8 }, (_, i) => { const group = new THREE.Group(); group.name = `Step_${i + 1}`; root.add(group); return group; });
  const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .8 });
  const bamboo = material('#c7a574'), bambooNode = material('#ab8c62'), white = material('#e5e3d9'), facade = material('#9baaaa'), ground = material('#c8c5b7'), road = material('#777d7c'), green = material('#74866a'), darkGreen = material('#52644c'), orange = material('#eeae73');
  const acrylic = new THREE.MeshPhysicalMaterial({ color: '#c6e0de', transparent: true, opacity: .18, roughness: .16, metalness: .02, depthWrite: false, side: THREE.DoubleSide });
  const edge = new THREE.MeshStandardMaterial({ color: '#d3e6e1', transparent: true, opacity: .74, roughness: .4, depthWrite: false });
  const highlightedGlass = acrylic.clone(); highlightedGlass.color.set('#efd1a4'); highlightedGlass.opacity = .4;
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const materials = [bamboo, bambooNode, white, facade, ground, road, green, darkGreen, acrylic, edge, orange, highlightedGlass];
  function box(stage: number, name: string, size: [number, number, number], pos: [number, number, number], mat: THREE.Material) {
    const mesh = new THREE.Mesh(cube, mat); mesh.name = name; mesh.scale.set(...size); mesh.position.set(...pos);
    mesh.castShadow = mat !== acrylic && mat !== edge; mesh.receiveShadow = true; stages[stage].add(mesh); return mesh;
  }
  function rod(stage: number, name: string, a: [number, number, number], b: [number, number, number], radius = 1.6, mat: THREE.Material = bamboo) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 12), mat);
    mesh.name = name; mesh.position.copy(start).add(end).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    mesh.castShadow = mat === bamboo; stages[stage].add(mesh); return mesh;
  }
  function slab(stage: number, name: string, outline: Point[], bottom: number, thickness: number, mat: THREE.Material) {
    const shape = new THREE.Shape(); outline.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, steps: 1 }); geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, mat); mesh.name = name; mesh.position.y = bottom; mesh.receiveShadow = mat !== acrylic; mesh.castShadow = mat !== acrylic;
    if (mat === acrylic) { mesh.renderOrder = 2; mesh.userData.acrylic = true; }
    stages[stage].add(mesh); return mesh;
  }
  function line(stage: number, name: string, a: Point, b: Point, y: number, width: number, height: number, mat: THREE.Material) {
    const mesh = box(stage, name, [Math.hypot(b[0] - a[0], b[1] - a[1]), height, width], [(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2], mat);
    mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); return mesh;
  }
  function outlineEdge(stage: number, outline: Point[]) { outline.forEach((a, i) => line(stage, 'Polished_deck_edge', a, outline[(i + 1) % outline.length], 75, .55, 2, edge)); }
  function guard(stage: number, a: Point, b: Point) {
    const count = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 28);
    const at = (i: number): Point => [a[0] + (b[0] - a[0]) * i / count, a[1] + (b[1] - a[1]) * i / count];
    for (let i = 0; i < count; i++) {
      const panel = line(stage, 'Acrylic_side_panel', at(i), at(i + 1), 82, .85, 12, acrylic); panel.renderOrder = 3; panel.userData.acrylic = true;
    }
    line(stage, 'Polished_guard_top', a, b, 88, .65, .65, edge);
    for (let i = 0; i <= count; i++) { const p = at(i); rod(stage, 'Clear_panel_joint', [p[0], 76, p[1]], [p[0], 88, p[1]], .4, edge); }
  }
  box(0, 'Model_base', [440, 5, 320], [0, -2.5, 0], ground);
  const avenue: Point[] = [[-85, 155], [-85, -40], [-50, -105], [-50, -155]];
  const street = banks(avenue, 33); slab(0, 'Street_below_bridge', [...street.left, ...street.right.reverse()], .05, .2, road);
  avenue.slice(0, -1).forEach((a, i) => {
    const b = avenue[i + 1], distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let d = 3; d < distance - 6; d += 17) {
      const at = (t: number): Point => [a[0] + (b[0] - a[0]) * t / distance, a[1] + (b[1] - a[1]) * t / distance];
      line(0, 'Road_marking', at(d), at(d + 7), .32, .65, .1, white);
    }
  });
  function building(id: string, x: number, z: number, w: number, d: number, h: number) {
    box(0, `Building_${id}_core`, [w - 14, h, d - 14], [x, h / 2, z], facade);
    box(0, `Building_${id}_plinth`, [w + 8, 1.5, d + 8], [x, .75, z], white);
    for (let y = 3; y < h; y += 24) {
      box(0, `Building_${id}_floor`, [w, 2, d], [x, y, z], white);
      // Balcony at Y=76 is the bridge entrance, without a planter across it.
      if (y !== 75) for (const side of [-1, 1]) box(0, `Building_${id}_green_terrace`, [w - 14, 2.5, 4], [x, y + 2.2, z + side * (d / 2 - 4)], green);
    }
    for (let dx = -w / 2 + 13; dx < w / 2 - 6; dx += 12) for (const side of [-1, 1]) box(0, `Building_${id}_facade_mullion`, [1.15, h - 3, 1.15], [x + dx, h / 2, z + side * (d / 2 - 6.8)], white);
    box(0, `Building_${id}_roof`, [w, 2, d], [x, h + 1, z], white);
    box(0, `Building_${id}_roof_garden`, [w - 12, 1.5, d - 12], [x, h + 2.7, z], green);
    box(0, `Building_${id}_roof_core`, [w * .36, 9, d * .35], [x - 4, h + 6, z - 3], white);
  }
  building('A', -170, -24, 60, 72, 124); building('B', 162, -85, 68, 64, 148); building('C', 42, 112, 82, 50, 100);
  for (const [x, z] of [[-168, 86], [-145, 107], [144, 37], [161, 61], [121, 124], [-10, -120]]) {
    box(0, 'Street_planter', [14, 1, 14], [x, .8, z], green); rod(0, 'Tree_trunk', [x, 1, z], [x, 13, z], 1.4, bambooNode);
    const tree = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 1), darkGreen); tree.position.set(x, 17, z); tree.name = 'Street_tree'; tree.castShadow = true; stages[0].add(tree);
  }
  const supports: { p: Point; n: Point }[] = [];
  const addSupports = (path: Point[], locations: [number, number][]) => locations.forEach(([index, t]) => {
    const a = path[index], b = path[index + 1], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    supports.push({ p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], n: [-(b[1] - a[1]) / length, (b[0] - a[0]) / length] });
  });
  addSupports(MAIN, [[0, .15], [0, .58], [1, .16], [1, .7], [2, .64]]); addSupports(BRANCH, [[0, .6], [1, .5]]);
  for (const { p, n } of supports) {
    for (const sign of [-1, 1]) {
      const x = p[0] + n[0] * 9 * sign, z = p[1] + n[1] * 9 * sign;
      rod(1, 'Bamboo_support_column', [x, 0, z], [x, 67.8, z], 1.7);
      for (const y of [18, 39, 60]) rod(1, 'Bamboo_node', [x, y, z], [x, y + .7, z], 1.83, bambooNode);
      rod(7, 'Bamboo_knee_brace', [x, 49, z], [p[0] + n[0] * 3 * sign, 70.8, p[1] + n[1] * 3 * sign], 1.05);
    }
    rod(2, 'Bamboo_crossbearer', [p[0] - n[0] * 14, 72.4, p[1] - n[1] * 14], [p[0] + n[0] * 14, 72.4, p[1] + n[1] * 14], 1.6);
  }
  for (const path of [MAIN, BRANCH]) {
    const beams = banks(path, 18);
    for (const bank of [beams.left, beams.right]) bank.slice(0, -1).forEach((a, i) => rod(2, 'Bamboo_longitudinal_bearer', [a[0], 69.3, a[1]], [bank[i + 1][0], 69.3, bank[i + 1][1]], 1.5));
  }
  slab(3, 'Acrylic_main_deck', mainOutline, 74, 2, acrylic); outlineEdge(3, mainOutline);
  slab(4, 'Acrylic_branch_deck', branchOutline, 74, 2, acrylic); outlineEdge(4, branchOutline);
  for (const run of guardRuns) run.slice(0, -1).forEach((a, i) => guard(5, a, run[i + 1]));
  for (const entrance of entrances) {
    slab(6, `Acrylic_building_${entrance.id}_landing`, entrance.outline, 74, 2, acrylic); entrance.rails.forEach(([a, b]) => guard(6, a, b));
  }
  box(6, 'Building_A_recessed_entry', [.3, 18, 15], [-146.85, 85, -24], road);
  box(6, 'Building_B_recessed_entry', [.3, 18, 15], [134.85, 85, -85], road);
  box(6, 'Building_C_recessed_entry', [15, 18, .3], [42, 85, 93.85], road);
  const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>(), offsets = [0, 0, 14, 26, 26, 44, 26, 0];
  function update(step: number, exploded: boolean, highlight: boolean) {
    for (const [mesh, mat] of originals) mesh.material = mat;
    originals.clear();
    stages.forEach((group, i) => {
      group.visible = i <= step; group.position.y = exploded ? offsets[i] : 0;
      if (i === step && highlight && step > 0 && step < 7) group.traverse(o => {
        if (o instanceof THREE.Mesh) { originals.set(o, o.material); o.material = o.userData.acrylic ? highlightedGlass : orange; }
      });
    }); root.updateMatrixWorld(true);
  }
  update(0, false, false);
  return { root, stages, update, materials };
}
