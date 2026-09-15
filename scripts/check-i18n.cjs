const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  if(file.endsWith('.json')) return JSON.parse(fs.readFileSync(file,'utf8'));
  const module = {exports:{}}; cache.set(file,module);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire = id => {
    if (!id.startsWith('.') && !id.startsWith('@/')) return require(id);
    const base=id.startsWith('@/')?path.resolve(id.slice(2)):path.resolve(path.dirname(file),id);
    const resolved=[base,base+'.ts',base+'.tsx',base+'.json'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
    return load(resolved);
  };
  new Function('require','module','exports',code)(localRequire,module,module.exports);
  return module.exports;
}
const {translateText}=load('lib/i18n.ts');
const {TOWER_STEPS,TOWER_CHAPTERS,TOOL_SPOTS}=load('lib/tower-lesson.ts');
const {TOWER_STEP_EN}=load('lib/tower-lesson.en.ts');
assert.equal(TOWER_STEP_EN.length,36);
assert.equal(TOWER_STEPS.length,34);
const originals = new Set();
for (const name of fs.readdirSync('components').filter(n=>n.endsWith('.tsx') && n!=='language-provider.tsx')) {
  const file='components/'+name,source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const walk=n=>{if((ts.isStringLiteralLike(n)||ts.isJsxText(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n))&&/[\u3400-\u9fff]/.test(n.text))originals.add(n.text.replace(/\s+/g,' ').trim());ts.forEachChild(n,walk);}; walk(source);
}
for(const s of TOWER_STEPS){for(const field of ['title','where','action','expect','help'])originals.add(s[field]);for(const v of s.values??[]){originals.add(v.label);originals.add(v.value);}}
TOWER_CHAPTERS.forEach(s=>originals.add(s));Object.values(TOOL_SPOTS).forEach(s=>originals.add(s.label));
const missing=[];
for(const source of originals){const en=translateText(source,'en');if(/[\u3400-\u9fff]/.test(en))missing.push({source,en});assert.equal(translateText(source,'zh-Hant'),source);}
assert.deepEqual(missing,[], 'Untranslated authored text');
const positionPattern = /\b[XYZ]\b/i;
for (const step of TOWER_STEPS) {
  for (const field of ['where', 'action', 'expect', 'help'])
    assert.equal(positionPattern.test(step[field]), false, `Position coordinate remains in ${step.title}: ${step[field]}`);
  for (const value of step.values ?? [])
    assert.equal(positionPattern.test(`${value.label} ${value.value}`), false, `Position value remains in ${step.title}`);
  for (const field of ['where', 'action', 'expect', 'help'])
    assert.equal(positionPattern.test(translateText(step[field], 'en')), false, `English position coordinate remains in ${step.title}`);
}
assert.match(translateText('生活社區模型已下載，可匯入 Blender。','en'),/Living Community model downloaded/);
assert.equal(translateText('街區建物 01','en'),'Context building 01');
const React=require('react');
const {localizeTree}=load('components/language-provider.tsx');
const ref={current:null},click=()=>{};
const node=React.createElement('button',{id:'keep-id',ref,onClick:click,'aria-label':'下一步'},'下一步');
const translated=localizeTree(node,'en');
assert.equal(translated.props.children,'Next');assert.equal(translated.props['aria-label'],'Next');
assert.equal(translated.props.ref,ref);assert.equal(translated.props.onClick,click);assert.equal(translated.props.id,'keep-id');
const input=localizeTree(React.createElement('option',{value:'生活社區'},'生活社區'),'en');
assert.equal(input.props.value,'生活社區');assert.equal(input.props.children,'Living Community');
const link=localizeTree(React.createElement('a',{href:load('lib/site-path.ts').sitePath('/concepts/')},'概念模型'),'en');
assert.match(link.props.href,/\/concepts\/\?lang=en$/);
console.log(`Translation checks passed: ${originals.size} authored strings, 34 visible lessons (36 complete source translations), unchanged IDs/refs/events and language-aware links.`);
