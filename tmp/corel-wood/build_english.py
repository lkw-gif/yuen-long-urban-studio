"""English edition using the same geometry, illustrations and page sequence."""
import json,re,io
from pathlib import Path
import build_guide as g
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from xml.sax.saxutils import escape

source=json.loads((g.TMP/'translate-strings.json').read_text(encoding='utf8'))
EN={
0:'Build Hong Kong buildings with wood',1:'Student guide',
2:'CorelDRAW 2019 (Windows) | Form 2 | 2 mm wood',
3:'Form 2 wooden buildings | CorelDRAW 2019 | 2 mm wood',
4:'Draw flat parts. Assemble a 3D building.',
5:'Start with W1, then choose a building. Each step: find the tool, do the action, check the result.',
6:'Class: __________   Group: __________   Name: ________________',
7:'Choose a model: start with W1',8:'Model menu',
9:'Click a picture to jump to its dimensions. New to CorelDRAW? Complete W1 first.',
10:'W1 Single-storey house',12:'W2 Two-level stepped building',14:'W3 Three-level mall',16:'W4 L-shaped school',18:'W5 U-shaped school',20:'W6 Twin-block commercial building',
22:'Pictures show the style. Use this guide for sizes: straight edges, flat roofs and engraved doors and windows.',
23:'How six panels make a house',24:'Panel joints',25:'W1 finished outer size: width 80 × depth 60 × height 50 mm.',
26:'Roof',27:'Left wall',28:'Back wall',29:'Front wall',30:'Right wall',31:'Base',
32:'Exploded view: gaps separate the parts for viewing only.',
33:'One roof and one base',34:'80 × 60 mm. These cover the top and bottom of all four walls.',
35:'One front and one back wall',37:'One left and one right wall',
39:'Side walls fit BETWEEN the front and back walls. The listed sizes already allow for wood thickness. Do not subtract it again.',
40:'01 | New document: use millimetres',41:'Basic skills',
42:'The page is your layout area. It is not the building size or the laser machine bed.',
43:'Start in the File menu. The table shows the settings.',44:'Document settings',45:'Enter',46:'Drawing units',47:'Millimetres (mm)',48:'Page width',50:'Page height',
52:'Press Ctrl + N',53:'Or choose File > New.',54:'Set the units and page',55:'Choose mm. Set width to 300 and height to 200. Click OK.',
56:'Check the result',57:'You should see a blank landscape page. Now draw the first wall.',
58:'02 | First wall: 80 × 46 mm',59:'Draw a rough rectangle, then enter its size. Your mouse does not need to be exact.',
60:'Property bar diagram (not a live screenshot)',61:'Object size',62:'W: 80 mm',63:'H: 46 mm',64:'Unlock\naspect ratio',65:'Front / back wall',
66:'Press F6; drag with the left button',67:'On the white page, hold the left mouse button. Drag from one corner to another, then release.',
68:'Set the object size',69:'Select the rectangle. Unlock the aspect ratio on the property bar. Enter width 80 and height 46; press Enter after each.',
70:'Check both numbers',71:'Select it again: it must be 80 × 46 mm. If one value changes the other, unlock the ratio and re-enter both.',
72:'03 | No fill: keep the outline',73:'Classroom colours: red outlines = cutting; blue lines = surface engraving.',
74:'Official palette detail: find these swatches',
76:'LEFT-click the No Color swatch.\nKeep the inside transparent.',
77:'RIGHT-click the red swatch.\nThe outline marks a cut.',
78:'Left',79:'Select the wall',80:'Choose the black-arrow Pick tool. Left-click the rectangle outline.',
81:'Remove the fill',82:'On the right palette, LEFT-click the No Color (×) swatch. Use the mouse, not the X key.',
83:'Right',84:'Set the outline',85:'RIGHT-click red. If the whole shape turns red, press Ctrl+Z and try the right button. Use the line width your teacher specifies.',
86:'04 | Duplicate: make all six panels',87:'Move each copy apart so identical cutting outlines do not overlap.',88:'Original',89:'Copy',
93:'A copy may already be offset. Use the Pick tool and drag its outline apart with the left button.',
94:'Select the front wall; Ctrl + D',95:'This makes the back wall: another 80 × 46 mm rectangle.',
96:'Duplicate and resize',97:'Make two more copies. Set each to 56 × 46 mm for the left and right walls.',
98:'Draw the roof and base',99:'Press F6. Draw 80 × 60 mm with no fill and a red outline. Duplicate it once. You now have six panels.',
100:'05 | Pause: do you have six panels?',101:'Make W1',102:'Dimensions for reference. This page is not a ready-to-cut layout file.',
103:'06 | Doors and windows: draw, then copy',104:'Blue rectangles are surface engraving lines. They do not cut the windows out.',
105:'W1 front wall: engrave doors and windows',106:'Window: 8 × 8 mm\nDoor: 10 × 16 mm\nKeep every line inside the wall.',
107:'Window: press F6',108:'Draw a rectangle, 8 × 8 mm. Left-click No Color; right-click blue.',
109:'Use the Pick tool to move it',110:'Place it near the top of the front wall. Press Ctrl+D and move each copy apart. Stay at least 3 mm from outer edges.',
111:'Door: 10 × 16 mm',112:'Use a blue outline near the bottom of the front wall. Leave at least 3 mm below it. You may design your own door and window layout.',
113:'07 | Align windows at the same height',114:'Finish entering numbers before selecting objects and using alignment keys.',
115:'Before alignment',116:'After: all three centres are at the same height',
117:'Select only three windows',118:'Click a window to move. Hold Shift and select another. Select the correctly placed reference window last.',
119:'Press E: align centres vertically',120:'Their centres move to the same height. Do not include the wall in the selection: it could move too.',
121:'Adjust the gaps',122:'Click blank space, then select one window with the Pick tool. Hold Ctrl while dragging sideways to keep its height. Undo with Ctrl+Z.',
123:'08 | Add a sign (optional)',124:'Finish all six panels first. The templates do not contain text.',
128:'Keep an editable CDR copy first.\nSave another copy and convert its text to curves.',
129:'Press F8; left-click once',130:'Type a short sign, such as MY SCHOOL. Switch to the Pick tool to move it.',
131:'Keep the sign inside the wall',132:'Use a blue outline, or the engraving method your teacher specifies. Keep clear of doors, windows and outer edges.',
133:'Convert text in the submission copy',134:'Save an editable copy, then a submission copy. Select the text and press Ctrl+Q. You cannot directly edit the wording after conversion.',
135:'09 | Arrange and save your CDR',136:'One complete model = quantity 1. Do not use the number of panels as the quantity.',
137:'W1 layout | Above: number / width; left: height',
138:'Units: mm. SVG page: 300 × 200 mm.\nDimension labels are only in this guide, not the cutting file.',
139:'Leave space between outlines',140:'Keep all panels on the page, at least 6 mm apart as in the template. Select or group each panel with its door and windows before moving.',
141:'Press Ctrl + S to save',142:'Choose CorelDRAW (CDR).\nExample: 2B_GROUP 2_W1_1.cdr',
143:'For a two-sheet template',144:'Import each SVG into a separate new document. Save with _S01 or _S02 at the end.\nExample: 2B_GROUP 2_W3_1_S01.cdr\nInclude a full-view screenshot of each file.',
145:'After cutting: test-fit before gluing',146:'Assembly',147:'Your teacher arranges cutting. Use the glue and assembly method your teacher recommends.',
148:'1 | Identify all six parts',149:'Find front, back, left, right, roof and base. The front wall has the door. Do not glue yet.',
150:'2 | Put four walls on the base',151:'Fit the side walls between the front and back walls. Hold them with tape. Check that all corners are square.',
152:'3 | Test the roof, then glue',153:'The roof should cover all four walls. If it fits, glue the joints one at a time. Let the glue dry before stacking boxes.',
154:'Roof does not fit? Check that side walls sit between front and back walls, and that you have not used the roof as a wall.',
155:'Follow your teacher when using hot glue or tools. Do not touch hot glue or material while the laser is working.',
157:'Building guide',159:'Style reference: adjust the number of windows to suit your time',
160:'Assembly diagram: use the box sizes below',161:'Box',162:'Use',163:'Outer W × D × H (mm)',165:'Main box',
168:'Panel sizes',169:'All sizes in mm, adjusted for 2 mm wood. Make TWO of each listed size. Do not subtract thickness again.',
170:'Front / back × 2',171:'Left / right × 2',172:'Roof / base × 2',
177:'Box positions (top view)',178:'Front',179:'One box',180:'Start with the base, add walls, then the roof. Front and back walls cover the ends of the side walls.',
181:'Finished height: 50 mm',182:'46 mm walls, plus a 2 mm roof and a 2 mm base.',
183:'Blue lines engrave doors and windows. Leave hidden joining faces blank. Diagrams are scaled to fit; use the stated dimensions.',
185:'Template key',187:'Sheet 1',188:'Above: part number / width; left: height. Units: mm. Spacing adjusted for clarity; cutting SVGs have no labels.',
197:'Lower box',199:'Upper box',207:'Box positions (front view)',208:'Ground',209:'A below, B above',
210:'Build two complete six-panel boxes. Centre B on the roof of A.',211:'Inset 10 mm on all sides',212:'B is 20 mm smaller in width and depth than A. Total height: 50 + 30 = 80 mm.',
224:'Middle box',239:'Stack largest to smallest',240:'Build each box first. Stack A (bottom), B (middle), then C (top).',241:'Centre each layer',242:'Each layer is inset 10 mm at each side and 7.5 mm at front and back. Total height: 95 mm.',245:'Sheet 2',
266:'Rear block',268:'Left wing',279:'A at the back; B at front left',280:'Place the back of B against the front of A. Align their left edges. Do not overlap the boxes.',
281:'Keep all walls of both boxes',282:'The layout makes an L. Leave the front-right space for a playground. Total depth: 40 + 60 = 100 mm.',
300:'Right wing',305:'A at the back; B and C in front',306:'Place B at the front left and C at the front right of A. Their back walls touch the front wall of A.',
307:'Leave a 40 mm courtyard',308:'The gap between the wings is the courtyard. Keep each box’s joining walls. Do not overlap the boxes.',
323:'Left tower',325:'Right tower',326:'Entrance lobby',337:'A on the left; B on the right',338:'Place lobby C in the middle. The bottoms of all three boxes sit at the same level.',
339:'Lobby inset: 10 mm front and back',340:'Centre the 40 mm-deep lobby between the 60 mm-deep towers. Total width: 60 + 40 + 60 = 160 mm.'
}
EXACT={source[i]:v for i,v in EN.items()}
NAMES={'單層小屋':'Single-storey house','兩層退台建築':'Two-level stepped building','三層商場':'Three-level mall','L 形學校':'L-shaped school','U 形學校':'U-shaped school','雙塔商業樓':'Twin-block commercial building',
'底板':'Base','頂板':'Roof','前牆':'Front','後牆':'Back','左牆':'Left','右牆':'Right','主體':'Main box','下層':'Lower box','上層':'Upper box','中層':'Middle box','後座':'Rear block','左翼':'Left wing','右翼':'Right wing','左塔':'Left tower','右塔':'Right tower','入口大堂':'Lobby'}
def tr(s):
    s=str(s)
    if s in EXACT:return EXACT[s]
    s=re.sub(r'完成外尺寸：寬 (\d+) × 深 (\d+) × 高 (\d+) mm；共 (\d+) 件板。',r'Finished outer size: W \1 × D \2 × H \3 mm; \4 panels.',s)
    s=re.sub(r'資料夾 templates/(W\d)；共 (\d) 張 SVG。每張頁面 300 × 200 mm。',r'Folder: templates/\1 | \2 SVG sheet(s) | Each page: 300 × 200 mm.',s)
    s=s.replace('照表畫零件','Draw the panels').replace('範本排版及零件對照','Template layout and part key')
    for a,b in NAMES.items():s=s.replace(a,b)
    s=s.replace(' 件',' panels').replace('｜',' | ').replace('。','.')
    if re.search('[\u4e00-\u9fff]',s):raise ValueError('Untranslated: '+s)
    return s

pdfmetrics.registerFont(TTFont('EN','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ENB','C:/Windows/Fonts/arialbd.ttf'))
def para(s,w,size,leading=None,bold=False,col=g.INK):
    p=Paragraph(escape(tr(s)).replace('\n','<br/>'),ParagraphStyle('en',fontName='ENB' if bold else 'EN',fontSize=size,leading=leading or size*1.3,textColor=col,splitLongWords=False))
    _,h=p.wrap(w,1000)
    return p,h
def txt(c,s,x,y,w,size=15,leading=None,col=g.INK,bold=False):
    text=tr(s)
    if c.getPageNumber()==2 and re.match(r'^W[1-6] ',text):
        y+=5;size=14.5;leading=17
    if c.getPageNumber()==2 and ' panels' in text:y-=10
    if c.getPageNumber()==13 and y==109:y+=12
    p,h=para(text,w,size,leading,bold,col)
    p.drawOn(c,x,y-h)
    g.AUDIT.append(dict(page=c.getPageNumber(),text=text,x=x,y=y-h,w=w,top=y))
    if y>35 and y-h<38:raise ValueError(f'Overflow p{c.getPageNumber()}: {text} / {y-h}')
    return y-h
def page(c,title,sub='',tag='學生指南',key=None):
    n=c.getPageNumber();key=key or f'p{n}';title=tr(title)
    c.bookmarkPage(key);c.addOutlineEntry(title,key,0);g.PAGES.append(dict(page=n,title=title,key=key))
    c.setFillColor(g.BLUE);c.roundRect(g.M,g.H-63,5,29,2,fill=1,stroke=0)
    fs=24
    while pdfmetrics.stringWidth(title,'ENB',fs)>g.CW-140:fs-=.5
    txt(c,title,g.M+16,g.H-29,g.CW-140,fs,30,g.NAVY,True)
    txt(c,tag,g.W-g.M-112,g.H-34,112,15,20,g.BLUE,True)
    txt(c,sub,g.M+16,g.H-66,g.CW-16,12.5,16,g.MUTED)
    c.setStrokeColor(g.LINE);c.line(g.M,31,g.W-g.M,31)
    txt(c,source[3],g.M,25,g.CW-50,9,12,g.MUTED)
    c.setFont('EN',10);c.setFillColor(g.MUTED);c.drawRightString(g.W-g.M,14,str(n))
    return g.TOP
def card(c,head,body,x,y,w,size=15,fill=g.PALE):
    hp,hh=para(head,w-26,15,19.5,True,g.BLUE)
    bp,bh=para(body,w-26,size,size*1.3)
    ht=hh+bh+27
    g.box(c,x,y-ht,w,ht,fill)
    txt(c,head,x+13,y-10,w-26,15,19.5,g.BLUE,True)
    txt(c,body,x+13,y-16-hh,w-26,size,size*1.3)
    return y-ht-12
def lesson(c,title,sub,draw,items,tag='基本操作',mouse_buttons=None):
    t=page(c,title,sub,tag);draw(c,g.M,t,426,376);y=t
    for i,(head,body) in enumerate(items):
        if mouse_buttons:
            x=g.M+448;w=g.CW-448
            _,bh=para(body,w-26,14.5,18.85)
            ht=bh+85
            g.box(c,x,y-ht,w,ht)
            g.mouse_icon(c,x+15,y-9,mouse_buttons[i])
            txt(c,head,x+65,y-17,w-80,15,19.5,g.BLUE,True)
            txt(c,body,x+13,y-75,w-26,14.5,18.85)
            y-=ht+10
        else:y=card(c,head,body,g.M+448,y,g.CW-448,14.5)
    g.end(c)
def table(c,rows,x,top,widths,rowh=36,size=14):
    y=top
    for i,row in enumerate(rows):
        cells=[];rh=rowh
        for val,w in zip(row,widths):
            p,h=para(val,w-16,size,18,i==0,g.WHITE if i==0 else g.INK)
            cells.append((val,w));rh=max(rh,h+12)
        xx=x
        for val,w in cells:
            c.setFillColor(g.BLUE if i==0 else (g.PALE if i%2 else g.WHITE));c.rect(xx,y-rh,w,rh,fill=1,stroke=0)
            txt(c,val,xx+9,y-6,w-16,size,18,g.WHITE if i==0 else g.INK,i==0);xx+=w
        y-=rh
    return y

def build():
    g.txt=txt;g.page=page;g.card=card;g.lesson=lesson;g.table=table
    g.AUDIT=[];g.PAGES=[]
    out=g.ROOT/'output/pdf/coreldraw-2019-wood-building-student-guide-en.pdf'
    c=g.canvas.Canvas(str(out),pagesize=(g.W,g.H),pageCompression=1)
    c.setTitle('CorelDRAW 2019 | Wooden Buildings | Student Guide');c.setAuthor('Urban Studio')
    g.doc(c);c.save()
    (g.TMP/'english-text-audit.json').write_text(json.dumps(g.AUDIT,ensure_ascii=False,indent=2),encoding='utf8')
    (g.TMP/'english-pages.json').write_text(json.dumps(g.PAGES,ensure_ascii=False,indent=2),encoding='utf8')
    print('English pages:',len(g.PAGES),'PDF:',out)
if __name__=='__main__':build()
