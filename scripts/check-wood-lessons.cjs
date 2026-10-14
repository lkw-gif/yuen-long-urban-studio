/* oxlint-disable typescript/no-require-imports, typescript/no-implied-eval -- Standalone Node check transpiles only trusted repository TypeScript, matching the other catalogue checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const loaded = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const requireLocal = id => load(path.resolve(path.dirname(file), id + '.ts'));
  new Function('require', 'module', 'exports', code)(requireLocal, loaded, loaded.exports);
  cache.set(file, loaded.exports);
  return loaded.exports;
}
const { WOOD_LESSONS } = load('lib/wood-lessons.ts');
const { woodPanelDrawing, WOOD_PANEL_NAMES, WOOD_PLAN_UI } = load('lib/wood-panel-plan.ts');
const catalog = JSON.parse(fs.readFileSync('lib/district-catalog.json', 'utf8'));
function checkBilingual(value) {
  if (!value || typeof value !== 'object') return;
  if ('zh' in value || 'en' in value) {
    assert.ok(typeof value.zh === 'string' && value.zh.trim());
    assert.ok(typeof value.en === 'string' && value.en.trim());
    assert.doesNotMatch(value.en, /[\u3400-\u9fff]/);
  } else Object.values(value).forEach(checkBilingual);
}
for (const lesson of Object.values(WOOD_LESSONS)) {
  const model = catalog.models.find(item => item.id === lesson.modelId);
  const expectedCount = lesson.id === 'mall' ? 18 : 12;
  assert.equal(lesson.stages.length, lesson.id === 'mall' ? 7 : 6);
  assert.equal(model.panels.length, expectedCount);
  assert.equal(lesson.panels.reduce((sum, group) => sum + group.quantity, 0), expectedCount);
  const covered = new Set();
  for (const group of lesson.panels) {
    const panels = model.panels.filter(panel => panel.moduleId === group.module && group.faces.includes(panel.face));
    assert.equal(panels.length, group.quantity, `${lesson.id}/${group.id}: wrong panel count`);
    for (const panel of panels) {
      const dimensions = [panel.w, panel.d, panel.h].sort((a, b) => a - b);
      assert.equal(dimensions[0], 2, `${panel.name}: plywood thickness`);
      assert.deepEqual(dimensions.slice(1), [group.width, group.depth].sort((a, b) => a - b), `${lesson.id}/${group.id}: cut size must match 3D panel`);
      assert.ok(!covered.has(panel), 'Duplicate panel in cut list');
      covered.add(panel);
    }
  }
  assert.equal(covered.size, expectedCount, 'Every 3D panel must be listed exactly once');
  for (const box of model.boxes) {
    const pieces = model.panels.filter(panel => panel.moduleId === box.moduleId);
    assert.deepEqual(pieces.map(panel => panel.face).sort(), ['base', 'roof', 'front', 'back', 'left', 'right'].sort());
    for (const panel of pieces) {
      assert.ok(panel.x >= box.x && panel.x + panel.w <= box.x + box.w);
      assert.ok(panel.y >= box.y && panel.y + panel.d <= box.y + box.d);
      assert.ok(panel.z >= box.z && panel.z + panel.h <= box.z + box.h);
    }
  }
  // A flat drawing must use the two face dimensions, excluding the 2 mm thickness.
  for (const panel of model.panels) {
    const drawing = woodPanelDrawing(panel, model.windows);
    const cutGroup = lesson.panels.find(group => group.module === panel.moduleId && group.faces.includes(panel.face));
    assert.deepEqual([drawing.width, drawing.height], [cutGroup.width, cutGroup.depth]);
    for (const mark of drawing.marks) {
      assert.ok(mark.x >= 0 && mark.y >= 0 && mark.x + mark.width <= drawing.width && mark.y + mark.height <= drawing.height, 'Engraving stays inside its cutting face');
      assert.deepEqual([mark.width, mark.height], mark.name === 'door' ? [10, 16] : [8, 8], 'Upright window/door dimensions');
    }
  }
  checkBilingual(lesson);
}
checkBilingual(WOOD_PANEL_NAMES); checkBilingual(WOOD_PLAN_UI);
// Independently check the mall's outside dimensions and centred stacking from guide pp. 20–22.
const mall = catalog.models.find(item => item.id === 'W3');
assert.deepEqual([mall.width, mall.depth, mall.height], [100, 70, 95]);
assert.deepEqual(mall.boxes.map(box => [box.w, box.d, box.h]), [[100, 70, 50], [80, 55, 25], [60, 40, 20]]);
for (let index = 1; index < mall.boxes.length; index++) {
  const below = mall.boxes[index - 1], above = mall.boxes[index];
  assert.equal(above.x - below.x, 10);
  assert.equal(above.y - below.y, 7.5);
  assert.equal(above.x + above.w / 2, below.x + below.w / 2);
  assert.equal(above.y + above.d / 2, below.y + below.d / 2);
  assert.equal(above.z, below.z + below.h, 'Each complete box rests on the roof below');
}
console.log('Wood lesson checks passed: bilingual stages, all 12/18 panels, 2 mm cut sizes matched to 3D geometry, complete boxes and centred mall stacking.');
