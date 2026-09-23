"""English edition of the 47-page blue residential tower student guide.

The page order, screenshots, dimensions and callout geometry follow the current
Chinese student guide.  Only the teaching text is translated.
"""
from __future__ import annotations

import json
from pathlib import Path
from reportlab.lib import colors
from reportlab.platypus import PageBreak, SimpleDocTemplate
from reportlab.pdfgen import canvas

import build_student_guide as b
import revise_student_guide as r

ROOT = b.ROOT
OUT = ROOT / "output/pdf/blue-residential-tower-student-guide-en.pdf"
W, H = b.CONTENT_W, b.CONTENT_H

TOOLS_EN = {
    "workplane": "Workplane",
    "view": "ViewCube",
    "home": "Home view",
    "zoom": "Zoom",
    "box": "Box",
    "undo": "Undo",
    "ruler": "Ruler",
    "settings": "Grid settings",
    "duplicate": "Duplicate",
    "align": "Align",
    "group": "Group / Union",
    "hole": "Hole",
    "rotate": "Rotate",
    "color": "Solid colour",
    "export": "Export",
}


def page_footer(c: canvas.Canvas, doc):
    if doc.page == 1:
        return
    c.saveState()
    c.setStrokeColor(b.LINE)
    c.setLineWidth(0.6)
    c.line(b.MARGIN_X, b.PAGE_H - 9 * b.mm, b.PAGE_W - b.MARGIN_X, b.PAGE_H - 9 * b.mm)
    c.setFont(b.FONT_BOLD, 8.5)
    c.setFillColor(b.MUTED)
    c.drawString(b.MARGIN_X, b.PAGE_H - 7 * b.mm, "Blue Residential Tower Student Guide")
    c.setFont(b.FONT_REG, 8.5)
    c.drawRightString(b.PAGE_W - b.MARGIN_X, b.PAGE_H - 7 * b.mm, "Tinkercad 3D modelling")
    c.line(b.MARGIN_X, 9 * b.mm, b.PAGE_W - b.MARGIN_X, 9 * b.mm)
    c.drawString(b.MARGIN_X, 5.5 * b.mm, "Form 2 STEAM modelling practice")
    c.drawRightString(b.PAGE_W - b.MARGIN_X, 5.5 * b.mm, f"Page {doc.page}")
    c.restoreState()


def mouse_en(c, y):
    top = y
    mx, my, mw, mh = 190, y - 185, 118, 163
    b.draw_round_rect(c, mx, my, mw, mh, b.PALE_BLUE, b.BLUE, 35)
    c.setStrokeColor(b.BLUE)
    c.line(mx + 59, my + 110, mx + 59, my + 160)
    c.line(mx + 8, my + 110, mx + 110, my + 110)
    b.draw_round_rect(c, mx + 53, my + 123, 12, 26, b.BLUE, b.BLUE, 5)
    c.setFillColor(b.INK); c.setFont(b.FONT_BOLD, 15)
    c.drawString(70, top - 45, "Left button")
    r.arrow(c, 146, top - 50, mx + 28, my + 139)
    c.drawString(355, top - 45, "Right button")
    r.arrow(c, 349, top - 50, mx + 89, my + 139)
    c.drawCentredString(mx + 59, top + 2, "Wheel")
    r.arrow(c, mx + 59, top - 5, mx + 59, my + 150)
    y = top - 205
    cards = [
        ("Left button: select and drag", "Click an object once to select it. Hold the left button, move the mouse, then release to drag. Click empty space to deselect."),
        ("Wheel: zoom the view", "Scroll forward to zoom in and backward to zoom out. This changes the view only; the model size stays the same."),
        ("Right button: orbit the view", "Place the pointer in the work area, hold the right button and drag to see another side of the building."),
        ("Shift + right button: pan", "Hold Shift, then hold the right button and drag. Release both when the view is in place."),
    ]
    for head, body in cards:
        y = r.card(c, head, body, 0, y, W)
    return y


KEYS = r.KEYS


def keyboard_en(title, names, items):
    def draw(c, y):
        y = r.picture(c, b.KEYBOARD, 0, y, W, 235, boxes=[KEYS[k] for k in names])
        cell = W / len(names)
        for i, k in enumerate(names):
            x0, y0, kw, kh = KEYS[k]
            r.picture(c, b.KEYBOARD, i * cell, y, cell - 7, 40, (x0, y0, x0 + kw, y0 + kh))
            c.setFillColor(b.BLUE); c.setFont(b.FONT_LATIN_BOLD, 11)
            c.drawCentredString((i + .5) * cell - 3, y - 55, k)
        y -= 75
        for head, body in items:
            y = r.card(c, head, body, 0, y, W)
        return y
    return r.Page(title, "Orange outlines mark the key edges; enlarged views are shown below.", draw)


def english_steps():
    base = json.loads(b.DATA.read_text(encoding="utf-8"))
    titles = [
        "Open a blank workplane", "Practise changing the view", "Practise zooming", "Drag in the first solid box",
        "Learn selection and size handles", "Use millimetres and understand scale", "Turn the box into a thin base",
        "Read the object size with Ruler", "Build the central tower", "Align the tower to the base centre",
        "Add the left residential wing", "Duplicate the wing to the right", "Rotate a copy for the front wing",
        "Duplicate a rear wing", "Add the roof plant room", "Group the basic building", "Make the building blue",
        "Finish the basic version before windows", "Make the first window recess", "Duplicate the second window",
        "Repeat the transform to make three windows", "Select one row of holes", "Group one row of holes",
        "Duplicate the second window row", "Repeat to make twenty-six rows", "Group one complete face",
        "Copy the holes to the right facade", "Copy the holes to the left facade", "Copy the holes to the rear facade",
        "Cut all four window faces at once", "Check size and connections", "Confirm the blue finish",
        "Export an STL from Tinkercad", "Give the file to the teacher for printing",
    ]
    where = [
        "The Tinkercad start screen and the blue Workplane.", "The ViewCube and the left viewing controls.",
        "The zoom controls on the left side of the editor.", "Basic Shapes on the right and the centre Workplane.",
        "A selected Box and its white size handles.", "Grid settings and the Units menu.", "The first Box on the Workplane.",
        "The Ruler tool and the selected base.", "A new Box on the base top surface.", "The Align tool with the base and tower selected.",
        "A Box beside the central tower.", "The selected wing copy.", "The curved rotation handle below the selected copy.",
        "The selected front wing copy.", "The top surface of the central tower.", "All solid building parts.",
        "Shape > Solid colour.", "The completed basic building before windows.", "A small Box changed to Hole.",
        "The selected first window hole.", "The selected copied window.", "The first row of three holes.",
        "The row of holes selected together.", "The grouped first row of holes.", "The second window row.",
        "The repeated rows on one face.", "The complete grouped face of holes.", "The right facade after rotation.",
        "The left facade copy.", "The rear facade copy.", "The building and all window-hole groups.",
        "Ruler and the four connected facades.", "The selected building and Solid colour control.", "Export at the top right of Tinkercad.",
    ]
    action = [
        "Open a new 3D Design and locate the blue Workplane. Keep the default view for now.",
        "Click TOP and FRONT on the ViewCube, then click Home to return to the default angle.",
        "Use + and - or the mouse wheel to zoom. The model is not resized.",
        "Drag a red Box from Basic Shapes onto the Workplane and release it.",
        "Click the Box once. Notice the white handles and the height handle; do not drag them yet.",
        "Open Edit Grid / Settings and choose Metric millimetres. Keep the snap grid visible.",
        "Set the Box to W 48, D 48, H 2 mm. Press Enter after each number.",
        "Drag Ruler to an empty part of the Workplane and select the base. Read 48, 48 and 2 mm.",
        "Place a Box on the base, set W 20, D 20, H 108 mm, then press D so it sits on the base.",
        "Select the base and tower with Shift. Click Align, then click the two horizontal centre dots. Keep the base height unchanged.",
        "Add a Box W 12, D 16, H 104 mm. Press D and move it to the left side so it slightly overlaps the tower.",
        "Select the left wing, press Ctrl+D, and move the copy to the right side. Keep the two wings at the same height.",
        "Copy a wing, rotate the copy 90 degrees with the curved handle or angle field, and move it to the front.",
        "Copy the front wing and move it to the rear. Leave a small overlap with the central tower.",
        "Set Workplane on the tower top. Add a Box W 10, D 10, H 4.3 mm and centre it as the plant room.",
        "Select the connected solid parts and press Ctrl+G (Group / Union). Check TOP and FRONT.",
        "Select the grouped building, choose Solid colour, and select a deep blue. Click empty space to inspect it.",
        "Use Home to view the finished basic building. Save it before starting the windows.",
        "Drag in a Box, set W 3.2, D 1.1, H 2 mm, change it to Hole and overlap the front wing wall.",
        "Press Ctrl+D to copy the first Hole. Keep both holes at the same height.",
        "Press Ctrl+D again to repeat the 5 mm horizontal move. Make a row of three holes.",
        "Select only the first row of holes. If needed, hide the building with Ctrl+H while you work.",
        "Press Ctrl+G to group the selected row of holes. Do not group it with the building yet.",
        "Press Ctrl+D to copy the row, then use Ctrl plus the Up arrow four times to raise it 4 mm.",
        "Repeat the row move until there are 26 rows. Keep every row inside the wing wall.",
        "Select all rows on this face and press Ctrl+G to make one complete window-hole group.",
        "Copy the face group, rotate it 90 degrees, and move it to the right wing. Show all to check overlap.",
        "Copy the face group to the left wing. Keep its height aligned with the right side.",
        "Copy the face group to the rear wing. Check the direction from TOP and the height from the rear view.",
        "Select the building and all four hole groups, then press Ctrl+G (Union) to cut the recesses.",
        "Use Ruler and the four views to confirm the base, tower, wings and plant room are connected.",
        "Select the finished solid and set Solid colour to deep blue. Click empty space and press Home.",
        "Select the complete building, click Export, choose The selected shape if asked, then choose .STL.",
        "Give the STL to the teacher. Confirm millimetres, base down, total height 114.3 mm, and inspect the slice preview.",
    ]
    expect = [
        "A new empty Workplane is visible.", "You can return to the default view without moving the model.",
        "The view changes size but the object dimensions do not.", "A red Box sits on the Workplane.",
        "The Box is selected and its handles are visible.", "The grid uses metric millimetres.", "A 48 × 48 × 2 mm thin base is visible.",
        "The Ruler shows 48, 48 and 2 mm.", "The tower stands on the base.", "From TOP, the tower has equal space on opposite sides.",
        "The left wing touches the tower with no visible gap.", "Two matching side wings are visible.", "A front wing is turned at 90 degrees.",
        "Four wings surround the central tower.", "The plant room is centred on the tower top.", "The basic building can be selected as one group.",
        "The basic building is blue.", "The shape is ready for window work.", "A shallow Hole overlaps the wall.",
        "Two equal-height window holes are visible.", "Three holes form one straight row.", "Only the intended row is selected.",
        "The row is one grouped Hole object.", "Two equal rows are visible.", "There are 26 rows inside the wall.",
        "One grouped face of window holes is selected.", "The right wing has matching recessed windows.", "The left wing has matching recessed windows.",
        "All four wings have aligned window groups.", "The recesses are cut and remain inside the walls.", "W 48, D 48, H 114.3 mm and no separated parts.",
        "The completed model is blue with clear recesses.", "An .stl file appears in Downloads.",
        "The teacher can check and prepare the model for printing.",
    ]
    help_text = [
        "Keep the PDF beside Tinkercad. Ask the teacher about the class sign-in method.",
        "If the interface looks different, hover over an icon to read its English name.",
        "Fit all in view (the four-corner icon) brings a lost model back into view.",
        "Do not drag the striped Hole by mistake; use the solid red Box for this step.",
        "White handles change size; the black lift handle changes height above the Workplane.",
        "If a number is not accepted, click the field again and press Enter.",
        "A thin base is 2 mm high; do not make it thick by dragging a view control.",
        "Ruler reads dimensions and distances; this guide uses length, width and height only.",
        "Press D after the dimensions are correct so the tower rests on the base.",
        "Align only the two horizontal directions; do not change the tower height.",
        "A small overlap prevents a gap in the printed model.",
        "Ctrl+D keeps the copy selected so the next move can be repeated.",
        "The curved handle rotates an object; a white square changes its size.",
        "If the copy falls over, press Ctrl+Z and rotate around the correct axis.",
        "Use Workplane on the top surface, then press D to make the plant room touch it.",
        "Keep a copy of the ungrouped design if the teacher wants a version that can be edited.",
        "STL does not save colour; blue filament is needed for a blue print.",
        "If time is short, export the basic version first and add windows later.",
        "A Hole must overlap the wall. A Hole floating beside it will not cut anything.",
        "Set Snap Grid to 1.0 mm before making repeated windows.",
        "5 mm is the copy movement; the clear wall space between holes is smaller.",
        "Select only the intended row before pressing Ctrl+G.",
        "Grouped holes can still be copied and moved as one row.",
        "Use Ctrl plus the arrow key to move a copy; do not stretch the Hole itself.",
        "Keep the highest row below the roof edge.",
        "Do not group the holes with the building until all four faces are ready.",
        "After rotating a face, move it to the new wall and check it in TOP view.",
        "Keep the same height as the opposite wing.",
        "Use TOP and the rear view to check the wall overlap.",
        "Select the building and holes together only at the final Union step.",
        "If a part looks detached, undo and check the Workplane and D key.",
        "The on-screen blue may differ from printed filament colour.",
        "Choose The selected shape when Tinkercad asks which object to export.",
        "The teacher checks wall thickness and window clarity in the slicer preview.",
    ]
    value_labels = {
        "比例": "Scale", "總高目標": "Target total height", "換算": "Calculation",
        "繞垂直軸": "Rotate around vertical axis", "旋轉後 W × D": "W × D after rotation",
        "底座": "Base", "總高": "Total height", "凹入牆面": "Wall overlap",
        "水平間隔": "Horizontal spacing", "本排外框 W × D × H": "Row bounding box W × D × H",
        "每排升高": "Rise per row", "孔洞高 H": "Hole height H", "總排數": "Total rows",
        "再按複製": "Further duplicates", "交付檔案": "Delivery file", "匯入單位": "Import units",
        "模型總高": "Model total height",
    }
    detail_overrides = {
        0: ("Follow the class link or the teacher's sign-in method. Choose Create > 3D Design to open a blank editor.", "The blue Workplane is in the centre and Basic Shapes is on the right."),
        5: ("Open Settings, choose Metric, keep the scale at 1:1 millimetres, and set Width and Length to 200. Close the settings panel.", "All following entries use mm; the example total height is 114.3 mm, about a 1:700 model of an 80 m building."),
        6: ("Select the first Box and enter Width 48, Length 48 and Height 2 mm. Press Enter after every number.", "A 48 × 48 × 2 mm thin base is visible."),
        7: ("Drag Ruler to an empty part of the Workplane, then select the base. Read its 48, 48 and 2 mm dimensions.", "Ruler shows the three base dimensions."),
        8: ("Place a Box on the base, set W 20, D 20, H 108 mm, then press D so it sits on the base.", "A 20 × 20 × 108 mm tower stands on the base."),
        9: ("Select the base and tower with Shift. Click Align, then click the two horizontal centre dots. Keep the bottom on the base.", "From TOP the tower is centred, and its bottom is still supported."),
        10: ("Add a Box W 12, D 16, H 104 mm. Press D and move it to the left so it slightly overlaps the tower.", "The 12 × 16 × 104 mm left wing touches the tower."),
        12: ("Select the wing copy, rotate it 90 degrees around the vertical axis, then move it to the front. Its W × D becomes 16 × 12 mm.", "The front wing is turned 90 degrees and extends towards the front."),
        13: ("Copy the front wing to the rear, leaving a small overlap. From TOP, the four wings form a cross and remain inside the 48 mm base.", "Four wings form a cross within the base."),
        14: ("Set Workplane on the tower top. Add a 10 × 10 × 4.3 mm Box, press D and centre it. Total height with the base is 2 + 108 + 4.3 = 114.3 mm.", "The plant room touches the tower top and the total height is 114.3 mm."),
        19: ("Set Snap Grid to 1.0 mm. Copy the first Hole and move it right by 5 mm. Keep the copy selected; the clear space between windows is 1.8 mm.", "Two equal-height windows are 5 mm apart from matching edges."),
        24: ("Repeat the row until there are 26 rows. There are 3 windows per row, so the face contains 78 holes.", "The 26 rows remain inside the wing wall."),
        25: ("Select the complete face and group it as one Hole object. The grouped face represents 78 window holes.", "One grouped face of 78 holes is selected."),
        28: ("Copy the original front face to the rear. With four faces, there are 4 × 78 = 312 window holes; check W 13.2 and D 1.1 mm.", "The rear copy overlaps the rear wall and all four faces match."),
        29: ("Select the building and the four hole groups, then press Ctrl+G (Union). If Shapes(5) appears, wait for the cut to finish.", "The four facades show rows of shallow recessed windows."),
    }
    for i, s in enumerate(base):
        s = dict(s)
        s.update(title=titles[i], where=where[i], action=action[i], expect=expect[i], help=help_text[i])
        if i in detail_overrides:
            s['action'], s['expect'] = detail_overrides[i]
        s["screenshotStep"] = s["shot"]
        s["values"] = [{"label": value_labels.get(v["label"], v["label"]),
                         "value": v["value"].replace("約 ", "about ").replace("排", " rows").replace("次", " times")}
                        for v in (s.get("values") or [])]
        yield s


def model_page_en(i, s):
    def draw(c, y):
        y = r.picture(c, b.ASSET_DIR / f"step-{s['shot']:02d}.jpg", 0, y, W, 250)
        y = r.text(c, "Tinkercad screenshot - observe the tool and the model shape.", 0, y, W, "step_note") - 10
        if s.get("values"):
            vals = "; ".join(f"{v['label']}: {v['value']}" for v in s["values"])
            y = r.text(c, vals, 0, y, W, "label") - 9
        for head, body in [("Find this", s["where"]), ("Do this", s["action"]), ("Check", s["expect"])]:
            y = r.card(c, head, body, 0, y, W)
        return r.text(c, "Help: " + s["help"], 3, y, W - 6, "step_note")
    return r.Page(f"{i:02d}  {s['title']}", f"Model build step {i} / 34  |  {TOOLS_EN.get(s['tool'], s['tool'])}", draw)


def build():
    def cover(c, y):
        y = r.picture(c, b.ASSET_DIR / "step-34.jpg", 0, y, W, 270)
        for head, body in [
            ("01 | Practise the basics", "Mouse, keyboard, selection, dimensions and tool locations."),
            ("02 | Follow the screenshots", "34 modelling steps, each with an action and a check."),
            ("03 | Export for your teacher", "Check connections and size, download STL, and prepare for 3D printing."),
        ]:
            y = r.card(c, head, body, 0, y, W)
        return y

    pages = [r.Page("Blue Residential Tower | Student Guide", "Form 2 STEAM  •  Tinkercad 3D modelling", cover)]
    pages.append(r.cards_page("How to use this guide", "Practise the basic functions first. Finish each page before moving on.", [
        ("Stage 1 | Basic controls", "Use the practice design to try the mouse, keyboard, dimensions and grouping. Find the button, do the action, then check the result."),
        ("Stage 2 | Basic building", "Steps 01-18 make the base, tower, four wings, plant room and blue finish. All dimensions use millimetres (mm)."),
        ("Stage 3 | Windows and export", "Steps 19-30 add windows; steps 31-34 check, export STL and submit. If time is short, submit the basic version first."),
        ("Remember three things", "Press Enter after every number. Press Ctrl+Z after a mistake. Press Fit all in view if the model disappears."),
        ("Reading screenshots", "Screenshots come from an earlier Tinkercad build. The interface may change slightly; hover over an icon to read its English name. This guide does not teach position coordinates."),
    ]))
    pages.append(r.photo_page("Meet the Tinkercad editor", "Orange outlines mark the tool areas and keep the text readable.", "editor", [
        ("Left | View controls", "ViewCube switches TOP and FRONT; Home returns to the default angle; Fit all in view puts the model on screen."),
        ("Top | Main toolbar", "Undo, Duplicate, Align and Group become available when the correct objects are selected."),
        ("Centre and right | Workplane and shapes", "The blue grid is the Workplane. Basic Shapes contains solid red Box and striped Hole."),
    ], maxh=260, boxes=[(2, 2, 1907, 62), (3, 85, 115, 470), (1578, 158, 328, 734)]))
    pages.append(r.Page("Mouse: identify the three controls", "The arrow tip points to the button to press. The drawing uses a standard left and right mouse button.", mouse_en))
    pages.append(r.photo_page("View the model: orbit and recover it", "Practise view controls; do not drag the model itself.", 7, [
        ("1 | Click TOP, then FRONT", "TOP shows the plan view; FRONT shows the front elevation. Click Home to return to the default angle."),
        ("2 | Fit all, then + / -", "The four-corner icon is Fit all in view. The + and - controls change viewing distance."),
        ("3 | Try right button and Shift + right button", "Right-drag orbits the view. Shift + right-drag pans the view. The model dimensions do not change."),
    ], crop=(0, 107, 290, 503), maxh=250))
    pages.append(keyboard_en("Keyboard 1: control keys and delete", ["Ctrl", "Shift", "Enter", "Delete", "Backspace"], [
        ("How to use Ctrl combinations", "Hold Ctrl, tap the second key, then release both. For example, Ctrl+Z. Click the work area before testing a shortcut."),
        ("Shift, Enter and Delete", "Shift adds objects to a selection; Enter confirms a number; Delete or Backspace removes the selected object."),
        ("Mini practice | delete and recover", "Select a practice Box, press Delete, then press Ctrl+Z. Check that the Box returns."),
    ]))
    pages.append(keyboard_en("Keyboard 2: common letter shortcuts", ["Z", "A", "D", "G", "H"], [
        ("Ctrl+Z undo; Ctrl+D duplicate", "Undo a mistake. A duplicate starts on top of the original, so move it away before checking it."),
        ("Ctrl+A select all; Ctrl+G group", "Check what is on screen before selecting all. Ctrl+G combines selected solids; a solid and a Hole together make a cut."),
        ("Ctrl+H hide; D drop to Workplane", "Ctrl+H hides a selected object. Show all brings it back. D drops an object onto the current Workplane; Ctrl+D duplicates."),
    ]))
    pages.append(r.photo_page("Try once: drag in and select a Box", "Work in the practice design; begin the real tower after this page.", 4, [
        ("1 | Drag in a solid Box", "Find the red Box in Basic Shapes, hold the left button, drag it to the blue grid and release."),
        ("2 | Select and deselect", "Click the Box once to see its outline and handles. Click empty space to remove the handles."),
        ("3 | Select two objects", "Add another Box. Click the first, hold Shift and click the second. Both should show a selection outline."),
    ], maxh=260))
    pages.append(r.photo_page("Change size: length, width and height", "The screenshot enlarges the Box panel so the numbers are easy to find.", 7, [
        ("1 | Select Box and open Properties", "Select the Box and find Properties in the Shape panel. Click the small arrow if it is collapsed."),
        ("2 | Enter 48, 48 and 2", "Length is front-to-back, Width is left-to-right and Height is the object height. Click a number, type it, then press Enter."),
        ("3 | Check", "The Box should become a thin plate. Do not confuse the black lift handle with the height field."),
    ], crop=(290, 105, 555, 605), maxh=320, boxes=[(308, 421, 120, 163)]))
    pages.append(r.photo_page("Place on a surface: Workplane and D", "Use a surface Workplane; do not enter position coordinates.", 7, [
        ("1 | Choose a support surface", "Click the blue Workplane grid tool, then click the top of the base to place a temporary Workplane."),
        ("2 | Drop the object onto the surface", "Drag in a new Box, select it and press D. The Box should touch the top surface of the base."),
        ("3 | Return to the ground grid", "Click Workplane again and click an empty grid area beside the model. Use the same method on the tower top."),
    ], crop=(563, 105, 743, 165), maxh=125))
    pages.append(r.photo_page("Align: select two objects first", "This is the key step for centring the tower on the base.", 11, [
        ("1 | Shift-click the base and tower", "Click empty space, hold Shift and click the two objects. Click Align or press L."),
        ("2 | Click the two horizontal centre dots", "Click the centre dot for left-right and the centre dot for front-back. Do not click the vertical centre dot."),
        ("3 | Check", "From TOP, the tower has equal space on opposite sides. From FRONT, its bottom still touches the base."),
    ], maxh=260))
    pages.append(r.photo_page("Holes and groups: making a window recess", "Try it on a practice Box; do not change the finished tower yet.", 7, [
        ("1 | Solid and Hole", "The red circle is Solid; the striped circle is Hole. Select a small Box and click Hole."),
        ("2 | Overlap before grouping", "Move the Hole onto the solid so they overlap. Hold Shift to select both, then press Ctrl+G (Union)."),
        ("3 | Check and undo", "The overlapping part is removed. A Hole beside the wall does nothing. Ctrl+Z returns to before the group."),
    ], crop=(290, 103, 555, 258), maxh=170))
    pages.append(r.cards_page("Before official modelling: preparation check", "Finish the basic practice, then open a new design.", [
        ("Name and units", "Rename the design Class_Name_BlueResidentialTower. In Settings / Edit Grid, choose millimetres; a 200 × 200 mm grid is enough."),
        ("Target dimensions", "Base 48 × 48 × 2 mm; tower 20 × 20 × 108 mm; plant room height 4.3 mm. Total height with base: 114.3 mm."),
        ("Scale", "80 m = 80,000 mm. 80,000 ÷ 700 is about 114.3 mm, so this example is about 1:700. It is a teaching model, not a survey drawing."),
        ("Working setup", "This guide shows a Windows keyboard and a standard mouse. Mac users can use the matching Command shortcut or the on-screen tool."),
        ("Try three actions", "Try Ctrl+Z, Shift selection and Workplane + D once each. Then start model step 01."),
    ]))
    for i, s in enumerate(english_steps(), 1):
        pages.append(model_page_en(i, s))
    # The Chinese file has its earlier p48-p49 removed. Keep this English file at 47 pages too.
    story = []
    for i, pg in enumerate(pages):
        if i:
            story.append(PageBreak())
        story.append(pg)
    doc = SimpleDocTemplate(str(OUT), pagesize=b.A4, leftMargin=b.MARGIN_X, rightMargin=b.MARGIN_X,
                            topMargin=b.MARGIN_Y, bottomMargin=b.MARGIN_Y,
                            title="Blue Residential Tower | Form 2 Student Guide", author="Urban Studio")
    doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
    print(OUT)


if __name__ == "__main__":
    build()
