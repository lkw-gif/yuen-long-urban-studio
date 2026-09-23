"""A self-contained classroom pack, landscape A4, verified before delivery."""
import json, math, re, io
from pathlib import Path
from xml.sax.saxutils import escape
import numpy as np
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader
import build_student_guide as b
import revise_student_guide as r

ROOT=b.ROOT
OUT=ROOT/'output/pdf/tinkercad-hong-kong-building-teaching-pack.pdf'
SCR=ROOT/'tmp/pdfs/building-pack'
SCR.mkdir(exist_ok=True)
REF=Path('C:/Users/ai/Desktop/F.2/Tinkercad/3D建築圖')
PW,PH=landscape(A4)
M=32; CW=PW-2*M; TOP=PH-94; BOT=43
BLUE=b.BLUE; NAVY=b.NAVY; INK=b.INK; MUTED=b.MUTED; PALE=b.PALE; LINE=b.LINE
ORANGE=b.ORANGE; GREEN=b.GREEN
AUDIT=[]; PAGES=[]; LINKS=[]; EMBED={}
def para(c,s,x,y,w,size=14,leading=None,color=INK,bold=False):
    s=r.clean(str(s))
    st=ParagraphStyle('p',fontName=b.FONT_BOLD if bold else b.FONT_REG,fontSize=size,
                      leading=leading or size*1.4,textColor=color,wordWrap='CJK')
    p=Paragraph(escape(s).replace('\n','<br/>'),st)
    _,hh=p.wrap(w,900)
    p.drawOn(c,x,y-hh)
    AUDIT.append({'page':c.getPageNumber(),'text':s[:50],'x':x,'y':y-hh,'right':x+w,'top':y})
    if y>=32 and y-hh<35:raise ValueError(f'Text overflow p{c.getPageNumber()}: {s[:45]} bottom {y-hh}')
    return y-hh

def rect(c,x,y,w,h,fill=PALE,stroke=LINE,radius=7):
    c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(.65)
    c.roundRect(x,y,w,h,radius,fill=1,stroke=1)

def page(c,title,sub='',section='共同操作',key=None):
    num=c.getPageNumber()
    key=key or f'p{num}'
    c.bookmarkPage(key);c.addOutlineEntry(title,key,level=0)
    PAGES.append({'page':num,'title':title,'key':key})
    c.setFillColor(BLUE);c.roundRect(M,PH-62,5,28,2,fill=1,stroke=0)
    para(c,title,M+16,PH-29,CW-138,24,30,NAVY,True)
    para(c,sub,M+16,PH-65,CW-16,12.3,16,MUTED)
    para(c,section,PW-M-120,PH-33,120,15,20,BLUE,True)
    c.setStrokeColor(LINE);c.line(M,32,PW-M,32)
    para(c,'香港社區建模｜中二 Tinkercad 教材',M,25,370,9.5,12,MUTED)
    c.setFillColor(MUTED);c.setFont(b.FONT_LATIN,10);c.drawRightString(PW-M,14,str(num))
    return TOP

def finish(c):c.showPage()

def card(c,head,body,x,y,w,size=14,fill=PALE):
    st=ParagraphStyle('measure',fontName=b.FONT_REG,fontSize=size,leading=size*1.4,wordWrap='CJK')
    p=Paragraph(escape(body).replace('\n','<br/>'),st);_,ph=p.wrap(w-26,999)
    hh=ph+48
    rect(c,x,y-hh,w,hh,fill)
    para(c,head,x+13,y-10,w-26,14,19,BLUE,True)
    para(c,body,x+13,y-34,w-26,size,size*1.4)
    return y-hh-10

def pic(c,path,x,y,w,h,crop=None,boxes=(),arrows=()):
    sw,sh=Image.open(path).size
    l,t,rr,bb=crop or (0,0,sw,sh)
    scale=min(w/(rr-l),h/(bb-t));dw=(rr-l)*scale;dh=(bb-t)*scale
    px=x+(w-dw)/2;py=y-dh
    c.saveState();q=c.beginPath();q.rect(px,py,dw,dh);c.clipPath(q,stroke=0)
    if Path(path).parent==REF:
        # Efficient PDF encoding; the full supplied concept image is preserved.
        if str(path) not in EMBED:
            buf=io.BytesIO();Image.open(path).convert('RGB').save(buf,format='JPEG',quality=91,subsampling=0);buf.seek(0);EMBED[str(path)]=ImageReader(buf)
        source=EMBED[str(path)]
    else:source=str(path)
    c.drawImage(source,px-l*scale,py-(sh-bb)*scale,sw*scale,sh*scale,mask='auto')
    c.restoreState()
    c.setStrokeColor(ORANGE);c.setLineWidth(1.3)
    for xx,yy,ww,hh in boxes:
        c.rect(px+(xx-l)*scale,y-(yy-t+hh)*scale,ww*scale,hh*scale,fill=0,stroke=1)
    for x1,y1,x2,y2 in arrows:
        r.arrow(c,px+(x1-l)*scale,y-(y1-t)*scale,px+(x2-l)*scale,y-(y2-t)*scale)
    return y-dh

def lesson(c,title,sub,shot,items,crop=None,boxes=(),imageh=350,key=None):
    y=page(c,title,sub,key=key)
    left=432;right=CW-left-20
    path=b.EDITOR if shot=='editor' else b.ASSET_DIR/f'step-{shot:02d}.jpg'
    rect(c,M,y-imageh,left,imageh,colors.white)
    pic(c,path,M+6,y-6,left-12,imageh-12,crop,boxes)
    para(c,'實作截圖供找工具；練習尺寸以本頁文字為準。',M,y-imageh-10,left,11,15,MUTED)
    if key in ('duplicate','rows'):
        para(c,'6 mm 只供本頁小窗練習。大窗的移動量要大於窗寬／窗高，窗與窗之間至少留 2 mm 實心牆。',M,y-imageh-39,left,13,18,BLUE)
    if key=='workplane':
        pic(c,b.ASSET_DIR/'step-04.jpg',M+118,y-232,186,112,(230,241,294,405),boxes=[(261,251,28,23)])
        para(c,'黑色升降柄：按住左鍵上下拖，抬高或放低物件。\n白色方點：改物件尺寸。兩者功能不同。',M,y-362,left,13,19,BLUE)
    yy=y
    for h,body in items:yy=card(c,h,body,M+left+20,yy,right)
    finish(c)

def mouse_page(c):
    y=page(c,'02  滑鼠：先認清要按哪裡','按住 = 不放手；拖曳 = 按住並移動，最後才放開。',key='mouse')
    x=M+118;bt=y-297;ww=172;hh=240
    rect(c,x,bt,ww,hh,b.PALE_BLUE,BLUE,48)
    c.setStrokeColor(BLUE);c.line(x+86,bt+152,x+86,bt+233);c.line(x+10,bt+152,x+162,bt+152)
    rect(c,x+77,bt+178,18,38,BLUE,BLUE,7)
    para(c,'左鍵',M,y-95,80,21,28,BLUE,True);r.arrow(c,M+62,y-110,x+37,bt+190)
    para(c,'右鍵',M+320,y-95,80,21,28,BLUE,True);r.arrow(c,M+320,y-110,x+136,bt+190)
    para(c,'滾輪',x+56,y-1,100,21,28,BLUE,True);r.arrow(c,x+86,y-34,x+86,bt+205)
    para(c,'箭咀尖端指向真正要按的位置。',M,y-330,408,14,20,MUTED)
    yy=y;rx=M+435;rw=CW-435
    for h,t in [('左鍵：選取和拖曳','點一下選物件；按住左鍵拖物件，放開便停。點空白处取消選取。'),('滾輪：放大／縮小畫面','向前滾放大，向後滾縮小；模型本身尺寸不變。'),('右鍵：轉觀看角度','游標放在工作區，按住右鍵拖曳。試看大樓的前面和側面。'),('Shift + 右鍵：平移畫面','先按住 Shift，再按住右鍵拖曳。放開兩者便完成。')]:yy=card(c,h,t.replace('处','處'),rx,yy,rw)
    finish(c)

def keyboard(c,second=False):
    title='04  鍵盤：複製、群組與救回模型' if second else '03  鍵盤：控制鍵、輸入及刪除'
    y=page(c,title,'先完成數字輸入，再選要操作的物件；不要在網址列使用快捷鍵。',key='keys2' if second else 'keys1')
    names=['Z','A','D','G','H'] if second else ['Ctrl','Shift','Enter','Delete','Backspace']
    ww=435;pic(c,b.KEYBOARD,M,y,ww,244,boxes=[r.KEYS[k] for k in names])
    cy=y-251;cell=ww/len(names)
    for i,k in enumerate(names):
        xx,yy,kw,kh=r.KEYS[k]
        pic(c,b.KEYBOARD,M+i*cell,cy,cell-8,44,(xx,yy,xx+kw,yy+kh))
        para(c,k,M+i*cell,cy-53,cell-4,12,17,BLUE,True)
    para(c,'橙框沿按鍵邊緣；下方放大圖與上面的真實按鍵相同。',M,cy-95,ww,14,20,MUTED)
    para(c,'本教材使用 Windows。其他鍵盤可按畫面上的同名工具。',M,cy-147,ww,12,17,MUTED)
    items=[('Ctrl+Z：復原','做錯立即按 Ctrl+Z。它會撤銷上一個動作。'),('Ctrl+D：複製','副本與原件重疊，移開才會看到；D 單鍵則是落到工作平面。'),('Ctrl+G：Union 群組','先選相關物件。把實體合併；實體與 Hole 一起合併會挖洞。'),('Ctrl+A／Ctrl+H','Ctrl+A 全選；Ctrl+H 隱藏選件。按上方 Show all 燈泡可顯示回來。')] if second else [('組合鍵怎樣按','先按住 Ctrl，再按一下另一個鍵，最後放開兩者。例如 Ctrl+Z。'),('Shift：加選物件','先左鍵點第一件，再按住 Shift 逐件點其他物件。'),('Enter：確認數字','輸入尺寸後按 Enter，才完成修改。'),('Delete／Backspace：刪除','選物件後按刪除鍵。小練習：刪一個 Box，再 Ctrl+Z 救回。')]
    yy=y
    for h,t in items:yy=card(c,h,t,M+455,yy,CW-455)
    finish(c)

def render_model(m,stage,path):
    """Z-buffered orthographic schematic; dimensions are real geometry, no faux UI."""
    boxes=m['boxes'];sol=[q for q in boxes if q['role']!='window']
    corners=[]
    for q in sol:
        for dx in (0,q['w']):
            for dy in (0,q['d']):
                for dz in (0,q['h']):corners.append((q['x']+dx,q['y']+dy,q['z']+dz))
    def proj(a):
        a=np.asarray(a,dtype=float);return np.stack(((a[...,0]+a[...,1])*.866,1.2*a[...,2]+.5*(a[...,1]-a[...,0]),a[...,0]-a[...,1]+a[...,2]*.833333),axis=-1)
    pc=proj(corners);mn=pc[:,:2].min(0);mx=pc[:,:2].max(0)
    width,height=900,650;scale=min((width-65)/(mx[0]-mn[0]),(height-38)/(mx[1]-mn[1]));ctr=(mx+mn)/2
    img=np.ones((height,width,4),dtype=np.uint8)*255;img[:,:,3]=0
    zbuf=np.ones((height,width))*-1e8
    def poly(points,color):
        vs=proj(points);vs[:,0]=(vs[:,0]-ctr[0])*scale+width/2;vs[:,1]=height/2-(vs[:,1]-ctr[1])*scale
        for ids in ((0,1,2),(0,2,3)):
            v=vs[list(ids)];lx=max(0,math.floor(v[:,0].min()));rx=min(width,math.ceil(v[:,0].max())+1);ty=max(0,math.floor(v[:,1].min()));by=min(height,math.ceil(v[:,1].max())+1)
            if rx<=lx or by<=ty:continue
            xx,yy=np.meshgrid(np.arange(lx,rx)+.5,np.arange(ty,by)+.5)
            x0,y0,z0=v[0];x1,y1,z1=v[1];x2,y2,z2=v[2]
            den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
            if abs(den)<1e-8:continue
            a=((y1-y2)*(xx-x2)+(x2-x1)*(yy-y2))/den;bary=((y2-y0)*(xx-x2)+(x0-x2)*(yy-y2))/den;cc=1-a-bary
            zz=a*z0+bary*z1+cc*z2;mask=(a>=-1e-7)&(bary>=-1e-7)&(cc>=-1e-7)&(zz>=zbuf[ty:by,lx:rx]-1e-6)
            zbuf[ty:by,lx:rx][mask]=zz[mask];img[ty:by,lx:rx][mask]=[*color,255]
    for q in boxes:
        if q['stage']>stage:continue
        x,y,z,w,d,h=[q[k] for k in ('x','y','z','w','d','h')]
        if q['role']=='window':
            # A shallow recess is shown by a dark inset face on its host wall.
            col=(36,66,102) if m['category']=='住宅' else (106,126,146)
            if d<=w:
                surf=y
                candidates=[s['y'] for s in sol if s['x']<=x+.1 and x+w<=s['x']+s['w']+.1 and s['z']<=z and z+h<=s['z']+s['h']+.1 and s['y']-.2<=y<=s['y']+1.5]
                if candidates:surf=min(candidates)-.035
                poly([(x,surf,z),(x+w,surf,z),(x+w,surf,z+h),(x,surf,z+h)],col)
                lip=min(h*.12,.3);poly([(x,surf-.01,z),(x+w,surf-.01,z),(x+w,surf-.01,z+lip),(x,surf-.01,z+lip)],tuple(min(255,int(v*1.5)) for v in col))
            else:
                surf=x+w
                candidates=[s['x']+s['w'] for s in sol if s['y']<=y+.1 and y+d<=s['y']+s['d']+.1 and s['z']<=z and z+h<=s['z']+s['h']+.1 and abs((s['x']+s['w'])-(x+w))<1.6]
                if candidates:surf=max(candidates)+.035
                poly([(surf,y,z),(surf,y+d,z),(surf,y+d,z+h),(surf,y,z+h)],col)
            continue
        if stage<6 and q['stage']==stage:base=np.array((235,152,67))
        elif q['role']=='base':base=np.array((185,203,218))
        elif m['category']=='住宅':base=np.array((53,118,205))
        else:base=np.array((225,233,239))
        poly([(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)],tuple(base))
        poly([(x,y,z),(x+w,y,z),(x+w,y,z+h),(x,y,z+h)],tuple((base*.86).astype(int)))
        poly([(x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h)],tuple((base*.68).astype(int)))
    Image.fromarray(img).save(path)

def diagrams(models):
    for m in models:
        for s in range(1,7):
            out=SCR/f'{m["id"]}-{s}.png'
            render_model(m,s,out)

def intro(c,m):
    y=page(c,f'{m["id"]}  {m["title"]}','參考建築外形製作；尺寸順序：寬 × 深 × 高（mm）。',m['category'],m['id'])
    left=433;rx=M+left+19;rw=CW-left-19
    pic(c,REF/m['image_filename'],M,y,left,324)
    para(c,'老師提供的 AI 概念參考圖；三視圖與箭嘴尺寸見下一頁。',M,y-328,left,11.5,16,MUTED)
    yy=y-357
    yy=para(c,'觀察重點｜'+m['feature'],M,yy,left,15,21,BLUE,True)-9
    para(c,'基本版：完成主要外形便達標。窗戶先做少量，再按時間增加。',M,yy,left,14,20)
    para(c,'建模練習尺寸',rx,y,rw,17,23,BLUE,True)
    cy=y-31
    for i,p in enumerate(m['parts']):
        fill=PALE if i%2==0 else colors.white
        rect(c,rx,cy-34,rw,34,fill,fill,2)
        name=re.sub('（.*?）','',p['name'])
        size=p['size'].replace(' mm','')
        if name=='每端六級樓梯':size='12 × 6 × 5.5 至 33'
        count='×'+str(p['count']) if isinstance(p['count'],int) else str(p['count'])
        para(c,name,rx+7,cy-6,101,12.5,18,INK,True)
        para(c,size,rx+110,cy-6,rw-151,13.2,18)
        para(c,count,rx+rw-38,cy-6,36,11.5,16,MUTED)
        cy-=35
    cy-=7
    cy=para(c,'挑戰｜'+m['challenge'],rx,cy,rw,13,18,BLUE)-9
    para(c,'打印提示｜'+m['print_note'],rx,cy,rw,12.5,18,MUTED)
    finish(c)

def steps_page(c,m):
    y=page(c,f'{m["id"]}  跟着做：{m["title"]}','橙色 = 本步新增實體；深色小格 = 凹窗示意。第 6 格顯示完成外形。',m['category'])
    gap=12;ww=(CW-2*gap)/3;hh=(TOP-BOT-12)/2
    for i,s in enumerate(m['steps']):
        col=i%3;row=i//3;x=M+col*(ww+gap);t=y-row*(hh+12);bt=t-hh
        rect(c,x,bt,ww,hh,colors.white)
        para(c,f'{i+1:02d}  '+s['title'],x+10,t-8,ww-20,14,19,BLUE,True)
        pic(c,SCR/f'{m["id"]}-{i+1}.png',x+10,t-29,ww-20,83)
        yy=para(c,s['action'],x+10,t-116,ww-20,13.5,18.5)
        yy-=5
        bb=para(c,'檢查：'+s['check'],x+10,yy,ww-20,12,16,GREEN)
        if bb<bt+7:raise ValueError(f'Step cell overflow {m["id"]}/{i+1}: {bb}<{bt+7}')
    finish(c)

def chooser(c,models,part):
    title='選一款模型：住宅與混合建築' if part==1 else '選一款模型：商業、學校與天橋'
    y=page(c,title,'1 入門｜2 進階｜3 挑戰。第一次建模，建議先選 R1 或 S1。','模型選單')
    gap=12;ww=(CW-gap*3)/4;hh=(TOP-BOT-12)/2
    for i,m in enumerate(models):
        x=M+(i%4)*(ww+gap);t=y-(i//4)*(hh+12);bt=t-hh
        rect(c,x,bt,ww,hh,PALE)
        para(c,m['id']+'  '+m['title'],x+9,t-9,ww-18,13,17,BLUE,True)
        pic(c,SCR/f'{m["id"]}-6.png',x+7,t-45,ww-14,122)
        para(c,'難度 '+str(m['difficulty'])+'  •  第 '+str(m['page'])+' 頁',x+9,bt+34,ww-18,12,17,MUTED)
        c.linkRect('',m['id'],(x,bt,x+ww,t),relative=0,thickness=0)
    finish(c)

def build(models):
    c=canvas.Canvas(str(OUT),pagesize=(PW,PH),pageCompression=1)
    c.setTitle('香港社區建模｜中二 Tinkercad 完整教材');c.setAuthor('Urban Studio');c.setSubject('共同操作、16款模型任務卡、完成與打印檢查')
    y=page(c,'把香港建築，變成你的 3D 社區','中二 Tinkercad 學生教材｜基本操作＋16 款模型任務卡','學生教材','cover')
    for i,mid in enumerate(['R2','M2','S2','B2']):
        pic(c,SCR/f'{mid}-6.png',M+i*CW/4,y,CW/4,235)
    yy=y-246
    for i,(h,t) in enumerate([('01  先練工具','用滑鼠及鍵盤，學會拖、改尺寸、複製、對齊及挖孔。'),('02  選一款建築','按難度選任務卡；每一步都有模型示意和完成檢查。'),('03  組成社區','檢查連接，匯出 STL，交老師安排打印及社區組合。')]):
        card(c,h,t,M+i*(CW+12)/3,yy,(CW-24)/3)
    para(c,'班別：____________　姓名：________________　組別：____________',M,75,CW,15,21)
    finish(c)

    y=page(c,'怎樣使用這份教材','先做共同練習，再選一張任務卡。不用一次做齊 16 款。','學習路線')
    xx=M;ww=(CW-20)/2
    yy=card(c,'第一站｜基本操作（第 3-16 頁）','依老師班級連結登入，選 Create／建立 → 3D Design。命名「練習」，跟着截圖試工具；完成後再開正式模型。',xx,y,ww)
    yy=card(c,'第二站｜選模型（第 17-18 頁）','選單可點擊跳頁。每款兩頁：先看參考與尺寸，再跟 6 格步驟。',xx,yy,ww)
    card(c,'第三站｜檢查與提交（第 51-54 頁）','完成基本版後才加細節。第 51 頁核對；第 52 頁匯出；遇到困難看第 53 頁。',xx,yy,ww)
    xx=M+ww+20;yy=y
    for h,t in [('尺寸怎樣讀','全部用 mm（毫米），依「寬 × 深 × 高」讀。這些是課堂練習尺寸，並非真實建築測量或固定比例。'),('三種圖片怎樣分','概念圖看外形；實作截圖找工具，尺寸以文字為準；建模示意看新增部件，並非軟件截圖。'),('做得到便打勾','每格先讀動作，再看示意，完成後核對「檢查」。主體完成就是基本版，窗戶可稍後再加。')]:yy=card(c,h,t,xx,yy,ww)
    finish(c)

    lesson(c,'01  認識 Tinkercad 編輯器','橙框圈住工具區；說明放在圖片外，避免遮住文字。','editor',[
      ('左邊｜觀看工具','ViewCube 切換 TOP／FRONT；Home 小屋回到預設視角；四角框讓模型放入畫面。'),
      ('中央｜Workplane','藍色格仔板是工作平面。把右側形狀拖到這裡開始建模。'),
      ('右邊及上方｜形狀和工具','右側 Basic Shapes 有 Box。上方有 Undo、Duplicate、Align、Group；先選物件才可使用部分工具。')],boxes=[(2,2,1907,62),(3,85,115,470),(1578,158,328,734)],imageh=320,key='interface')
    mouse_page(c);keyboard(c);keyboard(c,True)

    lesson(c,'05  拖入 Box，選取一件或多件','先開練習設計，試做後可以刪除。',4,[
      ('1｜拖入實心 Box','在右邊 Basic Shapes 找紅色 Box；按住左鍵拖到格仔板，放開。'),
      ('2｜試選取與取消','左鍵點方塊，會出現輪廓和控制點。點空白處，取消選取。'),
      ('3｜試 Shift 加選','再拖入一個 Box。先選第一件，再按住 Shift 點第二件。兩件都出現選取標示便成功。')],boxes=[(579,289,70,73),(239,282,58,99)],imageh=338)
    lesson(c,'06  改尺寸：寬、深、高','選未群組的 Box；輸入一個數字後，就按 Enter 確認。',7,[
      ('1｜打開形狀面板','選 Box，找到 Shape／Properties。若內容收起，點小箭頭展開。'),
      ('2｜用數字做薄板','Width 填 48；Length 填 48；Height 填 2。這裡是寬、深、高，不是物件放置位置。'),
      ('3｜對照結果','方塊變成 48 × 48 × 2 mm 薄板。轉視角後，物件寬／深欄位不會跟着畫面左右交換。')],crop=(290,105,555,605),boxes=[(308,421,120,163)],imageh=371,key='size')
    lesson(c,'07  放在表面：Workplane ＋ D','先選承托面，再放新部件；不用輸入位置座標。',7,[
      ('1｜選工作平面工具','右上方找藍色格網 Workplane。點一下，再點底座頂面。'),
      ('2｜讓新部件貼面','拖入新 Box，改好尺寸。選着它，按 D 單鍵；底部落到選好的表面。'),
      ('3｜做完記得還原','再點 Workplane，點旁邊空白格仔板，回復地面。屋頂機房也可先選塔頂再放置。')],crop=(563,105,743,165),boxes=[(582,107,51,51)],imageh=180,key='workplane')
    lesson(c,'08  Align 對齊：放到中央','只對齊兩個水平方向，保持原本承托高度。',11,[
      ('1｜先選兩件','點空白取消選取。按住 Shift，依次左鍵點底座和塔身，再按上方 Align。'),
      ('2｜點兩個中央黑點','左右方向點中間；前後方向也點中間。不要點垂直方向的中點。'),
      ('3｜換視角檢查','TOP 看四邊留空是否合適；FRONT 看塔身是否仍貼着底座。錯了先 Ctrl+Z。')],boxes=[(509,53,36,36)],imageh=350,key='align')
    lesson(c,'09  轉方向：把一翼轉 90°','轉觀看角度和轉物件是不同的操作。',15,[
      ('1｜選要轉的物件','左鍵選一翼。找到物件底部、沿格仔板方向的彎箭頭。'),
      ('2｜輸入角度','拖一下彎箭頭，再點角度數字輸入 90，按 Enter。不要拖白色尺寸控制點。'),
      ('3｜移到指定一側','點 TOP 從上面看，拖動副本到合適一側。轉方向後，仍需移動到位；若物件倒下，先復原。')],imageh=350,key='rotate')
    lesson(c,'10  凹窗：Hole 與 Union 群組','先在一個練習方塊試一次，再做正式模型。',21,[
      ('1｜先造一個小孔洞','拖入 Box，寬 3、深 1、高 3 mm；在形狀面板點斜紋 Hole。'),
      ('2｜讓孔洞淺淺嵌入牆','切 FRONT 及側視圖。移到外牆下方，稍微伸入牆內，仍有一部分露在外面。'),
      ('3｜選兩件，再群組','Shift 選牆和 Hole，按 Ctrl+G（Union）。出現淺凹窗便成功。孔洞不重疊牆面，就不會挖洞。')],boxes=[(1069,132,42,43),(576,384,109,74)],imageh=325,key='hole')
    lesson(c,'11  複製一排窗：Ctrl+D','先不要與大樓群組。先做一個 Hole，再複製它。',23,[
      ('1｜設定每次移動','右下 Snap Grid 選 1.0 mm。選第一個 Hole，Ctrl+D 複製。'),
      ('2｜移開第一個副本','從 FRONT 看，試方向鍵。確認向右後，共按 6 次，移動 6 mm；副本保持選中。'),
      ('3｜重複同一動作','再按 Ctrl+D，會重複上次移動。先做 3 個窗。6 mm 是移動量，3 mm 寬的窗之間空 3 mm。')],imageh=330,key='duplicate')
    lesson(c,'12  把一排窗複製成幾層','先做少量窗戶，留意每一排有沒有超出牆邊。',26,[
      ('1｜只選窗戶','可先選大樓並 Ctrl+H 暫藏。Shift 選同排 Hole，再 Ctrl+G，合成一排孔洞。'),
      ('2｜向上複製一排','Ctrl+D 複製整排；Snap Grid 1 mm 時，按住 Ctrl，按向上方向鍵 6 次。'),
      ('3｜顯示大樓再切割','可再 Ctrl+D 加幾排。按 Show all 燈泡，檢查仍在牆內；再選大樓和孔洞、Ctrl+G。')],imageh=320,key='rows')
    lesson(c,'13  顏色、群組與連接','完成外形後才群組；群組完成也要檢查有沒有分離部件。',19,[
      ('1｜檢查所有部件','先看 FRONT、TOP 及側面。上下部件貼面；並排部件稍微重疊，避免留縫。'),
      ('2｜合併和改顏色','只選模型所需實體，Ctrl+G。點 Solid 顏色圓，住宅選藍色，其餘可選白色。'),
      ('3｜留意打印顏色','STL 不保存顏色。要打印藍色／白色，由老師選用相應顏色的耗材。')],imageh=340,key='color')
    y=page(c,'14  五分鐘小練習：準備好才選模型','每完成一項，在方格內打勾。','共同操作','practice')
    items=[('拖入與選取','放兩個 Box；試取消選取，再用 Shift 同時選兩件。'),('改尺寸','把其中一件改成 48 × 48 × 2 mm 薄板。'),('放在上面','Workplane 放在薄板頂面；放一件小 Box，再按 D 貼面。'),('複製與復原','選小 Box，Ctrl+D；把副本移開，再按 Ctrl+Z 復原一次。'),('做一個凹窗','Hole 淺嵌實體；Shift 選兩件、Ctrl+G，確認有凹位。'),('正式建模','另建 3D Design，命名「班別_姓名_模型代號」。然後到下一頁選款。')]
    for i,(h,t) in enumerate(items):
        x=M+(i%2)*(CW+16)/2;topy=y-(i//2)*146;ww=(CW-16)/2
        rect(c,x,topy-130,ww,130,PALE);c.setStrokeColor(BLUE);c.rect(x+12,topy-32,15,15)
        para(c,h,x+38,topy-13,ww-50,17,23,BLUE,True);para(c,t,x+12,topy-49,ww-24,15,22)
    finish(c)

    # The model chooser occupies pages 17-18; task cards begin at page 19.
    for i,m in enumerate(models):m['page']=19+i*2
    chooser(c,models[:8],1);chooser(c,models[8:],2)
    for m in models:intro(c,m);steps_page(c,m)

    y=page(c,'完成模型：先檢查，再交檔','只完成基本版也可以；先確保外形、連接和尺寸清楚。','完成與提交','check')
    ww=(CW-20)/2
    for i,(h,t) in enumerate([
       ('外形清楚','我能指出建築的主要用途，以及一個最明顯的外形特徵。'),('部件有連接','從前、後、左、右及上方看，檢查縫隙、懸空及多餘小塊。群組後仍要看一次。'),('尺寸合適','我核對底板寬深及總高，先問老師是否適合社區底板；需要時整座等比例縮放。'),('窗戶留在牆內','凹窗沒有超出牆邊；不需要像概念圖般做滿每一層。'),('打印交老師確認','尖頂、長跨距、頂蓋及薄欄杆交老師查看。橋樑通常分件平放打印，再黏合。'),('檔案和記錄完整','保留 Tinkercad 設計；交 STL 和完成截圖，檔名寫班別、姓名和模型代號。')]):
        x=M+(i%2)*(ww+20);topy=y-(i//2)*146
        card(c,'□ '+h,t,x,topy,ww,15)
    finish(c)
    lesson(c,'匯出 STL：把模型交給老師','先點空白處，再選你要匯出的完整模型。',35,[
       ('1｜按 Export','右上方按 Export。若只交所選模型，範圍選 The selected shape。'),
       ('2｜下載 .STL','在 For 3D Print 下按 .STL。下載後改名，例如「2A_陳同學_R1.stl」。'),
       ('3｜一起交完成截圖','截圖要見到完整外形。STL 交老師用毫米匯入切片軟件，檢查厚度、支撐和打印方向。')],imageh=358,key='export')
    y=page(c,'遇到困難：先救回，再繼續','不要急着重新做整座樓。','快速查閱','help')
    for i,(h,t) in enumerate([
        ('模型不見了','先按左側四角框 Fit all in view。若曾隱藏，再按頂部 Show all 燈泡。'),('按鈕變灰色','先選物件。Align、Union 通常要至少兩件；只選一件時，部分工具不可用。'),('快捷鍵沒反應','先 Enter 結束數字輸入，再選要操作的物件。也可直接點工具列的同名按鈕。'),('複製了卻看不見','新副本與原件重疊。保留副本選中，拖開便能看見。'),('挖不到窗戶','孔洞要與牆重疊；同時選 Hole 和牆，再 Union。只按 Hole 不會立即挖洞。'),('屋頂或塔身懸空','Workplane 放在承托面，再選部件按 D。做完把 Workplane 點回空白格仔板。')]):
        xx=M+(i%2)*(CW+20)/2;yy=y-(i//2)*146
        card(c,h,t,xx,yy,(CW-20)/2,14.5)
    finish(c)
    y=page(c,'我的模型記錄與同伴檢查','先互相試讀作品，再交老師。','學習記錄')
    yy=card(c,'我製作的模型','模型代號：________　名稱：________________　我選它的原因：',M,y,CW)
    for i in range(2):c.setStrokeColor(LINE);c.line(M+12,yy-20-i*33,PW-M-12,yy-20-i*33)
    yy-=93
    yy=card(c,'我用過的工具','□ Box　□ 尺寸輸入　□ Workplane＋D　□ Shift 加選\n□ Ctrl+D 複製　□ Align　□ Hole　□ Union 群組',M,yy,CW)
    yy=card(c,'請同伴查看','同伴姓名：____________　已檢查：□ 外形　□ 連接　□ 尺寸\n我做得好的地方：________________________________________________',M,yy,CW)
    para(c,'下次想改善：________________________________________________________',M+12,yy-5,CW-24,15,22)
    finish(c)
    y=page(c,'教師使用建議與圖像來源','A4 橫向；雙面列印選短邊翻頁。可只派發共同操作頁及選中的兩頁任務卡。','教師備註')
    ww=(CW-20)/2;yy=y
    for h,t in [('課堂一｜共同操作','約 40 分鐘：認識介面 5 分鐘；滑鼠鍵盤 10 分鐘；基本功能示範 15 分鐘；五分鐘練習及選款 10 分鐘。'),('課堂二｜建模與互評','約 40 分鐘：按任務卡做基本版 25 分鐘；細節或修正 8 分鐘；同伴檢查、截圖及提交 7 分鐘。複雜款可延至下一課。'),('分工與延伸','各組可分配住宅、商店、學校、天橋。統一社區底板空間後再調整比例；基本版本不強求細節與概念圖一致。')]:yy=card(c,h,t,M,yy,ww,13.5)
    yy=y
    for h,t in [('圖片的用途','16 張 AI 概念參考圖及鍵盤照片由老師提供。Tinkercad 真實截圖沿用先前實作；96 格建模圖為本教材的程序式幾何示意。'),('打印前由教師決定','本教材提供建模練習，未經逐款切片驗證。按學校打印機確認壁厚、連接、支撐與分件；特別留意橋頂、跨橋和尖頂。'),('操作資料','Tinkercad 官方 Keyboard shortcuts。介面可能更新；滑鼠停在圖示上，按英文工具名核對。教材編訂：2026-09-18。')]:yy=card(c,h,t,M+ww+20,yy,ww,13.5)
    para(c,'開啟官方快捷鍵說明',M+ww+20,yy-2,ww,12,17,BLUE,True)
    c.linkURL('https://images.tinkercad.com/jl5ii4oqrdmc/6TNFVIF89KMN9CPLLH97U0/a847b794b1b579f1529d87863783df8d/Tinkercad_keyboard_shortcuts_2_up.pdf',(M+ww+20,yy-22,PW-M,yy),relative=0)
    finish(c)
    c.save()
    (SCR/'layout-audit.json').write_text(json.dumps(AUDIT,ensure_ascii=False,indent=2),encoding='utf-8')
    (SCR/'pages.json').write_text(json.dumps(PAGES,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Created',OUT,'pages',len(PAGES))

def load_models():
    models=json.loads((ROOT/'tmp/pdfs/pack_models_a.json').read_text(encoding='utf-8'))+json.loads((ROOT/'tmp/pdfs/pack_models_b.json').read_text(encoding='utf-8'))
    if isinstance(models,dict):raise TypeError('Need list')
    edits={
      'R5':{3:'連橋用尺寸表的 Box，以黑色升降柄抬至兩塔中上部。小屋先用 Workplane 點塔頂，再放入、按 D 貼面。'},
      'M1':{4:'先排 Hole，最後與牆群組。住宅做 8 欄、7 排；店面用表列大孔，每次橫移 10 mm，做 7 個。'},
      'M2':{4:'先排 Hole，最後與牆群組。住宅各做 3 欄、8 排；商場橫移 10、上移 11 mm，做 7 欄、2 排。'},
      'M3':{4:'先排 Hole，最後與牆群組。住宅加小窗；店面用表列大孔，每次橫移 10 mm，排在前面和右側。'},
      'C1':{4:'用表列尺寸做 Hole；先複製成窗列，留至少 2 mm 牆，最後與牆一起 Ctrl+G。'},
      'C2':{4:'商場 Hole 橫移 9 mm 複製；塔身孔橫移 7、上移 8 mm。留牆邊，排好才與牆群組。'},
      'C3':{4:'按表列尺寸排 Hole，橫移 6 mm、上移 7 mm 複製。留在各層牆內，最後與牆群組。'},
      'C4':{4:'兩塔先排 Hole；橫移 6 mm、上移 7 mm 複製。保持窗與牆邊距離，最後與牆群組。'},
      'S1':{4:'課室 Hole 橫移 9 mm、上移 7 mm 複製；避開樓梯塔。樓梯用窄孔，最後與牆群組。'},
      'S2':{4:'Hole 橫移 8、上移 7 mm 複製。左翼的孔先轉 90°、貼向操場的牆；排好才群組。'},
      'B1':{5:'先排 Hole，橫移 16 mm 複製，最後與牆群組。請老師複製設計留拆件版，再把實體合併。'},
      'B2':{5:'先排 Hole，橫移 16 mm 複製，最後與牆群組。請老師複製設計留拆件版，再把實體合併。'},
    }
    for m in models:
        for idx,action in edits.get(m['id'],{}).items():m['steps'][idx]['action']=action
        for s in m['steps']:
            s['action']=s['action'].replace('按 W，點','點 Workplane，再點').replace('按 W 點','點 Workplane，再點').replace('按 W，','點 Workplane，').replace('見基本操作「疊放」','見第 9 頁').replace('按 W 選好頂面','用 Workplane 選頂面')
            s['action']=s['action'].replace('先儲存可拆件版本，再另存群組完成版','先請老師複製設計備份，再群組').replace('保留可拆件版本，再另存群組版','先請老師複製設計備份，再群組')
    return models

if __name__=='__main__':
    models=load_models()
    import sys
    if '--reuse-diagrams' not in sys.argv:diagrams(models)
    build(models)
