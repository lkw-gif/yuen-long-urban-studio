const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const req=id=>{const base=path.resolve(path.dirname(file),id);return load([base,base+'.ts',base+'.json'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile()));};new Function('require','module','exports',code)(req,module,module.exports);cache.set(file,module.exports);return module.exports;}
const x=load('lib/district-design.ts');
assert.deepEqual(x.BOARD,{width:594,depth:420});assert.equal(x.MODELS.filter(m=>!m.custom).length,20);assert.equal(x.MODELS.filter(m=>m.kind==='print').length,15);assert.equal(x.MODELS.filter(m=>m.kind==='wood').length,7);
for(const m of x.MODELS){assert.equal(Math.max(...m.boxes.map(b=>b.x+b.w)),m.width);assert.equal(Math.max(...m.boxes.map(b=>b.y+b.d)),m.depth);assert.equal(Math.max(...m.boxes.map(b=>b.z+b.h)),m.height);}
const building=(id,modelId='R1',px=200,py=200)=>({id,modelId,x:px,y:py,rotation:0});

// New zone categories must survive file import, including existing community zones.
assert.equal(x.ZONES.commercial,'#a98ad3');assert.equal(x.ZONES.community,'#ead277');assert.equal(x.ZONES.mall,'#e79db7');assert.equal(x.ZONES.other,'#e9ac67');
for(const kind of Object.keys(x.ZONES)){const design=x.emptyDesign();design.zones=[{id:'zone',kind,x:200,y:200,w:30,d:30}];assert.equal(x.validate(design),null);assert.equal(x.parseDesign(JSON.parse(JSON.stringify(design))).zones[0].kind,kind);assert.ok(x.ZONE_LABELS[kind]);}


// In the original river-left view, printed models show their front windows.
for(const m of x.MODELS.filter(m=>m.kind==='print'&&!m.custom)){
 const before=JSON.stringify(m),b={id:'front-test',modelId:m.id,x:200,y:200,rotation:0};
 const oriented=x.modelForBuilding(b);
 assert.equal(oriented.windows.length,m.windows.length);
 m.windows.forEach((w,i)=>{const q=oriented.windows[i];assert.ok(Math.abs(q.x-(m.width-w.x-w.w))<1e-8);assert.ok(Math.abs(q.y-(m.depth-w.y-w.d))<1e-8);});
 m.boxes.forEach((v,i)=>{const q=oriented.boxes[i];assert.ok(Math.abs(q.x-(m.width-v.x-v.w))<1e-8);assert.ok(Math.abs(q.y-(m.depth-v.y-v.d))<1e-8);});
 assert.equal(JSON.stringify(m),before);
}
const school=x.MODEL_MAP.W4,orientedSchool=x.modelForBuilding({id:'wood-test',modelId:'W4',x:200,y:200,rotation:0});assert.deepEqual(orientedSchool.boxes,school.boxes);

let d=x.emptyDesign();d.buildings=Array.from({length:6},(_,i)=>building('p'+i));assert.equal(x.validate(d),null);d.buildings.push(building('seventh'));assert.equal(x.validate(d),'Maximum 6 printed buildings.');d.buildings=[];
d.buildings=Array.from({length:4},(_,i)=>building('w'+i,'W1'));assert.equal(x.validate(d),null);d.buildings.push(building('fifth','W1'));assert.equal(x.validate(d),'Maximum 4 wooden buildings.');
d=x.emptyDesign();d.buildings=[building('a','W1',160,180),building('b','R1',350,180)];d.bridges=[{id:'bridge',from:'a',to:'b',width:16,height:30}];assert.equal(x.validate(d),null);const before=x.bridgeGeometry(d,d.bridges[0]);assert.ok(before.length>100);d.buildings[1].x+=20;assert.ok(x.bridgeGeometry(d,d.bridges[0]).length>before.length);d.buildings[1].rotation=90;assert.equal(x.validate(d),null);assert.notDeepEqual(x.bridgeGeometry(d,d.bridges[0]).end,before.end);
d.bridges=Array.from({length:30},(_,i)=>({...d.bridges[0],id:'bridge'+i}));d.decorations=Array.from({length:40},(_,i)=>({id:'tree'+i,kind:'tree',x:160+i*5,y:285,rotation:0}));assert.equal(x.validate(d),null);assert.deepEqual(x.counts(d),{print:1,wood:1});assert.deepEqual(x.parseDesign(JSON.parse(JSON.stringify(d))),d);
const bad=structuredClone(d);bad.buildings[0].x=2;assert.match(x.validate(bad),/boundary/);assert.throws(()=>x.parseDesign(bad));const rotated=building('r','W6',190,165);assert.equal(x.polygonInside(x.footprint(rotated)),true);rotated.rotation=45;assert.equal(x.polygonInside(x.footprint(rotated)),false);
for(const mutate of [d=>d.buildings[0].modelId='__proto__',d=>d.buildings[0].x=NaN,d=>d.buildings[1].id='a',d=>d.bridges[0].to='missing',d=>d.board.width=600,d=>d.zones.push({id:'z',kind:'green',x:0,y:100,w:-10,d:10}),d=>d.roads.push({id:'r',kind:'road',width:16,points:[null,null]})]){const invalid=structuredClone(d);mutate(invalid);assert.throws(()=>x.parseDesign(invalid));}
let roadTest=x.emptyDesign();roadTest.buildings=[building('house','W1',150,200)];roadTest.roads=[{id:'road',kind:'road',width:16,points:[{x:50,y:200},{x:280,y:200}]}];assert.deepEqual(x.blockedRoutes(roadTest),['W1']);assert.equal(x.roadInside({id:'edge',kind:'road',width:50,points:[{x:535.3338,y:99.3872},{x:535.3338,y:99.3872}]}),false);
assert.equal(x.roadLength({points:[{x:0,y:0},{x:30,y:40},{x:30,y:60}]}),70);
assert.ok(x.RIVER.every(p=>x.inside(p)));assert.equal(x.SITE[x.SITE.length-1].y-x.SITE[0].y,190);assert.ok(Math.abs((x.RIVER[1].x-x.RIVER[0].x)/(x.RIVER[2].y-x.RIVER[1].y)-40/260)<1e-9);assert.ok(Math.abs((Math.max(...x.SITE.map(p=>p.x))-x.SITE[0].x)/190-982/480)<1e-9);assert.equal(x.BRIDGE_DECK_THICKNESS,2);
const legacy=x.emptyDesign();legacy.buildings=[building('old','R1',50,200)];legacy.roads=[{id:'old-road',kind:'road',width:16,points:[{x:90,y:100},{x:300,y:100}]}];assert.deepEqual(x.parseDesign(JSON.parse(JSON.stringify(legacy))),legacy);assert.ok(x.outsideSite(legacy).includes('old'));
const viewport=load('lib/district-viewport.ts');for(const [width,height] of [[820,430],[1400,400],[390,500]]){const frame=viewport.planFrame(width,height,1);assert.ok(frame.width>=606&&frame.height>=313-1e-9);assert.ok(Math.abs(frame.width/frame.height-width/height)<1e-9);}
const center={x:260,y:190},anchor={x:140,y:240};for(const next of [.01,.5,1.7,3,6,20]){const v=viewport.zoomAt(center,1.4,next,anchor);assert.ok(v.zoom>=.5&&v.zoom<=6);for(const axis of ['x','y'])assert.ok(Math.abs((anchor[axis]-v.center[axis])*v.zoom-(anchor[axis]-center[axis])*1.4)<1e-9);}
console.log('District checks passed: 20 exact-size models, quotas, rotation/boundaries, bridge updates, unlimited extras, import validation, route overlap, mm lengths.');
console.log('Viewport checks passed: responsive site fit, cursor-anchored zoom/clamps, fixed river proportions and legacy design compatibility.');

// Instance dimensions drive geometry without changing the catalogue defaults.
const resized=building('resized','R1',200,200);resized.name='Library & studio';resized.dimensions={width:100,depth:50,height:91.25};
const original=JSON.stringify(x.MODEL_MAP.R1),scaled=x.modelForBuilding(resized);
assert.equal(scaled.width,100);assert.equal(scaled.depth,50);assert.equal(scaled.height,91.25);
assert.equal(Math.max(...scaled.boxes.map(p=>p.z+p.h)),91.25);assert.equal(x.footprint(resized)[0].x,150);assert.equal(x.footprint(resized)[0].y,175);
assert.equal(JSON.stringify(x.MODEL_MAP.R1),original);assert.equal(x.MODEL_MAP.R1.width,80);
const custom=x.emptyDesign();custom.buildings=[resized,{...building('custom','CUSTOM-WOOD',380,200),name:'Community centre',dimensions:{width:70,depth:65,height:75}}];
custom.bridges=[{id:'link',from:'resized',to:'custom',width:16,height:30}];
assert.equal(x.validate(custom),null);assert.deepEqual(x.counts(custom),{print:1,wood:1});assert.deepEqual(x.parseDesign(JSON.parse(JSON.stringify(custom))),custom);
const bridgeBefore=x.bridgeGeometry(custom,custom.bridges[0]);custom.buildings[0].dimensions.width=120;assert.ok(x.bridgeGeometry(custom,custom.bridges[0]).length<bridgeBefore.length);
custom.buildings[0].dimensions.height=20;assert.match(x.validate(custom),/deck height/);custom.buildings[0].dimensions.height=91.25;
for(const dimensions of [null,{},[],{width:0,depth:30,height:40},{width:30,depth:-1,height:40},{width:30,depth:30,height:Infinity},{width:30,depth:30,height:301},{width:'30',depth:30,height:40}]){const bad=structuredClone(custom);bad.buildings[0].dimensions=dimensions;assert.throws(()=>x.parseDesign(bad));}
const injected=structuredClone(custom);injected.buildings[0].dimensions.script='ignored';assert.equal(x.parseDesign(injected).buildings[0].dimensions.script,undefined);
const manyCustom=x.emptyDesign();manyCustom.buildings=Array.from({length:7},(_,i)=>building('c'+i,'CUSTOM-3D',200,200));assert.match(x.validate(manyCustom),/Maximum 6/);
console.log('Custom building checks passed: defaults, scaled geometry/bridge anchors, quotas, dimensions and names survive import, malformed overrides rejected.');

const palette=load('lib/building-materials.ts');assert.equal(palette.PLA_MATERIALS.length,10);
for(const material of palette.PLA_MATERIALS){const coloured=x.emptyDesign();coloured.buildings=[{...building('colour','R1',200,200),plaMaterialId:material.id}];assert.equal(x.parseDesign(JSON.parse(JSON.stringify(coloured))).buildings[0].plaMaterialId,material.id);assert.equal(x.validate(coloured),null);}
for(const invalidColour of ['__proto__','#f00','made-up-colour',null,{}]){const invalid=x.emptyDesign();invalid.buildings=[{...building('colour','R1',200,200),plaMaterialId:invalidColour}];assert.throws(()=>x.parseDesign(invalid));}
const woodenPla=x.emptyDesign();woodenPla.buildings=[{...building('wood','W1',200,200),plaMaterialId:'matte-red'}];assert.throws(()=>x.parseDesign(woodenPla));
console.log('PLA checks passed: ten colours persist in design files; invalid colours and PLA applied to wood are rejected.');

// Existing outlying objects remain recoverable; new objects must use the revised site.
const prior=x.emptyDesign();prior.buildings=[building('left','R1',50,200),building('right','R1',500,200)];
assert.deepEqual(x.parseDesign(JSON.parse(JSON.stringify(prior))),prior);
const repair=structuredClone(prior);repair.buildings[0].x=200;assert.equal(x.validateEdit(repair,prior),null);
const invalidAddition=structuredClone(repair);invalidAddition.buildings.push(building('new-outside','R1',50,200));assert.match(x.validateEdit(invalidAddition,repair),/boundary/);
repair.buildings[1].x=350;assert.equal(x.validate(repair),null);
console.log('190 mm site checks passed: proportional outline, preserved building sizes and recoverable older layouts.');
