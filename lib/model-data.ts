export type Building = { id: string; name: string; en: string; x: number; z: number; w: number; d: number; h: number; rotation?: number; named?: boolean };
// Normalized coordinates traced from the supplied map. Horizontal scale and all heights are illustrative.
export const BOUNDARY: [number, number][] = [[12,8],[288,9],[414,5],[840,6],[899,20],[990,27],[997,82],[994,103],[969,135],[943,164],[920,189],[895,233],[870,290],[851,342],[835,391],[819,447],[808,497],[15,498],[8,481],[10,335],[7,170],[9,35]];
export const BUILDINGS: Building[] = [
 {id:'lee-king',name:'利景樓',en:'Lee King Building',x:530,z:171,w:118,d:36,h:30,named:true},
 {id:'cheung-fat',name:'祥發大廈',en:'Cheung Fat Building',x:674,z:172,w:126,d:36,h:34,named:true},
 {id:'lee-fat',name:'利發大廈',en:'Lee Fat House',x:342,z:380,w:121,d:40,h:24,named:true},
 {id:'siu-fung',name:'兆豐樓',en:'Siu Fung Building',x:170,z:434,w:132,d:52,h:27,named:true},
 {id:'siu-ming',name:'兆明樓',en:'Siu Ming Building',x:341,z:436,w:122,d:43,h:33,named:true},
 {id:'ka-ho',name:'嘉好樓',en:'Ka Ho Building',x:515,z:376,w:89,d:33,h:24,named:true},
 {id:'hing-fat',name:'興發樓',en:'Hing Fat Building',x:662,z:376,w:108,d:33,h:29,named:true},
 {id:'lok-sing',name:'樂成大廈',en:'Lok Sing Building',x:655,z:435,w:109,d:43,h:32,named:true},
 ...[[145,110,43,41,21],[194,110,49,41,28],[245,110,47,41,24],[282,110,23,41,30],[332,112,40,43,27],[383,115,60,42,31],[499,111,55,39,28],[560,111,52,39,33],[640,117,64,46,37],[706,117,60,46,35],[783,117,73,42,39],[855,115,68,42,34],[913,116,41,36,31],[749,171,16,35,33],[513,274,77,74,35],[570,376,20,33,26],[597,376,24,33,26],[751,402,27,118,35],[803,289,33,31,18],[807,328,30,32,20],[769,280,34,32,18],[497,435,55,43,26],[554,435,54,43,30],[600,435,35,43,29],[135,244,49,25,7],[249,327,20,51,9]].map((b,i)=>({id:'block-'+i,name:'街區建物 '+String(i+1).padStart(2,'0'),en:'Context building',x:b[0],z:b[1],w:b[2],d:b[3],h:b[4]})),
 {id:'diagonal-1',name:'斜向場地建物',en:'Context building',x:231,z:184,w:122,d:22,h:10,rotation:-43},
 {id:'diagonal-2',name:'斜向場地建物',en:'Context building',x:206,z:225,w:64,d:38,h:7,rotation:-43},
];
export const NAMED_BUILDINGS = BUILDINGS.filter(b=>b.named);
export const world = (x:number,z:number): [number,number] => [(x-500)*.4,(z-250)*.4];
export const MODEL_NOTICE = '依提供地圖目測描繪；建築高度、外觀及比例為示意，非測繪資料。';
