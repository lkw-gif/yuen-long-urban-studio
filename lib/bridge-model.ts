import * as THREE from 'three';

// Model units are millimetres. Y is up; the bridge runs along X.
export const BRIDGE_SIZE = { deckLength: 200, deckWidth: 60, deckTop: 60, clearSpan: 160, canopyTop: 112 };

export function createBridgeLessonModel() {
  const root = new THREE.Group();
  root.name = 'School_Skybridge_200mm';
  root.userData = { units: 'millimetres', deckLength: 200, clearSpan: 160, purpose: 'Display model only' };
  const stages = Array.from({ length: 8 }, (_, i) => {
    const group = new THREE.Group(); group.name = `Step_${i + 1}`; root.add(group); return group;
  });
  const wood = new THREE.MeshStandardMaterial({ color: '#c4a36d', roughness: .8 });
  const card = new THREE.MeshStandardMaterial({ color: '#c3c3b8', roughness: .9 });
  const deck = new THREE.MeshStandardMaterial({ color: '#ddc397', roughness: .8 });
  const blue = new THREE.MeshStandardMaterial({ color: '#578c93', roughness: .6 });
  const glass = new THREE.MeshStandardMaterial({ color: '#a5dae1', transparent: true, opacity: .38, roughness: .22, metalness: .05, depthWrite: false, side: THREE.DoubleSide });
  const paper = new THREE.MeshStandardMaterial({ color: '#f5f0df', roughness: 1 });
  const orange = new THREE.MeshStandardMaterial({ color: '#f3ab63', roughness: .7 });
  const highlightedGlass = glass.clone(); highlightedGlass.color.set('#f3ab63');
  const cube = new THREE.BoxGeometry(1, 1, 1);
  function box(step: number, name: string, size: number[], pos: number[], material: THREE.Material) {
    const mesh = new THREE.Mesh(cube, material); mesh.name = name;
    mesh.scale.set(size[0], size[1], size[2]); mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = material !== glass; mesh.receiveShadow = true; stages[step].add(mesh); return mesh;
  }
  function rod(step: number, name: string, a: number[], b: number[], radius = .8) {
    const start = new THREE.Vector3(...a as [number, number, number]);
    const end = new THREE.Vector3(...b as [number, number, number]);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 8), wood);
    mesh.name = name; mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    mesh.castShadow = true; stages[step].add(mesh); return mesh;
  }
  box(0, 'Base_320x180x5', [320, 5, 180], [0, -2.5, 0], card);
  // Pencil layout marks remain visible around the bridge.
  for (const x of [-100, 100]) box(0, 'Deck_layout_mark', [.5, .1, 72], [x, .12, 0], blue);
  for (const z of [-30, 30]) box(0, 'Deck_layout_mark', [220, .1, .5], [0, .12, z], blue);
  for (const x of [-90, 90]) {
    box(1, 'Pier_front_wall', [20, 58, 2], [x, 29, -29], card);
    box(1, 'Pier_back_wall', [20, 58, 2], [x, 29, 29], card);
    for (const dx of [-9, 9]) box(1, 'Pier_side_wall', [2, 58, 56], [x + dx, 29, 0], card);
    box(1, 'Pier_top_cap', [16, 2, 56], [x, 57, 0], card);
  }
  box(2, 'Plywood_deck_200x60x2', [200, 2, 60], [0, 59, 0], deck);
  for (const z of [-28, 28]) {
    for (const x of [-100, -50, 0, 50, 100]) {
      box(3, 'Timber_post_50mm', [2, 50, 2], [x, 85, z], wood);
      box(3, 'Paper_L_tab_foot', [8, .4, 8], [x, 60.2, z], paper);
      box(3, 'Paper_L_tab_upright', [6, 8, .4], [x, 64, z + 1.2], paper);
    }
    const side = Math.sign(z);
    for (const y of [61, 90]) box(3, 'Side_rail_200mm', [200, 2, 2], [0, y, z + side * 2], wood);
    for (let x = -100; x < 100; x += 50) {
      rod(3, 'Toothpick_diagonal_A', [x, 60, z + side * 3.8], [x + 50, 90, z + side * 3.8]);
      rod(3, 'Toothpick_diagonal_B', [x, 90, z - side * 1.8], [x + 50, 60, z - side * 1.8]);
    }
  }
  for (const z of [-30, 30]) box(4, 'Canopy_longitudinal_rail', [200, 2, 2], [0, 109, z], wood);
  for (const x of [-100, -50, 0, 50, 100]) box(4, 'Canopy_crossbeam_60mm', [2, 2, 60], [x, 111, 0], wood);
  box(5, 'Clear_roof_220x80x1', [220, 1, 80], [0, 112.7, 0], glass);
  for (const x of [-100, 100]) for (const z of [-27, 27]) box(5, 'Removable_roof_tape', [2, .2, 5], [x, 112.1, z], blue);
  for (const x of [-110, 110]) box(6, 'Building_connection_landing', [20, 60, 60], [x, 30, 0], card);
  for (let x = -105; x < 110; x += 15) box(6, 'Paper_wayfinding_line', [8, .1, 1.2], [x, 60.3, 0], paper);
  box(6, 'Paper_person_body', [5, 13, 1], [15, 66.5, 7], blue);
  const head = new THREE.Mesh(new THREE.SphereGeometry(2.7, 12, 8), blue); head.position.set(15, 76, 7); head.name = 'Paper_person_head'; stages[6].add(head);
  box(6, 'Bridge_sign', [28, 8, 1], [0, 102, -30], blue);
  // An empty folded paper card is a placement check, not a load rating.
  box(7, 'Empty_paper_check_card', [26, .4, 18], [-22, 60.4, 0], orange);
  for (const x of [-90, 90]) box(7, 'Inspection_marker', [8, .2, 8], [x, .3, 40], orange);
  const offsets = [0, 10, 24, 38, 50, 64, 0, 24];
  const highlights = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  function update(step: number, exploded: boolean, highlight: boolean) {
    for (const [mesh, original] of highlights) mesh.material = original;
    highlights.clear();
    stages.forEach((group, i) => {
      group.visible = i <= step; group.position.y = exploded ? offsets[i] : 0;
      if (i === step && highlight && step < 7) group.traverse(object => {
        if (object instanceof THREE.Mesh) { highlights.set(object, object.material); object.material = object.material === glass ? highlightedGlass : orange; }
      });
    });
    root.updateMatrixWorld(true);
  }
  update(0, false, false);
  return { root, stages, update, materials: [wood, card, deck, blue, glass, paper, orange, highlightedGlass] };
}
