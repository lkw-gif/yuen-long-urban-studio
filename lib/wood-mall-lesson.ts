import { SCHOOL_UI, type SchoolPanelGroup, type SchoolStage } from './wood-school-lesson';

/** CorelDRAW 2019 wood-building guide, W3, pp. 20–22. Sizes include 2 mm plywood allowance. */
export const MALL_PANELS: SchoolPanelGroup[] = [
  { id: 'A-base', module: 'A', faces: ['base', 'roof'], face: { zh: '底板＋頂板', en: 'Base + roof' }, quantity: 2, width: 100, depth: 70 },
  { id: 'A-long', module: 'A', faces: ['front', 'back'], face: { zh: '前牆＋後牆', en: 'Front + back walls' }, quantity: 2, width: 100, depth: 46 },
  { id: 'A-short', module: 'A', faces: ['left', 'right'], face: { zh: '左牆＋右牆', en: 'Left + right walls' }, quantity: 2, width: 66, depth: 46 },
  { id: 'B-base', module: 'B', faces: ['base', 'roof'], face: { zh: '底板＋頂板', en: 'Base + roof' }, quantity: 2, width: 80, depth: 55 },
  { id: 'B-long', module: 'B', faces: ['front', 'back'], face: { zh: '前牆＋後牆', en: 'Front + back walls' }, quantity: 2, width: 80, depth: 21 },
  { id: 'B-short', module: 'B', faces: ['left', 'right'], face: { zh: '左牆＋右牆', en: 'Left + right walls' }, quantity: 2, width: 51, depth: 21 },
  { id: 'C-base', module: 'C', faces: ['base', 'roof'], face: { zh: '底板＋頂板', en: 'Base + roof' }, quantity: 2, width: 60, depth: 40 },
  { id: 'C-long', module: 'C', faces: ['front', 'back'], face: { zh: '前牆＋後牆', en: 'Front + back walls' }, quantity: 2, width: 60, depth: 16 },
  { id: 'C-short', module: 'C', faces: ['left', 'right'], face: { zh: '左牆＋右牆', en: 'Left + right walls' }, quantity: 2, width: 36, depth: 16 },
];

export const MALL_UI = {
  ...SCHOOL_UI,
  title: { zh: '把三層商場拆成 18 塊木板', en: 'Build a three-level mall from 18 panels' },
  subtitle: { zh: '三個盒子，由大至小疊起。先點算面板、設計刻線，再逐層組裝和置中。', en: 'Stack three boxes from largest to smallest. Count the panels, plan the engraving, then assemble and centre each level.' },
  count: { zh: '18 塊木板', en: '18 panels' },
  size: { zh: '完成尺寸 100 × 70 × 95 mm', en: 'Finished size 100 × 70 × 95 mm' },
  inventory: { zh: '逐塊點算：A 六塊＋B 六塊＋C 六塊', en: 'Count every part: six each for A, B and C' },
  assembly: { zh: '疊層位置', en: 'Stacking position' },
  position: { zh: 'A 在下、B 在中、C 在上。每層置中：左右各退入 10 mm，前後各退入 7.5 mm。', en: 'A at the bottom, B in the middle, C on top. Centre each level: 10 mm inset at both sides and 7.5 mm at the front and back.' },
  source: { zh: '參考：CorelDRAW 2019 木板建築指南，第 20–22 頁；窗門與線色示例見第 6、9 頁。', en: 'Reference: CorelDRAW 2019 wooden-building guide, pp. 20–22; window and line-colour examples on pp. 6 and 9.' },
};

export const MALL_STAGES: SchoolStage[] = [
  {
    title: { zh: '拆成三個盒子', en: 'Split into three boxes' },
    lead: { zh: '下層 A、中層 B、上層 C，各有底板、頂板和四幅牆，合共 18 塊。', en: 'Lower box A, middle box B and upper box C each have a base, roof and four walls: 18 panels in all.' },
    actions: [
      { zh: 'A：100 × 70 × 50；B：80 × 55 × 25；C：60 × 40 × 20 mm。', en: 'A: 100 × 70 × 50; B: 80 × 55 × 25; C: 60 × 40 × 20 mm.' },
      { zh: '這是盒子外尺寸；畫板件時用下方的切割尺寸清單。', en: 'These are the outside box sizes. Use the cut list below when drawing individual panels.' },
    ],
    check: { zh: '每層六塊，三層共 18 塊；總高 50＋25＋20＝95 mm。', en: 'Six panels per level, 18 total. Overall height: 50 + 25 + 20 = 95 mm.' },
  },
  {
    title: { zh: '畫窗門與刻線', en: 'Plan windows and engraving' },
    lead: { zh: '先在 CorelDRAW 的平面牆板上畫門窗，再切割和組裝。', en: 'Draw the windows and doors on flat wall panels in CorelDRAW before cutting and assembly.' },
    actions: [
      { zh: '紅色外框切割；藍色窗門只作表面刻印。示例窗 8 × 8 mm、門 10 × 16 mm。', en: 'Cut the red outlines; engrave the blue window and door outlines on the surface. Examples: 8 × 8 mm windows and a 10 × 16 mm door.' },
      { zh: '刻線離板邊至少 3 mm；板件外框相隔至少 6 mm。門設於 A 前牆，上層用窗戶。', en: 'Keep engraving at least 3 mm from panel edges and cut outlines at least 6 mm apart. Put the entrance on A’s front wall; use windows upstairs.' },
    ],
    check: { zh: '頂板與底板的接觸面留白；可在外露牆面加刻商場名稱。門窗排列可自行設計。', en: 'Leave contacting roof/base surfaces blank. You may engrave a mall name on an exposed wall and design your own window layout.' },
  },
  {
    title: { zh: '組裝 A 下層', en: 'Assemble lower box A' },
    lead: { zh: '先砌最大的盒子：底板 → 四牆 → 試蓋頂板。', en: 'Build the largest box first: base → four walls → dry-fit the roof.' },
    actions: [
      { zh: '底／頂板 100 × 70；前／後牆 100 × 46；左／右牆 66 × 46 mm，各兩塊。', en: 'Base/roof: 100 × 70; front/back: 100 × 46; sides: 66 × 46 mm. Two of each size.' },
      { zh: '前後牆包住左右牆，先用紙膠帶固定，四角成 90°。', en: 'The front and back walls wrap the side walls. Hold with tape and check every corner is 90°.' },
    ],
    check: { zh: '六塊齊全，試蓋後才黏合；盒子完成外高為 50 mm。', en: 'Check all six pieces, dry-fit, then glue. Finished outside height: 50 mm.' },
  },
  {
    title: { zh: '組裝 B 中層', en: 'Assemble middle box B' },
    lead: { zh: '另外砌好中層，暫時不要黏到 A 上面。', en: 'Build the middle box separately before attaching it to A.' },
    actions: [
      { zh: '底／頂板 80 × 55；前／後牆 80 × 21；左／右牆 51 × 21 mm，各兩塊。', en: 'Base/roof: 80 × 55; front/back: 80 × 21; sides: 51 × 21 mm. Two of each size.' },
      { zh: '同樣先底板、再四牆，最後試蓋頂板；窗戶朝外。', en: 'Again, start with the base, add four walls, then dry-fit the roof. Face the windows outward.' },
    ],
    check: { zh: 'B 是獨立六面盒，完成外高 25 mm；保留自己的底板和頂板。', en: 'B is a complete six-panel box, 25 mm high. Keep its own base and roof.' },
  },
  {
    title: { zh: '組裝 C 上層', en: 'Assemble upper box C' },
    lead: { zh: '最後砌最小的上層；牆板較矮，注意不要與其他層混合。', en: 'Build the smallest box last. Its walls are shorter, so keep them separate from the other levels.' },
    actions: [
      { zh: '底／頂板 60 × 40；前／後牆 60 × 16；左／右牆 36 × 16 mm，各兩塊。', en: 'Base/roof: 60 × 40; front/back: 60 × 16; sides: 36 × 16 mm. Two of each size.' },
      { zh: '先試拼和檢查直角，再黏好完整盒；頂板保持水平。', en: 'Dry-fit and check square corners before gluing the full box. Keep the roof level.' },
    ],
    check: { zh: 'C 六塊齊全，完成外高 20 mm；A、B、C 都已各自砌好。', en: 'C has all six panels and is 20 mm high. A, B and C are now complete boxes.' },
  },
  {
    title: { zh: '置中逐層疊起', en: 'Centre and stack the levels' },
    lead: { zh: '先把 B 放在 A 上，再把 C 放在 B 上；每層由大至小置中。', en: 'Place B on A, then C on B. Centre each smaller box on the one below.' },
    actions: [
      { zh: '每次左右各退入 10 mm，前後各退入 7.5 mm。先用鉛筆輕畫定位線。', en: 'For each level, inset 10 mm on both sides and 7.5 mm at the front and back. Mark light pencil guides first.' },
      { zh: '先乾放檢查四邊距離，再於接觸面薄薄塗膠；不要刪走上層底板。', en: 'Dry-stack and check the margins, then apply a thin layer of glue to the contact surfaces. Keep each upper box’s base.' },
    ],
    check: { zh: '3D 圖暫時分開各層方便對位；實物完成後，底板與下層頂板應貼合。', en: 'The 3D view separates the levels to show alignment. In the finished model, each base rests directly on the roof below.' },
  },
  {
    title: { zh: '完成與檢查', en: 'Finish and check' },
    lead: { zh: '旋轉模型，檢查商場的退台外形與窗門方向。', en: 'Rotate the model to check the stepped form and the direction of the windows and entrance.' },
    actions: [
      { zh: '三層共 18 塊；整體 100 × 70 × 95 mm，越上層越小。', en: '18 panels across three levels; overall size 100 × 70 × 95 mm, with smaller boxes higher up.' },
      { zh: '檢查三層置中、底部平穩、頂板水平，以及刻線清楚。', en: 'Check that all levels are centred, the base is stable, roofs are level and engraved lines are clear.' },
    ],
    check: { zh: '待膠水乾透後，再搬動和放上街區底板。', en: 'Let the glue dry fully before moving the model onto the district board.' },
  },
];
