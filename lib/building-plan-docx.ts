import {strFromU8,strToU8,unzipSync,zipSync} from 'fflate';
import {MODELS,buildingName,modelForBuilding,type Design,type Model} from './district-design';
import {materialName,DEFAULT_PLA_MATERIAL,type PlaMaterialId} from './building-materials';

export type ProductionRow={number:number;modelId:string;name:string;kind:Model['kind'];quantity:number;width:number;depth:number;height:number;materialId?:PlaMaterialId;color:string};
const mm=(value:number)=>String(Math.round(value*1000)/1000);
const escapeXml=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));

export function productionRows(d:Design,language:string):ProductionRow[]{
 const rows=new Map<string,Omit<ProductionRow,'number'>>();
 for(const b of d.buildings){const m=modelForBuilding(b),name=buildingName(b,language),materialId=m.kind==='print'?b.plaMaterialId??DEFAULT_PLA_MATERIAL:undefined,color=m.kind==='print'?materialName(materialId,language):language==='en'?'Natural wood':'木板原色',key=JSON.stringify([m.id,name,m.width,m.depth,m.height,materialId]);const row=rows.get(key);if(row)row.quantity++;else rows.set(key,{modelId:m.id,name,kind:m.kind,quantity:1,width:m.width,depth:m.depth,height:m.height,materialId,color});}
 const order=new Map(MODELS.map((m,i)=>[m.id,i]));
 return [...rows.values()].sort((a,b)=>(a.kind===b.kind?0:a.kind==='print'?-1:1)||(order.get(a.modelId)!-order.get(b.modelId)!)).map((row,i)=>({...row,number:i+1}));
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
function cellWithText(cell:string,text:string,englishColour=false,compact=true){
 if(!cell.includes('<w:vAlign'))cell=cell.replace('</w:tcPr>','<w:vAlign w:val="center"/></w:tcPr>');
 const source=cell.match(/<w:p\b[\s\S]*?<\/w:p>/)?.[0]??'';
 let first=true;
 let updated=cell.replace(/<w:p\b[\s\S]*?<\/w:p>/g,p=>{if(!first)return compact?'':paragraph('',p);first=false;return paragraph(text,source,compact);});
 // Keep 12 pt text and the template grid. Proportional Latin glyphs and a small
 // inset fit "Transparent" as a whole word inside the original colour column.
 if(englishColour){updated=updated.replace(/w:ascii="[^"]*"/g,'w:ascii="Times New Roman"').replace(/w:hAnsi="[^"]*"/g,'w:hAnsi="Times New Roman"').replace(/<w:b(?:\s[^>]*)?\/>/g,'');const margins='<w:tcMar><w:left w:w="20" w:type="dxa"/><w:right w:w="20" w:type="dxa"/></w:tcMar>';updated=updated.includes('<w:tcMar')?updated.replace(/<w:tcMar[\s\S]*?<\/w:tcMar>/,margins):updated.replace('</w:tcPr>',margins+'</w:tcPr>');}
 return updated;
}
export function buildProductionPlan(template:Uint8Array,d:Design,language:string):Uint8Array{
 const parts=unzipSync(template),document=parts['word/document.xml'];if(!document)throw new Error('Missing Word template.');
 const rows=productionRows(d,language),en=language==='en';if(rows.length>10)throw new Error('Too many building groups.');
 let xml=strFromU8(document),tableIndex=0;
 const headers=en?['No.','Building type','Qty','Length\n(mm)','Width\n(mm)','Height\n(mm)','Production\nmethod','Colour','Assigned to','Done']:['編號','建築物類型','數量','長\n(mm)','闊\n(mm)','高\n(mm)','製作方法','顏色','分工','完成'];
 xml=xml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g,table=>{
  if(tableIndex++!==0)return table;
  let rowIndex=-1;
  return table.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g,row=>{
   const index=rowIndex++,data=rows[index-1];
   const values=index===-1?headers:index===0?(en?['Example','Residential','2','57','36','143','3D Print','Blue','2B01','✔']:['例子','住宅','2','57','36','143','3D Print','藍色','2B01','✔']):data?[String(data.number),data.name,String(data.quantity),mm(data.width),mm(data.depth),mm(data.height),data.kind==='print'?'3D Print':en?'Wood construction':'木板製作',data.color,'','']:[String(index),'','','','','','','','',''];
   if((row.match(/<w:tc\b/g)||[]).length!==10)throw new Error('The building plan template must have 10 columns.');
   let column=0;let updated=row.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g,cell=>{const position=column++;return cellWithText(cell,values[position],en&&position===7&&!!data);});
   if(index>0){const height='<w:trHeight w:val="860" w:hRule="atLeast"/>';updated=updated.includes('<w:trHeight')?updated.replace(/<w:trHeight\b[^>]*\/>/,height):updated.replace('</w:trPr>',height+'</w:trPr>');}
   if(!updated.includes('<w:cantSplit'))updated=updated.replace('</w:trPr>','<w:cantSplit/></w:trPr>');
   return updated;
  });
 });
 // The metadata paragraphs are all before the building table.
 const tableStart=xml.indexOf('<w:tbl>')>=0?xml.indexOf('<w:tbl>'):xml.search(/<w:tbl\b/);
 let paragraphIndex=0;
 const intro=xml.slice(0,tableStart).replace(/<w:p\b[\s\S]*?<\/w:p>/g,p=>{
  const index=paragraphIndex++;
  if(en&&index===0)return paragraph('CCC Kei Long College',p);
  if(en&&index===1)return paragraph('F.2 Geography, Design and Technology and Innovation',p);
  if(en&&index===2)return paragraph('Future Yuen Long Community | Building Production Plan',p);
  if(index===3)return paragraph(`${en?'Design name: ':'設計名稱：'}${d.name||'__________________________'}`,p);
  if(index===5)return paragraph(en?`Class: ${d.className||'_______'}    Group: ${d.group||'_______'}    Members / numbers: __________________________   Date: ________________`:`班別：${d.className||'_______'}    組別：${d.group||'_______'}    組員名字及學號：__________________________________   日期：__________________________`,p);
  return p;
 });
 xml=intro+xml.slice(tableStart);
 parts['word/document.xml']=strToU8(xml);
 return zipSync(parts,{level:6});
}
