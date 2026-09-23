"""Render teaching assembly pictures from the same model JSON as the cut files.

PNG files are illustrations only, not cutting files. No images are embedded in SVGs.
"""
import json
import math
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[1]
OUT = ROOT / "output" / "coreldraw-wood-building" / "assembly-views"
OUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads((BASE / "models.json").read_text(encoding="utf-8"))
SS = 3
W,H = 1000,760
COS = math.cos(math.pi/6)
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)


def project(p):
    x,y,z = p
    return ((x-y)*COS, (x+y)*0.5-z)


def render(model):
    verts=[]
    for m in model["modules"]:
        d,p = m["external_dimensions_mm"],m["assembly_position_mm"]
        x,y,z=p.values()
        a,b,c=d.values()
        verts += [project((xx,yy,zz)) for xx in (x,x+a) for yy in (y,y+b) for zz in (z,z+c)]
    xmin,xmax=min(v[0] for v in verts),max(v[0] for v in verts)
    ymin,ymax=min(v[1] for v in verts),max(v[1] for v in verts)
    scale=min((W-150)/(xmax-xmin), (H-130)/(ymax-ymin))
    ox=(W-(xmax-xmin)*scale)/2-xmin*scale
    oy=(H-(ymax-ymin)*scale)/2-ymin*scale
    def pt(v):
        px,py=project(v)
        return (round((px*scale+ox)*SS),round((py*scale+oy)*SS))
    im=Image.new("RGB",(W*SS,H*SS),"white")
    draw=ImageDraw.Draw(im)
    svg=ET.Element(f"{{{NS}}}svg", {"version":"1.1", "width":str(W), "height":str(H), "viewBox":f"0 0 {W} {H}"})
    def polygon(poly,fill):
        draw.polygon(poly,fill=fill)
        ET.SubElement(svg,f"{{{NS}}}polygon", {"points":" ".join(f"{x/SS:.3f},{y/SS:.3f}" for x,y in poly),"fill":fill})
    def line(points,fill,width):
        draw.line(points,fill=fill,width=width,joint="curve")
        ET.SubElement(svg,f"{{{NS}}}polyline", {"points":" ".join(f"{x/SS:.3f},{y/SS:.3f}" for x,y in points),"fill":"none","stroke":fill,"stroke-width":str(width/SS),"stroke-linejoin":"round"})
    faces=[]
    for m in model["modules"]:
        d,p=m["external_dimensions_mm"],m["assembly_position_mm"]
        x,y,z=p.values(); a,b,c=d.values()
        fs=[("front",[(x,y+b,z),(x+a,y+b,z),(x+a,y+b,z+c),(x,y+b,z+c)],"#D6AD7A"),
            ("right",[(x+a,y,z),(x+a,y+b,z),(x+a,y+b,z+c),(x+a,y,z+c)],"#BA8A58"),
            ("roof",[(x,y,z+c),(x+a,y,z+c),(x+a,y+b,z+c),(x,y+b,z+c)],"#ECD2AB")]
        for face,points,color in fs:
            depth=sum(sum(v) for v in points)/4
            faces.append((depth,m,face,points,color))
    for _,m,face,points,color in sorted(faces,key=lambda a:a[0]):
        poly=[pt(v) for v in points]
        polygon(poly,fill=color)
        line(poly+[poly[0]],fill="#705238",width=2*SS)
        d,p=m["external_dimensions_mm"],m["assembly_position_mm"]
        x,y,z=p.values(); a,b,c=d.values()
        if face == "roof":
            continue
        if face == "front":
            for zh in (2,c-2):
                line([pt((x,y+b,z+zh)),pt((x+a,y+b,z+zh))],fill="#97754F",width=SS)
        if face == "right":
            for zh in (2,c-2):
                line([pt((x+a,y,z+zh)),pt((x+a,y+b,z+zh))],fill="#97754F",width=SS)
            for yy in (2,b-2):
                line([pt((x+a,y+yy,z+2)),pt((x+a,y+yy,z+c-2))],fill="#97754F",width=SS)
        panel=next(p for p in model["panels"] if p["module_id"]==m["id"] and p["face"]==face)
        for feat in panel["engraving"]:
            xx,yy,fw,fh=feat["x"],feat["y"],feat["width"],feat["height"]
            if face=="front":
                corners=[(x+u,y+b,z+c-2-v) for u,v in ((xx,yy),(xx+fw,yy),(xx+fw,yy+fh),(xx,yy+fh))]
            else:
                corners=[(x+a,y+2+u,z+c-2-v) for u,v in ((xx,yy),(xx+fw,yy),(xx+fw,yy+fh),(xx,yy+fh))]
            path=[pt(v) for v in corners]
            line(path+[path[0]],fill="#755130",width=SS)
    im.resize((W,H),Image.Resampling.LANCZOS).save(OUT/f'{model["id"]}_assembly.png')
    ET.indent(svg,space="  ")
    ET.ElementTree(svg).write(OUT/f'{model["id"]}_assembly.svg',encoding="utf-8",xml_declaration=True)


def exploded(model):
    """Show all six physical panel cuboids in a separated assembly."""
    offsets={"base":(0,0,-25),"roof":(0,0,42),"front":(0,30,0),"back":(0,-30,0),"left":(-30,0,0),"right":(30,0,0)}
    boxes=[]
    for p in model["panels"]:
        off=offsets[p["face"]]
        mn=[a+b for a,b in zip(p["assembly_local_min_mm"],off)]
        mx=[a+b for a,b in zip(p["assembly_local_max_mm"],off)]
        boxes.append((p,mn,mx))
    points=[project((x,y,z)) for _,mn,mx in boxes for x in (mn[0],mx[0]) for y in (mn[1],mx[1]) for z in (mn[2],mx[2])]
    xmin,xmax=min(v[0] for v in points),max(v[0] for v in points)
    ymin,ymax=min(v[1] for v in points),max(v[1] for v in points)
    scale=min((W-100)/(xmax-xmin),(H-80)/(ymax-ymin))
    ox=(W-(xmax-xmin)*scale)/2-xmin*scale
    oy=(H-(ymax-ymin)*scale)/2-ymin*scale
    def pt(p):
        x,y=project(p)
        return ((x*scale+ox)*SS,(y*scale+oy)*SS)
    im=Image.new("RGB",(W*SS,H*SS),"white")
    draw=ImageDraw.Draw(im)
    svg=ET.Element(f"{{{NS}}}svg", {"version":"1.1","width":str(W),"height":str(H),"viewBox":f"0 0 {W} {H}"})
    faces=[]
    for p,mn,mx in boxes:
        x,y,z=mn; xx,yy,zz=mx
        for face,vs,color in [("front",[(x,yy,z),(xx,yy,z),(xx,yy,zz),(x,yy,zz)],"#D6AD7A"),
                 ("right",[(xx,y,z),(xx,yy,z),(xx,yy,zz),(xx,y,zz)],"#BA8A58"),
                 ("roof",[(x,y,zz),(xx,y,zz),(xx,yy,zz),(x,yy,zz)],"#ECD2AB")]:
            faces.append((sum(sum(v) for v in vs)/4,p,face,vs,color))
    for _,panel,face,vs,color in sorted(faces,key=lambda a:a[0]):
        poly=[pt(v) for v in vs]
        draw.polygon(poly,fill=color)
        draw.line(poly+[poly[0]],fill="#705238",width=2*SS,joint="curve")
        ET.SubElement(svg,f"{{{NS}}}polygon", {"points":" ".join(f"{x/SS:.3f},{y/SS:.3f}" for x,y in poly),"fill":color,"stroke":"#705238","stroke-width":"2","stroke-linejoin":"round"})
        if panel["face"] == face and face in ("front","right"):
            off=offsets[face]
            for feat in panel["engraving"]:
                x,y,w,h=feat["x"],feat["y"],feat["width"],feat["height"]
                if face=="front":
                    vv=[(u+off[0],60+off[1],48-v+off[2]) for u,v in ((x,y),(x+w,y),(x+w,y+h),(x,y+h))]
                else:
                    vv=[(80+off[0],2+u+off[1],48-v+off[2]) for u,v in ((x,y),(x+w,y),(x+w,y+h),(x,y+h))]
                poly=[pt(v) for v in vv]
                draw.line(poly+[poly[0]],fill="#755130",width=SS,joint="curve")
                ET.SubElement(svg,f"{{{NS}}}polygon", {"points":" ".join(f"{x/SS:.3f},{y/SS:.3f}" for x,y in poly),"fill":"none","stroke":"#755130","stroke-width":"1"})
    im.resize((W,H),Image.Resampling.LANCZOS).save(OUT/"W1_exploded.png")
    ET.indent(svg,space="  ")
    ET.ElementTree(svg).write(OUT/"W1_exploded.svg",encoding="utf-8",xml_declaration=True)


for model in DATA["models"]:
    render(model)
exploded(DATA["models"][0])
print(str(OUT))
