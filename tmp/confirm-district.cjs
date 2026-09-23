const fs=require('fs');let p='components/district-designer.tsx',s=fs.readFileSync(p,'utf8');
s=s.replace("import {StudioNav}","import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';\nimport {StudioNav}");
s=s.replace("const current=selected?", "const [confirmation,setConfirmation]=useState<{message:string;resolve:(value:boolean)=>void}|null>(null);\n function ask(message:string){return new Promise<boolean>(resolve=>setConfirmation({message,resolve}));}\n function respond(value:boolean){confirmation?.resolve(value);setConfirmation(null);}\n const current=selected?");
s=s.replace('function remove(){','async function remove(){');
s=s.replace("!window.confirm(t('Delete this building and its connected bridges?'))", "!(await ask('Delete this building and its connected bridges?'))");
s=s.replace("!window.confirm(t('Replace this design with the selected file? You can undo this action.'))", "!(await ask('Replace this design with the selected file? You can undo this action.'))");
s=s.replace("onClick={()=>{if(window.confirm(t('Clear this design? You can undo this action.')))","onClick={async()=>{if(await ask('Clear this design? You can undo this action.'))");
s=s.replace('</main>;','<Dialog open={!!confirmation} onOpenChange={open=>{if(!open)respond(false);}}><DialogContent className="dd-confirm"><DialogTitle>{t(\'Confirm action\')}</DialogTitle><DialogDescription>{t(confirmation?.message??\'\')}</DialogDescription><div><button onClick={()=>respond(false)}>{t(\'Cancel\')}</button><button onClick={()=>respond(true)}>{t(\'Confirm\')}</button></div></DialogContent></Dialog></main>;');
fs.writeFileSync(p,s);
