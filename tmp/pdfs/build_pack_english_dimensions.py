"""Build the English pack with the same 52-page sequence as the current pack."""
from __future__ import annotations
import json
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import build_pack_english as e
import revise_pack_dimensions as d
import build_student_guide as b

OUT=e.OUT; ROOT=e.ROOT; SCR=e.SCR; REF=e.REF; M=e.M; CW=e.CW; TOP=e.TOP; BOT=e.BOT
BLUE=e.BLUE; RED=colors.HexColor('#D34A36')

def n(v): return f'{float(v):g}'

def main_en(m): return d.main(m)

def dimension_page(c,m):
    geom=dict(m); geom['category']='住宅' if m.get('_orig_category')=='住宅' else 'other'
    lo,hi=d.bounds(geom); delta=hi-lo; q=main_en(geom)
    qname=e.PART_EN.get(q['name'],'Main part')
    top=e.page(c,f"{m['id']}  Three views and dimensions",f"Blue: overall (including base) | Red: {qname} | Unit: mm; see the previous page for other parts.",'Dimension reference')
    gap=12; ww=(CW-gap*2)/3; bottom=177; hh=top-bottom
    for i,t in enumerate(['1. Isometric view','2. Front view','3. Top view']):
        x=M+i*(ww+gap); e.rect(c,x,bottom,ww,hh,colors.white); e.para(c,t,x+13,top-12,ww-26,17,23,e.NAVY,True)
    x=M; a=d.iso(c,geom,x+24,top-53,ww-83,226)
    d.dim(c,a(lo),a((hi[0],lo[1],lo[2])),(0,-18),f'Width {n(delta[0])}',side=-1,size=11.5)
    d.dim(c,a((hi[0],lo[1],lo[2])),a((hi[0],hi[1],lo[2])),(17,-5),f'Depth {n(delta[1])}',side=-1,size=11.5)
    topobjects=[s for s in d.solids(geom) if abs(s['z']+s['h']-hi[2])<.001]
    tallest=max(topobjects,key=lambda s:s['x']+s['w']+s['y']+s['d'])
    foot=(tallest['x']+tallest['w'],tallest['y']+tallest['d'],lo[2]); htbase=a(foot); httop=a((foot[0],foot[1],hi[2]))
    d.dim(c,htbase,httop,(x+ww-31-htbase[0],0),f'Height {n(delta[2])}',side=-1,size=11.5)
    x=M+ww+gap; af=d.ortho(c,geom,x+44,top-56,ww-91,222,'front')
    d.dim(c,af(lo),af((hi[0],lo[1],lo[2])),(0,-19),f'{n(delta[0])} mm',side=-1)
    d.dim(c,af((hi[0],lo[1],lo[2])),af(hi),(21,0),f'{n(delta[2])} mm',side=-1)
    left=af(lo)[0]; qa=af((q['x'],q['y'],q['z'])); qb=af((q['x'],q['y'],q['z']+q['h']))
    d.dim(c,qa,qb,(left-18-qa[0],0),f'{n(q["h"])} mm',RED,side=1)
    x=M+2*(ww+gap); at=d.ortho(c,geom,x+43,top-78,ww-89,190,'top')
    d.dim(c,at(lo),at((hi[0],lo[1],lo[2])),(0,-21),f'{n(delta[0])} mm',side=-1)
    d.dim(c,at((hi[0],lo[1],lo[2])),at(hi),(20,0),f'{n(delta[1])} mm',side=-1)
    l2=at(lo)[0]; t2=at(hi)[1]
    qa=at((q['x'],q['y']+q['d'],q['z'])); qb=at((q['x']+q['w'],q['y']+q['d'],q['z']))
    d.dim(c,qa,qb,(0,t2+18-qa[1]),f'{n(q["w"])} mm',RED,side=1)
    qa=at((q['x'],q['y'],q['z'])); qb=at((q['x'],q['y']+q['d'],q['z']))
    d.dim(c,qa,qb,(l2-17-qa[0],0),f'{n(q["d"])} mm',RED,side=1)
    data=[('Overall (including base)',f'Width × Depth × Height = {n(delta[0])} × {n(delta[1])} × {n(delta[2])} mm',BLUE),(qname,f'Width × Depth × Height = {n(q["w"])} × {n(q["d"])} × {n(q["h"])} mm',RED)]
    for i,(head,body,col) in enumerate(data):
        xx=M+i*(CW+14)/2; wid=(CW-14)/2; e.rect(c,xx,79,wid,83,e.PALE); e.para(c,head,xx+12,151,wid-24,14,20,col,True); e.para(c,body,xx+12,123,wid-24,14,20)
    e.para(c,'Arrows show model dimensions, not placement coordinates. Views are scaled to fit; use the labelled numbers.',M,65,CW,11.5,16,e.MUTED); e.finish(c)

def build():
    models=list(e.models_en()); c=canvas.Canvas(str(OUT),pagesize=(e.PW,e.PH),pageCompression=1)
    c.setTitle('Hong Kong buildings | Form 2 Tinkercad reference pack'); c.setAuthor('Urban Studio')
    top=e.page(c,'Turn Hong Kong buildings into your 3D community','Form 2 Tinkercad | 16 building references with three-view dimensions','Student pack','cover')
    for i,mid in enumerate(['R2','M2','S2','B2']): e.pic(c,SCR/f'{mid}-6.png',M+i*CW/4,top,CW/4,235)
    e.para(c,'Choose one building, study its form, three views and arrow dimensions, then build it in Tinkercad.',M,top-245,CW,21,30,e.NAVY,True)
    yy=top-324
    for i,(h,t) in enumerate([('01  Choose a model','Choose a residential, commercial, school or footbridge reference on the next pages.'),('02  Build from dimensions','All dimensions use mm. Make the main form first, then add windows and other details.'),('03  Finish and submit','Check that every part is connected, then submit the STL and a screenshot.')]): e.card(c,h,t,M+i*(CW+12)/3,yy,(CW-24)/3,13.5)
    e.para(c,'Class: ____________   Name: __________________   Group: ____________',M,65,CW,14,20); e.finish(c)
    for i,m in enumerate(models): m['page']=4+3*i
    e.chooser(c,models[:8],1); e.chooser(c,models[8:],2)
    for m in models:
        e.intro(c,m); dimension_page(c,m); e.steps_page(c,m)
    top=e.page(c,'Export STL: give the model to the teacher','Keep this export reference and use it after your model is complete.','Submission reference','export')
    e.pic(c,b.ASSET_DIR/'step-35.jpg',M,top,432,350); yy=top
    for h,t in [('1 | Click Export','Select the complete model and click Export at the top right. If you are submitting only the selection, choose The selected shape.'),('2 | Download .STL','Under For 3D Print, click .STL.\nFilename: Class_Group_ModelID_Quantity\nExample: 2B_GROUP 2_B1_1.stl\n(2B class, Group 2, model B1, one piece)'),('3 | Submit a completion screenshot','The screenshot must show the complete form. The teacher imports the STL in millimetres and checks thickness, supports and print direction.')]: yy=e.card(c,h,t,M+452,yy,CW-452)
    e.finish(c); c.save(); print(OUT,'pages',len(e.PAGES))

if __name__=='__main__': build()
