export type Point = [number, number];
// Millimetres, Y up. Three routes meet at an open junction.
export const MAIN: Point[] = [[-128, -24], [-20, -24], [56, -85], [116, -85]];
export const BRANCH: Point[] = [[-20, -24], [42, 26], [42, 75]];
export const BRIDGE_SIZE = { width: 26, deckBottom: 74, deckTop: 76, guardTop: 88, guardThickness: 1, maxGuardPanelLength: 28, baseWidth: 440, baseDepth: 320 };
function intersection(a: Point, b: Point, c: Point, d: Point): Point {
  const ux = b[0] - a[0], uz = b[1] - a[1], vx = d[0] - c[0], vz = d[1] - c[1];
  const t = ((c[0] - a[0]) * vz - (c[1] - a[1]) * vx) / (ux * vz - uz * vx);
  return [a[0] + t * ux, a[1] + t * uz];
}
export function banks(points: Point[], width: number) {
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


/** The same straight segments and subdivisions used by the 3D guard panels. */
export const BRIDGE_GUARD_SECTIONS = guardRuns.flatMap((run, side) => run.slice(0, -1).map((a, index) => {
  const b = run[index + 1], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const quantity = Math.ceil(length / BRIDGE_SIZE.maxGuardPanelLength);
  return { id: `${String.fromCharCode(65 + side)}${index + 1}`, side, a, b, length, quantity, panelLength: length / quantity };
}));
export const BRIDGE_GUARD_HEIGHT = BRIDGE_SIZE.guardTop - BRIDGE_SIZE.deckTop;
export const BRIDGE_ENTRY_PANELS = entrances.flatMap(entrance => entrance.rails.map(([a, b]) => ({
  entrance: entrance.id, length: Math.hypot(b[0] - a[0], b[1] - a[1]), a, b,
})));
