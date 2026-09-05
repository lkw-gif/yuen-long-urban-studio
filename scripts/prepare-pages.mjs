import { copyFileSync, existsSync, mkdirSync, renameSync, rmdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// vinext emits base-path assets and flat route HTML; Pages serves directory indexes.
const root = resolve('dist/client');
const prefixed = resolve(root, 'yuen-long-urban-studio');
if (existsSync(resolve(prefixed, '_next'))) {
  renameSync(resolve(prefixed, '_next'), resolve(root, '_next'));
  rmdirSync(prefixed);
}
for (const route of ['concepts', 'bridge-workshop']) {
  mkdirSync(resolve(root, route), { recursive: true });
  copyFileSync(resolve(root, `${route}.html`), resolve(root, route, 'index.html'));
}
for (const path of ['index.html', '_next', 'concepts/index.html', 'bridge-workshop/index.html']) {
  if (!existsSync(resolve(root, path))) throw new Error(`Missing Pages output: ${path}`);
}
writeFileSync(resolve(root, '.nojekyll'), '');
console.log('Pages ready: home, concepts and bridge-workshop.');
