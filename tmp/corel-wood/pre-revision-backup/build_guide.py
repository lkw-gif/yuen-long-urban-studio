"""Student-friendly CorelDRAW 2019 woodworking pack; geometry stays vector."""
from pathlib import Path
import json, math, io, shutil, zipfile
from xml.sax.saxutils import escape
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg

ROOT=Path('C:/Users/ai/Documents/Codex/building')
TMP=ROOT/'tmp/corel-wood'
OUT=ROOT/'output/coreldraw-wood-building'
PDF=ROOT/'output/pdf/coreldraw-2019-wood-building-student-guide.pdf'
TEACHER=ROOT/'output/pdf/coreldraw-2019-wood-building-teacher-settings.pdf'
ASSETS=OUT/'assembly-views'
PHOTO=Path('C:/Users/ai/Desktop/ChatGPT Image 2026年9月19日 上午10_59_05.png')
HELP=Path('C:/Program Files/Corel/CorelDRAW Graphics Suite 2019/Languages/ct/Help/Draw/images/CorelDRAW-loc-wkspc-app-windowDRAW.jpg')
KEYBOARD=ROOT/'public/tinkercad/keyboard-reference.png'
DATA=json.loads((TMP/'models.json').read_text(encoding='utf8'))
MODELS=DATA['models']
W,H=landscape(A4);M=32;CW=W-2*M;TOP=H-96
NAVY=colors.HexColor('#153750');BLUE=colors.HexColor('#186398');INK=colors.HexColor('#263E4D')
MUTED=colors.HexColor('#597082');PALE=colors.HexColor('#EDF4F8');LINE=colors.HexColor('#CCDCE5')
WOOD=colors.HexColor('#ECD2AB');AMBER=colors.HexColor('#B66B1C');RED=colors.HexColor('#C83932')
GREEN=colors.HexColor('#327261');WHITE=colors.white
pdfmetrics.registerFont(TTFont('JH','C:/Windows/Fonts/msjh.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('JHB','C:/Windows/Fonts/msjhbd.ttc',subfontIndex=0))
AUDIT=[];PAGES=[];IMG={}

def txt(c,s,x,y,w,size=15,leading=None,col=INK,bold=False):
    st=ParagraphStyle('t',fontName='JHB' if bold else 'JH',fontSize=size,leading=leading or size*1.4,textColor=col,wordWrap='CJK')
    p=Paragraph(escape(str(s)).replace('\n','<br/>'),st);_,hh=p.wrap(w,1000)
    p.drawOn(c,x,y-hh)
    AUDIT.append(dict(page=c.getPageNumber(),text=str(s)[:60],x=x,y=y-hh,w=w,top=y))
    if y>35 and y-hh<38:raise ValueError(f'Text overflow p{c.getPageNumber()} {s} {y-hh}')
    return y-hh

def box(c,x,y,w,h,fill=PALE,stroke=LINE,r=8):
    c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(.7);c.roundRect(x,y,w,h,r,fill=1,stroke=1)

def page(c,title,sub='',tag='學生指南',key=None):
    n=c.getPageNumber();key=key or f'p{n}'
    c.bookmarkPage(key);c.addOutlineEntry(title,key,0);PAGES.append(dict(page=n,title=title,key=key))
    c.setFillColor(BLUE);c.roundRect(M,H-63,5,29,2,fill=1,stroke=0)
    txt(c,title,M+16,H-28,CW-140,24,30,NAVY,True)
    txt(c,tag,W-M-112,H-34,112,15,20,BLUE,True)
    txt(c,sub,M+16,H-66,CW-16,12.5,17,MUTED)
    c.setStrokeColor(LINE);c.line(M,31,W-M,31)
    txt(c,'中二木板建築｜CorelDRAW 2019｜2 mm 木板',M,25,CW-50,9,12,MUTED)
    c.setFont('JH',10);c.setFillColor(MUTED);c.drawRightString(W-M,14,str(n))
    return TOP

def end(c):c.showPage()
def card(c,head,body,x,y,w,size=15,fill=PALE):
    st=ParagraphStyle('m',fontName='JH',fontSize=size,leading=size*1.4,wordWrap='CJK')
    p=Paragraph(escape(body).replace('\n','<br/>'),st);_,hh=p.wrap(w-26,900);ht=hh+48
    box(c,x,y-ht,w,ht,fill)
    txt(c,head,x+13,y-10,w-26,15,21,BLUE,True)
    txt(c,body,x+13,y-35,w-26,size,size*1.4)
    return y-ht-12

def picture(c,path,x,top,w,h,crop=None):
    im=Image.open(path);iw,ih=im.size;l,t,r,b=crop or (0,0,iw,ih)
    sc=min(w/(r-l),h/(b-t));dw=(r-l)*sc;dh=(b-t)*sc;px=x+(w-dw)/2
    if str(path) not in IMG:
        buf=io.BytesIO();im.convert('RGB').save(buf,format='JPEG',quality=93);buf.seek(0);IMG[str(path)]=ImageReader(buf)
    c.saveState();q=c.beginPath();q.rect(px,top-dh,dw,dh);c.clipPath(q,stroke=0)
    c.drawImage(IMG[str(path)],px-l*sc,top-dh-(ih-b)*sc,iw*sc,ih*sc);c.restoreState()
    return px,top,sc,dw,dh

def svg(c,path,x,top,w,h):
    d=svg2rlg(str(path));sc=min(w/d.width,h/d.height);c.saveState()
    c.translate(x+(w-d.width*sc)/2,top-d.height*sc);c.scale(sc,sc);renderPDF.draw(d,c,0,0);c.restoreState()

def arrow(c,a,b,col=AMBER,width=1.5,heads=1):
    c.setStrokeColor(col);c.setFillColor(col);c.setLineWidth(width);c.line(*a,*b)
    def tip(p,q):
        angle=math.atan2(p[1]-q[1],p[0]-q[0]);r=6
        path=c.beginPath();path.moveTo(*p);path.lineTo(p[0]-r*math.cos(angle-.42),p[1]-r*math.sin(angle-.42));path.lineTo(p[0]-r*math.cos(angle+.42),p[1]-r*math.sin(angle+.42));path.close();c.drawPath(path,fill=1,stroke=0)
    tip(b,a)
    if heads==2:tip(a,b)

def dim(c,a,b,s,vertical=False,col=BLUE):
    arrow(c,a,b,col,1,2);cx=(a[0]+b[0])/2;cy=(a[1]+b[1])/2
    c.saveState();c.translate(cx-7 if vertical else cx,cy if vertical else cy+5)
    if vertical:c.rotate(90)
    width=pdfmetrics.stringWidth(s,'JHB',12);c.setFillColor(WHITE);c.rect(-width/2-3,-2,width+6,16,fill=1,stroke=0)
    c.setFillColor(col);c.setFont('JHB',12);c.drawCentredString(0,0,s);c.restoreState()

def key(c,s,x,y,w=66):
    box(c,x,y-37,w,37,WHITE,BLUE,5);txt(c,s,x+3,y-6,w-6,15,20,BLUE,True)

def face(c,x,top,w,ph=46,pw=80,engrave=True,title='前牆',dimension=True):
    sc=w/pw;h=ph*sc;bottom=top-h
    c.setStrokeColor(RED);c.setFillColor(WHITE);c.setLineWidth(1.6);c.rect(x,bottom,w,h,fill=1,stroke=1)
    if engrave:
        panel=MODELS[0]['panels'][2]
        for e in panel['engraving']:
            c.setStrokeColor(BLUE);c.setLineWidth(1);c.rect(x+e['x']*sc,top-(e['y']+e['height'])*sc,e['width']*sc,e['height']*sc,stroke=1,fill=0)
    if dimension:
        dim(c,(x,top+18),(x+w,top+18),f'{pw:g} mm')
        dim(c,(x-20,bottom),(x-20,top),f'{ph:g} mm',True)
    if title:txt(c,title,x,bottom-10,w,14,20,BLUE,True)
    return bottom

def crop_for(i):
    # Original supplied montage, layout read from its visible six examples.
    return [(15,215,465,510),(485,125,940,510),(950,76,1440,510),(12,606,474,918),(485,618,971,916),(969,606,1440,916)][i]

def model_view(c,m,x,top,w,h):
    f=ASSETS/f'{m["id"]}_assembly.svg'
    if f.exists():svg(c,f,x,top,w,h)
    else:picture(c,ASSETS/f'{m["id"]}_assembly.png',x,top,w,h)

def exploded(c,x,top):
    svg(c,ASSETS/'W1_exploded.svg',x+42,top-15,350,286)
    def at(a,b):return (x+42+a*.35,top-15-b*.35)
    for name,lx,ly,ax,ay,sx,sy in [
      ('頂板',331,9,500,140,334,28),('左牆',0,105,300,310,56,119),
      ('後牆',334,119,695,370,337,139),('前牆',0,229,300,525,56,239),
      ('右牆',334,229,720,540,338,243),('底板',174,315,510,645,201,297)]:
        txt(c,name,x+lx,top-ly,70,13,18,BLUE,True)
        arrow(c,(x+sx,top-sy),at(ax,ay),AMBER,1.1)

def plan(c,m,x,top,w,h):
    ov=m['overall_external_dimensions_mm'];stack=m['id'] in ['W2','W3'];span=ov['height'] if stack else ov['depth'];sc=min((w-55)/ov['width'],(h-40)/span)
    xx=x+25;yy=top-12
    for mo in m['modules']:
        p=mo['assembly_position_mm'];d=mo['external_dimensions_mm'];a=xx+p['x']*sc
        dh=d['height'] if stack else d['depth']
        b=yy-span*sc+p['z']*sc if stack else yy-(p['y']+d['depth'])*sc
        box(c,a,b,d['width']*sc,dh*sc,WOOD,AMBER,1)
        txt(c,mo['id'],a+d['width']*sc/2-10,b+dh*sc/2+10,30,17,22,NAVY,True)
    dim(c,(xx,yy+12),(xx+ov['width']*sc,yy+12),f"{ov['width']} mm")
    dim(c,(xx-13,yy-span*sc),(xx-13,yy),f"{span} mm",True)
    txt(c,'地面' if stack else '前方',xx,yy-span*sc-8,w-30,12,17,BLUE)

def table(c,rows,x,top,widths,rowh=36,size=14):
    y=top
    for i,row in enumerate(rows):
        xx=x
        for val,ww in zip(row,widths):
            c.setFillColor(BLUE if i==0 else (PALE if i%2 else WHITE));c.rect(xx,y-rowh,ww,rowh,fill=1,stroke=0)
            txt(c,val,xx+9,y-8,ww-16,size,19,WHITE if i==0 else INK,i==0)
            xx+=ww
        y-=rowh
    return y

def sheet(c,m,num,x,top,w,h):
    sc=min(w/300,h/200);ww=300*sc;hh=200*sc
    box(c,x,top-hh,ww,hh,WHITE,LINE,1)
    for idx,p in enumerate(m['panels'],1):
        if p['layout']['sheet']!=num:continue
        loc=p['layout'];sz=p['cut_size_mm'];px=x+loc['x_mm']*sc;py=top-loc['y_mm']*sc
        c.setStrokeColor(RED);c.setLineWidth(.8);c.rect(px,py-sz['height']*sc,sz['width']*sc,sz['height']*sc,fill=0,stroke=1)
        for e in p['engraving']:
            c.setStrokeColor(BLUE);c.setLineWidth(.4);c.rect(px+e['x']*sc,py-(e['y']+e['height'])*sc,e['width']*sc,e['height']*sc,fill=0,stroke=1)
        # Number badges occupy reserved 0-3 mm margin; no text is added to SVG cut files.
        c.setFillColor(NAVY);c.setFont('JHB',7);c.drawString(px+1.3,py-6,str(idx))
    return top-hh

def lesson(c,title,sub,draw,items,tag='基本操作'):
    t=page(c,title,sub,tag);draw(c,M,t,426,376)
    y=t
    for h,b in items:y=card(c,h,b,M+448,y,CW-448,14.5)
    end(c)

def doc(c):
    t=page(c,'用木板，建造你的香港建築','CorelDRAW 2019（Windows）｜中二學生｜木板厚度 2 mm','學生指南','cover')
    picture(c,PHOTO,M,t,CW,332)
    txt(c,'先畫平面零件，再把木板組成立體建築。',M,t-344,CW,24,32,NAVY,True)
    txt(c,'先跟做 W1 單層小屋，再選一款建築。每一步：找工具 → 做動作 → 看結果。',M,t-389,CW,16,24)
    txt(c,'班別：__________　組別：__________　姓名：________________',M,69,CW,14,20)
    end(c)

    t=page(c,'選一款：由小屋開始','按圖片可跳到該款尺寸頁。初次使用，先完成 W1。','模型選單','chooser')
    cw=(CW-24)/3;hh=209
    for i,m in enumerate(MODELS):
        x=M+(i%3)*(cw+12);yy=t-(i//3)*(hh+12);box(c,x,yy-hh,cw,hh,WHITE)
        picture(c,PHOTO,x+6,yy-7,cw-12,134,crop_for(i))
        txt(c,m['id']+' '+m['name_zh'],x+11,yy-145,cw-20,16,22,BLUE,True)
        d=m['overall_external_dimensions_mm'];txt(c,f"{d['width']} × {d['depth']} × {d['height']} mm｜{m['panel_count']} 件",x+11,yy-174,cw-20,12.5,18)
        c.linkRect('',m['id'],(x,yy-hh,x+cw,yy),thickness=0)
    txt(c,'圖中成品是外形參考；本教材採直邊、平屋頂及門窗刻線，實際尺寸以本教材為準。',M,59,CW,11.5,16,MUTED)
    end(c)

    t=page(c,'先看懂：六塊板怎樣變成小屋','W1 完成外尺寸：寬 80 × 深 60 × 高 50 mm。','木板拼接','joints')
    ef=ASSETS/'W1_exploded.svg'
    if ef.exists():exploded(c,M,t)
    else:model_view(c,MODELS[0],M,t,438,320)
    txt(c,'分開看零件｜間距只為說明，並非組裝間隙。',M,t-349,430,12,17,MUTED)
    yy=t
    for h,b in [('頂板、底板各 1 件','80 × 60 mm；上下各蓋住四面牆。'),('前牆、後牆各 1 件','80 × 46 mm；牆高 = 50 - 2 - 2。'),('左牆、右牆各 1 件','56 × 46 mm；側牆深 = 60 - 2 - 2。')]:yy=card(c,h,b,M+455,yy,CW-455)
    txt(c,'記住：側牆夾在前、後牆之間。照表輸入已扣板厚的尺寸，不要再扣一次。',M,98,CW,17,25,BLUE,True)
    end(c)

    t=page(c,'認識 CorelDRAW 2019：先找四個地方','以下是官方 2019 繁中介面圖；保留原有編號，方便對照。','基本操作','interface')
    picture(c,HELP,M,t,466,365)
    yy=t
    for h,b in [('1｜左邊：工具箱','黑箭頭是「選取」；矩形工具用來畫牆板。'),('7｜上方：屬性列','選物件後才改物件寬、高；沒有選物件時可能顯示頁面大小。'),('12｜中央：繪圖頁面','在白色頁面畫圖及擺放零件。'),('15｜右邊：色盤','左鍵點色塊改填色；右鍵點色塊改外框顏色。')]:yy=card(c,h,b,M+487,yy,CW-487,14)
    txt(c,'來源：CorelDRAW 2019 隨附官方說明。下頁起的放大控件與線稿會清楚標為操作示意。',M,82,CW,11.5,17,MUTED)
    end(c)

    t=page(c,'滑鼠：左鍵做動作，右鍵改外框','按住 = 不放手；拖曳 = 按住並移動，最後放開。','基本操作','mouse')
    mx=M+103;my=t-290;mw=165;mh=240
    box(c,mx,my,mw,mh,PALE,BLUE,49)
    c.setStrokeColor(BLUE);c.line(mx+mw/2,my+150,mx+mw/2,my+232);c.line(mx+9,my+150,mx+mw-9,my+150)
    box(c,mx+74,my+175,17,38,BLUE,BLUE,7)
    txt(c,'左鍵',M,t-85,85,22,29,BLUE,True);arrow(c,(M+63,t-105),(mx+32,my+197))
    txt(c,'右鍵',M+296,t-85,93,22,29,BLUE,True);arrow(c,(M+300,t-106),(mx+132,my+197))
    txt(c,'滾輪',mx+49,t-3,100,21,28,BLUE,True);arrow(c,(mx+83,t-37),(mx+83,my+194))
    yy=t
    for h,b in [('左鍵點一下','選取物件或按按鈕。'),('左鍵按住拖','畫矩形，或用選取工具移動物件。'),('右鍵點色盤','先選物件，再右鍵點紅／藍色塊，改外框顏色。'),('看不見圖形','按 F4 顯示所有物件；按 F3 縮小畫面。')]:yy=card(c,h,b,M+420,yy,CW-420,14.5)
    txt(c,'滑鼠示意圖｜左、右以使用者看滑鼠的方向判斷。',M,t-331,394,12,18,MUTED)
    end(c)

    t=page(c,'鍵盤：這次只需記住幾組鍵','先離開文字／數字輸入框，再使用選取、複製等快捷鍵。','基本操作','keyboard')
    # Clean vector keyboard avoids misplaced labels over tiny photograph legends.
    x=M;y=t-20;unit=31;gap=4
    for i,lab in enumerate(['Esc','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12']):
        xx=x+i*(unit+gap);box(c,xx,y-28,unit,28,WOOD if lab in ['F4','F6','F8'] else WHITE,LINE,3);txt(c,lab,xx+3,y-6,unit-4,10,14,BLUE,True)
    rows=[list('QWERTYUIOP'),list('ASDFGHJKL'),list('ZXCVBNM')]
    for j,row in enumerate(rows):
        xx=x+44+j*13;yy=y-43-j*39
        for i,lab in enumerate(row):
            ax=xx+i*35;box(c,ax,yy-31,31,31,WOOD if lab in 'DSZI' else WHITE,LINE,3);txt(c,lab,ax+8,yy-6,22,12,17,BLUE,True)
    key(c,'Ctrl',x,y-168,61);key(c,'Shift',x,y-128,70);key(c,'Enter',x+375,y-88,79);key(c,'Del',x+408,y-43,47)
    txt(c,'鍵盤位置示意；實際鍵盤排列可能不同，找相同鍵名即可。',M,y-224,475,12,18,MUTED)
    txt(c,'組合鍵怎樣按：先按住 Ctrl，再按一下 D，最後放開兩鍵。',M,y-264,470,17,24,BLUE,True)
    yy=t
    for h,b in [('F6 ／ F8','F6 畫矩形；F8 加文字。'),('Ctrl + D ／ Ctrl + Z','複製一件；復原上一個動作。'),('Ctrl + I ／ Ctrl + S','匯入 SVG；儲存 CDR。'),('Shift ／ Enter','按住 Shift 逐件加選；Enter 確認數字。')]:yy=card(c,h,b,M+505,yy,CW-505,14)
    end(c)

    def newdraw(c,x,y,w,h):
        picture(c,HELP,x,y,w,148,(0,58,524,151))
        txt(c,'在「檔案」選單開始；以下為設定內容示意。',x,y-154,w,12,17,MUTED)
        table(c,[['新文件設定','輸入內容'],['繪圖單位','毫米（mm）'],['頁面寬度','300 mm'],['頁面高度','200 mm'] ],x,y-194,[180,w-180],39,15)
    lesson(c,'01｜開新檔，先用毫米','頁面是排版範圍；不是建築物大小，也不是機器工作台。',newdraw,[('按 Ctrl + N','或選「檔案 → 新增」。'),('設定單位及頁面','繪圖單位選 mm；頁面寬 300、高 200。按確定。'),('完成後應看到','空白橫向頁面。若用老師的 SVG 範本，可直接看「匯入範本」。')])

    def sizedraw(c,x,y,w,h):
        txt(c,'屬性列欄位示意（不是實作截圖）',x,y,w,12,17,MUTED)
        box(c,x,y-108,w,76,PALE);txt(c,'物件大小',x+13,y-42,100,15,20,BLUE,True)
        box(c,x+116,y-67,128,29,WHITE);txt(c,'寬：80 mm',x+123,y-44,117,15,20)
        box(c,x+116,y-103,128,29,WHITE);txt(c,'高：46 mm',x+123,y-80,117,15,20)
        txt(c,'解除\n維持比例',x+277,y-51,132,14,20,AMBER,True)
        face(c,x+44,y-174,320,46,80,False,'前牆／後牆',True)
    lesson(c,'02｜畫第一塊牆：80 × 46 mm','先畫大約大小，再輸入尺寸；不用靠滑鼠拖到準確。',sizedraw,[('按 F6，左鍵拖出矩形','在白色頁面按住左鍵，由一角拖到另一角，放手。'),('改「物件大小」','選中矩形，在上方屬性列解除維持比例；寬輸入 80、高輸入 46，各按 Enter。'),('核對一次','再選矩形，確認仍是 80 × 46 mm。若另一數值跟著變，先解除比例再重輸。')])

    def colordraw(c,x,y,w,h):
        picture(c,HELP,x+118,y,175,160,(714,240,746,454))
        txt(c,'官方色盤局部｜找相同色塊',x,y-168,w,12,17,MUTED)
        box(c,x+20,y-236,54,42,WHITE);txt(c,'×',x+33,y-199,35,25,32,INK,True)
        txt(c,'左鍵點「無色」色塊\n讓矩形內部保持透明。',x+97,y-204,310,17,24)
        c.setStrokeColor(RED);c.setLineWidth(2);c.rect(x+24,y-345,68,56,fill=0,stroke=1)
        txt(c,'右鍵點紅色色塊\n外框用來表示切割。',x+116,y-284,290,17,24)
    lesson(c,'03｜不要填色，只保留外框','課堂識別：紅色外框 = 切割；藍色線條 = 表面雕刻。',colordraw,[('先選牆板','用左邊黑箭頭選取工具，左鍵點矩形。'),('清除填色','在右邊色盤左鍵點「無色」× 色塊。這是滑鼠操作，不是按鍵盤 X。'),('設定外框','右鍵點红色色塊。若變成整塊紅色，按 Ctrl+Z，再用右鍵。實際切割線寬由老師指定。'.replace('红','紅'))])

    def duplicatedraw(c,x,y,w,h):
        face(c,x+37,y-50,155,46,80,False,'原件',False);face(c,x+236,y-112,155,46,80,False,'副本',False)
        arrow(c,(x+180,y-90),(x+259,y-111));key(c,'Ctrl',x+96,y-245,74);txt(c,'+',x+183,y-250,25,19,27);key(c,'D',x+218,y-245,59)
        txt(c,'副本可能已偏移；用選取工具左鍵拖開即可。',x+10,y-311,w-20,17,25,BLUE,True)
    lesson(c,'04｜複製牆板，做齊六件','複製後先移開，避免兩條相同外框疊在一起。',duplicatedraw,[('選前牆，按 Ctrl + D','得到另一塊 80 × 46 mm 的後牆。'),('複製並改尺寸','再複製兩件，改為 56 × 46 mm，做左、右牆。'),('另畫頂板及底板','按 F6 畫 80 × 60 mm，設定無填色及紅外框，再複製一件。合共六塊板。')])

    t=page(c,'05｜停一停：你的六件板齊了嗎？','這一頁是尺寸參考，不是可直接送切的排版檔。','跟做 W1','sixpanels')
    sizes=[('前牆',80,46),('後牆',80,46),('左牆',56,46),('右牆',56,46),('頂板',80,60),('底板',80,60)]
    cw=(CW-50)/3
    for i,(name,pw,ph) in enumerate(sizes):
        x=M+29+(i%3)*(cw+16);yy=t-33-(i//3)*202;ww=min(185,pw*2.3)
        face(c,x,yy,ww,ph,pw,False,name,True)
    end(c)

    def windowsdraw(c,x,y,w,h):
        face(c,x+38,y-55,345,46,80,True,'W1 前牆示例：門窗只刻線',True)
        txt(c,'小窗 8 × 8 mm\n門 10 × 16 mm\n所有線留在牆板之內。',x+40,y-294,w-55,17,25,BLUE,True)
    lesson(c,'06｜加門窗：先做一個，再複製','藍色矩形是表面刻線；不會把整塊窗戶切走。',windowsdraw,[('小窗：按 F6 畫矩形','輸入 8 × 8 mm；左鍵點無色、右鍵點藍色。'),('切回黑箭頭，再拖小窗','用選取工具把小窗放在前牆上方；Ctrl+D 複製、拖開。距外邊至少 3 mm。'),('門：10 × 16 mm','同樣用藍色外框；放在前牆下方，底邊留至少 3 mm。門窗可按自己的外觀設計。')])

    def aligndraw(c,x,y,w,h):
        for i,(xx,yy) in enumerate([(25,90),(132,58),(237,110)]):
            c.setStrokeColor(BLUE);c.setLineWidth(1.7);c.rect(x+xx,y-yy-42,42,42,fill=0,stroke=1)
        txt(c,'對齊前',x,y-165,w,16,23,BLUE,True)
        arrow(c,(x+178,y-198),(x+178,y-236))
        c.setStrokeColor(BLUE)
        for xx in [25,132,237]:c.rect(x+xx,y-319,42,42,fill=0,stroke=1)
        c.setDash(3,3);c.setStrokeColor(AMBER);c.line(x+8,y-298,x+312,y-298);c.setDash()
        txt(c,'對齊後：三個窗中心在同一高度',x,y-339,w,15,21,BLUE,True)
    lesson(c,'07｜排整齊：讓窗戶同一高度','先完成數字輸入，再選物件使用對齊鍵。',aligndraw,[('只選三個窗戶','先點要移動的窗，按住 Shift 加選另一窗，最後點已放好的參考窗。'),('按 E：上下置中','各窗中心變成同一高度。先不要選牆板，否則牆板也可能移動。'),('調整左右間距','點空白取消多選，再用黑箭頭選一個窗。按住 Ctrl 左右拖動，保留同一高度。做錯按 Ctrl+Z。')])

    def textdraw(c,x,y,w,h):
        box(c,x+28,y-132,w-56,82,WOOD,AMBER,1);txt(c,'MY SCHOOL',x+57,y-67,w-110,27,37,NAVY,True)
        key(c,'F8',x+56,y-193,70);arrow(c,(x+163,y-212),(x+241,y-212));key(c,'Ctrl + Q',x+263,y-193,127)
        txt(c,'先保留可改文字的 CDR，\n再另存一份，把文字轉曲線。',x+30,y-281,w-60,18,27,BLUE,True)
    lesson(c,'08｜加招牌（選做）','先完成六塊板，再增加文字。範本本身沒有文字。',textdraw,[('按 F8，左鍵點一下','輸入簡短招牌，例如 MY SCHOOL；切回選取工具再移動。'),('把招牌放在牆內','用藍色外框或按老師指定的雕刻方式。與門窗、外邊保持距離。'),('提交版文字轉曲線','先存可修改版本，再另存提交版；選文字按 Ctrl+Q。轉曲線後不能直接改字。')])

    def importdraw(c,x,y,w,h):
        box(c,x+12,y-165,w-24,145,PALE);txt(c,'templates → W1\nW1_sheet_01.svg',x+33,y-43,w-65,21,30,BLUE,True)
        key(c,'Ctrl + I',x+54,y-215,124)
        txt(c,'匯入游標出現後：\n左鍵點一下；不要拖拉縮放。',x+20,y-284,w-40,19,28,NAVY,True)
    lesson(c,'09｜使用範本：匯入後先核對尺寸','SVG 是可編輯的向量檔；不是把參考照片放入 CorelDRAW。',importdraw,[('按 Ctrl + I','選模型資料夾內的 SVG。若有匯入比例選項，先用「自動」及 1:1。'),('單擊放入頁面','不要拖出一個大小；拖拉會改比例。若全組一起選到，用物件選單取消群組，直到可單選外框。'),('核對一件板','W1 頂板應是 80 × 60 mm。若不符，先停止並請老師檢查匯入比例，再修改圖案。')])

    def layoutdraw(c,x,y,w,h):
        sheet(c,MODELS[0],1,x,y-15,w,280)
        txt(c,'W1 的一張排版示意',x,y-303,w,15,21,BLUE,True)
        txt(c,'每張 SVG 的頁面是 300 × 200 mm。\n圖內沒有尺寸字、零件名或相片。',x,y-337,w,14,20)
    lesson(c,'10｜排版及儲存：交 CDR 給老師','一套完整模型 = 數量 1；不是填入木板零件數目。',layoutdraw,[('外框留空隙','所有板放在頁面內；範本外框相隔至少 6 mm。移動時把該板和門窗一起選取／群組。'),('按 Ctrl + S 儲存','檔案類型用 CorelDRAW（CDR）。\n例：2B_GROUP 2_W1_1.cdr'),('兩張範本怎樣交','每張 SVG 各開一個新文件，匯入後分別儲存，檔尾加 _S01、_S02。\n例：2B_GROUP 2_W3_1_S01.cdr\n兩個檔案都附全圖截圖。')])

    t=page(c,'切割後：先試拼，最後才黏','切割由老師安排；組裝時按老師指示使用合適膠水。','組裝小屋','assembly')
    ef=ASSETS/'W1_exploded.svg'
    if ef.exists():svg(c,ef,M,t,412,320)
    else:model_view(c,MODELS[0],M,t,412,320)
    yy=t
    for h,b in [('1｜先認件，不上膠','找前、後、左、右、頂、底六件；有門的是前牆。'),('2｜底板上圍四面牆','前後牆包住左右牆。先用膠紙固定，檢查四角成直角。'),('3｜試蓋頂板，再黏合','頂板應蓋齊四面牆。合適才逐邊黏合；膠水乾後才疊上層。')]:yy=card(c,h,b,M+437,yy,CW-437,15)
    txt(c,'如果蓋不上：先檢查側牆有沒有夾在前、後牆之間，及有沒有把頂板當牆板。',M,109,CW,16,23,BLUE,True)
    txt(c,'使用熱溶膠或其他工具時，依老師示範；不要接觸熱膠及雷射機加工中的材料。',M,67,CW,12,17,MUTED)
    end(c)

    for i,m in enumerate(MODELS):model_pages(c,m,i)

    t=page(c,'交件前：照這六項檢查','一邊看 CorelDRAW，一邊逐項打勾。','完成與提交','checklist')
    items=[('尺寸正確','文件單位是 mm；已核對至少一件板的寬、高。'),('零件齊全','每個盒子六塊板；兩張 SVG 的模型已交齊兩張。'),('線条分清楚'.replace('条','條'),'外框紅色；門窗蓝色'.replace('蓝','藍')+'刻線；沒有填色遮住圖形。'),('沒有重複外框','Ctrl+D 後已移開；每件板只需一圈切割外框。'),('只交設計內容','切割檔沒有參考照片、尺寸箭嘴或說明標籤；文字依老師要求轉曲線。'),('檔名及檔案齊全','班別_組別_模型代號_數量.cdr；另附全圖截圖，保留原檔。')]
    for j,(h,b) in enumerate(items):card(c,'□ '+h,b,M+(j%2)*(CW+20)/2,t-(j//2)*140,(CW-20)/2,14.5)
    end(c)

    t=page(c,'遇到問題，先看這一頁','做錯先 Ctrl+Z；不要不停重畫。','快速查閱','help')
    items=[('改寬度，高度也變了','先解除維持比例，再依次输入'.replace('输入','輸入')+'寬、高，各按 Enter。'),('矩形整塊變成紅色','按 Ctrl+Z。左鍵是填色；右鍵點色塊才改外框。'),('一移動就整張一起走','物件仍群組在一起；選「物件」內取消群組，直到可選單一外框。'),('找不到畫面中的圖','先按 F4 顯示所有物件；F3 縮小。不要隨便縮放零件本身。'),('匯入後尺寸不對','停止修改，重新檢查匯入比例；不要靠目測拉大。用已知板尺寸核對。'),('木板拼不齊','先檢查拿錯零件及拼接方向；仍不符交老師量板厚、檢查切縫。')]
    for j,(h,b) in enumerate(items):card(c,h,b,M+(j%2)*(CW+20)/2,t-(j//2)*140,(CW-20)/2,14.5)
    end(c)

def model_pages(c,m,i):
    d=m['overall_external_dimensions_mm'];mid=m['id']
    t=page(c,f'{mid}｜{m["name_zh"]}',f"完成外尺寸：寬 {d['width']} × 深 {d['depth']} × 高 {d['height']} mm；共 {m['panel_count']} 件板。",'建築參考',mid)
    picture(c,PHOTO,M,t,366,243,crop_for(i));txt(c,'外形參考｜學生可按時間增減門窗',M,t-253,370,12,17,MUTED)
    model_view(c,m,M+399,t,378,252);txt(c,'本教材組裝示意｜依下表製作各盒子',M+399,t-259,378,12,17,MUTED)
    rows=[['盒子','用途','外寬 × 外深 × 外高（mm）']]
    for mo in m['modules']:
        e=mo['external_dimensions_mm'];rows.append([mo['id'],mo['name_zh'],f"{e['width']} × {e['depth']} × {e['height']}"])
    table(c,rows,M,t-299,[70,210,CW-280],33,14)
    end(c)

    t=page(c,f'{mid}｜照表畫零件','尺寸單位 mm，已扣除 2 mm 板厚。每一格尺寸各做兩件，不要再次扣板厚。','零件尺寸')
    rows=[['盒子','前／後牆 × 2','左／右牆 × 2','頂／底板 × 2']]
    for mo in m['modules']:
        e=mo['external_dimensions_mm'];a,b,h=e['width'],e['depth'],e['height']
        rows.append([mo['id']+' '+mo['name_zh'],f'{a} × {h-4}',f'{b-4} × {h-4}',f'{a} × {b}'])
    table(c,rows,M,t,[160,206,206,CW-572],42,15)
    yy=t-len(rows)*42-34
    txt(c,'組裝位置（從正面看）' if mid in ['W2','W3'] else '組裝位置（從上面看）',M,yy,360,17,23,BLUE,True)
    plan(c,m,M,yy-39,356,200)
    asse={
      'W1':[('一個盒子','先底板，圍牆，再蓋頂板。前後牆包住左右牆。'),('完成高度 50 mm','46 mm 牆高，加上頂板及底板各 2 mm。')],
      'W2':[('A 在下，B 在上','分別完成兩個六面盒，再把 B 放在 A 頂板正中。'),('四周退入 10 mm','B 比 A 的寬、深各小 20 mm；總高 50 + 30 = 80 mm。')],
      'W3':[('由大至小疊起','A 下層 → B 中層 → C 上層，各自先組好完整盒。'),('各層置中','每層左右退入 10 mm，前後退入 7.5 mm；總高 95 mm。')],
      'W4':[('A 橫放後面，B 放左前','B 後牆貼 A 前牆，左邊對齊；中間不重疊。'),('保留兩盒自己的牆','組合外形是 L。右前方留空作操場，總深 40 + 60 = 100 mm。')],
      'W5':[('A 在後，B、C 在兩側','B 與 C 放 A 的左前、右前；後牆貼 A 前牆。'),('中間留 40 mm','兩翼之間是庭院；三盒保留各自的接合牆，沒有重疊。')],
      'W6':[('A 左塔，B 右塔','C 大堂放在中間；三個盒子的底部在同一平面。'),('大堂前後各退入 10 mm','大堂深 40 mm，放在兩座 60 mm 深的塔中間；總寬 60 + 40 + 60 = 160 mm。')]
    }
    sy=yy
    for h,b in asse[mid]:sy=card(c,h,b,M+388,sy,CW-388,14)
    txt(c,'門窗以藍色刻線表示；拼合後看不到的接觸面保持空白。圖示按版面縮放，尺寸以數字為準。',M,64,CW,11.5,16,MUTED)
    end(c)

    t=page(c,f'{mid}｜範本排版及零件對照',f"資料夾 templates/{mid}；共 {m['sheet_count']} 張 SVG。每張頁面 300 × 200 mm。",'範本對照')
    if m['sheet_count']==1:
        sheet(c,m,1,M+108,t-21,560,257);txt(c,'第 1 張',M,t,CW,14,20,BLUE,True)
    else:
        for num in [1,2]:
            x=M+(num-1)*(CW+16)/2;txt(c,f'第 {num} 張',x,t,(CW-16)/2,14,20,BLUE,True);sheet(c,m,num,x,t-26,(CW-16)/2,255)
    txt(c,'圖中小號碼只供此頁對照；切割 SVG 沒有這些標籤。',M,t-289,CW,12,17,MUTED)
    for j,p in enumerate(m['panels']):
        col=j//6;row=j%6;x=M+col*(CW+12)/3;y=t-322-row*19
        txt(c,f"{j+1:02d}  {p['module_id']} {p['name_zh']}",x,y,(CW-24)/3,12.5,18,INK)
    end(c)

def teacher():
    c=canvas.Canvas(str(TEACHER),pagesize=(W,H));c.setTitle('CorelDRAW 2019 木板建築｜教師切割設定表')
    t=page(c,'教師切割設定表','本教材：2 mm 名義板厚、直邊膠合、封閉六面盒；先試切 W1 再全班製作。','教師用')
    y=t
    left=[('加工前填寫','板材：____________　實測厚度：______ mm\n機器／軟件：________________________\n可用範圍：寬 ______ × 高 ______ mm'),('確認工序','紅色：閉合外框 → 切割\n藍色：門窗 → 表面線刻（不穿孔）\n實際顏色、線寬及工序依機器設定。'),('填入已試驗參數','切割速度：_____　功率：_____　次數：_____\n線刻速度：_____　功率：_____　次數：_____\n切縫補償：_____　膠水／夾具：________')]
    for h,b in left:y=card(c,h,b,M,y,(CW-22)/2,13.5)
    y=t
    right=[('檔案與尺寸核對','□ SVG 匯入後量 W1 頂板：80 × 60 mm\n□ 每個盒子六件，總數及兩張分頁齊全\n□ 無重複輪廓、參考圖或尺寸標註'),('先試切及試拼','SVG 為 0.1 mm 顯示線寬，未做切縫補償。\nW1 側板 56 × 46，前後板 80 × 46。\n檢查成品 80 × 60 × 50 mm、直角及屋頂貼合。'),('課堂安排及驗證範圍','9 張 SVG／84 件：已核對名義尺寸、排版及向量結構。未完成實機切割及 CorelDRAW 匯入測試。老師先驗證匯入、板厚與試拼；切割由受訓教師安排。')]
    for h,b in right:y=card(c,h,b,M+(CW+22)/2,y,(CW-22)/2,13.5)
    end(c);c.save()

def build():
    OUT.mkdir(exist_ok=True);PDF.parent.mkdir(exist_ok=True)
    c=canvas.Canvas(str(PDF),pagesize=(W,H),pageCompression=1);c.setTitle('CorelDRAW 2019｜2 mm 木板建築學生指南');c.setAuthor('Urban Studio')
    doc(c);c.save()
    (TMP/'guide-pages.json').write_text(json.dumps(PAGES,ensure_ascii=False,indent=2),encoding='utf8')
    (TMP/'guide-text-audit.json').write_text(json.dumps(AUDIT,ensure_ascii=False,indent=2),encoding='utf8')
    teacher()
    print('Student pages',len(PAGES)-1,'PDF',PDF)

if __name__=='__main__':build()
