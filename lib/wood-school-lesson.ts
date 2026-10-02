/** Physical cut list from the CorelDRAW 2019 wood-building guide, W4 (pp. 23–25). */
export type SchoolLanguage = 'zh-Hant' | 'en';
export type Bilingual = { zh: string; en: string };
export const schoolWords = (value: Bilingual, language: SchoolLanguage) => value[language === 'en' ? 'en' : 'zh'];

export type SchoolPanelGroup = {
  id: string;
  module: 'A' | 'B';
  face: Bilingual;
  quantity: 2;
  width: number;
  depth: number;
};

export const SCHOOL_PANELS: SchoolPanelGroup[] = [
  { id: 'A-base', module: 'A', face: { zh: '底板＋頂板', en: 'Base + roof' }, quantity: 2, width: 100, depth: 40 },
  { id: 'A-long', module: 'A', face: { zh: '前牆＋後牆', en: 'Front + back walls' }, quantity: 2, width: 100, depth: 36 },
  { id: 'A-short', module: 'A', face: { zh: '左牆＋右牆', en: 'Left + right walls' }, quantity: 2, width: 36, depth: 36 },
  { id: 'B-base', module: 'B', face: { zh: '底板＋頂板', en: 'Base + roof' }, quantity: 2, width: 40, depth: 60 },
  { id: 'B-short', module: 'B', face: { zh: '前牆＋後牆', en: 'Front + back walls' }, quantity: 2, width: 40, depth: 36 },
  { id: 'B-long', module: 'B', face: { zh: '左牆＋右牆', en: 'Left + right walls' }, quantity: 2, width: 56, depth: 36 },
];

export const SCHOOL_UI = {
  nav: { zh: '製作次序', en: 'Build sequence' },
  title: { zh: '把 L 形學校拆成 12 塊木板', en: 'Build an L-shaped school from 12 panels' },
  subtitle: { zh: '從外形、面板、窗門刻印到組裝。轉動 3D 模型，一步一步看清每一塊板的位置。', en: 'Explore the shape, panels, window engraving and assembly. Rotate the 3D model to see where every piece belongs.' },
  heroTag: { zh: 'CORELDRAW 2019 · 木板建築', en: 'CORELDRAW 2019 · WOODEN BUILDING' },
  count: { zh: '12 塊木板', en: '12 panels' },
  thickness: { zh: '2 mm 板厚', en: '2 mm plywood' },
  size: { zh: '完成尺寸 100 × 100 × 40 mm', en: 'Finished size 100 × 100 × 40 mm' },
  viewTitle: { zh: '互動 3D 拆解模型', en: 'Interactive 3D exploded model' },
  viewHelp: { zh: '拖曳旋轉 · 滾輪縮放 · 點選零件清單突出顯示', en: 'Drag to rotate · wheel to zoom · select a part group to highlight it' },
  actionTitle: { zh: '這一步要做', en: 'What to do now' },
  checkTitle: { zh: '完成前檢查', en: 'Check before moving on' },
  previous: { zh: '上一步', en: 'Previous' },
  next: { zh: '下一步', en: 'Next' },
  inventory: { zh: '逐塊點算：A 六塊＋B 六塊', en: 'Count every part: six for A + six for B' },
  inventoryHelp: { zh: '點選表格一行，可在 3D 模型中突出顯示該組板件。尺寸為單件切割尺寸。', en: 'Select a row to highlight those panels in 3D. Dimensions are for one cut piece.' },
  module: { zh: '區塊', en: 'Block' },
  face: { zh: '板件', en: 'Panel' },
  dimensions: { zh: '切割尺寸', en: 'Cut size' },
  quantity: { zh: '數量', en: 'Qty' },
  rear: { zh: 'A 後座', en: 'A Rear block' },
  wing: { zh: 'B 左翼', en: 'B Left wing' },
  assembly: { zh: '組裝方向', en: 'Assembly position' },
  position: { zh: 'A 橫放後方；B 放在左前方，後牆貼 A 前牆，左邊對齊。右前方留空。', en: 'Place A across the back. Put B at the front-left, touching A front wall with B back wall and aligning left edges. Keep the front-right open.' },
  cut: { zh: '紅線：切割板件外框', en: 'Red: cut the panel outline' },
  engrave: { zh: '藍線：只在木板表面刻印窗門', en: 'Blue: engrave windows and doors on the surface' },
  thicknessNote: { zh: '表內牆板尺寸已按 2 mm 板厚計算，不用再減。', en: 'Wall cut sizes already account for 2 mm plywood; do not subtract again.' },
  source: { zh: '參考：CorelDRAW 2019 木板建築指南，第 23–25 頁；窗門及線色示例見第 6、9 頁。', en: 'Reference: CorelDRAW 2019 wooden-building guide, pp. 23–25; window and line-colour examples on pp. 6 and 9.' },
} satisfies Record<string, Bilingual>;

export type SchoolStage = {
  title: Bilingual;
  lead: Bilingual;
  actions: Bilingual[];
  check: Bilingual;
};

export const SCHOOL_STAGES: SchoolStage[] = [
  {
    title: { zh: '先拆成兩個盒', en: 'Split the L into two boxes' },
    lead: { zh: 'A 後座橫放後方，B 左翼在左前方。每個盒有六塊板，合共 12 塊。', en: 'Place rear block A across the back and left wing B at the front-left. Each box has six panels: 12 in all.' },
    actions: [
      { zh: '先看俯視外形：後方 100 × 40 mm，左前方 40 × 60 mm。', en: 'Read the top view first: 100 × 40 mm at the back, 40 × 60 mm at the front-left.' },
      { zh: '按下方清單逐組點算板件；切割尺寸已計入 2 mm 板厚。', en: 'Count the panels by group below. Cut sizes already account for 2 mm plywood.' },
    ],
    check: { zh: '總尺寸 100 × 100 × 40 mm；右前方留作操場。', en: 'Overall size: 100 × 100 × 40 mm. Keep the front-right area open for a playground.' },
  },
  {
    title: { zh: '組裝 A 後座', en: 'Assemble rear block A' },
    lead: { zh: '先放 100 × 40 底板，再圍上四幅牆；前後牆包住左右牆。', en: 'Start with the 100 × 40 base. Add four walls, with front/back walls wrapping the side walls.' },
    actions: [
      { zh: 'A：底板 1、前後牆各 1、左右牆各 1。', en: 'A: one base, one each of front/back and left/right walls.' },
      { zh: '先乾拼、用紙膠帶固定，檢查四角是否 90°。', en: 'Dry-fit first; hold with tape and check all corners are 90°.' },
    ],
    check: { zh: 'A 的頂板先不要黏上，方便檢查牆板。', en: 'Leave A’s roof loose so you can inspect the wall joints.' },
  },
  {
    title: { zh: '組裝 B 左翼', en: 'Assemble left wing B' },
    lead: { zh: '用 40 × 60 底板和四幅牆，另外砌好左翼。', en: 'Build the left wing separately on its 40 × 60 base with four walls.' },
    actions: [
      { zh: 'B：前後牆 40 × 36 各 1；左右牆 56 × 36 各 1。', en: 'B: front/back walls 40 × 36 each; left/right walls 56 × 36 each.' },
      { zh: 'B 的後牆將貼 A 的前牆；這兩幅接觸面不要刻窗。', en: 'B’s back wall will meet A’s front wall; leave these contact faces unengraved.' },
    ],
    check: { zh: 'A、B 都各有自己的牆板，不要共用或重疊板件。', en: 'A and B each keep their own walls; do not share or overlap panels.' },
  },
  {
    title: { zh: '設計窗門與刻線', en: 'Plan windows and engraving' },
    lead: { zh: '先在外露牆面畫窗門，再切板和組裝。藍線是表面刻印，不是挖空。', en: 'Draw windows and doors on the exposed walls before cutting and assembly. Blue lines are surface engraving, not holes.' },
    actions: [
      { zh: '示例：窗 8 × 8 mm、門 10 × 16 mm；圖案離板邊至少 3 mm。', en: 'Examples: 8 × 8 mm windows and a 10 × 16 mm door; keep marks at least 3 mm from panel edges.' },
      { zh: '在 CorelDRAW 平排板件，紅線切割、藍線刻印；板件外框之間至少留 6 mm。', en: 'Lay out the panels in CorelDRAW: red outlines for cutting, blue marks for engraving. Leave at least 6 mm between panel outlines.' },
    ],
    check: { zh: '窗戶數量和排列可以自訂；接觸面留白。', en: 'You may change the window count and layout. Leave the contact faces blank.' },
  },
  {
    title: { zh: '試蓋頂板，再接成 L 形', en: 'Fit roofs, then join the L' },
    lead: { zh: '先試蓋 A、B 各自的頂板，再把 B 放到 A 的左前方。', en: 'Dry-fit a roof on each box, then put B at the front-left of A.' },
    actions: [
      { zh: 'A 頂板 100 × 40；B 頂板 40 × 60，確認牆身沒有變形。', en: 'A roof: 100 × 40; B roof: 40 × 60. Check the walls remain square.' },
      { zh: 'B 後牆貼 A 前牆，左邊對齊；確認後才黏合。', en: 'Place B’s back wall against A’s front wall, align the left edges, then glue.' },
    ],
    check: { zh: '從上方看，兩盒只在邊緣相接，沒有互相重疊。', en: 'From above, the boxes meet at one edge without overlapping.' },
  },
  {
    title: { zh: '完成與檢查', en: 'Finish and check' },
    lead: { zh: '旋轉 3D 模型，對照完成後的 L 形外觀。', en: 'Rotate the 3D model and compare it with the finished L-shaped form.' },
    actions: [
      { zh: '點算 A 六塊、B 六塊，共 12 塊；頂板、底板和四牆各自齊全。', en: 'Count six panels for A and six for B: 12 total, with base, roof and four walls in each.' },
      { zh: '檢查窗門刻線、四角直角，以及左翼和後座的接合位。', en: 'Check engraved windows/doors, square corners and the joint between wing and rear block.' },
    ],
    check: { zh: '前方右側保持開放，外形為 100 × 100 × 40 mm。', en: 'Keep the front-right area open. Overall form: 100 × 100 × 40 mm.' },
  },
];
