const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, dependencies = {}) {
  const m = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require','module','exports',js)(name => dependencies[name] ?? require(name),m,m.exports);
  return m.exports;
}
const plan = load('lib/google-drive-plan.ts');
const drive = load('lib/google-drive-design.ts', { './google-drive-plan': plan });
const json = (body, status = 200) => new Response(JSON.stringify(body), {status});
async function main() {
  await drive.saveDriveDesign('token','2B_1.json','{"name":"school"}',async (url,options) => {
    assert.match(url,/uploadType=multipart/); assert.equal(options.method,'POST');
    assert.equal(options.headers.Authorization,'Bearer token');
    const body=await options.body.text(); assert.match(body,/district-design-v1/); assert.match(body,/2B_1\.json/); assert.match(body,/"name":"school"/); assert.doesNotMatch(body,/permissions/);
    return json({id:'created'});
  });
  await drive.updateDriveDesign('token','created','{"name":"updated"}',async (url,options)=>{
    assert.match(url,/created\?uploadType=media/); assert.equal(options.method,'PATCH');
    assert.equal(options.headers.Authorization,'Bearer token'); assert.equal(options.body,'{"name":"updated"}');
    return json({id:'created'});
  });
  await assert.rejects(drive.updateDriveDesign('token','../bad','{}',async()=>{throw Error('must not request');}));
  await assert.rejects(drive.updateDriveDesign('token','created','{}',async()=>json({id:'other'})));
  let calls=0;
  const listed=await drive.listDriveDesigns('token',async url => {
    const p=new URL(url).searchParams; assert.match(p.get('q'),/studioDesign/);
    return calls++===0 ? json({files:[{id:'one',name:'one.json',modifiedTime:'2026-01-01'}],nextPageToken:'next'}) : (assert.equal(p.get('pageToken'),'next'),json({files:[{id:'two',name:'two.json',modifiedTime:'2026-01-01'}]}));
  });
  assert.deepEqual(listed.map(f=>f.id),['one','two']);
  const file=await drive.readDriveDesign('token','one',async url=>{assert.match(url,/one\?alt=media/);return new Response('{"name":"school"}');});
  assert.equal(await file.text(),'{"name":"school"}');
  await assert.rejects(drive.readDriveDesign('token','../bad',async()=>{throw Error('must not request');}));
  await assert.rejects(drive.readDriveDesign('token','one',async()=>new Response('x',{status:401})),e=>e.code==='permission-expired');
  await assert.rejects(drive.readDriveDesign('token','one',async()=>new Response('x',{headers:{'content-length':'2000001'}})));
  console.log('Drive design checks passed: tagged JSON upload, paginated listing, download and size/error handling.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
