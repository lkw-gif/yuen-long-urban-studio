export type ToolSpot =
  | 'workplane'
  | 'view'
  | 'home'
  | 'zoom'
  | 'box'
  | 'undo'
  | 'ruler'
  | 'settings'
  | 'duplicate'
  | 'align'
  | 'group'
  | 'hole'
  | 'rotate'
  | 'color'
  | 'export';
export type TowerStep = {
  chapter: number;
  title: string;
  tool: ToolSpot;
  stage: number;
  where: string;
  action: string;
  expect: string;
  help: string;
  values?: { label: string; value: string }[];
  diagram?:
    | 'dimensions'
    | 'position'
    | 'selection'
    | 'rotation'
    | 'hole'
    | 'export';
};
export const TOWER_CHAPTERS = [
  '認識介面',
  '比例與底座',
  '中央塔身',
  '住宅側翼',
  '天台與藍色',
  '第一面窗戶',
  '其餘立面',
  '完成與匯出',
];
export const TOWER_STEPS: TowerStep[] = [
  {
    chapter: 0,
    title: '開啟空白工作平面',
    tool: 'workplane',
    stage: 0,
    where: 'Tinkercad 首頁的 3D Designs（3D 設計）。',
    action:
      '依老師提供的班級連結或登入方法進入。找 Create／建立，再選 3D Design／3D 設計，開啟空白編輯器。',
    expect: '中央有藍色格仔板，右邊有 Basic Shapes（基本形狀）。',
    help: '本頁是教學示範，不會代你操作 Tinkercad。把兩個網站並排；若未能登入，請老師協助。班級頁的入口名稱可能不同，以 3D Design 為準。',
  },
  {
    chapter: 0,
    title: '先學會改變觀看方向',
    tool: 'view',
    stage: 0,
    where: '左上角寫着 TOP／FRONT 的 ViewCube（視角方塊）。',
    action:
      '點 TOP 看俯視圖，再點 FRONT 看正面，最後按左邊小屋 Home 回到斜角。',
    expect: '觀看角度改變，物件位置不會改變。',
    help: 'TOP 是由上向下看；FRONT 是從正面看。改視角不會旋轉物件本身。',
  },
  {
    chapter: 0,
    title: '練習放大與縮小',
    tool: 'zoom',
    stage: 0,
    where: '左邊直排工具列的 ＋ 和 −。',
    action: '點 ＋ 放大一次，再點 − 縮小一次。也可用滑鼠滾輪。',
    expect: '畫面遠近改變，模型實際尺寸不變。',
    help: '找不到模型時，先按 Home。不要拖物件角落的白點來放大畫面：白點會改變物件尺寸。',
  },
  {
    chapter: 0,
    title: '拖入第一個實心方塊',
    tool: 'box',
    stage: 1,
    where: '右邊 Basic Shapes 的紅色 Box。你的截圖中是第二排最左邊。',
    action: '按住紅色 Box，拖到格仔板中央，再放開滑鼠。',
    expect: '出現一個實心紅色方塊，通常是 20 × 20 × 20 mm。',
    help: '上面灰色斜紋的 Box 是 Hole（孔洞）。拖錯了，先按左上 Undo（向左彎箭頭），再拖紅色 Box。',
  },
  {
    chapter: 0,
    title: '認識選取和尺寸控制點',
    tool: 'workplane',
    stage: 1,
    where: '剛放入的方塊上，以及它周圍的白色小方點。',
    action:
      '點空白處取消選取，再點方塊一次。留意白色尺寸控制點、彎曲旋轉箭頭，以及上方黑色升降控制柄。',
    expect: '選中方塊後才會出現控制點和 Shape 設定。',
    help: '點白點是改尺寸；拖彎箭頭是旋轉；黑色升降控制柄是升起整件物件。按 Delete 會刪除選中的物件，誤刪可按 Undo。',
    diagram: 'dimensions',
  },
  {
    chapter: 1,
    title: '使用毫米，理解模型比例',
    tool: 'settings',
    stage: 1,
    where: '格仔板右下的 Settings（設定）；部分版本叫 Edit Grid。',
    action:
      '開啟 Settings，Units 選 Metric，Scale 保留 1:1 (millimeters)，Width 和 Length 設 200，再關閉設定。這裡的 Scale 是單位顯示，並非社區模型的 1:700 比例。',
    expect: '接下來全部輸入 mm。本例總高 114.3 mm，約等於 1:700 的 80 m 建築。',
    help: '厘米換毫米要乘 10。這是參考圖片設計的示範大樓，不是真實大廈的測量模型。',
    values: [
      {
        label: '比例',
        value: '約 1:700',
      },
      {
        label: '總高目標',
        value: '114.3 mm',
      },
      {
        label: '換算',
        value: '80,000 ÷ 700',
      },
    ],
  },
  {
    chapter: 1,
    title: '把方塊變成薄底座',
    tool: 'workplane',
    stage: 2,
    where: '選取 Box，點底部白色角點，讓長闊數字出現；頂部白點用來設定高度。',
    action:
      '點尺寸數字，輸入後按 Enter：左右寬 W=48、前後深 D=48、物件高度 H=2。不要拖拉估尺寸。',
    expect: '原本的方塊變成 48 × 48 × 2 mm 的薄板。',
    help: '也可像實作截圖，在 Box 面板輸入 Width（W）、Length（D）、Height（H）。高度 H 是物件本身多高；之後的 Z 是底部離格仔板多高，兩者不同。',
    values: [
      {
        label: '寬 W',
        value: '48 mm',
      },
      {
        label: '深 D',
        value: '48 mm',
      },
      {
        label: '高 H',
        value: '2 mm',
      },
    ],
    diagram: 'dimensions',
  },
  {
    chapter: 1,
    title: '放置尺規，固定座標原點',
    tool: 'ruler',
    stage: 2,
    where: '右上方 L 形的 Ruler（尺規），在 Workplane 工具旁邊。',
    action:
      '拖 Ruler 到底座左前方的空白格仔板，放開後全課不再移動它。按 TOP 看俯視，再點底座查看尺寸及到尺規的距離。',
    expect: '選取物件時，會出現尺寸數字和位置距離數字。',
    help: '保持尺規預設的端點量測。下方 X／Y／Z 是本課記號，不一定是畫面上的欄名；靠物件的是尺寸，連到尺規的是位置距離。',
    diagram: 'position',
  },
  {
    chapter: 1,
    title: '讓底座對準原點',
    tool: 'ruler',
    stage: 2,
    where: 'Ruler 顯示的兩個水平位置距離，以及底部的離地高度。',
    action: '選取底座，將左邊到原點的 X、前邊到原點的 Y、底部離地 Z 全設為 0。',
    expect: '底座左前角貼齊尺規原點，平放在格仔板上。',
    help: 'X=Y=0 後，尺規原點應在底座左前角，底座只向右、向後延伸。若原點落在底座中央，先切回端點量測，再設定 0。若物件變薄，你改到了尺寸；按 Undo，再改連接尺規的距離數字。',
    values: [
      {
        label: '位置 X',
        value: '0 mm',
      },
      {
        label: '位置 Y',
        value: '0 mm',
      },
      {
        label: '底部 Z',
        value: '0 mm',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 2,
    title: '建立中央塔身',
    tool: 'box',
    stage: 3,
    where: '右邊紅色 Box，再用剛學會的白點／尺規數字。',
    action:
      '拖入另一個 Box；尺寸設 W=20、D=20、H=108；位置先設 X=8、Y=10、Z=0。',
    expect: '薄板內出現一根高柱，暫時未置中。',
    help: '先點空白處，再單擊新方塊，確保沒有選到底座。每輸入一個數字就按 Enter。',
    values: [
      {
        label: 'W × D × H',
        value: '20 × 20 × 108 mm',
      },
      {
        label: 'X / Y / Z',
        value: '8 / 10 / 0 mm',
      },
    ],
    diagram: 'dimensions',
  },
  {
    chapter: 2,
    title: '把塔身對齊底座中央',
    tool: 'align',
    stage: 4,
    where: '頂部 Align（對齊）工具；需先選取兩件物件。',
    action:
      '點空白處；按住 Shift，依次點底座和塔身。按 Align，先點左右方向的中央黑點，再點前後方向的中央黑點。',
    expect: '塔身在底座正中央；位置 X=14、Y=14，底部暫時仍是 Z=0。',
    help: '只點兩個水平方向的中點，不點垂直方向。按鈕灰色代表未選到兩件物件；可按 TOP，點底座露出的邊再 Shift 點塔身。',
    values: [
      {
        label: '對齊後 X / Y',
        value: '14 / 14 mm',
      },
      {
        label: '底部 Z',
        value: '先保留 0 mm',
      },
    ],
    diagram: 'selection',
  },
  {
    chapter: 2,
    title: '把塔身放到底座上',
    tool: 'ruler',
    stage: 5,
    where: '取消多選，只選塔身，找尺規的底部離地數字。',
    action: '點空白處，再點塔身；把底部 Z 改為 2。物件高度 H 保持 108。',
    expect: '塔身底部貼在厚 2 mm 的底座上，頂部到達 110 mm。',
    help: '若塔身變成矮板，你把 H 改為 2 了。按 Undo，再改底部的離地距離。',
    values: [
      {
        label: '高 H',
        value: '108 mm',
      },
      {
        label: '底部 Z',
        value: '2 mm',
      },
      {
        label: '頂部',
        value: '110 mm',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 3,
    title: '加入左側住宅翼',
    tool: 'box',
    stage: 6,
    where: '右邊 Box 和 Ruler 的尺寸、位置數字。',
    action: '拖入 Box，尺寸設 W=12、D=16、H=104；位置設 X=4、Y=16、Z=2。',
    expect: '塔身左邊出現一塊略矮的住宅翼，與中央塔身重疊 2 mm。',
    help: '側翼應碰到塔身。若在空中或離開底座，先核對 Z=2，並確認尺規原點沒有移動。',
    values: [
      {
        label: 'W × D × H',
        value: '12 × 16 × 104 mm',
      },
      {
        label: 'X / Y / Z',
        value: '4 / 16 / 2 mm',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 3,
    title: '複製到右側',
    tool: 'duplicate',
    stage: 7,
    where:
      '左上方 Duplicate and repeat（複製與重複）圖示，或 Ctrl+D；Mac 用 ⌘D。',
    action:
      '只選左翼，按 Duplicate 一次。新副本仍被選中，將它的位置 X 改為 32，Y=16、Z=2 不變。',
    expect: '左右各一塊相同的住宅翼。',
    help: '窄視窗可能把按鈕收進頂部「⋯」選單；可放大瀏覽器視窗，或用 Ctrl+D／⌘D。剛複製時兩件重疊，直接改副本 X；若原件被搬走，Undo 後重新複製。',
    values: [
      {
        label: '副本 X / Y / Z',
        value: '32 / 16 / 2 mm',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 3,
    title: '旋轉副本，加入前翼',
    tool: 'rotate',
    stage: 8,
    where: '選中右翼後的 Duplicate，以及靠近物件底部、繞垂直軸的彎箭頭。',
    action:
      '點空白取消選取，再選右翼，複製一次。按住 Shift 拖底部旋轉箭頭，以 45° 一格轉至 90°；再用尺規設 X=16、Y=4、Z=2。',
    expect: '俯視時，新翼的 W=16、D=12，向大樓前方伸出。',
    help: '要在格仔板上轉方向，不是把高柱放倒。轉錯軸就 Undo。旋轉後才輸入位置；本課 3D 圖顯示完成旋轉及移位後的結果。',
    values: [
      {
        label: '繞垂直軸',
        value: '90°',
      },
      {
        label: '旋轉後 W × D',
        value: '16 × 12 mm',
      },
      {
        label: 'X / Y / Z',
        value: '16 / 4 / 2 mm',
      },
    ],
    diagram: 'rotation',
  },
  {
    chapter: 3,
    title: '複製出後翼',
    tool: 'duplicate',
    stage: 9,
    where: '選取剛完成的前翼，再按 Duplicate。',
    action:
      '先點空白取消選取，再重新選前翼，以中斷上次的重複變換。複製一次，把副本 Y 改為 32，X=16、Z=2 保持不變。',
    expect: '按 TOP：四翼形成十字形，四邊都留在 48 mm 的底座內。',
    help: '底座外伸出物件通常是 X／Y 輸入錯誤。逐件點選核對，不要把整座樓一起移動。',
    values: [
      {
        label: '後翼 X / Y / Z',
        value: '16 / 32 / 2 mm',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 4,
    title: '加上天台機房',
    tool: 'box',
    stage: 10,
    where: '右邊 Box；選取後用尺規輸入尺寸和位置。',
    action: '新增 Box，尺寸 W=10、D=10、H=4.3；位置 X=19、Y=19、Z=110。',
    expect: '中央塔頂有一個小機房，模型總高達到 114.3 mm。',
    help: '機房的 H=4.3；Z=110 才是它放置的高度。若看不到，按 Home，再放大塔頂。',
    values: [
      {
        label: 'W × D × H',
        value: '10 × 10 × 4.3 mm',
      },
      {
        label: 'X / Y / Z',
        value: '19 / 19 / 110 mm',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 4,
    title: '把基本大樓合成一件',
    tool: 'group',
    stage: 10,
    where: '頂部群組工具區；滑鼠停留，找 Group／Union group（聯集群組）。',
    action:
      '在空白處拖框圈住整座模型，或按 Ctrl+A（Mac：⌘A）。按 Union group；快捷鍵 Ctrl+G／⌘G。',
    expect: '底座、塔身、四翼和機房成為一件模型；單擊即可整座選中。',
    help: '按鈕灰色時要先選多件實體。較新版有 Bundle／Union 等工具，本課用 Union（聯集），不是 Bundle。分組工具外觀不同時，用滑鼠停留查看名稱。',
    diagram: 'selection',
  },
  {
    chapter: 4,
    title: '把大樓變成藍色',
    tool: 'color',
    stage: 11,
    where: '選中模型後，右邊 Shape 面板的 Solid（實體）色圓。',
    action: '點 Solid 的色圓打開色板，選深藍色，再點空白處關閉色板。',
    expect: '整座住宅大樓變成藍色。',
    help: '空白編輯器截圖沒有色板；必須先選物件。若看到斜紋半透明，表示選了 Hole；切回 Solid 再選藍色。',
    diagram: 'hole',
  },
  {
    chapter: 4,
    title: '基本版完成，準備加窗戶',
    tool: 'home',
    stage: 11,
    where: '左邊 Home 小屋和 ViewCube。',
    action:
      '用 Home、TOP、FRONT 看一次。確認有四個側翼、中央塔身、機房和薄底座。',
    expect: '你已完成基本版。下一階段會做淺凹窗戶，增加住宅大樓的細節。',
    help: '先檢查本階段的模型。課堂時間不足可直接跳至「完成與匯出」的匯出步驟，先保存基本版。',
    values: [
      {
        label: '底座',
        value: '48 × 48 × 2 mm',
      },
      {
        label: '總高',
        value: '114.3 mm',
      },
    ],
  },
  {
    chapter: 5,
    title: '做第一個窗戶孔洞',
    tool: 'hole',
    stage: 12,
    where:
      '右邊 Basic Shapes 的灰色斜紋 Box；也可把實心 Box 的 Shape 改為 Hole。',
    action:
      '拖入 Hole Box。尺寸設 W=3.2、D=1.1、H=2；位置設 X=17.4、Y=3.8、Z=3.5。',
    expect: '前翼左下有一個半透明孔洞方塊，部分伸入牆內，尚未真正挖空。',
    help: '本頁用橙色顯示待切孔洞，方便看清；Tinkercad 通常顯示灰色斜紋。此時不要連同大樓群組，先複製好所有孔洞。',
    values: [
      {
        label: 'W × D × H',
        value: '3.2 × 1.1 × 2 mm',
      },
      {
        label: 'X / Y / Z',
        value: '17.4 / 3.8 / 3.5 mm',
      },
      {
        label: '凹入牆面',
        value: '0.9 mm',
      },
    ],
    diagram: 'hole',
  },
  {
    chapter: 5,
    title: '複製第二個窗戶',
    tool: 'duplicate',
    stage: 13,
    where: '只選剛建立的 Hole Box，按 Duplicate。',
    action:
      '複製一次，把新副本 X 改為 22.4。Y=3.8、Z=3.5 不變。完成後保持新副本被選中。',
    expect: '同一高度有兩個窗戶，左右位置相差 5 mm。',
    help: '移動的是副本，不是第一個孔洞。若連大樓一起移動，Undo，再只選孔洞。',
    values: [
      {
        label: '第二個 X',
        value: '22.4 mm',
      },
      {
        label: '水平間隔',
        value: '5 mm',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 5,
    title: '重複變換，完成一排三窗',
    tool: 'duplicate',
    stage: 14,
    where: '左上 Duplicate and repeat，或 Ctrl+D／⌘D。',
    action: '不點其他地方，再按 Duplicate 一次。它會重複剛才向右 5 mm 的移動。',
    expect: '第三個孔洞 X=27.4；一排共有 3 個孔洞。',
    help: '若副本仍重疊，先把它 X 改為 27.4。重複變換要保留上一個副本選取狀態；選別的物件會中斷記憶。',
    values: [
      {
        label: '三個 X',
        value: '17.4 / 22.4 / 27.4 mm',
      },
    ],
  },
  {
    chapter: 5,
    title: '只選取這一排孔洞',
    tool: 'workplane',
    stage: 14,
    where:
      '選中藍色大樓後，Shape 面板右邊劃線燈泡 Hide selected（隱藏所選物件）。',
    action:
      '點空白處，再只選藍色大樓。按 Hide selected（Windows：Ctrl+H），暫時隱藏大樓；點空白處後按 Ctrl+A／⌘A，選取畫面剩下的三個孔洞。',
    expect: '只有三個孔洞被選取，大樓本體沒有選取框。',
    help: '必須先隱藏大樓才全選；右邊應顯示 Shapes(3)。隱藏不會刪除模型，頂部主工具列的燈泡 Show all 可讓大樓重新出現。',
    diagram: 'selection',
  },
  {
    chapter: 5,
    title: '把一排孔洞合成一組',
    tool: 'group',
    stage: 14,
    where: '選好三個孔洞後，頂部 Group／Union group。',
    action: '按 Union group（Ctrl+G／⌘G）。檢查 Shape 面板仍顯示 Hole。',
    expect: '一整排三個窗戶可一起選中，仍然是孔洞。',
    help: '如果大樓被挖了三個洞，代表你也選了大樓。立刻 Undo，回到上一步只選三個孔洞。',
    values: [
      {
        label: '本排外框 W × D × H',
        value: '13.2 × 1.1 × 2 mm',
      },
    ],
    diagram: 'hole',
  },
  {
    chapter: 5,
    title: '複製第二層窗戶',
    tool: 'duplicate',
    stage: 15,
    where: '選取整排孔洞後，Duplicate 和尺規的底部離地 Z。',
    action:
      '複製一排，將副本 Z 從 3.5 改為 7.5。X=17.4、Y=3.8 不變。保持副本選中。',
    expect: '有兩排、共 6 個孔洞，每排向上相隔 4 mm。',
    help: '要改底部離地 Z，不是孔洞本身高度 H；H 保持 2。若整排變高，Undo 再改離地欄。',
    values: [
      {
        label: '第二排 Z',
        value: '7.5 mm',
      },
      {
        label: '每排升高',
        value: '4 mm',
      },
      {
        label: '孔洞高 H',
        value: '2 mm',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 5,
    title: '重複成二十六排窗戶',
    tool: 'duplicate',
    stage: 16,
    where: '保持第二排被選中，使用 Duplicate and repeat。',
    action:
      '先再按 Duplicate 一次，確認第三排 Z=11.5。位置正確才再按 23 次，完成後檢查最上排底部 Z=103.5。',
    expect:
      '26 排 × 每排 3 個，共 78 個孔洞；最高窗頂是 105.5 mm，仍在側翼內。',
    help: '若多一排，立刻 Undo 一次。若第三排仍重疊，先改 Z=11.5；往後每複製一排就把 Z 加 4（15.5、19.5…103.5），直到共 26 排。不要在未核對前連按很多次。',
    values: [
      {
        label: '總排數',
        value: '26 排',
      },
      {
        label: '再按複製',
        value: '24 次',
      },
      {
        label: '最高排 Z',
        value: '103.5 mm',
      },
    ],
  },
  {
    chapter: 5,
    title: '整理整面孔洞群組',
    tool: 'group',
    stage: 16,
    where: '大樓保持隱藏，畫面只顯示二十六排孔洞。',
    action:
      '確認大樓仍隱藏，點空白處，按 Ctrl+A／⌘A。右邊應顯示 Shapes(26)，再按 Union group，確認仍為 Hole。',
    expect: '整面 78 個孔洞變成一個可選取的孔洞群組，底部 Z=3.5。',
    help: '若顯示 27 件，可能沒有隱藏大樓；取消選取，先隱藏大樓再全選。下方數值可檢查有沒有漏掉最頂或最底一排。',
    values: [
      {
        label: '整面 W × D × H',
        value: '13.2 × 1.1 × 102 mm',
      },
      {
        label: 'X / Y / Z',
        value: '17.4 / 3.8 / 3.5 mm',
      },
    ],
    diagram: 'selection',
  },
  {
    chapter: 6,
    title: '複製孔洞到右側立面',
    tool: 'rotate',
    stage: 17,
    where: '選取前面整片孔洞群組；Duplicate 和底部旋轉箭頭。',
    action:
      '點空白取消選取，再選前面孔洞群組，複製一次。拖底部旋轉箭頭，在格仔板上轉 90°（−90° 亦可）；再設 X=43.1、Y=17.4、Z=3.5。按頂部燈泡 Show all，顯示大樓作對照。',
    expect: '右翼外側也有 26 排孔洞，前面的一片仍保留。',
    help: '旋轉會改變位置參照，所以先轉、後輸入位置。若窗戶橫躺，旋轉軸選錯了，按 Undo。',
    values: [
      {
        label: '旋轉',
        value: '繞垂直軸 90°',
      },
      {
        label: 'W × D × H',
        value: '1.1 × 13.2 × 102 mm',
      },
      {
        label: 'X / Y / Z',
        value: '43.1 / 17.4 / 3.5 mm',
      },
    ],
    diagram: 'rotation',
  },
  {
    chapter: 6,
    title: '複製孔洞到左側立面',
    tool: 'duplicate',
    stage: 18,
    where: '選取右側整片孔洞，按 Duplicate。',
    action:
      '先選藍色大樓，按 Shape 面板的 Hide selected 再次隱藏它。點空白取消選取，再選右側整片孔洞。複製後把 X 改為 3.8；Y=17.4、Z=3.5 不變，不用再旋轉。',
    expect: '左右兩面都有相同窗戶排列。',
    help: '左右側都是矩形孔洞，複製移位即可。用 TOP 檢查孔洞貼在左右翼最外側。',
    values: [
      {
        label: '左側 X / Y / Z',
        value: '3.8 / 17.4 / 3.5 mm',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 6,
    title: '複製孔洞到後方立面',
    tool: 'duplicate',
    stage: 19,
    where: '轉到能看見前面孔洞的角度，選取最初的前面整片孔洞。',
    action:
      '大樓保持隱藏，取消選取再選前面那片孔洞，複製一次；把 Y 改為 43.1，X=17.4、Z=3.5 不變。最後按頂部燈泡 Show all，重新顯示大樓。',
    expect: '四個方向各有 78 個孔洞，共 312 個。',
    help: '要複製前面那片，不是剛剛左側那片。檢查 W=13.2、D=1.1；若反過來，選錯立面了。',
    values: [
      {
        label: '後側 X / Y / Z',
        value: '17.4 / 43.1 / 3.5 mm',
      },
      {
        label: '全部孔洞',
        value: '312 個',
      },
    ],
    diagram: 'position',
  },
  {
    chapter: 7,
    title: '一次挖出四面窗戶',
    tool: 'group',
    stage: 20,
    where: '點空白處，使用全選，再按頂部 Union group。',
    action:
      '確認大樓已顯示，按 Ctrl+A／⌘A，選大樓和四片孔洞，右邊應顯示 Shapes(5)。按 Union group（Ctrl+G／⌘G），等待運算完成。',
    expect: '所有孔洞預覽消失，四個側翼真正出現一排排淺凹窗戶。',
    help: '如整座樓消失或變斜紋，先 Undo，檢查大樓是 Solid、四片窗戶是 Hole。很多孔洞合併可能需要稍等。',
    diagram: 'hole',
  },
  {
    chapter: 7,
    title: '檢查尺寸和連接',
    tool: 'ruler',
    stage: 20,
    where: '選取完成的大樓，看尺規尺寸，再用 ViewCube 查看各面。',
    action:
      '核對 W=48、D=48、H=114.3、底部 Z=0。旋轉確認四面窗戶、機房和底座都仍存在。',
    expect: '大樓保持一件，窗戶只向牆內凹入，沒有穿透整個翼。',
    help: '若外框尺寸變大，可能有未移好的副本留在外面。Undo 到群組前，逐片檢查位置再合併。基本版跳過窗戶也應是同一總尺寸。',
    values: [
      {
        label: 'W × D × H',
        value: '48 × 48 × 114.3 mm',
      },
      {
        label: '底部 Z',
        value: '0 mm',
      },
    ],
    diagram: 'dimensions',
  },
  {
    chapter: 7,
    title: '確認藍色完成效果',
    tool: 'color',
    stage: 21,
    where: '選中大樓後的 Shape → Solid 色圓。',
    action:
      '合併後若顏色改變，重新選深藍色；點空白處取消選取，再按 Home 看完成效果。',
    expect: '完成一座帶底座、四翼、機房及凹窗的藍色住宅大樓。',
    help: '本頁「看完成效果」可作外形對照；實際 Tinkercad 的光線與藍色色階可能不同。',
    diagram: 'hole',
  },
  {
    chapter: 7,
    title: '從 Tinkercad 匯出 STL',
    tool: 'export',
    stage: 21,
    where: '右上角 Export（匯出），就在 Import 旁邊。',
    action:
      '只選完成的大樓，按 Export。若有匯出範圍選項，選所選物件；再選 .STL，等待檔案下載。',
    expect: '電腦 Downloads／下載資料夾出現大樓的 .stl 檔。',
    help: '實作截圖中的範圍選項是 The selected shape；下方 For 3D Print 有 .STL 按鈕。下一步亦可下載這次實作在 Tinkercad 匯出的完成模型作對照。',
    diagram: 'export',
  },
  {
    chapter: 7,
    title: '交給老師檢查打印',
    tool: 'export',
    stage: 21,
    where: '電腦的下載資料夾，以及老師使用的 3D 打印切片軟件。',
    action:
      '將自己的 STL 交給老師，確認以 mm 匯入、底座朝下，核對總高 114.3 mm，再查看窗戶細節的切片預覽。',
    expect: '你的設計已完成，可由老師按打印機和材料設定安排打印。',
    help: 'STL 不保存藍色色彩；單色打印要使用藍色耗材。窗戶能否清晰打印，請以老師使用的噴嘴與切片預覽確認。',
    values: [
      {
        label: '交付檔案',
        value: '.STL',
      },
      {
        label: '匯入單位',
        value: 'mm',
      },
      {
        label: '模型總高',
        value: '114.3 mm',
      },
    ],
    diagram: 'export',
  },
];
export const TOOL_SPOTS: Record<
  ToolSpot,
  { label: string; rect: [number, number, number, number] }
> = {
  workplane: { label: 'Workplane 工作平面', rect: [420, 255, 720, 520] },
  view: { label: 'ViewCube 視角方塊', rect: [25, 90, 96, 108] },
  home: { label: 'Home 預設視角', rect: [4, 210, 65, 65] },
  zoom: { label: 'Zoom 放大／縮小', rect: [4, 348, 66, 137] },
  box: { label: 'Box 實心方塊', rect: [1586, 353, 109, 117] },
  undo: { label: 'Undo 復原', rect: [235, 10, 52, 45] },
  ruler: { label: 'Ruler 尺規', rect: [1707, 70, 77, 70] },
  settings: { label: 'Settings 格線設定', rect: [1436, 848, 126, 48] },
  duplicate: {
    label: 'Duplicate and repeat 複製與重複',
    rect: [119, 10, 49, 45],
  },
  align: { label: 'Align 對齊', rect: [1207, 8, 48, 48] },
  group: { label: '群組工具區：找 Union group', rect: [1025, 9, 173, 48] },
  hole: { label: 'Hole 孔洞方塊', rect: [1586, 229, 109, 117] },
  rotate: { label: '選取物件後的彎箭頭', rect: [600, 400, 430, 260] },
  color: { label: '選取物件後的 Shape 色彩面板', rect: [1300, 75, 260, 230] },
  export: { label: 'Export 匯出', rect: [1684, 9, 109, 48] },
};
export const TINKERCAD_SOURCES = {
  guide:
    'https://images.tinkercad.com/jl5ii4oqrdmc/9PJD2xyRS9dQ1vVwsF66E/2e0ad26d796fd860ad85be706bef4479/SBS_20Guide_20Level_20Up_20to_20Fusion_20360-1.pdf',
  shortcuts:
    'https://images.tinkercad.com/jl5ii4oqrdmc/6TNFVIF89KMN9CPLLH97U0/a847b794b1b579f1529d87863783df8d/Tinkercad_keyboard_shortcuts_2_up.pdf',
  tutorials: 'https://www.tinkercad.com/learn/designs',
};
