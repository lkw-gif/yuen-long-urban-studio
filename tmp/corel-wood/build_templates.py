"""Create nominal 2 mm plywood butt-joint building templates, in millimetres.

Standard library only. Output SVGs contain native vector rectangles and no text.
The 300 x 200 mm page is a teaching layout, not a declaration of machine capacity.
"""
from __future__ import annotations

import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "coreldraw-wood-building" / "templates"
TMP = Path(__file__).resolve().parent
T = 2
PAGE_W, PAGE_H, MARGIN, GAP = 300, 200, 10, 6
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)


def module(ident, name, dimensions, position=(0, 0, 0)):
    return {"id": ident, "name_zh": name,
            "external_dimensions_mm": dict(zip(("width", "depth", "height"), dimensions)),
            "assembly_position_mm": dict(zip(("x", "y", "z"), position))}


MODELS = [
    {"id": "W1", "name_zh": "單層小屋", "name_en": "Simple box house",
     "modules": [module("A", "主體", (80, 60, 50))]},
    {"id": "W2", "name_zh": "兩層退台建築", "name_en": "Two-level setback building",
     "modules": [module("A", "下層", (80, 60, 50)),
                 module("B", "上層", (60, 40, 30), (10, 10, 50))]},
    {"id": "W3", "name_zh": "三層商場", "name_en": "Three-level shopping mall",
     "modules": [module("A", "下層", (100, 70, 50)),
                 module("B", "中層", (80, 55, 25), (10, 7.5, 50)),
                 module("C", "上層", (60, 40, 20), (20, 15, 75))]},
    {"id": "W4", "name_zh": "L 形學校", "name_en": "L-shaped school",
     "modules": [module("A", "後座", (100, 40, 40)),
                 module("B", "左翼", (40, 60, 40), (0, 40, 0))]},
    {"id": "W5", "name_zh": "U 形學校", "name_en": "U-shaped school",
     "modules": [module("A", "後座", (120, 40, 40)),
                 module("B", "左翼", (40, 60, 40), (0, 40, 0)),
                 module("C", "右翼", (40, 60, 40), (80, 40, 0))]},
    {"id": "W6", "name_zh": "雙塔商業樓", "name_en": "Twin-tower commercial building",
     "modules": [module("A", "左塔", (60, 60, 90)),
                 module("B", "右塔", (60, 60, 90), (100, 0, 0)),
                 module("C", "入口大堂", (40, 40, 30), (60, 10, 0))]},
]

FACE_ZH = {"base": "底板", "roof": "頂板", "front": "前牆", "back": "後牆", "left": "左牆", "right": "右牆"}

STEPS = {
    "W1": ["按零件表找出兩件 80 × 60 頂／底板、兩件 80 × 46 前／後牆、兩件 56 × 46 左／右牆。", "先乾拼：左右牆夾在前後牆之間；四面牆立在底板上。", "核對外尺寸及直角，再把四面牆黏在底板上。", "待牆身定位後，蓋上並黏好頂板。"],
    "W2": ["分開砌好 A 下層和 B 上層兩個六面盒；每個盒均由底板、四面牆、頂板組成。", "先把 A 放平；把 B 放在 A 頂板上。", "B 在寬和深方向都置中，四邊退入各 10 mm。", "乾放確認後，才把 B 黏在 A 上。"],
    "W3": ["分開砌好 A 下層、B 中層及 C 上層三個六面盒。", "把 B 放在 A 頂板上：左右各退入 10 mm，前後各退入 7.5 mm。", "把 C 放在 B 頂板上：左右各退入 10 mm，前後各退入 7.5 mm。", "核對三層都置中、整體高 95 mm，才逐層黏合。"],
    "W4": ["分開砌好 A 後座和 B 左翼兩個六面盒。", "把 A 放在後方，B 放在 A 的左前方；兩者底部同高。", "B 的後牆貼着 A 前牆的左邊 40 mm 段，左邊外牆對齊。", "確認平面呈 L 形、接合處兩面牆各自保留，才黏合。"],
    "W5": ["分開砌好 A 後座、B 左翼及 C 右翼三個六面盒。", "把 A 放後方；B 和 C 分別放在 A 的左前方及右前方。", "B、C 的後牆貼着 A 前牆，外側對齊；中間留下 40 × 60 mm 的開口庭院。", "確認三個模組底部同高、平面呈 U 形，才黏合。"],
    "W6": ["分開砌好 A 左塔、B 右塔及 C 入口大堂三個六面盒。", "把兩座塔放在同一水平面，兩塔之間留 40 mm。", "把大堂放在兩塔之間，前後各退入 10 mm；三個模組底部同高。", "大堂左右牆分別貼着兩座塔的內側牆，確認整體寬 160 mm 後才黏合。"],
}


def extents(m):
    p, d = m["assembly_position_mm"], m["external_dimensions_mm"]
    return (p["x"], p["y"], p["z"], p["x"] + d["width"], p["y"] + d["depth"], p["z"] + d["height"])


def contact_faces(m, others):
    """Skip decoration on any wall partly touching another module."""
    a = extents(m)
    found = set()
    for other in others:
        if other is m:
            continue
        b = extents(other)
        overlap_z = min(a[5], b[5]) > max(a[2], b[2])
        overlap_x = min(a[3], b[3]) > max(a[0], b[0])
        overlap_y = min(a[4], b[4]) > max(a[1], b[1])
        if overlap_z and overlap_x:
            if math.isclose(a[4], b[1]): found.add("front")
            if math.isclose(a[1], b[4]): found.add("back")
        if overlap_z and overlap_y:
            if math.isclose(a[0], b[3]): found.add("left")
            if math.isclose(a[3], b[0]): found.add("right")
    return found


def engraving(width, height, face, plain):
    if face in ("base", "roof") or face in plain:
        return []
    features = []
    door = None
    if face == "front" and height >= 26:
        door = {"kind": "door", "x": (width - 10) / 2, "y": height - 19, "width": 10, "height": 16}
    count_x = max(1, math.floor((width - 8) / 18))
    count_y = max(1, math.floor((height - 16) / 18) + 1)
    for row in range(count_y):
        for col in range(count_x):
            x, y = (col + 1) * width / (count_x + 1) - 4, 4 + row * 18
            # Leave 2 mm clearance between the door engraving and window engraving.
            if door and x < door["x"] + door["width"] + 2 and x + 8 > door["x"] - 2 and y < door["y"] + door["height"] + 2 and y + 8 > door["y"] - 2:
                continue
            features.append({"kind": "window", "x": x, "y": y, "width": 8, "height": 8})
    if door:
        features.append(door)
    return features


def panel_specs(m, model):
    d = m["external_dimensions_mm"]
    w, dep, h = d["width"], d["depth"], d["height"]
    plain = contact_faces(m, model["modules"])
    m["plain_contact_faces"] = sorted(plain)
    # Panel solid boxes are local to the module and have no positive-volume overlap.
    specs = [
        ("base", w, dep, [0, 0, 0], [w, dep, T], "XY"),
        ("roof", w, dep, [0, 0, h-T], [w, dep, h], "XY"),
        ("front", w, h-2*T, [0, dep-T, T], [w, dep, h-T], "XZ"),
        ("back", w, h-2*T, [0, 0, T], [w, T, h-T], "XZ"),
        ("left", dep-2*T, h-2*T, [0, T, T], [T, dep-T, h-T], "YZ"),
        ("right", dep-2*T, h-2*T, [w-T, T, T], [w, dep-T, h-T], "YZ"),
    ]
    panels = []
    for face, pw, ph, mn, mx, plane in specs:
        panels.append({"id": f'{model["id"]}-{m["id"]}-{face}', "module_id": m["id"],
                       "face": face, "name_zh": FACE_ZH[face], "quantity": 1,
                       "cut_size_mm": {"width": pw, "height": ph},
                       "assembly_local_min_mm": mn, "assembly_local_max_mm": mx,
                       "assembly_plane": plane,
                       "engraving": engraving(pw, ph, face, plain)})
    return panels


def pack(panels):
    """Deterministic shelf layout: preserve module and panel order, never rotate."""
    if panels[0]["id"].startswith("W4-"):
        # Three coherent rows avoid a mostly empty second page for the L-school.
        order = [0, 1, 10, 2, 3, 11, 4, 5, 6, 7, 8, 9]
        panels = [panels[i] for i in order]
    sheet, row, cell = 1, 1, 0
    x = y = MARGIN
    row_height = 0
    for panel in panels:
        w, h = panel["cut_size_mm"].values()
        assert w <= PAGE_W - 2*MARGIN and h <= PAGE_H - 2*MARGIN
        if x + w > PAGE_W - MARGIN:
            x, y = MARGIN, y + row_height + GAP
            row, cell, row_height = row + 1, 0, 0
        if y + h > PAGE_H - MARGIN:
            sheet, row, cell, x, y, row_height = sheet + 1, 1, 0, MARGIN, MARGIN, 0
        cell += 1
        panel["layout"] = {"sheet": sheet, "row": row, "column": cell, "x_mm": x, "y_mm": y,
                           "rotation_degrees": 0}
        x += w + GAP
        row_height = max(row_height, h)
    return sheet


def fmt(value):
    return f"{value:.6f}".rstrip("0").rstrip(".")


def write_svg(model, sheet_number, directory):
    svg = ET.Element(f"{{{NS}}}svg", {"version": "1.1", "width": "300mm", "height": "200mm", "viewBox": "0 0 300 200"})
    title = ET.SubElement(svg, f"{{{NS}}}title")
    title.text = f'{model["id"]} sheet {sheet_number}: nominal 2 mm plywood; teaching layout'
    desc = ET.SubElement(svg, f"{{{NS}}}desc")
    desc.text = "Red closed rectangles: cut perimeters. Blue rectangles: surface engraving only. Colours are teaching semantics, not machine presets. No kerf compensation."
    cut = ET.SubElement(svg, f"{{{NS}}}g", {"id": "CUT_RED", "fill": "none", "stroke": "#FF0000", "stroke-width": "0.1"})
    engrave = ET.SubElement(svg, f"{{{NS}}}g", {"id": "ENGRAVE_BLUE", "fill": "none", "stroke": "#0000FF", "stroke-width": "0.1"})
    for p in model["panels"]:
        lay = p["layout"]
        if lay["sheet"] != sheet_number:
            continue
        x, y = lay["x_mm"], lay["y_mm"]
        w, h = p["cut_size_mm"].values()
        ET.SubElement(cut, f"{{{NS}}}rect", {"id": p["id"], "x": fmt(x), "y": fmt(y), "width": fmt(w), "height": fmt(h)})
        for index, feature in enumerate(p["engraving"], 1):
            ET.SubElement(engrave, f"{{{NS}}}rect", {"id": f'{p["id"]}-{feature["kind"]}-{index}',
                "x": fmt(x + feature["x"]), "y": fmt(y + feature["y"]),
                "width": fmt(feature["width"]), "height": fmt(feature["height"])})
    ET.indent(svg, space="  ")
    name = f'{model["id"]}_sheet_{sheet_number:02d}.svg'
    ET.ElementTree(svg).write(directory / name, encoding="utf-8", xml_declaration=True)
    return name


def overlap_volume(a_min, a_max, b_min, b_max):
    return all(min(a_max[i], b_max[i]) > max(a_min[i], b_min[i]) + 1e-8 for i in range(3))


def validate(model, directory):
    assert len(model["panels"]) == len(model["modules"]) * 6
    assert len({p["id"] for p in model["panels"]}) == len(model["panels"])
    for m in model["modules"]:
        ps = [p for p in model["panels"] if p["module_id"] == m["id"]]
        assert {p["face"] for p in ps} == set(FACE_ZH)
        d = m["external_dimensions_mm"]
        expected = {"base": (d["width"], d["depth"]), "roof": (d["width"], d["depth"]),
                    "front": (d["width"], d["height"]-4), "back": (d["width"], d["height"]-4),
                    "left": (d["depth"]-4, d["height"]-4), "right": (d["depth"]-4, d["height"]-4)}
        for p in ps:
            assert tuple(p["cut_size_mm"].values()) == expected[p["face"]]
        for i, a in enumerate(ps):
            for b in ps[i+1:]:
                assert not overlap_volume(a["assembly_local_min_mm"], a["assembly_local_max_mm"], b["assembly_local_min_mm"], b["assembly_local_max_mm"])
        # Six panels exactly occupy the difference between an external and internal box.
        panel_volume = sum(math.prod(b-a for a,b in zip(p["assembly_local_min_mm"], p["assembly_local_max_mm"])) for p in ps)
        assert math.isclose(panel_volume, d["width"]*d["depth"]*d["height"] - (d["width"]-4)*(d["depth"]-4)*(d["height"]-4))
    for i, a in enumerate(model["modules"]):
        for b in model["modules"][i+1:]:
            ae, be = extents(a), extents(b)
            assert not overlap_volume(ae[:3], ae[3:], be[:3], be[3:]), "Module volumes overlap"
    for sheet in range(1, model["sheet_count"]+1):
        ps = [p for p in model["panels"] if p["layout"]["sheet"] == sheet]
        for i, a in enumerate(ps):
            x,y = a["layout"]["x_mm"], a["layout"]["y_mm"]
            w,h = a["cut_size_mm"].values()
            assert x >= MARGIN and y >= MARGIN and x+w <= PAGE_W-MARGIN and y+h <= PAGE_H-MARGIN
            for feature in a["engraving"]:
                assert feature["x"] >= 3 and feature["y"] >= 3
                assert feature["x"]+feature["width"] <= w-3+1e-6
                assert feature["y"]+feature["height"] <= h-3+1e-6
            for b in ps[i+1:]:
                bx,by = b["layout"]["x_mm"], b["layout"]["y_mm"]
                bw,bh = b["cut_size_mm"].values()
                horizontal_gap = max(bx-(x+w), x-(bx+bw))
                vertical_gap = max(by-(y+h), y-(by+bh))
                assert max(horizontal_gap, vertical_gap) >= GAP-1e-6
        file = directory / f'{model["id"]}_sheet_{sheet:02d}.svg'
        root = ET.parse(file).getroot()
        assert root.attrib["width"] == "300mm" and root.attrib["height"] == "200mm"
        assert not root.findall(f".//{{{NS}}}text") and not root.findall(f".//{{{NS}}}image")
        cut = root.find(f"{{{NS}}}g[@id='CUT_RED']")
        assert len(cut) == len(ps)
        geometry = [tuple(e.attrib[k] for k in ("x", "y", "width", "height")) for e in cut]
        assert len(geometry) == len(set(geometry))
        assert all(e.tag == f"{{{NS}}}rect" and float(e.attrib["width"])>0 and float(e.attrib["height"])>0 for e in cut)
        assert root.find(f"{{{NS}}}g[@id='ENGRAVE_BLUE']") is not None
    return {"model": model["id"], "passed": True, "modules": len(model["modules"]), "panels": len(model["panels"]), "sheets": model["sheet_count"]}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    reports = []
    index = ["# 木板建築 SVG 練習檔", "", "材料：標稱 2 mm 膠合板。所有尺寸為 mm；每個模組都是獨立六面盒。", "", 
        "每頁 300 × 200 mm 是教學排版，並不表示雷射機工作台尺寸。請教師按實際機台重新排版；匯入後先核對實際毫米尺寸。圖形沒有預先補償雷射切縫。", "",
        "紅色 CUT_RED：閉合的切割外框。藍色 ENGRAVE_BLUE：門窗的表面線刻。顏色只是教學分類，並非任何機器的加工預設；必須由教師指定切割／雕刻工序及合適參數。SVG 使用 0.1 mm 顯示線寬；是否轉為髮絲線依實際機台工作流程決定。", "",
        "檔案只有原生向量，沒有點陣圖、文字、尺寸標註或零件標籤。請用下面的頁碼／行／由左至右對照表識別零件。相鄰切割外框相距最少 6 mm；頁邊最少 10 mm。", "",
        "拼裝公式（外尺寸 W × D × H）：底板和頂板各 W × D；前牆和後牆各 W × (H − 4)；左牆和右牆各 (D − 4) × (H − 4)。頂／底板蓋在牆的上下；左右牆夾在前後牆之間。所有牆面門窗只刻線，不穿孔。", "",
        "組裝座標：x 向右、y 向建築前方、z 向上；原點位於整體後左下角。多層模組上下相貼；L／U 形模組及雙塔大堂左右或前後相貼，接觸處保留各自的牆。相接牆面不刻門窗。", "",
        "注意：這些是名義幾何設計，尚未作實物切割驗證。正式切割前需量度板厚，試切及試拼，按實際切縫和膠層調整。", ""]
    for model in MODELS:
        model["assembly_steps_zh"] = STEPS[model["id"]]
        model["panels"] = [p for m in model["modules"] for p in panel_specs(m, model)]
        model["module_count"] = len(model["modules"])
        for m in model["modules"]:
            m["panel_count"] = 6
            m["panel_ids"] = [p["id"] for p in model["panels"] if p["module_id"] == m["id"]]
        model["sheet_count"] = pack(model["panels"])
        model["panel_count"] = len(model["panels"])
        e = [extents(m) for m in model["modules"]]
        model["overall_external_dimensions_mm"] = {"width": max(a[3] for a in e), "depth": max(a[4] for a in e), "height": max(a[5] for a in e)}
        directory = OUT / model["id"]
        directory.mkdir(exist_ok=True)
        model["svg_files"] = [f'{model["id"]}/{write_svg(model, s, directory)}' for s in range(1, model["sheet_count"]+1)]
        reports.append(validate(model, directory))
        d = model["overall_external_dimensions_mm"]
        index += [f'## {model["id"]} {model["name_zh"]}', "", f'整體外尺寸：{d["width"]} × {d["depth"]} × {d["height"]}；共 {len(model["modules"])} 個模組、{model["panel_count"]} 件板、{model["sheet_count"]} 頁。', ""]
        for m in model["modules"]:
            md,mp = m["external_dimensions_mm"],m["assembly_position_mm"]
            index.append(f'- 模組 {m["id"]} {m["name_zh"]}：{md["width"]} × {md["depth"]} × {md["height"]}；左後下角座標 ({mp["x"]}, {mp["y"]}, {mp["z"]})。')
        index += ["", "| 頁 | 行 | 從左數 | 模組 | 零件 | 裁切寬 × 高 |", "|---:|---:|---:|:---:|---|---:|"]
        for p in sorted(model["panels"], key=lambda p: (p["layout"]["sheet"], p["layout"]["row"], p["layout"]["column"])):
            l,d = p["layout"],p["cut_size_mm"]
            index.append(f'| {l["sheet"]} | {l["row"]} | {l["column"]} | {p["module_id"]} | {p["name_zh"]} | {d["width"]} × {d["height"]} |')
        index += [""]
    data = {"schema_version": "1.0", "units": "mm", "material": "nominal 2 mm plywood", "thickness_mm": T,
            "joint": "butt joints; full roof/base caps; front/back full width; side walls between front and back",
            "kerf_compensation_mm": None, "physical_cut_test_completed": False,
            "page": {"width_mm": PAGE_W, "height_mm": PAGE_H, "margin_mm": MARGIN, "minimum_cut_outline_gap_mm": GAP, "purpose": "teaching layout, not machine-bed specification"},
            "coordinate_system": {"x": "right", "y": "towards front", "z": "up", "origin": "overall rear-left-bottom"},
            "layers": {"CUT_RED": {"stroke": "#FF0000", "meaning": "closed cut perimeter"}, "ENGRAVE_BLUE": {"stroke": "#0000FF", "meaning": "surface line engraving only"}, "note": "Teaching colours only; not machine presets"},
            "models": MODELS, "validation": reports}
    (TMP / "models.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "README.md").write_text("\n".join(index), encoding="utf-8")
    (TMP / "validation.json").write_text(json.dumps({"passed": True, "checks": ["panel formula and quantity", "assembly panel volumes and shell volume", "module non-overlap", "6 mm cut-outline spacing", "10 mm page margin", "engraving inset at least 3 mm", "physical SVG page size", "closed cut rectangles", "no duplicated cut geometry", "no raster images or visible text"], "models": reports}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(reports, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
