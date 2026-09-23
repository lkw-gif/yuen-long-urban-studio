"""English edition of the 52-page Tinkercad Hong Kong building teaching pack."""
from __future__ import annotations

import json, io, math, re
from pathlib import Path
from xml.sax.saxutils import escape
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader

import build_student_guide as b
import revise_student_guide as r
import build_teaching_pack as src

ROOT = b.ROOT
OUT = ROOT / 'output/pdf/tinkercad-hong-kong-building-teaching-pack-en.pdf'
SCR = ROOT / 'tmp/pdfs/building-pack'
REF = src.REF
PW, PH = landscape(A4)
M, CW, TOP, BOT = 32, PW - 64, PH - 94, 43
BLUE, NAVY, INK, MUTED, PALE, LINE = b.BLUE, b.NAVY, b.INK, b.MUTED, b.PALE, b.LINE
ORANGE, GREEN = b.ORANGE, b.GREEN
PAGES = []
EMBED = {}


def para(c, s, x, y, w, size=14, leading=None, color=INK, bold=False):
    st = ParagraphStyle('en', fontName=b.FONT_BOLD if bold else b.FONT_REG, fontSize=size,
                        leading=leading or size * 1.4, textColor=color, wordWrap='CJK')
    p = Paragraph(escape(str(s)).replace('\n', '<br/>'), st)
    _, hh = p.wrap(w, 900)
    p.drawOn(c, x, y - hh)
    return y - hh


def rect(c, x, y, w, h, fill=PALE, stroke=LINE, radius=7):
    c.setFillColor(fill); c.setStrokeColor(stroke); c.setLineWidth(.65)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def page(c, title, sub='', section='Common controls', key=None):
    num = c.getPageNumber(); key = key or f'p{num}'
    c.bookmarkPage(key); c.addOutlineEntry(title, key, level=0)
    PAGES.append({'page': num, 'title': title, 'key': key})
    c.setFillColor(BLUE); c.roundRect(M, PH - 62, 5, 28, 2, fill=1, stroke=0)
    # Reserve a wider, fixed area for the right-hand section label.  The
    # previous 145 pt area wrapped "Dimension reference" onto a second line.
    section_w = 185
    para(c, title, M + 16, PH - 29, CW - section_w - 8, 24, 30, NAVY, True)
    para(c, sub, M + 16, PH - 65, CW - 16, 12.3, 16, MUTED)
    para(c, section, PW - M - section_w, PH - 33, section_w, 15, 20, BLUE, True)
    c.setStrokeColor(LINE); c.line(M, 32, PW - M, 32)
    para(c, 'Hong Kong Community Modelling | Form 2 Tinkercad pack', M, 25, 390, 9.5, 12, MUTED)
    c.setFillColor(MUTED); c.setFont(b.FONT_LATIN, 10); c.drawRightString(PW - M, 14, str(num))
    return TOP


def finish(c): c.showPage()


def card(c, head, body, x, y, w, size=14, fill=PALE):
    st = ParagraphStyle('measure-en', fontName=b.FONT_REG, fontSize=size, leading=size * 1.4, wordWrap='CJK')
    p = Paragraph(escape(body).replace('\n', '<br/>'), st); _, ph = p.wrap(w - 26, 999)
    hh = ph + 48; rect(c, x, y - hh, w, hh, fill)
    para(c, head, x + 13, y - 10, w - 26, 14, 19, BLUE, True)
    para(c, body, x + 13, y - 34, w - 26, size, size * 1.4)
    return y - hh - 10


def pic(c, path, x, y, w, h, crop=None, boxes=(), arrows=()):
    sw, sh = Image.open(path).size
    l, t, rr, bb = crop or (0, 0, sw, sh)
    scale = min(w / (rr - l), h / (bb - t)); dw = (rr - l) * scale; dh = (bb - t) * scale
    px, py = x + (w - dw) / 2, y - dh
    c.saveState(); q = c.beginPath(); q.rect(px, py, dw, dh); c.clipPath(q, stroke=0)
    if Path(path).parent == REF:
        if str(path) not in EMBED:
            buf = io.BytesIO(); Image.open(path).convert('RGB').save(buf, format='JPEG', quality=91, subsampling=0); buf.seek(0); EMBED[str(path)] = ImageReader(buf)
        source = EMBED[str(path)]
    else: source = str(path)
    c.drawImage(source, px - l * scale, py - (sh - bb) * scale, sw * scale, sh * scale, mask='auto')
    c.restoreState()
    c.setStrokeColor(ORANGE); c.setLineWidth(1.3)
    for xx, yy, ww, hh in boxes: c.rect(px + (xx - l) * scale, y - (yy - t + hh) * scale, ww * scale, hh * scale, fill=0, stroke=1)
    for x1, y1, x2, y2 in arrows: r.arrow(c, px + (x1 - l) * scale, y - (y1 - t) * scale, px + (x2 - l) * scale, y - (y2 - t) * scale)
    return y - dh


def lesson(c, title, sub, shot, items, crop=None, boxes=(), imageh=350, key=None):
    y = page(c, title, sub, key=key); left = 432; right = CW - left - 20
    path = b.EDITOR if shot == 'editor' else b.ASSET_DIR / f'step-{shot:02d}.jpg'
    rect(c, M, y - imageh, left, imageh, colors.white); pic(c, path, M + 6, y - 6, left - 12, imageh - 12, crop, boxes)
    para(c, 'Use the screenshot to find the tool; use the written dimensions for practice.', M, y - imageh - 10, left, 11, 15, MUTED)
    yy = y
    for h, body in items: yy = card(c, h, body, M + left + 20, yy, right)
    finish(c)


def mouse_page(c):
    y = page(c, '02  Mouse: identify the controls', 'Hold = keep the button down. Drag = hold, move, then release.', key='mouse')
    x, bt, ww, hh = M + 118, y - 297, 172, 240
    rect(c, x, bt, ww, hh, b.PALE_BLUE, BLUE, 48)
    c.setStrokeColor(BLUE); c.line(x + 86, bt + 152, x + 86, bt + 233); c.line(x + 10, bt + 152, x + 162, bt + 152)
    rect(c, x + 77, bt + 178, 18, 38, BLUE, BLUE, 7)
    para(c, 'Left button', M, y - 95, 100, 20, 27, BLUE, True); r.arrow(c, M + 82, y - 110, x + 37, bt + 190)
    para(c, 'Right button', M + 300, y - 95, 120, 20, 27, BLUE, True); r.arrow(c, M + 335, y - 110, x + 136, bt + 190)
    para(c, 'Wheel', x + 56, y - 1, 100, 20, 27, BLUE, True); r.arrow(c, x + 86, y - 34, x + 86, bt + 205)
    para(c, 'The arrow tip points to the physical control to press.', M, y - 330, 408, 14, 20, MUTED)
    yy = y; rx, rw = M + 435, CW - 435
    for h, t in [
        ('Left button: select and drag', 'Click an object to select it. Hold the left button and drag the object, then release. Click empty space to deselect.'),
        ('Wheel: zoom the view', 'Scroll forward to zoom in and backward to zoom out; the model dimensions do not change.'),
        ('Right button: orbit', 'Place the pointer in the work area, hold the right button and drag to see the front and side.'),
        ('Shift + right button: pan', 'Hold Shift, then hold the right button and drag. Release both when the view is in place.'),
    ]: yy = card(c, h, t, rx, yy, rw)
    finish(c)


def keyboard(c, second=False):
    title = '04  Keyboard: duplicate, group and recover' if second else '03  Keyboard: control keys, input and delete'
    y = page(c, title, 'Finish number entry first, then select the object. Do not use shortcuts in the browser address bar.', key='keys2' if second else 'keys1')
    names = ['Z', 'A', 'D', 'G', 'H'] if second else ['Ctrl', 'Shift', 'Enter', 'Delete', 'Backspace']
    ww = 435; pic(c, b.KEYBOARD, M, y, ww, 244, boxes=[r.KEYS[k] for k in names]); cy = y - 251; cell = ww / len(names)
    for i, k in enumerate(names):
        xx, yy, kw, kh = r.KEYS[k]; pic(c, b.KEYBOARD, M + i * cell, cy, cell - 8, 44, (xx, yy, xx + kw, yy + kh)); para(c, k, M + i * cell, cy - 53, cell - 4, 12, 17, BLUE, True)
    para(c, 'Orange boxes follow the key edges; enlarged views match the real keyboard above.', M, cy - 95, ww, 14, 20, MUTED)
    para(c, 'This pack uses Windows. Other keyboards can use the matching on-screen tool.', M, cy - 147, ww, 12, 17, MUTED)
    items = [('Ctrl+Z: undo', 'Undo the last action immediately.'), ('Ctrl+D: duplicate', 'The copy starts on top of the original; move it away. D alone drops an object to the Workplane.'), ('Ctrl+G: Union group', 'Select related objects. Group solids, or group a solid and a Hole to cut it.'), ('Ctrl+A / Ctrl+H', 'Ctrl+A selects all. Ctrl+H hides the selection; Show all brings it back.')] if second else [('How to press a combination', 'Hold Ctrl, tap the other key, then release both. Example: Ctrl+Z.'), ('Shift: add to a selection', 'Click the first object, hold Shift, then click more objects.'), ('Enter: confirm a number', 'Press Enter after changing a dimension.'), ('Delete / Backspace: delete', 'Select an object and press a delete key. Practise deleting a Box, then recover with Ctrl+Z.')]
    yy = y
    for h, t in items: yy = card(c, h, t, M + 455, yy, CW - 455)
    finish(c)


TITLE_EN = {
    'R1':'Straight corridor housing','R2':'Cross-shaped public housing','R3':'Stepped residential building','R4':'H-shaped housing','R5':'Twin-tower housing',
    'M1':'Long residential block + street shops','M2':'Twin residential towers + mall','M3':'High/low housing + corner shops',
    'C1':'Modern office tower','C2':'Mall-style commercial building','C3':'Slender pointed skyscraper','C4':'Twin glass towers',
    'S1':'Secondary school main block','S2':'L-shaped school campus','B1':'Straight covered footbridge','B2':'Covered footbridge with stairs'}
CATEGORY_EN={'住宅':'Residential','混合用途':'Mixed use','商業及摩天大樓':'Commercial / high-rise','學校':'School','行人天橋':'Footbridge'}
FEATURE_EN={
 'R1':'A long main block with a central strip and repeated windows.','R2':'A central tower with four wings forming a cross in plan.','R3':'The centre is highest and the two sides step down symmetrically.','R4':'Two parallel wings are joined by a lower centre block.','R5':'Two homes share a platform and a high connecting bridge.','M1':'A wider shop base supports one long residential block.','M2':'A broad mall base supports two residential towers.','M3':'Two different-height towers share a corner-shop base.','C1':'A tall and a shorter tower with a roof plant room and regular window rows.','C2':'A wide mall below a layered office tower.','C3':'The tower narrows upwards in steps and ends in a strong short spire.','C4':'Two different-height towers share a wide base, plant rooms and spires.','S1':'A rectangular teaching block with a central stair tower and entrance canopy.','S2':'Two wings meet at a right angle around an open playground.','B1':'Thick side walls, square columns and a flat roof connect to one lift tower.','B2':'Two lift towers and a covered bridge with six stairs at each end.'}
PART_EN = {'底板':'Base plate','底座':'Base','長條主樓':'Long main block','中央直條':'Central strip','中央塔身':'Central tower','側翼（前後兩件轉90°）':'Wings (front/rear turned 90°)','中央高樓':'Central high block','中層樓':'Middle blocks','外側低樓':'Outer low blocks','左右側翼':'Left and right wings','中央連接部':'Central connector','住宅塔':'Residential tower','平台':'Platform','高位連橋':'High bridge','商舖基座':'Shop base','上層住宅':'Upper residential block','街角商舖':'Corner shop base','高住宅塔':'High residential tower','低住宅塔':'Low residential tower','商場基座':'Mall base','商場':'Mall','主塔':'Main tower','側塔':'Side tower','天台':'Roof slab','機房':'Plant room','入口簷篷':'Entrance canopy','左右側翼':'Side wings','下層塔身':'Lower tower','中層塔身':'Middle tower','上層塔身':'Upper tower','塔冠':'Crown','尖頂':'Spire','基座大樓':'Base building','左塔':'Left tower','右塔':'Right tower','教學樓':'Teaching block','樓梯塔':'Stair tower','屋頂':'Roof','門柱':'Door columns','後翼':'Rear wing','左翼':'Left wing','後翼屋頂':'Rear-wing roof','左翼屋頂':'Left-wing roof','升降機塔':'Lift tower','橋墩':'Bridge columns','中央橋墩':'Central bridge column','橋面':'Bridge deck','兩邊側牆':'Side walls','頂蓋':'Top cover','每端六級樓梯':'Six-step stair set at each end','窗孔模組（重複使用）':'Window-hole module (reused)','店面孔模組（重複使用）':'Shopfront-hole module (reused)','商場窗孔模組':'Mall window-hole module','橋廊凹窗模具':'Bridge-window tool','塔身凹窗模具':'Tower-window tool','凹窗模具':'Recessed-window tool','上層凹窗模具':'Upper-window tool','商場櫥窗模具':'Mall display-window tool','課室凹窗模具':'Classroom-window tool','樓梯窗模具':'Stair-tower window tool','樓梯凹窗模具':'Stair-tower window tool','天台小屋':'Roof plant room'}
COMMON_CHECK=['The base is thin and flat.','The main block is inside the base.','The new parts touch and the outline is clear.','The roof piece is attached and centred.','Windows are regular and do not cut through the whole building.','All solid parts are connected; window recesses remain clear.']

def title_step(s):
    t=s['title'];
    exact={'做底板':'Make the base plate','做底座':'Make the base','先留操場':'Leave the playground open','做共用基座':'Make the shared base','放長條主樓':'Place the long main block','做中央塔身':'Make the central tower','放最高一座':'Place the highest block','放兩條側翼':'Place the two wings','放兩座住宅塔':'Place the two residential towers','放商舖基座':'Place the shop base','建立商場':'Build the mall','放上主塔':'Place the main tower','做闊底層':'Make the wide lower level','做教學樓':'Make the teaching block','做兩端塔':'Make the two end towers','做底座及塔':'Make the base and tower','放兩條橋墩':'Place the two bridge columns','架上橋面':'Add the bridge deck','加兩邊側牆':'Add the two side walls','蓋上頂蓋':'Add the top cover','逐級做樓梯':'Build the stairs step by step','加塔冠':'Add the tower crown','加粗短尖頂':'Add the strong short spire','複製兩座塔':'Duplicate the two towers','加兩個天台':'Add the two roof slabs','加機房及尖頂':'Add plant rooms and spires','加樓梯塔':'Add the stair tower','排成 L 形':'Arrange an L shape','加兩翼屋頂':'Add both wing roofs','群組與檢查':'Group and check','檢查及群組':'Check and group','做窗及完成':'Make windows and finish','加窗及完成':'Add windows and finish','做分層窗列':'Make stepped window rows','加入窗列':'Add window rows','做兩種窗':'Make the two window types','加入凹窗':'Add recessed windows','複製凹窗':'Duplicate recessed windows','按高度做窗口':'Make windows to suit each height','排列淺凹窗':'Arrange shallow window recesses','做重複窗口':'Make repeated windows','做大小兩種凹窗':'Make two sizes of recess','分清窗口及店面':'Separate windows and shopfronts','做住宅窗和兩面店舖':'Make housing windows and two shop fronts','加各自的天台小屋':'Add each roof plant room','加天台小屋':'Add the roof plant room','加天台和入口':'Add the roof and entrance','加天台與小屋':'Add the roof and plant rooms','加連橋及小屋':'Add the bridge and plant rooms','加四個側翼':'Add four wings','加中央直條':'Add the central strip','加高低側翼':'Add high and low wings','排出階梯外形':'Arrange the stepped outline','加最高處的小屋':'Add the top plant room','連成 H 字':'Connect the H shape','加兩個天台小屋':'Add two roof plant rooms'}
    exact.update({'做共同平台':'Make the shared platform','在商舖上加住宅':'Place housing above the shops','做大型商場基座':'Build the large mall base','在上面放兩座住宅':'Place two residential towers above it','放高低住宅':'Place the high and low towers','放底座':'Place the base','建立主塔':'Build the main tower','加入側塔':'Add the side tower','放天台與入口':'Add the roof and entrance','加天台和簷篷':'Add the roof and canopy','放屋頂':'Place the roof','做高低側翼':'Add high and low wings','逐層收窄':'Narrow the tower layer by layer','做有柱入口':'Make the columned entrance','複製課室窗':'Duplicate classroom windows','朝向操場開窗':'Open windows towards the playground','架上橋廊':'Add the covered bridge','做橋廊側牆':'Make the bridge side walls','放平頂蓋':'Place the flat top cover'})
    return exact.get(t, t)

def models_en():
    models=json.loads((ROOT/'tmp/pdfs/pack_models_a.json').read_text(encoding='utf-8'))+json.loads((ROOT/'tmp/pdfs/pack_models_b.json').read_text(encoding='utf-8'))
    for m in models:
        m=dict(m); m['_orig_category']=m['category']; m['title']=TITLE_EN[m['id']]; m['category']=CATEGORY_EN[m['category']]; m['feature']=FEATURE_EN[m['id']]
        m['parts']=[dict(p, name=PART_EN.get(p['name'], 'Building part'), count={'重複':'reuse','各 1':'one each','2 組':'2 sets'}.get(str(p['count']),p['count']), size={'寬 12、深 6；高 5.5 起，每級加 5.5 mm':'W 12, D 6; H 5.5, add 5.5 each step'}.get(p['size'],p['size'])) for p in m['parts']]
        ensteps=[]
        for idx,s in enumerate(m['steps']):
            t=title_step(s)
            dims=m['parts'][min(idx,len(m['parts'])-1)]['size']
            if idx==0: action=f"Add a Box for the main part. Set the size shown in the parts list ({dims}), then place it on the base. Use Workplane and D so it touches the surface."
            elif idx==1: action=f"Add the next Box using its listed size ({dims}). Place it on the previous part and keep the building inside the base."
            elif idx==2: action=f"Add or duplicate the next part ({dims}). Arrange the copies as shown in the reference and let neighbouring faces overlap slightly."
            elif idx==3: action=f"Add the roof, connector or entrance part ({dims}). Use Workplane on the supporting top face, then press D so the new part touches it."
            elif idx==4: action="Make a small Hole, duplicate it into the window pattern and keep every recess inside the wall. Leave at least 2 mm of solid wall."
            else: action="Select the solid parts with Shift, press Ctrl+G (Group / Union), then check the model from TOP and FRONT. Change the residential version to blue and the other versions to white."
            if m['id']=='R1' and idx==4: action='Make four window columns on the front and repeat them for nine rows. Add two columns on the side if time allows; keep the recesses shallow.'
            if m['id']=='R2' and idx==4: action='Make two window columns on each wing and repeat them for ten rows. Finish the visible front faces first.'
            if m['id']=='R3' and idx==4: action='Make two front window columns. Use 11 rows on the high block, 8 on the middle blocks and 5 on the low blocks.'
            if m['id']=='R4' and idx==4: action='Make three columns by ten rows on each wing and four columns by six rows on the central connector.'
            if m['id']=='R5' and idx==4: action='Make two columns by eight rows on each tower. Add a larger shallow entrance recess on the platform if time allows.'
            if m['id']=='M1' and idx==4: action='Make eight columns by seven rows of small residential windows. Use the 6 × 1 × 11 mm tool for seven larger shopfront openings.'
            if m['id']=='M2' and idx==4: action='Make three columns by eight rows on each tower. On the mall, make seven columns by two rows of larger windows, then add the sides.'
            if m['id']=='M3' and idx==4: action='Make three columns on both towers: nine rows on the high tower and six on the low tower. Put seven shopfronts on the front and five on the side.'
            if m['id'] in ('B1','B2') and idx==5: action='Add a few shallow recesses to the bridge and tower. Ask the teacher to keep a separate, ungrouped version before making the final Union.'
            checks=[
                'The part is thin, stable and inside the base.', 'The main block touches the base and leaves a clear outline.',
                'The pieces are aligned, slightly overlapped and at the same support height.', 'The new roof, bridge or entrance touches the main body.',
                'The windows stay inside the walls and the main silhouette remains readable.', 'The building is connected, with no floating pieces or unselected parts.'
            ]
            ensteps.append({'title':t,'action':action,'check':checks[idx]})
        m['steps']=ensteps; yield m


def intro(c,m):
    y=page(c,f"{m['id']}  {m['title']}",'Use the reference shape; dimensions are Width × Depth × Height (mm).',m['category'],m['id'])
    left=433; rx=M+left+19; rw=CW-left-19
    pic(c,REF/m['image_filename'],M,y,left,324)
    para(c,'Teacher-provided AI concept reference; see the next page for the three views and arrow dimensions.',M,y-328,left,11.5,16,MUTED)
    yy=y-357; yy=para(c,'Observation focus | '+m['feature'],M,yy,left,15,21,BLUE,True)-9
    para(c,'Basic version: complete the main form first. Add a few windows, then add more if time allows.',M,yy,left,14,20)
    para(c,'Build dimensions',rx,y,rw,17,23,BLUE,True); cy=y-31
    for i,p in enumerate(m['parts']):
        fill=PALE if i%2==0 else colors.white; rect(c,rx,cy-34,rw,34,fill,fill,2)
        name=p['name']; size=p['size'].replace(' mm',''); count='×'+str(p['count']) if isinstance(p['count'],int) else str(p['count'])
        # Keep long English labels on one line.  The name column is widened
        # and the label size is reduced slightly; dimensions and quantities
        # retain their own columns so all six rows stay aligned.
        name_w=178; size_x=rx+187; count_x=rx+rw-38
        para(c,name,rx+7,cy-6,name_w,11.2,15,INK,True)
        para(c,size,size_x,cy-6,count_x-size_x-8,12.2,16)
        para(c,count,count_x,cy-6,36,11.5,16,MUTED)
        cy-=35
    cy-=7; cy=para(c,'Challenge | Add more windows, a small entrance or a roof detail if time allows.',rx,cy,rw,13,18,BLUE)-9
    para(c,'Print note | Check walls, bridges and roof parts with the teacher before printing.',rx,cy,rw,12.5,18,MUTED); finish(c)


def steps_page(c,m):
    y=page(c,f"{m['id']}  Build it: {m['title']}",'Orange = new solid in this step; dark squares = recessed-window examples. Cell 6 shows the finished outline.',m['category'])
    gap=12; ww=(CW-2*gap)/3; hh=(TOP-BOT-12)/2
    for i,s in enumerate(m['steps']):
        col=i%3; row=i//3; x=M+col*(ww+gap); t=y-row*(hh+12); bt=t-hh; rect(c,x,bt,ww,hh,colors.white)
        para(c,f'{i+1:02d}  {s["title"]}',x+10,t-8,ww-20,14,19,BLUE,True); pic(c,SCR/f'{m["id"]}-{i+1}.png',x+10,t-29,ww-20,83)
        yy=para(c,s['action'],x+10,t-116,ww-20,10.5,13,); yy-=3; bb=para(c,'Check: '+s['check'],x+10,yy,ww-20,9.5,12,GREEN)
        if bb<bt+7: raise ValueError(f'Step cell overflow {m["id"]}/{i+1}: {bb}<{bt+7}')
    finish(c)


def chooser(c,models,part):
    title='Choose a model: housing and mixed use' if part==1 else 'Choose a model: commercial, schools and footbridges'
    y=page(c,title,'1 Starter | 2 Developing | 3 Challenge. First build: R1 or S1.','Model menu')
    gap=12;ww=(CW-gap*3)/4;hh=(TOP-BOT-12)/2
    for i,m in enumerate(models):
        x=M+(i%4)*(ww+gap); t=y-(i//4)*(hh+12); bt=t-hh; rect(c,x,bt,ww,hh,PALE)
        para(c,m['id']+'  '+m['title'],x+9,t-9,ww-18,13,17,BLUE,True); pic(c,SCR/f'{m["id"]}-6.png',x+7,t-45,ww-14,122)
        para(c,'Level '+str(m.get('difficulty',''))+'  •  Page '+str(m['page']),x+9,bt+34,ww-18,12,17,MUTED); c.linkRect('',m['id'],(x,bt,x+ww,t),relative=0,thickness=0)
    finish(c)


def build():
    models=list(models_en())
    c=canvas.Canvas(str(OUT),pagesize=(PW,PH),pageCompression=1); c.setTitle('Hong Kong Community Modelling | Form 2 Tinkercad Teaching Pack'); c.setAuthor('Urban Studio')
    y=page(c,'Turn Hong Kong buildings into your 3D community','Form 2 Tinkercad student pack | basic controls + 16 model task cards','Student pack','cover')
    for i,mid in enumerate(['R2','M2','S2','B2']): pic(c,SCR/f'{mid}-6.png',M+i*CW/4,y,CW/4,235)
    yy=y-246
    for i,(h,t) in enumerate([('01  Practise the tools','Use mouse and keyboard controls to drag, resize, duplicate, align and cut holes.'),('02  Choose one building','Pick a level and follow the model card. Every step has a diagram and a check.'),('03  Build the community','Check connections, export an STL and give it to the teacher for the shared base.')]): card(c,h,t,M+i*(CW+12)/3,yy,(CW-24)/3)
    para(c,'Class: ____________   Name: __________________   Group: ____________',M,75,CW,15,21); finish(c)
    y=page(c,'How to use this pack','Do the shared practice first, then choose one task card. You do not need to build all 16 models.','Learning route')
    xx=M; ww=(CW-20)/2; yy=card(c,'Stage 1 | Basic controls (pages 3-16)','Open the class link, choose Create > 3D Design and name it Practice. Follow the screenshots before starting the real model.',xx,y,ww); yy=card(c,'Stage 2 | Choose a model (pages 17-18)','Click a model in the menu. Each model has two pages: reference and dimensions, then six build cells.',xx,yy,ww); card(c,'Stage 3 | Check and submit (pages 51-52)','Complete the basic form first. Use page 51 to check the model and page 52 to export the STL.',xx,yy,ww)
    xx=M+ww+20; yy=y
    for h,t in [('Reading dimensions','All dimensions are in millimetres (mm), read as Width × Depth × Height. They are classroom practice sizes, not a survey.'),('Reading the three pictures','The concept image shows the form; the screenshot helps you find tools; the diagram shows the new part and its dimensions.'),('Tick when it works','Read the action, study the diagram, do the step and then check the result. A completed basic form is enough; windows are an extension.')]: yy=card(c,h,t,xx,yy,ww)
    finish(c)
    lesson(c,'01  Meet the Tinkercad editor','Orange outlines mark tool areas; the explanation stays outside the screenshot.','editor',[('Left | View controls','ViewCube switches TOP and FRONT. Home returns to the default angle. Fit all in view brings the model onto the screen.'),('Centre | Workplane','The blue grid is the Workplane. Drag shapes from the right onto this grid.'),('Right and top | Shapes and tools','Basic Shapes contains Box. Undo, Duplicate, Align and Group are on the top toolbar; some tools need a selection.')],boxes=[(2,2,1907,62),(3,85,115,470),(1578,158,328,734)],imageh=320,key='interface')
    mouse_page(c); keyboard(c); keyboard(c,True)
    lesson(c,'05  Drag in a Box and select objects','Open a practice design. Delete it after the practice.',4,[('1 | Drag in a solid Box','Find the red Box in Basic Shapes, hold the left button, drag to the grid and release.'),('2 | Select and deselect','Click the Box to show its outline and handles. Click empty space to deselect.'),('3 | Try Shift selection','Add another Box. Select the first, hold Shift and select the second.')],boxes=[(579,289,70,73),(239,282,58,99)],imageh=338)
    lesson(c,'06  Change size: width, depth and height','Select an ungrouped Box. Press Enter after each number.',7,[('1 | Open the Shape panel','Select Box and find Shape / Properties. Expand it with the small arrow if needed.'),('2 | Make a thin plate','Set Width 48, Length 48 and Height 2. These are dimensions, not position.'),('3 | Check','The result is a 48 × 48 × 2 mm plate. Turning the view does not swap the fields.')],crop=(290,105,555,605),boxes=[(308,421,120,163)],imageh=371,key='size')
    lesson(c,'07  Place on a surface: Workplane + D','Select a support surface before adding a part; do not type position coordinates.',7,[('1 | Choose Workplane','Click the blue Workplane grid icon, then click the top of the base.'),('2 | Drop the new part','Drag in a Box, set its size, select it and press D. Its bottom touches the chosen surface.'),('3 | Restore the ground grid','Click Workplane and then an empty grid area. Use the same method for a roof plant room.')],crop=(563,105,743,165),boxes=[(582,107,51,51)],imageh=180,key='workplane')
    lesson(c,'08  Align: centre the tower','Align the two horizontal directions and keep the support height.',11,[('1 | Select two objects','Click empty space. Hold Shift and select the base and tower, then click Align.'),('2 | Click the two centre dots','Click the left-right centre dot and the front-back centre dot. Do not change height.'),('3 | Check from two views','TOP shows equal side spaces; FRONT shows the tower still touching the base.')],boxes=[(509,53,36,36)],imageh=350,key='align')
    lesson(c,'09  Rotate a wing 90°','Orbiting the view and rotating an object are different actions.',15,[('1 | Select the object','Select one wing and find the curved rotation handle below it.'),('2 | Enter the angle','Drag the curved handle, click the angle value, type 90 and press Enter.'),('3 | Move to its side','Use TOP to place the copy. Rotation changes direction; you still need to move it.')],imageh=350,key='rotate')
    lesson(c,'10  Recessed windows: Hole + Union','Try one practice cut before editing the chosen model.',21,[('1 | Make one Hole','Add a Box W 3, D 1, H 3 mm and choose the striped Hole option.'),('2 | Partly overlap the wall','Use FRONT and side views. Let the Hole enter the wall while part remains visible.'),('3 | Select and group','Shift-select the wall and Hole, then press Ctrl+G (Union). A shallow recess should appear.')],boxes=[(1069,132,42,43),(576,384,109,74)],imageh=325,key='hole')
    lesson(c,'11  Copy a window row: Ctrl+D','Make one Hole first; do not group it with the building yet.',23,[('1 | Set the move grid','Choose 1.0 mm Snap Grid. Select the first Hole and press Ctrl+D.'),('2 | Move the copy','From FRONT, test an arrow key. When it moves right, press it 6 times to move 6 mm.'),('3 | Repeat','Press Ctrl+D again to repeat the last move. Make three windows; leave solid wall between them.')],imageh=330,key='duplicate')
    lesson(c,'12  Copy a row into floors','Start with a few rows and keep them inside the wall.',26,[('1 | Select only windows','Hide the building with Ctrl+H if needed. Shift-select the row of Holes and press Ctrl+G.'),('2 | Copy the row upward','Ctrl+D the row; with Snap Grid 1 mm, hold Ctrl and press Up six times.'),('3 | Show the building','Use Show all to check the rows remain inside, then group the building and holes at the end.')],imageh=320,key='rows')
    lesson(c,'13  Colour, group and connect','Group after the form is complete, then check for separated parts.',19,[('1 | Check all sides','View FRONT, TOP and the side. Parts should touch or overlap slightly.'),('2 | Group and colour','Select the solid parts and press Ctrl+G. Choose blue for residential models and white for the others.'),('3 | Remember printing','STL does not save colour. The teacher chooses blue or white filament for printing.')],imageh=340,key='color')
    y=page(c,'14  Five-minute practice: be ready before choosing','Tick each item when it works.','Common controls','practice'); items=[('Drag and select','Place two Boxes. Deselect, then Shift-select both.'),('Change size','Make one Box a 48 × 48 × 2 mm plate.'),('Place on top','Put Workplane on the plate, add a small Box and press D.'),('Duplicate and undo','Ctrl+D the small Box, move the copy, then Ctrl+Z once.'),('Make a recess','Partly overlap a Hole, select both and Ctrl+G.'),('Start the model','Open a new 3D Design named Class_Name_ModelID, then choose a model.')]
    for i,(h,t) in enumerate(items):
        x=M+(i%2)*(CW+16)/2; topy=y-(i//2)*146; ww=(CW-16)/2; rect(c,x,topy-130,ww,130,PALE); c.setStrokeColor(BLUE); c.rect(x+12,topy-32,15,15); para(c,h,x+38,topy-13,ww-50,17,23,BLUE,True); para(c,t,x+12,topy-49,ww-24,15,22)
    finish(c)
    for i,m in enumerate(models): m['page']=19+i*2
    chooser(c,models[:8],1); chooser(c,models[8:],2)
    for m in models: intro(c,m); steps_page(c,m)
    y=page(c,'Finish the model: check before submission','A basic version is acceptable; first make sure the form, connections and dimensions are clear.','Finish and submit','check'); ww=(CW-20)/2
    for i,(h,t) in enumerate([('Clear form','I can name the building use and one obvious shape feature.'),('Connected parts','From all sides and above, I checked gaps, floating pieces and extra blocks. I checked again after grouping.'),('Suitable size','I checked the base and total height and asked whether it fits the community base.'),('Windows stay in walls','Recesses do not go outside the wall; they do not need to fill every floor.'),('Teacher checks printing','I showed pointed roofs, long spans, covers and thin rails to the teacher. Bridges may be printed in parts.'),('Files and record complete','I kept the Tinkercad design and submitted the STL and a screenshot with class, name and model ID.')]): x=M+(i%2)*(ww+20); topy=y-(i//2)*146; card(c,'□ '+h,t,x,topy,ww,15)
    finish(c)
    lesson(c,'Export STL: give the model to the teacher','Click empty space, then select the complete model to export.',35,[('1 | Click Export','Click Export at the top right. If asked, choose The selected shape.'),('2 | Download .STL','Under For 3D Print, click .STL. Rename it, for example 2A_Name_R1.stl.'),('3 | Submit a screenshot too','The screenshot must show the full shape. The teacher imports the STL in millimetres and checks wall thickness, supports and print direction.')],imageh=358,key='export')
    c.save(); (SCR/'english-pages.json').write_text(json.dumps(PAGES,ensure_ascii=False,indent=2),encoding='utf-8'); print(OUT,'pages',len(PAGES))


if __name__=='__main__': build()
