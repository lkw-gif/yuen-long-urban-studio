const fs=require('node:fs');
function update(file,pairs){let s=fs.readFileSync(file,'utf8');for(const [from,to] of pairs){if(!s.includes(from))throw new Error('Missing '+from.slice(0,70));s=s.replace(from,to);}fs.writeFileSync(file,s);}
update('components/district-plan.tsx',[
 ["r.kind==='road'?'#64737a':'#d3bb87'","r.kind==='road'?'#64737a':'#aeb4b5'"],
 ['  {d.roads.map(r=>',`  <g aria-label={t('Fixed river')} pointerEvents="none"><polygon points={pts(RIVER)} fill="#78b8d7" stroke="#4c96b7" strokeWidth="1"/>{[110,150,190,230,270,310].map(y=><path key={y} d={\`M23 \${y}q5 -2 10 0t10 0\`} fill="none" stroke="#c5e8ee" strokeWidth=".7"/>)}<text x="35" y="210" textAnchor="middle" fill="#24516b" fontSize="6" transform="rotate(-90 35 210)">{t('River')} · 40 × 260 mm</text></g>
  {d.roads.map(r=>`],
 ['stroke="#f2db8d" strokeWidth={b.width-1.2}', 'stroke="#b6dadd" strokeOpacity=".72" strokeWidth={b.width-1.2}'],
 ['stroke="#9d8143" strokeWidth=".5" strokeDasharray="2 4"','stroke="#ab8c62" strokeWidth=".7" strokeDasharray="1 18"']
]);
update('components/district-designer.tsx',[
 ['Maximize2,Save,X','Maximize2,Minimize2,Save,X'],
 ['warnings,blockedRoutes,','warnings,riverOverlaps,blockedRoutes,'],
 ['[routeWidth,setRouteWidth]=useState(16)','[routeWidth,setRouteWidth]=useState(15)'],
 ["[view,setView]=useState<'top'|'3d'>('top')","[view,setView]=useState<'top'|'3d'>('top'),[expanded,setExpanded]=useState(false)"],
 ['function choose(next:Tool){setTool(next);','function choose(next:Tool){setTool(next);if(next===\'road\')setRouteWidth(15);if(next===\'path\')setRouteWidth(8);'],
 ["if(e.key==='Escape'){choose('select');", "if(e.key==='Escape'){setExpanded(false);choose('select');"],
 ['const collision=warnings(design),blocked=blockedRoutes(design),','const collision=warnings(design),blocked=blockedRoutes(design),water=riverOverlaps(design),'],
 ['return <main className="district-studio">','return <main className={\'district-studio\'+(expanded?\' dd-expanded\':\'\')}>'],
 ["choose('road');setRouteWidth(16);","choose('road');setRouteWidth(15);"],
 ["setView('3d');setPreview(null)","setView('3d');setSelected(null);setPreview(null)"],
 ["{t('Show dimensions')}</label>","{t(view==='3d'?'Selected object dimensions':'Show dimensions')}</label>"],
 ['<label><input type="checkbox" checked={grid}', "{view==='top'&&<label><input type=\"checkbox\" checked={grid}"],
 ["{t('Snap to 5 mm')}</label></div>","{t('Snap to 5 mm')}</label>}<button className=\"dd-expand\" aria-pressed={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}<span>{t(expanded?'Exit expanded view':'Expand workspace')}</span></button></div>"],
 ["t(view==='3d'?'Edit positions in top view.':instruction)","t(view==='3d'?'Click a building to show its dimensions.':instruction)"],
 ['design={design} dimensions={dimensions} errorText=', "design={design} dimensions={dimensions} selected={selected?.id??''} onSelect={id=>setSelected(id?{kind:design.buildings.some(b=>b.id===id)?'buildings':'bridges',id}:null)} errorText="],
 ['center={viewCenter} tool={tool}', 'center={viewCenter} onViewport={(next,center)=>{setZoom(next);setViewCenter(center);}} tool={tool}'],
 ["if(zoom===1)setViewCenter(b?{x:b.x,y:b.y}:{x:297,y:211});setZoom(v=>Math.min(3,v+.25));", "if(b)setViewCenter({x:b.x,y:b.y});setZoom(v=>Math.min(6,v*1.25));"],
 ["if(zoom<=1.25)setViewCenter({x:297,y:211});setZoom(v=>Math.max(1,v-.25));", "setZoom(v=>Math.max(.5,v/1.25));"],
 ["aria-label={t('Fit board')}","aria-label={t('Fit site')}"],
 ["t(view==='top'?'Site boundary':'Drag to orbit · wheel to zoom · right-drag to pan')", "t(view==='top'?'Wheel to zoom · right-drag to pan':'Drag to orbit · wheel to zoom · right-drag to pan')"],
 ["{view==='top'?' · 574 × 280.6 mm':''}", ""],
 ['{collision.length>0&&<div className="dd-alert">{t(\'Building overlap\')}: {collision.join(\', \')}</div>}{blocked.length>0&&<div className="dd-alert">{t(\'Building blocks a route\')}: {blocked.join(\', \')}</div>}', `{collision.length+blocked.length+water.length>0&&<details className="dd-warnings"><summary>{t('Design checks')} ({collision.length+blocked.length+water.length})</summary>{collision.length>0&&<p>{t('Building overlap')}: {collision.join(', ')}</p>}{blocked.length>0&&<p>{t('Building blocks a route')}: {blocked.join(', ')}</p>}{water.length>0&&<p>{t('Building overlaps the river')}: {water.join(', ')}</p>}</details>}`]
]);
// Keep the material explanation consistent in both bridge tool and inspector.
let designer=fs.readFileSync('components/district-designer.tsx','utf8').replaceAll('Deck is 3 mm thick; rails are 12 mm high.','Bamboo frame · 2 mm acrylic deck · 12 mm guards.');fs.writeFileSync('components/district-designer.tsx',designer);
update('lib/district-export.ts',[
 ['MODELS,bridgeGeometry','BRIDGE_DECK_THICKNESS,MODELS,bridgeGeometry'],
 ['b.width,b.height,3]','b.width,b.height,BRIDGE_DECK_THICKNESS]']
]);
