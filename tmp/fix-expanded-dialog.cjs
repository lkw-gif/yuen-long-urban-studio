const fs=require('node:fs');
const p='components/district-designer.tsx';let s=fs.readFileSync(p,'utf8');s=s.replace('const key=(e:KeyboardEvent)=>{if((e.target','const key=(e:KeyboardEvent)=>{if(confirmation)return;if((e.target');fs.writeFileSync(p,s);
const c='components/district-designer.css';s=fs.readFileSync(c,'utf8').replace('position:fixed;inset:0;z-index:70;min-height:0','position:fixed;inset:0;z-index:40;min-height:0');fs.writeFileSync(c,s);
