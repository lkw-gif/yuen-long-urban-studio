"""Student-first PDF revision; source screenshots are preserved, annotations are vectors."""
import math
import json
from pathlib import Path
from PIL import Image
import build_student_guide as b
from reportlab.lib import colors
from reportlab.platypus import Flowable, PageBreak, SimpleDocTemplate

W,H=b.CONTENT_W,b.CONTENT_H
SOURCE='https://assets.ctfassets.net/jl5ii4oqrdmc/24W19aTK6wTT0YydFO3xZd/4fe1ca09149f6ae4d57fb33fe7b9af92/Tinkercad_keyboard_shortcuts_1_up.pdf'
AUDIT=[]

def clean(s):
    for a,z in [('−','-'),('–','-'),('≈','約等於'),('⋯','...'),('来自','來自'),('移开','移開')]:s=s.replace(a,z)
    return s

def text(c,s,x,y,w,style='body'):
    return b.draw_para(c,clean(s),b.STYLE[style],x,y,w)

def card(c,title,body,x,y,w,fill=b.PALE):
    title=clean(title)
    body=clean(body)
    q=b.p(body,b.STYLE['body']); _,ph=q.wrap(w-28,999)
    height=ph+48
    b.draw_round_rect(c,x,y-height,w,height,fill,b.LINE)
    c.setFillColor(b.BLUE);c.setFont(b.FONT_BOLD,13)
    c.drawString(x+14,y-21,title)
    text(c,body,x+14,y-31,w-28)
    return y-height-10

def picture(c,path,x,y,w,maxh,crop=None,boxes=()):
    # Native screenshot pixels are clipped, not repainted or fabricated.
    sw,sh=Image.open(path).size
    l,t,r,bt=crop or (0,0,sw,sh)
    scale=min(w/(r-l),maxh/(bt-t));iw=(r-l)*scale;ih=(bt-t)*scale
    px=x+(w-iw)/2;py=y-ih
    c.saveState();p=c.beginPath();p.rect(px,py,iw,ih);c.clipPath(p,stroke=0)
    c.drawImage(str(path),px-l*scale,py-(sh-bt)*scale,sw*scale,sh*scale,mask='auto')
    c.restoreState()
    c.setStrokeColor(b.ORANGE);c.setLineWidth(1.3)
    for xx,yy,ww,hh in boxes:
        c.rect(px+(xx-l)*scale,y-(yy-t+hh)*scale,ww*scale,hh*scale,stroke=1,fill=0)
    return y-ih-12

def arrow(c,x1,y1,x2,y2,col=b.ORANGE):
    c.setStrokeColor(col);c.setLineWidth(1.4);c.line(x1,y1,x2,y2)
    a=math.atan2(y2-y1,x2-x1)
    for da in [-.5,.5]:c.line(x2,y2,x2-6*math.cos(a+da),y2-6*math.sin(a+da))

class Page(Flowable):
    def __init__(self,title,sub,draw):
        super().__init__();self.width=W;self.height=H;self.title=title;self.sub=sub;self.body=draw
    def wrap(self,a,h):return W,H
    def draw(self):
        c=self.canv
        name='page'+str(c.getPageNumber())
        c.bookmarkPage(name);c.addOutlineEntry(self.title,name,level=0,closed=False)
        c.setFillColor(b.BLUE);c.roundRect(0,H-25,6,28,3,fill=1,stroke=0)
        y=text(c,self.title,17,H,W-17,'section')-5
        y=text(c,self.sub,17,y,W-17,'subtitle')-18
        bottom=self.body(c,y)
        AUDIT.append((self.title,round(bottom,1)))
        if bottom<0:raise ValueError(f'Page overflow: {self.title} {bottom}')

def cards_page(title,sub,items):
    def draw(c,y):
        for head,body in items:y=card(c,head,body,0,y,W)
        return y
    return Page(title,sub,draw)

def photo_page(title,sub,shot,items,crop=None,boxes=(),maxh=285):
    def draw(c,y):
        path=b.EDITOR if shot=='editor' else b.ASSET_DIR/f'step-{shot:02d}.jpg'
        y=picture(c,path,0,y,W,maxh,crop,boxes)
        for head,body in items:y=card(c,head,body,0,y,W)
        return y
    return Page(title,sub,draw)

def mouse(c,y):
    # All labels sit outside the mouse; arrowheads point at physical controls.
    top=y;mx=190;my=y-185;mw=118;mh=163
    b.draw_round_rect(c,mx,my,mw,mh,b.PALE_BLUE,b.BLUE,35)
    c.setStrokeColor(b.BLUE);c.line(mx+59,my+110,mx+59,my+160)
    c.line(mx+8,my+110,mx+110,my+110)
    b.draw_round_rect(c,mx+53,my+123,12,26,b.BLUE,b.BLUE,5)
    c.setFillColor(b.INK);c.setFont(b.FONT_BOLD,16)
    c.drawString(70,top-45,'左鍵');arrow(c,119,top-49,mx+28,my+139)
    c.drawString(355,top-45,'右鍵');arrow(c,349,top-49,mx+89,my+139)
    c.drawCentredString(mx+59,top+2,'滾輪')
    arrow(c,mx+59,top-5,mx+59,my+150)
    y=top-205
    for head,body in [
        ('左鍵：選取、放置、移動','點一下物件 = 選取。按住左鍵 → 移動滑鼠 → 放開 = 拖曳。點空白處取消選取。'),
        ('滾輪：放大／縮小畫面','向前滾動放大，向後滾動縮小。只改觀看遠近，模型尺寸不變。'),
        ('右鍵：轉換觀看角度','游標放在工作區，按住右鍵並拖曳；可以看到大樓不同側面。'),
        ('Shift + 右鍵：平移畫面','先按住鍵盤 Shift，再按住滑鼠右鍵拖曳。完成後放開兩者。')]:
        y=card(c,head,body,0,y,W)
    return y

# Tight borders on the actual key edges; never put number badges on key lettering.
KEYS={
 'Ctrl':(41,179,39,31),'Shift':(3,142,78,31),'Delete':(495,6,41,23),
 'Backspace':(467,35,69,30),'Enter':(459,105,77,31),
 'Z':(86,142,30,32),'A':(69,106,30,30),'D':(141,106,30,30),
 'G':(213,106,30,30),'H':(249,106,30,30)}

def keyboard_page(title,names,items):
    def draw(c,y):
        y=picture(c,b.KEYBOARD,0,y,W,235,boxes=[KEYS[k] for k in names])
        # Enlarged real-key snippets, with the name BELOW the photograph.
        cell=W/len(names)
        for i,k in enumerate(names):
            x0,y0,kw,kh=KEYS[k]
            picture(c,b.KEYBOARD,i*cell,y,cell-7,40,(x0,y0,x0+kw,y0+kh))
            c.setFillColor(b.BLUE);c.setFont(b.FONT_LATIN_BOLD,11)
            c.drawCentredString((i+.5)*cell-3,y-55,k)
        y-=75
        for head,body in items:y=card(c,head,body,0,y,W)
        return y
    return Page(title,'橙色細框只圈按鍵邊緣；下面是相同按鍵的放大圖。',draw)

def updated_steps():
    steps=json.loads(b.DATA.read_text(encoding='utf-8'))
    edits={
      1:{'help':'把 PDF 和 Tinkercad 並排。依老師的班級登入方法進入；沒有帳戶時先請老師協助。'},
      3:{'help':'看不到模型時，按左側「Fit all in view」四角框圖示；Home 小屋用來回到預設視角。白色控制點會改模型尺寸，不是畫面縮放。'},
      8:{'title':'用尺規查看物件尺寸','action':'拖右上方 L 形 Ruler 到工作平面空白處，再點底座查看長、闊、高。這課只讀尺寸，不需輸入位置座標。','help':'尺規同時顯示尺寸和距離；本課只用長、闊、高。讀不清時可用 Box 面板輸入尺寸。','expect':'能找到底座的 48、48、2 mm 三個尺寸。'},
      10:{'action':'先點右上 Workplane 格網工具，再點底座頂面。拖入新 Box，設定 W=20、D=20、H=108。選着新塔身，按 D 鍵讓底部貼住底座頂面。','help':'先完成尺寸輸入並按 Enter，再按 D。D 單鍵是落到工作平面；Ctrl+D 才是複製。','expect':'高柱站在底座上；暫時未置中。'},
      11:{'action':'先把 Workplane 點回旁邊空白格仔板。按住 Shift，左鍵依次點底座和塔身。按 Align，點左右與前後兩個方向的中央黑點。','expect':'從 TOP 看，塔身兩邊留空相同；底部仍貼住底座頂面。'},
      13:{'action':'把 Workplane 放到底座頂面；拖入 Box，設定 W=12、D=16、H=104。按 D 貼住底座；從 TOP 把側翼移到塔身左側，稍微伸入塔身。','expect':'左翼與塔身相連，沒有縫隙；底部貼住底座。','help':'側翼沿前後方向置中，可用 Align。重疊約 2 mm 即可；模型所有部分都要連在一起。'},
      15:{'action':'先取消選取，再選右翼、Ctrl+D 複製。拖底部彎箭頭轉 90°；也可點角度數字輸入 90。從 TOP 把副本移到塔身前方，與塔身稍微重疊。','help':'轉完還要移到前面。底部彎箭頭是在平面上轉方向；選錯軸令高柱倒下時，按 Ctrl+Z。'},
      16:{'action':'先取消選取，再選前翼、Ctrl+D 複製。把副本移到塔身後方，與塔身稍微重疊。四翼完成後，把 Workplane 點回空白格仔板。'},
      17:{'action':'把 Workplane 放到中央塔頂；新增 Box，設定 10 × 10 × 4.3 mm。按 D 貼住塔頂，移到塔頂中央。最後把 Workplane 點回空白格仔板。','expect':'機房貼住塔頂；連底座總高是 2 + 108 + 4.3 = 114.3 mm。'},
      20:{'help':'基本版完成！時間不足，可跳到本指南步驟 33 匯出 STL，稍後再加窗戶。'},
      21:{'action':'拖入 Hole Box，設定 W=3.2、D=1.1、H=2，移到前翼左下方。拖黑色升降控制柄，令底邊離底座頂面約 1.5 mm；由側面看，讓孔洞約 0.9 mm 伸入牆內。','help':'Tinkercad 的 Hole 是灰色斜紋。先用 FRONT 和側視圖檢查：它要與牆重疊，才可挖洞；暫時不要群組。'},
      22:{'action':'把右下 Snap Grid 設成 1.0 mm。只選第一個孔洞、Ctrl+D 複製；從 FRONT 看，按對應向右的方向鍵 5 次，令副本向右移 5 mm。保持副本選中。','expect':'兩個窗戶等高；同一側邊相距 5 mm，窗戶之間淨空 1.8 mm。','help':'先試按一次方向鍵，確認是向右；方向不對就 Undo。5 mm 是複製移動量，不是兩窗之間的空隙。','values':[{'label':'向右移動量','value':'5 mm'}]},
      26:{'action':'Snap Grid 保持 1.0 mm。只選整排孔洞，Ctrl+D 複製；按住 Ctrl，再按向上方向鍵 4 次。放開按鍵，保持副本选中。','expect':'兩排共 6 個孔洞。每排移高 4 mm，兩排之間淨空 2 mm。','help':'Ctrl + 向上方向鍵是升起物件；不要拉高白色尺寸控制點。每個窗戶本身仍高 2 mm。'},
      27:{'expect':'26 排 × 每排 3 個 = 78 個孔洞。最上一排仍在側翼牆內，沒有超出天台。','help':'最高一排超出牆面時，先檢查首排是否太高、每次是否移高 4 mm。不要把孔洞本身拉長。'},
      29:{'action':'取消選取，再選前面整片孔洞，Ctrl+D 複製。用底部彎箭頭轉 90°。按頂部 Show all 燈泡顯示大樓；把副本移到右翼外牆，調至與牆稍微重疊。','help':'單是旋轉不會把窗戶送到另一側；必須再移動。用 TOP 核對貼牆方向，再用側視圖核對高度。'},
      30:{'action':'選大樓並按 Ctrl+H 隱藏它。取消選取，再選右側整片孔洞、Ctrl+D 複製。移到左側後按 Show all 顯示大樓，核對孔洞與左翼外牆重疊。','help':'只移動孔洞副本，不必旋轉；保持兩側窗戶高度一致。下一步需要時再隱藏大樓。'},
      31:{'action':'先隱藏大樓；取消選取，再選最初前方那片孔洞、Ctrl+D 複製。移到後方，按 Show all 顯示大樓；用 TOP 和後視圖確認孔洞與後翼牆面重疊。'},
      34:{'help':'對照實作截圖的外形。Tinkercad 畫面的光線和藍色色階可能與列印成品不同。'},
      35:{'help':'範圍選 The selected shape（所選物件），在 For 3D Print 下面按 .STL。下載後把檔名改為「班別_姓名_住宅大樓.stl」。'},
    }
    for s in steps:
        s.update(edits.get(s['shot'],{}))
        for k in ['where','action','expect','help']:
            s[k]=s[k].replace('选中','選中').replace('⌘','Command+')
        s['help']=s['help'].replace('旋轉後查看 3D 圖','旋轉後對照本頁截圖')
    return steps

def model_page(i,s):
    def draw(c,y):
        y=picture(c,b.ASSET_DIR/f"step-{s['shot']:02d}.jpg",0,y,W,250)
        y=text(c,'Tinkercad 實作截圖｜觀察這一步的工具和模型外形。',0,y,W,'step_note')-10
        if s['values']:
            vals='；'.join(f"{v['label']}：{v['value']}" for v in s['values'])
            y=text(c,vals,0,y,W,'label')-9
        for head,body in [('找這裡',s['where']),('跟着做',s['action']),('完成檢查',s['expect'])]:
            y=card(c,head,body,0,y,W)
        y=text(c,'遇到困難：'+s['help'],3,y,W-6,'step_note')
        return y
    return Page(f"{i:02d}  {s['title']}",f"建模步驟 {i} / 34　｜　{b.TOOLS.get(s['tool'],s['tool'])}",draw)

def build():
    def cover(c,y):
        y=picture(c,b.ASSET_DIR/'step-34.jpg',0,y,W,270)
        for head,body in [('01｜先練基本操作','滑鼠、實物鍵盤、選取、尺寸和工具位置。'),('02｜跟着截圖製作','34 個建模步驟，每頁都有動作與完成檢查。'),('03｜匯出交給老師','檢查連接和尺寸，下載 STL，準備 3D 打印。')]:
            y=card(c,head,body,0,y,W)
        return y
    pages=[Page('藍色住宅大樓｜學生指南','中二 STEAM　•　Tinkercad 3D 建模',cover)]
    pages.append(cards_page('怎樣使用這份指南','先練基本操作，再建模。每頁做完才翻下一頁。',[
      ('第一站｜第 3–12 頁：基本操作','先在練習設計中試滑鼠、鍵盤、尺寸與群組。看圖找按鈕 → 做動作 → 對照完成檢查。'),
      ('第二站｜第 14–31 頁：大樓基本版','跟着 01–18 步完成底座、塔身、四翼、天台和藍色外觀。全部尺寸用毫米 mm。'),
      ('第三站｜第 32–47 頁：窗戶與匯出','第 19–30 步加窗戶；第 31–34 步檢查、匯出 STL，交給老師。時間不足可先做基本版。'),
      ('記住三件事','每次輸入數字後按 Enter。做錯先按 Ctrl+Z。找不到模型時，按左邊四角框 Fit all in view。'),
      ('截圖怎樣看','截圖来自之前的 Tinkercad 實作。介面版本可能略有不同，可把游標停在圖示上，看英文名稱；本課不教位置座標。')]))

    pages.append(photo_page('認識 Tinkercad 編輯器','橙色細框標出工具區，文字和圖示保持清楚。','editor',[
      ('左邊｜觀看工具','ViewCube 視角方塊、Home 小屋、四角框、＋／−。只用來看模型。'),
      ('上方｜主工具列','Undo 復原、Duplicate 複製、Align 對齊、Group 群組。先選物件，相關按鈕才可用。'),
      ('中央及右邊｜工作區和形狀','中央藍色格仔板是 Workplane；右邊 Basic Shapes 有實心紅色 Box 和斜紋 Hole。')],maxh=260,boxes=[(2,2,1907,62),(3,85,115,470),(1578,158,328,734)]))
    pages.append(Page('滑鼠：先認清三個位置','箭咀尖端指向要按的位置；以一般左右鍵設定示範。',mouse))
    pages.append(photo_page('看模型：轉角度、找回模型','先練觀看工具；不用拖模型。',7,[
      ('1｜點 TOP，再點 FRONT','ViewCube 上 TOP 是俯視，FRONT 是正面。點小屋 Home 回到預設斜角。'),
      ('2｜點四角框，再點 ＋／−','小屋下面的四角框是 Fit all in view：讓模型放入畫面。＋／− 改觀看遠近。'),
      ('3｜試右鍵及 Shift + 右鍵','右鍵按住拖曳轉觀看角度；Shift + 右鍵拖曳平移。檢查模型尺寸不變。')],crop=(0,107,290,503),maxh=250))
    pages.append(keyboard_page('鍵盤 1：控制鍵與刪除',['Ctrl','Shift','Enter','Delete','Backspace'],[
      ('Ctrl 組合鍵的按法','先按住 Ctrl → 點一下另一個鍵 → 放開兩者。例如 Ctrl+Z。點一下工作區空白處後才試快捷鍵。'),
      ('Shift、Enter、Delete','Shift 配合左鍵加選物件；Enter 確認輸入；Delete 或 Backspace 刪除選中物件。輸入欄內的刪除鍵只刪文字。'),
      ('小練習｜刪除後救回','選一個練習方塊 → 按 Delete → 按 Ctrl+Z。完成檢查：方塊重新出現。')]))
    pages.append(keyboard_page('鍵盤 2：常用字母鍵',['Z','A','D','G','H'],[
      ('Ctrl+Z 復原；Ctrl+D 複製','做錯先復原。複製後副本和原件重疊，要移开才看得見；保持副本選中可重複同一變換。'),
      ('Ctrl+A 全選；Ctrl+G 聯集','先確認畫面中有哪些物件，再全選。Ctrl+G 將選中的實體合併；實體與 Hole 一起合併可挖洞。'),
      ('Ctrl+H 隱藏；D 單鍵落下','Ctrl+H 暫時藏起物件，頂部 Show all 燈泡可顯示回來。D 單鍵是落到工作平面，與 Ctrl+D 複製不同。')]))
    pages.append(photo_page('先試一次：拖入和選取 Box','在練習設計操作；完成後才開始正式大樓。',4,[
      ('1｜拖入實心方塊','找右側紅色 Box，按住左鍵拖到中央格仔板，放開。不要選灰色斜紋的 Hole。'),
      ('2｜選取與取消選取','左鍵點方塊一次，會看到輪廓及控制點；點空白處，控制點消失。'),
      ('3｜同時選兩件','再放一個 Box。先點第一件，再按住 Shift 點第二件。完成檢查：兩件都被選中。')],maxh=260))
    pages.append(photo_page('改尺寸：只改長、闊、高','截圖放大 Box 面板，讓數字和名稱更易找。',7,[
      ('1｜選 Box，打開 Properties','選方塊後，在 Shape 面板找 Properties。收起時，點小箭頭展開。'),
      ('2｜依次輸入 48、48、2','Length = 前後深；Width = 左右寬；Height = 本身高度。點數字 → 輸入 → Enter。'),
      ('3｜完成檢查','立方體應變成薄板。不要把黑色升降控制柄當成高度控制點；升起物件不會改本身高度。')],crop=(290,105,555,605),maxh=320,boxes=[(308,421,120,163)]))
    pages.append(photo_page('放在表面：Workplane 與 D','用表面貼合，無需輸入位置座標。',7,[
      ('1｜選一個承托面','右上方有藍色格網圖示 Workplane。點它，再點底座頂面；臨時工作平面會放在該面。'),
      ('2｜讓物件貼住表面','拖入新 Box，選着它，按 D 單鍵。完成檢查：Box 貼住底座頂面，沒有懸空。'),
      ('3｜完成後回復格仔板','再點 Workplane，點模型旁的空白格仔板。要放天台機房時，同樣先把工作平面放到塔頂。')],crop=(563,105,743,165),maxh=125))
    pages.append(photo_page('對齊：先選兩件，再按 Align','把塔身放在底座中央的關鍵步驟。',11,[
      ('1｜Shift + 左鍵，選底座和塔身','點空白取消選取，再按住 Shift 逐件點。按 Align 或鍵盤 L。'),
      ('2｜點兩個水平方向的中點','左右方向點中央黑點，前後方向也點中央黑點。不要點垂直方向的對齊點。'),
      ('3｜完成檢查','從 TOP 看，塔身在底座中央；從 FRONT 看，塔身底部仍貼住底座頂面。做錯方向便 Ctrl+Z。')],maxh=260))
    pages.append(photo_page('孔洞與群組：怎樣挖出窗戶','先用練習方塊試；本頁不改正式大樓。',7,[
      ('1｜Solid 和 Hole','面板左邊紅色圓是 Solid 實體；右邊斜紋圓是 Hole。選小 Box，點 Hole，把它變成切割用的形狀。'),
      ('2｜重疊後才會挖洞','把 Hole 移到實體上，讓兩者有重疊。按住 Shift 選兩件，再按 Ctrl+G（Union group）。'),
      ('3｜完成檢查與復原','重疊部分被挖走；Hole 單獨存在時不會切割。按 Ctrl+Z 可回到群組前；與大樓群組前先核對選取物件。')],crop=(290,103,555,258),maxh=170))
    pages.append(cards_page('正式建模前：準備檢查','基本功能練習完，另開一個新設計。',[
      ('命名及單位','點左上設計名稱，改為「班別_姓名_藍色住宅大樓」。Settings／Edit Grid 用毫米 mm；格仔板可設 200 × 200 mm。'),
      ('本課尺寸','底座 48 × 48 × 2 mm；塔身 20 × 20 × 108 mm；機房高 4.3 mm。連底座總高 114.3 mm。'),
      ('模型比例','80 m = 80,000 mm。80,000 ÷ 700 ≈ 114.3 mm，所以本例約為 1:700。這是示範模型，不是真實建築測量圖。'),
      ('操作環境','本指南以 Windows 鍵盤和一般滑鼠示範。Mac 使用者可參照 Tinkercad 選單標示的 Command 快捷鍵，或直接按畫面工具。'),
      ('開始前試三次','試一次 Ctrl+Z；試一次 Shift 加選；試一次 Workplane + D。成功後翻下一頁，開始步驟 01。')]))
    for i,s in enumerate(updated_steps(),1):pages.append(model_page(i,s))
    pages.append(cards_page('交給老師前：最後檢查','逐項核對，完成後才提交 STL。',[
      ('外形及連接','底座、中央塔身、四翼、機房都有連接，沒有懸空。Union 後可整座選中；仍要從各面查看有沒有分離的部分。'),
      ('尺寸及窗戶','外框 48 × 48 × 114.3 mm。完整版四面各有 26 排、每排 3 個窗戶。凹窗不應穿透整個住宅翼。'),
      ('檔案及顏色','提交「班別_姓名_住宅大樓.stl」。STL 不保存藍色；要印藍色模型，需用藍色耗材。'),
      ('打印前請老師檢查','以 mm 匯入切片軟件，底座朝下。由老師查看凹窗、薄邊和支撐，按學校打印機設定列印。')]))
    def sources(c,y):
        for head,body in [
          ('按鈕灰色','先選物件。Align、Group 通常需要兩件或以上；Shape 面板則要先選一件。'),
          ('找不到模型／不小心隱藏','按 Fit all in view 四角框。若仍看不到，按頂部 Show all 燈泡，再調整視角。'),
          ('快捷鍵沒有反應','先按 Enter 完成輸入，再左鍵點工作區。也可直接使用上方工具；別在瀏覽器網址列輸入。'),
          ('截圖和介面不同','本指南使用之前的實作截圖。更新版可能改動工具名稱或位置；將滑鼠停在圖示，讀英文提示。')]:y=card(c,head,body,0,y,W)
        y=text(c,'操作資料核對：Autodesk / Tinkercad 官方 Keyboard shortcuts。',0,y-8,W,'body_small')-7
        c.setFillColor(b.BLUE);c.setFont(b.FONT_LATIN,12)
        c.drawString(0,y,'Tinkercad official keyboard shortcuts (PDF)')
        c.linkURL(SOURCE,(0,y-3,W,y+15),relative=1)
        y-=35
        return text(c,'圖片：Tinkercad 實作截圖；鍵盤照片由老師提供。PDF 修訂：2026-09-16。',0,y,W,'body_small')
    pages.append(Page('遇到困難時，先看這頁','先復原，再找原因；不用重新做整座樓。',sources))
    story=[]
    for i,pg in enumerate(pages):
        if i:story.append(PageBreak())
        story.append(pg)
    doc=SimpleDocTemplate(str(b.OUT),pagesize=b.A4,leftMargin=b.MARGIN_X,rightMargin=b.MARGIN_X,topMargin=b.MARGIN_Y,bottomMargin=b.MARGIN_Y,title='藍色住宅大樓｜中二學生指南',author='Urban Studio')
    doc.build(story,onFirstPage=b.draw_header_footer,onLaterPages=b.draw_header_footer)
    (b.ROOT/'tmp/pdfs/layout-audit.json').write_text(json.dumps(AUDIT,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Pages:',len(pages),'Minimum space:',min(v for _,v in AUDIT));print(b.OUT)

if __name__=='__main__':build()
