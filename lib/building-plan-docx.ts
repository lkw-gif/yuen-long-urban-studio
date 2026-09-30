import {strFromU8,strToU8,unzipSync,zipSync} from 'fflate';
import {MODELS,buildingName,modelForBuilding,type Design,type Model} from './district-design';

export type ProductionRow={code:string;modelId:string;name:string;kind:Model['kind'];quantity:number;width:number;depth:number;height:number;filename:string};
const cleanFilename=(value:string)=>Array.from(value,c=>c.charCodeAt(0)<32?'-':c).join('').replace(/[<>:"/\\|?*]/g,'-').trim();
const cm=(mm:number)=>String(Math.round(mm*1000/10)/1000);
const escapeXml=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));

export function productionRows(d:Design,language:string):ProductionRow[]{
 const rows=new Map<string,Omit<ProductionRow,'code'|'filename'>>();
 for(const b of d.buildings){const m=modelForBuilding(b),name=buildingName(b,language),key=JSON.stringify([m.id,name,m.width,m.depth,m.height]);const row=rows.get(key);if(row)row.quantity++;else rows.set(key,{modelId:m.id,name,kind:m.kind,quantity:1,width:m.width,depth:m.depth,height:m.height});}
 const order=new Map(MODELS.map((m,i)=>[m.id,i]));
 return [...rows.values()].sort((a,b)=>(a.kind===b.kind?0:a.kind==='print'?-1:1)||(order.get(a.modelId)!-order.get(b.modelId)!)).map((row,i)=>{
  const code=`B${i+1}`,group=d.group.trim().replace(/^GROUP\s*/i,'')||'( )';
  return {...row,code,filename:`${cleanFilename(d.className)||'2( )'}_GROUP ${cleanFilename(group)}_${code}`};
 });
}

// Only edit known text slots in the retained template. Every other ZIP member
// is copied unchanged, including styles, theme, relationships and page furniture.
function paragraph(text:string,source:string,compact=false):string{
 let properties=source.match(/<w:pPr\b[^>]*>[\s\S]*?<\/w:pPr>/)?.[0]??'<w:pPr/>';
 const runProperties=source.match(/<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>/)?.[0]??'<w:rPr><w:rFonts w:ascii="新細明體" w:eastAsia="新細明體" w:hAnsi="新細明體"/></w:rPr>';
 if(compact){properties=properties.replace(/<w:spacing\b[^>]*\/>/,'<w:spacing w:after="0" w:line="240" w:lineRule="auto"/>').replace('</w:pPr>','<w:snapToGrid w:val="0"/></w:pPr>');}
 const lines=text.split('\n').map(line=>`<w:t xml:space="preserve">${escapeXml(line)}</w:t>`).join('<w:br/>');
 return `<w:p>${properties}<w:r>${runProperties}${lines}</w:r></w:p>`;
}
function cellWithText(cell:string,text:string){
 if(!cell.includes('<w:vAlign'))cell=cell.replace('</w:tcPr>','<w:vAlign w:val="center"/></w:tcPr>');
 const source=cell.match(/<w:p\b[\s\S]*?<\/w:p>/)?.[0]??'';
 let first=true;
 return cell.replace(/<w:p\b[\s\S]*?<\/w:p>/g,()=>{if(!first)return '';first=false;return paragraph(text,source,true);});
}
export function buildProductionPlan(template:Uint8Array,d:Design,language:string):Uint8Array{
 const parts=unzipSync(template),document=parts['word/document.xml'];if(!document)throw new Error('Missing Word template.');
 const rows=productionRows(d,language);if(rows.length>15)throw new Error('Too many building groups.');
 let xml=strFromU8(document),tableIndex=0;
 xml=xml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g,table=>{
  if(tableIndex++!==1)return table;
  let rowIndex=-2;
  return table.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g,row=>{
   const data=rows[rowIndex++];if(!data)return row;
   const values=[data.code,data.name,String(data.quantity),cm(data.width),cm(data.depth),cm(data.height),data.kind==='print'?'3D Print':'木板製作','',data.filename,'',''];
   let column=0;let updated=row.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g,cell=>cellWithText(cell,values[column++]));
   updated=updated.replace(/<w:trHeight\b[^>]*\/>/,'<w:trHeight w:val="780" w:hRule="atLeast"/>');
   if(!updated.includes('<w:cantSplit'))updated=updated.replace('</w:trPr>','<w:cantSplit/></w:trPr>');
   return updated;
  });
 });
 // The first paragraphs are all before the instruction table.
 const tableStart=xml.indexOf('<w:tbl>')>=0?xml.indexOf('<w:tbl>'):xml.search(/<w:tbl\b/);
 let paragraphIndex=0;
 const intro=xml.slice(0,tableStart).replace(/<w:p\b[\s\S]*?<\/w:p>/g,p=>{
  const index=paragraphIndex++;
  if(index===3)return paragraph(`設計名稱：${d.name||'__________________________'}`,p);
  if(index===4){let field=0;return p.replace(/___________/g,match=>{field++;return field===1?escapeXml(d.className||match):field===2?escapeXml(d.group||match):match;});}
  return p;
 });
 xml=intro+xml.slice(tableStart);
 parts['word/document.xml']=strToU8(xml);
 return zipSync(parts,{level:6});
}
