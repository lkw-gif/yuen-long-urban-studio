"""Building reference edition: remove basic lessons, add dimensioned three views."""
import json, math, shutil
from pathlib import Path
import numpy as np
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
import build_teaching_pack as p

ROOT=p.ROOT
OUT=p.OUT
QA=ROOT/'tmp/pdfs/building-pack-dimensions'
QA.mkdir(exist_ok=True)
RED=colors.HexColor('#D34A36')
SELECT={'R1':'長條主樓','R2':'中央塔身','R3':'中央高樓','R4':'左翼','R5':'左塔',
        'M1':'上層住宅','M2':'左住宅塔','M3':'高住宅塔','C1':'主塔','C2':'主塔',
        'C3':'中層塔身','C4':'右塔','S1':'教學樓','S2':'後翼','B1':'升降機塔','B2':'左塔'}
DA=[]
def n(v):return f'{float(v):g}'
def solids(m):return [q for q in m['boxes'] if q['role']!='window']
def bounds(m):
    qs=solids(m)
    lo=np.array([min(q[a] for q in qs) for a in ['x','y','z']])
    hi=np.array([max(q[a]+q[d] for q in qs) for a,d in [('x','w'),('y','d'),('z','h')]])
    return lo,hi
def main(m):return next(q for q in solids(m) if q['name']==SELECT[m['id']])

def label(c,s,point,col=p.BLUE,angle=0,size=12):
    x,y=point;fw=pdfmetrics.stringWidth(s,p.b.FONT_BOLD,size)
    c.saveState();c.translate(x,y);c.rotate(angle)
    c.setFillColor(colors.white);c.roundRect(-fw/2-3,-4,fw+6,size+7,2,fill=1,stroke=0)
    c.setFillColor(col);c.setFont(p.b.FONT_BOLD,size);c.drawCentredString(0,0,s)
    c.restoreState()
    DA.append({'page':c.getPageNumber(),'text':s,'x':round(x,1),'y':round(y,1),'angle':angle})

def dim(c,a,b,off,text,col=p.BLUE,side=1,size=12,rotate=True):
    """Measured endpoints a/b, parallel dimension line offset from geometry."""
    a=np.array(a,float);b=np.array(b,float);off=np.array(off,float)
    u=a+off;v=b+off;vv=v-u;ll=np.linalg.norm(vv)
    if ll<.1:return
    direction=vv/ll;perp=np.array([-direction[1],direction[0]])
    normoff=off/np.linalg.norm(off) if np.linalg.norm(off) else perp
    c.setStrokeColor(col);c.setFillColor(col);c.setLineWidth(.8)
    for src,dst in [(a,u),(b,v)]:
        st=src+normoff*2;en=dst+normoff*4;c.line(*st,*en)
    c.setLineWidth(1.1);c.line(*u,*v)
    ah=min(5.3,ll*.2);aw=2.1
    for tip,taildir in [(u,direction),(v,-direction)]:
        base=tip+taildir*ah
        path=c.beginPath();path.moveTo(*tip);path.lineTo(*(base+perp*aw));path.lineTo(*(base-perp*aw));path.close()
        c.drawPath(path,fill=1,stroke=0)
    angle=math.degrees(math.atan2(direction[1],direction[0])) if rotate else 0
    if angle>90:angle-=180
    if angle<-90:angle+=180
    lab=(u+v)/2+perp*side*7
    label(c,text,lab,col,angle,size)

def iso(c,m,x,top,w,h):
    path=p.SCR/f'{m["id"]}-6.png'
    im=Image.open(path);bb=im.getbbox();sw,sh=im.size
    l,t,r,b=bb;f=min(w/(r-l),h/(b-t));dw=(r-l)*f;dh=(b-t)*f
    px=x+(w-dw)/2;py=top-dh
    p.pic(c,path,x,top,w,h,bb)
    pts=[]
    for q in solids(m):
        pts.extend((q['x']+dx,q['y']+dy,q['z']+dz) for dx in (0,q['w']) for dy in (0,q['d']) for dz in (0,q['h']))
    def proj(q):return np.array([(q[0]+q[1])*.866,1.2*q[2]+.5*(q[1]-q[0])])
    pp=np.array([proj(q) for q in pts]);mi=pp.min(0);ma=pp.max(0);ct=(ma+mi)/2
    sc=min((900-65)/(ma[0]-mi[0]),(650-38)/(ma[1]-mi[1]))
    def at(q):
        a=proj(q);sx=(a[0]-ct[0])*sc+450;sy=325-(a[1]-ct[1])*sc
        return np.array([px+(sx-l)*f,top-(sy-t)*f])
    return at

def ortho(c,m,x,top,w,h,view):
    lo,hi=bounds(m);d=hi-lo
    axes=(0,2) if view=='front' else (0,1)
    wid,hei=d[axes[0]],d[axes[1]]
    sc=min(w/wid,h/hei);left=x+(w-wid*sc)/2;bottom=top-h+(h-hei*sc)/2
    def at(q):return np.array([left+(q[axes[0]]-lo[axes[0]])*sc,bottom+(q[axes[1]]-lo[axes[1]])*sc])
    qs=sorted(solids(m),key=(lambda q:-q['y']) if view=='front' else (lambda q:q['z']+q['h']))
    for q in qs:
        point=at((q['x'],q['y'],q['z']))
        ww=q['w']*sc;hh=q['h' if view=='front' else 'd']*sc
        if q['role']=='base':col=colors.HexColor('#C1CEDA')
        elif m['category']=='住宅':col=colors.HexColor('#4C83CF')
        else:col=colors.HexColor('#E1E8EF')
        c.setFillColor(col);c.setStrokeColor(colors.HexColor('#8FA2B5'));c.setLineWidth(.45)
        c.rect(*point,ww,hh,fill=1,stroke=1)
    # Emphasise the measured main part with a fine outline, without covering text.
    q=main(m);pt=at((q['x'],q['y'],q['z']))
    c.setStrokeColor(RED);c.setLineWidth(1.1)
    c.rect(*pt,q['w']*sc,q['h' if view=='front' else 'd']*sc,fill=0,stroke=1)
    return at

def dimension_page(c,m):
    lo,hi=bounds(m);d=hi-lo;q=main(m)
    top=p.page(c,f'{m["id"]}  三視圖與尺寸',f'藍色：整體（連底板）｜紅色：{q["name"]}｜單位 mm；其餘部件尺寸見前頁。','尺寸參考')
    gap=12;ww=(p.CW-gap*2)/3;bottom=177;hh=top-bottom
    for i,t in enumerate(['1. 立體圖','2. 正面圖','3. 俯視圖']):
        x=p.M+i*(ww+gap);p.rect(c,x,bottom,ww,hh,colors.white)
        p.para(c,t,x+13,top-12,ww-26,17,23,p.NAVY,True)
    x=p.M
    a=iso(c,m,x+24,top-53,ww-83,226)
    # Width/depth measure the base footprint; vertical arrow is total envelope height.
    dim(c,a(lo),a((hi[0],lo[1],lo[2])),(0,-18),f'寬 {n(d[0])}',side=-1,size=11.5)
    dim(c,a((hi[0],lo[1],lo[2])),a((hi[0],hi[1],lo[2])),(17,-5),f'深 {n(d[1])}',side=-1,size=11.5)
    topobjects=[s for s in solids(m) if abs(s['z']+s['h']-hi[2])<.001]
    tallest=max(topobjects,key=lambda s:s['x']+s['w']+s['y']+s['d'])
    foot=(tallest['x']+tallest['w'],tallest['y']+tallest['d'],lo[2])
    htbase=a(foot);httop=a((foot[0],foot[1],hi[2]))
    dim(c,htbase,httop,(x+ww-31-htbase[0],0),f'高 {n(d[2])}',side=-1,size=11.5)
    x=p.M+ww+gap
    af=ortho(c,m,x+44,top-56,ww-91,222,'front')
    dim(c,af(lo),af((hi[0],lo[1],lo[2])),(0,-19),f'{n(d[0])} mm',side=-1)
    dim(c,af((hi[0],lo[1],lo[2])),af(hi),(21,0),f'{n(d[2])} mm',side=-1)
    left=af(lo)[0]
    qa=af((q['x'],q['y'],q['z']));qb=af((q['x'],q['y'],q['z']+q['h']))
    dim(c,qa,qb,(left-18-qa[0],0),f'{n(q["h"])} mm',RED,side=1)
    x=p.M+2*(ww+gap)
    at=ortho(c,m,x+43,top-78,ww-89,190,'top')
    dim(c,at(lo),at((hi[0],lo[1],lo[2])),(0,-21),f'{n(d[0])} mm',side=-1)
    dim(c,at((hi[0],lo[1],lo[2])),at(hi),(20,0),f'{n(d[1])} mm',side=-1)
    l2=at(lo)[0];t2=at(hi)[1]
    qa=at((q['x'],q['y']+q['d'],q['z']));qb=at((q['x']+q['w'],q['y']+q['d'],q['z']))
    dim(c,qa,qb,(0,t2+18-qa[1]),f'{n(q["w"])} mm',RED,side=1)
    qa=at((q['x'],q['y'],q['z']));qb=at((q['x'],q['y']+q['d'],q['z']))
    dim(c,qa,qb,(l2-17-qa[0],0),f'{n(q["d"])} mm',RED,side=1)
    # Text summary gives the same numbers as the three arrow views.
    data=[('整體尺寸（連底板）',f'寬 × 深 × 高 = {n(d[0])} × {n(d[1])} × {n(d[2])} mm',p.BLUE),
          (q['name'],f'寬 × 深 × 高 = {n(q["w"])} × {n(q["d"])} × {n(q["h"])} mm',RED)]
    for i,(head,body,col) in enumerate(data):
        xx=p.M+i*(p.CW+14)/2;wid=(p.CW-14)/2
        p.rect(c,xx,79,wid,83,p.PALE)
        p.para(c,head,xx+12,151,wid-24,14,20,col,True)
        p.para(c,body,xx+12,123,wid-24,14,20)
    p.para(c,'箭嘴標示模型尺寸，並非擺放位置。各視圖按版面縮放，請以標示數字為準。',p.M,65,p.CW,11.5,16,p.MUTED)
    p.finish(c)

def build():
    ms=p.load_models()
    # Remove references to lessons that no longer exist in this edition.
    for m in ms:
        for s in m['steps']:
            s['action']=s['action'].replace('見基本操作：凹窗。','按尺寸表做 Hole，排好後與牆群組。').replace('；見第 9 頁','').replace('見基本操作「凹窗」。','先排孔洞，再與牆群組。')
    if OUT.exists() and not (QA/'previous-teaching-pack.pdf').exists():shutil.copy2(OUT,QA/'previous-teaching-pack.pdf')
    c=canvas.Canvas(str(OUT),pagesize=(p.PW,p.PH),pageCompression=1)
    c.setTitle('香港建築建模參考｜三視圖與尺寸');c.setAuthor('Urban Studio')
    c.setSubject('16款建築參考、尺寸箭嘴、模型製作')
    top=p.page(c,'參考香港建築，製作你的模型','中二 Tinkercad｜16 款建築參考與尺寸圖','學生教材','cover')
    for i,mid in enumerate(['R2','M2','S2','B2']):p.pic(c,p.SCR/f'{mid}-6.png',p.M+i*p.CW/4,top,p.CW/4,235)
    p.para(c,'請選擇一款建築物，參考外形、三視圖及箭嘴標示的尺寸，\n在 Tinkercad 製作自己的建築模型。',p.M,top-245,p.CW,21,30,p.NAVY,True)
    yy=top-324
    items=[('01  選款','從下一頁選擇住宅、商業、學校或天橋。'),('02  參考尺寸製作','所有尺寸用 mm；先做主要外形，再加窗戶等細節。'),('03  完成並提交','檢查各部件相連，提交 STL 和完成截圖。')]
    for i,(h,t) in enumerate(items):p.card(c,h,t,p.M+i*(p.CW+12)/3,yy,(p.CW-24)/3,13.5)
    p.para(c,'班別：____________　姓名：________________　組別：____________',p.M,65,p.CW,14,20)
    p.finish(c)
    for i,m in enumerate(ms):m['page']=4+3*i
    p.chooser(c,ms[:8],1);p.chooser(c,ms[8:],2)
    for m in ms:
        p.intro(c,m)
        dimension_page(c,m)
        p.steps_page(c,m)
    top=p.page(c,'匯出 STL：把模型交給老師','保留原有匯出參考，完成模型後使用。','提交參考','export')
    p.pic(c,p.b.ASSET_DIR/'step-35.jpg',p.M,top,432,350)
    yy=top
    for h,t in [('1｜按 Export','選好完整模型，右上方按 Export。只交所選模型時，範圍選 The selected shape。'),('2｜下載 .STL','在 For 3D Print 下按 .STL。\n檔名：班別_組別_模型代號_數量\n例：2B_GROUP 2_B1_1.stl\n（2B 班、第 2 組、B1 模型、1 件）'),('3｜一起交完成截圖','截圖要見到完整外形。STL 交老師以毫米匯入切片軟件，檢查厚度、支撐及打印方向。')]:yy=p.card(c,h,t,p.M+452,yy,p.CW-452)
    p.finish(c)
    c.save()
    (QA/'dimension-labels.json').write_text(json.dumps(DA,ensure_ascii=False,indent=2),encoding='utf-8')
    (QA/'pages.json').write_text(json.dumps(p.PAGES,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Created',OUT,'pages',len(p.PAGES))

if __name__=='__main__':build()
