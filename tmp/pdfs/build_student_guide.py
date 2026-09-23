from __future__ import annotations

import json
import os
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Flowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "blue-residential-tower-student-guide.pdf"
DATA = ROOT / "tmp" / "tower_steps.json"
ASSET_DIR = ROOT / "public" / "tinkercad" / "live"
EDITOR = ROOT / "public" / "tinkercad" / "editor.png"
KEYBOARD = ROOT / "public" / "tinkercad" / "keyboard-reference-crop.png"
PAGE_W, PAGE_H = A4
MARGIN_X = 15 * mm
MARGIN_Y = 14 * mm
# SimpleDocTemplate's default frame has 6 pt padding on each side.
CONTENT_W = PAGE_W - 2 * MARGIN_X - 12
CONTENT_H = PAGE_H - 2 * MARGIN_Y - 12

FONT_REG = "MSJH"
FONT_BOLD = "MSJH-Bold"
FONT_LATIN = "Arial"
FONT_LATIN_BOLD = "Arial-Bold"
pdfmetrics.registerFont(TTFont(FONT_REG, r"C:\Windows\Fonts\msjh.ttc"))
pdfmetrics.registerFont(TTFont(FONT_BOLD, r"C:\Windows\Fonts\msjhbd.ttc"))
pdfmetrics.registerFont(TTFont(FONT_LATIN, r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont(FONT_LATIN_BOLD, r"C:\Windows\Fonts\arialbd.ttf"))

NAVY = colors.HexColor("#13263D")
BLUE = colors.HexColor("#1E5BB8")
CYAN = colors.HexColor("#32A8C7")
ORANGE = colors.HexColor("#E88931")
GREEN = colors.HexColor("#198A72")
INK = colors.HexColor("#1C2E42")
MUTED = colors.HexColor("#5B7087")
PALE = colors.HexColor("#F3F7FB")
PALE_BLUE = colors.HexColor("#E8F1FC")
PALE_ORANGE = colors.HexColor("#FFF3E7")
LINE = colors.HexColor("#D5E0EB")

styles = getSampleStyleSheet()
STYLE = {
    "body": ParagraphStyle("body", fontName=FONT_REG, fontSize=14.3, leading=21, textColor=INK, wordWrap="CJK"),
    "body_small": ParagraphStyle("body_small", fontName=FONT_REG, fontSize=11.2, leading=16, textColor=MUTED, wordWrap="CJK"),
    "body_white": ParagraphStyle("body_white", fontName=FONT_REG, fontSize=14, leading=21, textColor=colors.white, wordWrap="CJK"),
    "title": ParagraphStyle("title", fontName=FONT_BOLD, fontSize=25, leading=32, textColor=NAVY, wordWrap="CJK"),
    "section": ParagraphStyle("section", fontName=FONT_BOLD, fontSize=22, leading=28, textColor=NAVY, wordWrap="CJK"),
    "subtitle": ParagraphStyle("subtitle", fontName=FONT_REG, fontSize=14.5, leading=21, textColor=MUTED, wordWrap="CJK"),
    "label": ParagraphStyle("label", fontName=FONT_BOLD, fontSize=12.5, leading=17, textColor=BLUE, wordWrap="CJK"),
    "label_white": ParagraphStyle("label_white", fontName=FONT_BOLD, fontSize=12, leading=16, textColor=colors.white, wordWrap="CJK"),
    "step_title": ParagraphStyle("step_title", fontName=FONT_BOLD, fontSize=20, leading=26, textColor=NAVY, wordWrap="CJK"),
    "step_body": ParagraphStyle("step_body", fontName=FONT_REG, fontSize=13.2, leading=19, textColor=INK, wordWrap="CJK"),
    "step_note": ParagraphStyle("step_note", fontName=FONT_REG, fontSize=10.5, leading=14, textColor=MUTED, wordWrap="CJK"),
    "cover_title": ParagraphStyle("cover_title", fontName=FONT_BOLD, fontSize=31, leading=39, textColor=colors.white, wordWrap="CJK"),
    "cover_sub": ParagraphStyle("cover_sub", fontName=FONT_REG, fontSize=16, leading=24, textColor=colors.HexColor("#D9E8F5"), wordWrap="CJK"),
}


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(str(text)).replace("\n", "<br/>") , style)


def draw_round_rect(c, x, y, w, h, fill, stroke=LINE, radius=7):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def draw_para(c, text: str, style: ParagraphStyle, x: float, top: float, width: float) -> float:
    q = p(text, style)
    _, h = q.wrap(width, 1000)
    q.drawOn(c, x, top - h)
    return top - h


def fit_image(path: Path, max_w: float, max_h: float):
    from PIL import Image
    with Image.open(path) as im:
        iw, ih = im.size
    scale = min(max_w / iw, max_h / ih)
    return iw * scale, ih * scale


TOOLS = {
    "workplane": "Workplane 工作平面",
    "view": "ViewCube 視角方塊",
    "home": "Home 預設視角",
    "zoom": "Zoom 放大／縮小",
    "box": "Box 實心方塊",
    "undo": "Undo 復原",
    "ruler": "Ruler 尺規",
    "settings": "Settings 格線設定",
    "duplicate": "Duplicate 複製",
    "align": "Align 對齊",
    "group": "Group／Union 群組",
    "hole": "Hole 孔洞",
    "rotate": "Rotate 旋轉",
    "color": "Solid 顏色",
    "export": "Export 匯出",
}


class CoverPage(Flowable):
    def __init__(self, w, h):
        super().__init__()
        self.width, self.height = w, h

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        c.setFillColor(NAVY)
        c.rect(0, 0, w, h, fill=1, stroke=0)
        c.setFillColor(BLUE)
        c.circle(w - 20, h - 36, 105, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#17477F"))
        c.circle(w - 56, h - 93, 55, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#8FE2F0"))
        c.setStrokeColor(colors.HexColor("#8FE2F0"))
        c.setLineWidth(2)
        c.line(0, h - 12, w, h - 12)
        y = h - 112
        y = draw_para(c, "藍色住宅大樓", STYLE["cover_title"], 26, y, w * 0.66)
        y -= 7
        y = draw_para(c, "Tinkercad 學生指南", STYLE["cover_sub"], 28, y, w * 0.68)
        y -= 28
        c.setFillColor(colors.HexColor("#9CC5E8"))
        c.setFont(FONT_LATIN_BOLD, 11)
        c.drawString(28, y, "FORM 2  ·  STEAM  ·  3D DESIGN")
        y -= 36
        c.setFillColor(colors.HexColor("#D7E7F4"))
        c.setFont(FONT_REG, 14)
        c.drawString(28, y, "先學會操作工具，再一步一步完成住宅大樓。")
        y -= 23
        c.setFont(FONT_REG, 12)
        c.setFillColor(colors.HexColor("#B8D0E2"))
        c.drawString(28, y, "每一步都有 Tinkercad 實作截圖，完成一項才進入下一項。")

        # Three learning cards.
        card_y = 88
        card_w = (w - 64) / 3
        cards = [("01", "基本操作", "滑鼠、鍵盤、視角"), ("02", "模型步驟", "尺寸、複製、群組"), ("03", "完成匯出", "檢查、STL、交付")]
        for i, (num, head, desc) in enumerate(cards):
            x = 18 + i * (card_w + 14)
            draw_round_rect(c, x, card_y, card_w, 86, colors.HexColor("#1A3856"), colors.HexColor("#3B648A"), 8)
            c.setFillColor(CYAN)
            c.circle(x + 23, card_y + 59, 14, fill=1, stroke=0)
            c.setFillColor(NAVY)
            c.setFont(FONT_LATIN_BOLD, 10)
            c.drawCentredString(x + 23, card_y + 56, num)
            c.setFillColor(colors.white)
            c.setFont(FONT_BOLD, 14)
            c.drawString(x + 46, card_y + 57, head)
            c.setFillColor(colors.HexColor("#BDD5E8"))
            c.setFont(FONT_REG, 11)
            c.drawString(x + 20, card_y + 30, desc)

        # Simple tower silhouette.
        base_x, base_y = w - 132, 190
        c.setFillColor(colors.HexColor("#0E408C"))
        c.roundRect(base_x, base_y, 116, 13, 3, fill=1, stroke=0)
        for bx, bw, bh in [(base_x + 27, 33, 226), (base_x + 65, 30, 184), (base_x + 8, 26, 142)]:
            c.setFillColor(colors.HexColor("#2D78DA"))
            c.roundRect(bx, base_y + 13, bw, bh, 3, fill=1, stroke=0)
            c.setFillColor(colors.HexColor("#8FC8F3"))
            for row in range(8):
                for col in range(2):
                    c.rect(bx + 7 + col * 12, base_y + 31 + row * 23, 6, 9, fill=1, stroke=0)


class IntroPage(Flowable):
    def __init__(self, title, subtitle, sections, w, h, image=None):
        super().__init__()
        self.title, self.subtitle, self.sections = title, subtitle, sections
        self.width, self.height, self.image = w, h, image

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        top = h - 4
        c.setFillColor(BLUE)
        c.roundRect(0, top - 7, 9, 28, 4, fill=1, stroke=0)
        top = draw_para(c, self.title, STYLE["section"], 19, top + 10, w - 20)
        top -= 3
        top = draw_para(c, self.subtitle, STYLE["subtitle"], 19, top, w - 20)
        top -= 18
        if self.image:
            iw, ih = fit_image(self.image, w, 270)
            x = (w - iw) / 2
            c.setFillColor(PALE)
            c.roundRect(x - 7, top - ih - 7, iw + 14, ih + 14, 8, fill=1, stroke=0)
            c.drawImage(str(self.image), x, top - ih, iw, ih, preserveAspectRatio=True, mask="auto")
            top -= ih + 24
        for heading, text in self.sections:
            block_h = 67
            if len(text) > 125:
                block_h = 82
            draw_round_rect(c, 0, top - block_h, w, block_h, PALE, LINE, 8)
            c.setFillColor(BLUE)
            c.setFont(FONT_BOLD, 13.5)
            c.drawString(17, top - 24, heading)
            draw_para(c, text, STYLE["body"], 17, top - 32, w - 34)
            top -= block_h + 11


class InterfaceGuidePage(Flowable):
    """A large annotated editor image, matching the red-box visual cue in the reference."""
    def __init__(self, title, subtitle, sections, image, w, h):
        super().__init__()
        self.title, self.subtitle, self.sections = title, subtitle, sections
        self.image, self.width, self.height = image, w, h

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        top = h - 4
        c.setFillColor(BLUE)
        c.roundRect(0, top - 7, 9, 28, 4, fill=1, stroke=0)
        top = draw_para(c, self.title, STYLE["section"], 19, top + 10, w - 20)
        top -= 3
        top = draw_para(c, self.subtitle, STYLE["subtitle"], 19, top, w - 20)
        top -= 13
        iw, ih = fit_image(self.image, w, 238)
        x = (w - iw) / 2
        c.setFillColor(PALE)
        c.roundRect(x - 7, top - ih - 7, iw + 14, ih + 14, 8, fill=1, stroke=0)
        c.drawImage(str(self.image), x, top - ih, iw, ih, preserveAspectRatio=True, mask="auto")
        # Red boxes and arrows are drawn in the image's native coordinate system.
        sx, sy = iw / 1912, ih / 901
        def box(rx, ry, rw, rh, n, arrow=False):
            bx, by = x + rx * sx, top - (ry + rh) * sy
            c.setStrokeColor(colors.red)
            c.setLineWidth(3.2)
            c.rect(bx, by, rw * sx, rh * sy, fill=0, stroke=1)
            c.setFillColor(colors.red)
            c.circle(bx + 12, by + rh * sy - 12, 9, fill=1, stroke=0)
            c.setFillColor(colors.white)
            c.setFont(FONT_LATIN_BOLD, 8)
            c.drawCentredString(bx + 12, by + rh * sy - 15, str(n))
            if arrow:
                ax = bx + 10
                ay = by - 14
                c.setStrokeColor(colors.red)
                c.setLineWidth(2.2)
                c.line(ax, ay, ax, by + 2)
                c.line(ax, by + 2, ax - 5, by - 7)
                c.line(ax, by + 2, ax + 5, by - 7)
        box(8, 80, 104, 410, 1, True)
        box(220, 6, 1500, 74, 2)
        box(420, 255, 720, 520, 3)
        box(1570, 160, 330, 705, 4)
        top -= ih + 18
        c.setFillColor(PALE_ORANGE)
        c.setStrokeColor(colors.HexColor("#F1C79C"))
        c.roundRect(0, top - 28, w, 27, 7, fill=1, stroke=1)
        c.setFillColor(ORANGE)
        c.setFont(FONT_BOLD, 11.5)
        c.drawString(13, top - 18, "紅框 = 要找的區域    箭咀 = 先從這裡開始    編號 = 對照下面說明")
        top -= 41
        for heading, text in self.sections:
            block_h = 61 if len(text) < 110 else 74
            draw_round_rect(c, 0, top - block_h, w, block_h, PALE, LINE, 8)
            c.setFillColor(BLUE)
            c.setFont(FONT_BOLD, 12.5)
            c.drawString(17, top - 22, heading)
            draw_para(c, text, STYLE["body"], 17, top - 30, w - 34)
            top -= block_h + 8


class MouseGuidePage(Flowable):
    def __init__(self, w, h):
        super().__init__()
        self.width, self.height = w, h

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw_mouse(self, c, x, y):
        # Large, simple mouse picture with a split left/right button and wheel.
        c.setFillColor(colors.HexColor("#E7EEF7"))
        c.setStrokeColor(BLUE)
        c.setLineWidth(2)
        c.roundRect(x, y, 112, 174, 38, fill=1, stroke=1)
        c.setStrokeColor(colors.HexColor("#91A9C2"))
        c.line(x + 56, y + 118, x + 56, y + 168)
        c.line(x + 8, y + 118, x + 104, y + 118)
        c.setFillColor(BLUE)
        c.roundRect(x + 49, y + 130, 14, 27, 7, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#80D4E2"))
        c.circle(x + 56, y + 146, 3, fill=1, stroke=0)
        # Put the left/right labels directly over the two click zones.
        c.setFillColor(ORANGE)
        c.setFont(FONT_BOLD, 17)
        c.drawCentredString(x + 35, y + 141, "左")
        c.drawCentredString(x + 77, y + 141, "右")
        c.setFillColor(colors.HexColor("#C8D7E8"))
        c.roundRect(x + 42, y - 22, 28, 23, 7, fill=1, stroke=1)
        c.setFillColor(MUTED)
        c.setFont(FONT_BOLD, 10)
        c.drawCentredString(x + 56, y - 14, "滾輪")
        # Arrow helpers.
        c.setStrokeColor(ORANGE)
        c.setFillColor(ORANGE)
        c.setLineWidth(2)
        c.line(x + 35, y + 150, x - 26, y + 172)
        c.line(x - 26, y + 172, x - 14, y + 171)
        c.line(x - 26, y + 172, x - 21, y + 161)
        c.line(x + 77, y + 150, x + 145, y + 168)
        c.line(x + 145, y + 168, x + 133, y + 168)
        c.line(x + 145, y + 168, x + 140, y + 157)
        c.line(x + 70, y + 35, x + 143, y + 23)
        c.line(x + 143, y + 23, x + 132, y + 18)
        c.line(x + 143, y + 23, x + 134, y + 30)

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        top = h - 4
        c.setFillColor(BLUE)
        c.roundRect(0, top - 7, 9, 28, 4, fill=1, stroke=0)
        top = draw_para(c, "基本操作 01：滑鼠指引", STYLE["section"], 19, top + 10, w - 20)
        top -= 3
        top = draw_para(c, "先學會看懂每一個箭咀，再開始拖 Box。", STYLE["subtitle"], 19, top, w - 20)
        top -= 20
        # Picture area.
        draw_round_rect(c, 0, top - 225, 185, 220, PALE_BLUE, colors.HexColor("#BFD4EF"), 10)
        self.draw_mouse(c, 40, top - 180)
        c.setFillColor(INK)
        c.setFont(FONT_BOLD, 11)
        c.drawString(12, top - 198, "左鍵按住 = 拖動")
        c.setFont(FONT_REG, 10)
        c.drawString(12, top - 214, "白色方點改尺寸")
        # Right-hand instruction cards.
        cards = [
            ("1  左鍵點一下", "點空白處取消選取；點物件一次選取。"),
            ("2  左鍵按住再拖", "拖 Box 放置；拖物件移動；拖白色方點改尺寸。"),
            ("3  滾輪", "向上放大，向下縮小。找不到模型時按 Home。"),
            ("4  右鍵按住再拖", "平移整個畫面；不會移動模型。"),
            ("5  Shift + 點擊", "逐件加選，之後才可以 Align 或 Group。"),
        ]
        cy = top
        for heading, text in cards:
            bh = 39 if len(text) < 25 else 48
            draw_round_rect(c, 200, cy - bh, w - 200, bh, PALE, LINE, 7)
            c.setFillColor(BLUE)
            c.setFont(FONT_BOLD, 11.2)
            c.drawString(211, cy - 17, heading)
            draw_para(c, text, STYLE["body_small"], 211, cy - 23, w - 222)
            cy -= bh + 8
        top = min(top - 239, cy - 5)
        c.setFillColor(PALE_ORANGE)
        c.setStrokeColor(colors.HexColor("#F1C79C"))
        c.roundRect(0, top - 66, w, 62, 8, fill=1, stroke=1)
        draw_para(c, "記住：白色方點是改尺寸；底部彎箭頭是旋轉；滾輪只改畫面遠近。做錯可按 Ctrl+Z。", STYLE["body"], 14, top - 13, w - 28)


class KeyboardGuidePage(Flowable):
    def __init__(self, w, h, image):
        super().__init__()
        self.width, self.height, self.image = w, h, image

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        top = h - 4
        c.setFillColor(BLUE)
        c.roundRect(0, top - 7, 9, 28, 4, fill=1, stroke=0)
        top = draw_para(c, "基本操作 02：鍵盤指引", STYLE["section"], 19, top + 10, w - 20)
        top -= 3
        top = draw_para(c, "Windows 用 Ctrl；Mac 把 Ctrl 換成 ⌘。", STYLE["subtitle"], 19, top, w - 20)
        top -= 17
        # Use the student's supplied physical keyboard photo and overlay numbered callouts.
        iw, ih = fit_image(self.image, w - 20, 230)
        ix, iy = (w - iw) / 2, top - 238
        draw_round_rect(c, 0, top - 246, w, 240, PALE_BLUE, colors.HexColor("#BFD4EF"), 10)
        c.drawImage(str(self.image), ix, iy, iw, ih, preserveAspectRatio=True, mask="auto")
        sx, sy = iw / 540, ih / 263

        def mark(rx, ry, rw, rh, n):
            # Coordinates refer to the cropped source image (origin at its top-left).
            bx = ix + rx * sx
            by = iy + (263 - ry - rh) * sy
            bw, bh = rw * sx, rh * sy
            c.setStrokeColor(ORANGE)
            c.setLineWidth(2.4)
            c.rect(bx, by, bw, bh, fill=0, stroke=1)
            c.setFillColor(ORANGE)
            c.circle(bx + 8, by + bh - 8, 7, fill=1, stroke=0)
            c.setFillColor(colors.white)
            c.setFont(FONT_LATIN_BOLD, 8)
            c.drawCentredString(bx + 8, by + bh - 11, str(n))

        mark(35, 174, 42, 38, 1)    # Ctrl
        mark(3, 137, 85, 34, 2)     # Shift
        mark(83, 137, 40, 34, 3)    # Z
        mark(72, 101, 39, 31, 4)    # A
        mark(145, 101, 40, 31, 5)   # D
        mark(220, 101, 39, 31, 6)   # G
        mark(257, 101, 40, 31, 7)   # H
        mark(505, 4, 35, 32, 8)     # Delete

        top -= 255
        draw_round_rect(c, 0, top - 38, w, 34, PALE_ORANGE, colors.HexColor("#F1C79C"), 8)
        draw_para(c, "圖上標號：1 Ctrl　2 Shift　3 Z　4 A　5 D　6 G　7 H　8 Delete／Backspace", STYLE["body_small"], 13, top - 9, w - 26)
        top -= 51

        # Shortcut cards, arranged in two columns for large type.
        cards = [
            ("Ctrl + Z", "Undo 復原上一個動作"),
            ("Ctrl + D", "Duplicate 複製並保持副本選取"),
            ("Ctrl + G", "Group／Union 群組選取物件"),
            ("Ctrl + A", "全選目前畫面上的物件"),
            ("Ctrl + H", "Hide 隱藏所選物件"),
            ("Delete / Back", "刪除選取物件；誤刪按 Ctrl+Z"),
        ]
        card_w = (w - 11) / 2
        for i, (keys, text) in enumerate(cards):
            col, row = i % 2, i // 2
            x = col * (card_w + 11)
            y = top - row * 66
            draw_round_rect(c, x, y - 53, card_w, 53, PALE, LINE, 8)
            c.setFillColor(BLUE)
            c.setFont(FONT_LATIN_BOLD, 12)
            c.drawString(x + 13, y - 20, keys)
            draw_para(c, text, STYLE["body_small"], x + 13, y - 27, card_w - 24)
        note_y = top - 3 * 66 - 3
        c.setFillColor(PALE_ORANGE)
        c.setStrokeColor(colors.HexColor("#F1C79C"))
        c.roundRect(0, note_y - 50, w, 46, 8, fill=1, stroke=1)
        draw_para(c, "按住 Shift 再拖旋轉箭頭，可一格一格以 45° 旋轉。每次輸入尺寸後按 Enter。", STYLE["body"], 14, note_y - 10, w - 28)


class StepPage(Flowable):
    def __init__(self, index, total, step, image, w, h):
        super().__init__()
        self.index, self.total, self.step, self.image = index, total, step, image
        self.width, self.height = w, h

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw_label_row(self, c, y, label, text, fill=colors.white):
        row_h = 0
        c.setFillColor(fill)
        c.setStrokeColor(LINE)
        c.roundRect(0, y - 62, self.width, 62, 6, fill=1, stroke=1)
        c.setFillColor(BLUE)
        c.setFont(FONT_BOLD, 12.5)
        c.drawString(14, y - 23, label)
        q = p(text, STYLE["step_body"])
        _, ph = q.wrap(self.width - 104, 100)
        q.drawOn(c, 103, y - 16 - ph)
        return max(62, ph + 28)

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        step = self.step
        top = h - 3
        c.setFillColor(BLUE)
        c.roundRect(0, top - 7, 9, 28, 4, fill=1, stroke=0)
        c.setFillColor(BLUE)
        c.setFont(FONT_LATIN_BOLD, 10)
        c.drawString(20, top + 2, f"MODEL BUILD  {self.index:02d} / {self.total:02d}")
        tool = TOOLS.get(step.get("tool", ""), step.get("tool", ""))
        c.setFillColor(PALE_ORANGE)
        c.setStrokeColor(colors.HexColor("#F1C79C"))
        c.roundRect(w - 174, top - 10, 174, 22, 11, fill=1, stroke=1)
        c.setFillColor(ORANGE)
        c.setFont(FONT_BOLD, 10.5)
        c.drawCentredString(w - 87, top - 2, tool)
        top -= 29
        top = draw_para(c, f"STEP {step.get('screenshotStep', self.index):02d}  {step['title']}", STYLE["step_title"], 0, top, w - 4)
        top -= 8
        max_img_h = 270
        iw, ih = fit_image(self.image, w - 10, max_img_h)
        x = (w - iw) / 2
        c.setFillColor(PALE)
        c.roundRect(x - 6, top - ih - 6, iw + 12, ih + 12, 7, fill=1, stroke=0)
        c.drawImage(str(self.image), x, top - ih, iw, ih, preserveAspectRatio=True, mask="auto")
        top -= ih + 18

        # Dimension badges, when the cleaned lesson has measurable values.
        vals = step.get("values") or []
        if vals:
            c.setFont(FONT_BOLD, 11.5)
            c.setFillColor(BLUE)
            c.drawString(2, top - 1, "本步尺寸")
            bx = 74
            by = top + 7
            for item in vals[:3]:
                text = f"{item['label']}  {item['value']}"
                bw = min(210, max(106, pdfmetrics.stringWidth(text, FONT_REG, 10.5) + 24))
                if bx + bw > w:
                    bx = 74
                    by -= 28
                c.setFillColor(PALE_BLUE)
                c.setStrokeColor(colors.HexColor("#BFD4EF"))
                c.roundRect(bx, by - 17, bw, 22, 8, fill=1, stroke=1)
                c.setFillColor(NAVY)
                c.setFont(FONT_REG, 10.5)
                c.drawString(bx + 10, by - 10, text)
                bx += bw + 7
            top = by - 27
        else:
            top -= 2

        # Three concise instruction blocks.
        rows = [("位置", step["where"], PALE), ("現在做這個動作", step["action"], colors.white), ("完成檢查", step["expect"], PALE)]
        for label, text, fill in rows:
            rh = self.draw_label_row(c, top, label, text, fill)
            top -= rh + 7
        # Keep the help note legible but compact at the bottom.
        note = "小提示：" + step["help"]
        c.setFillColor(colors.HexColor("#F7FAFD"))
        c.setStrokeColor(LINE)
        c.roundRect(0, max(2, top - 47), w, 46, 6, fill=1, stroke=1)
        draw_para(c, note, STYLE["step_note"], 13, max(39, top - 6), w - 26)


def draw_header_footer(c: canvas.Canvas, doc):
    page = doc.page
    if page == 1:
        return
    c.saveState()
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(MARGIN_X, PAGE_H - 9 * mm, PAGE_W - MARGIN_X, PAGE_H - 9 * mm)
    c.setFont(FONT_BOLD, 8.5)
    c.setFillColor(MUTED)
    c.drawString(MARGIN_X, PAGE_H - 7 * mm, "藍色住宅大樓學生指南")
    c.setFont(FONT_REG, 8.5)
    c.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 7 * mm, "Tinkercad 3D 建模")
    c.line(MARGIN_X, 9 * mm, PAGE_W - MARGIN_X, 9 * mm)
    c.drawString(MARGIN_X, 5.5 * mm, "中二 STEAM 建模練習")
    c.drawRightString(PAGE_W - MARGIN_X, 5.5 * mm, f"第 {page} 頁")
    c.restoreState()


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    steps = json.loads(DATA.read_text(encoding="utf-8"))
    doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN_X, rightMargin=MARGIN_X, topMargin=MARGIN_Y, bottomMargin=MARGIN_Y, title="藍色住宅大樓 Tinkercad 學生指南", author="Urban Studio")
    story = [CoverPage(CONTENT_W, CONTENT_H), PageBreak()]
    story.append(IntroPage("使用方法", "先練習基本功能，再開始建模。每頁完成後才按下一步。", [
        ("① 先看滑鼠和鍵盤", "認識選取、拖曳、縮放、旋轉、複製和群組。先在空白工作平面試一次，熟悉後才做大樓。"),
        ("② 跟着截圖做模型", "每一個建模步驟都有一張之前在 Tinkercad 製作時的實作截圖。圖片看不清時可放大 PDF。"),
        ("③ 做完就檢查", "完成檢查寫着這一步應該看到甚麼。對得上才繼續；做不到可按 Undo，回到上一個動作。"),
    ], CONTENT_W, CONTENT_H))
    story.append(PageBreak())
    story.append(InterfaceGuidePage("認識 Tinkercad 編輯器", "第一次打開 3D Design 時，先找到以下區域。", [
        ("左邊：觀看工具", "ViewCube 可切換 TOP／FRONT；Home 回到預設斜角；＋／− 改變畫面遠近。這些只改變你看到的畫面，不會改變模型。"),
        ("中央：Workplane", "藍色格仔板是工作平面。所有 Box 都要拖到這裡；網格用來估位置，尺寸則用白色控制點或數字輸入。"),
        ("右邊：Basic Shapes", "紅色 Box 是實心方塊；灰色斜紋 Box 是 Hole 孔洞。拖入後才會在中央工作平面出現。"),
        ("上方：主工具列", "Undo、Redo、Duplicate、Align、Group 等按鈕會按選取狀態啟用。找不到時把滑鼠停在圖示上看名稱。"),
    ], EDITOR, CONTENT_W, CONTENT_H))
    story.append(PageBreak())
    story.append(MouseGuidePage(CONTENT_W, CONTENT_H))
    story.append(PageBreak())
    story.append(KeyboardGuidePage(CONTENT_W, CONTENT_H, KEYBOARD))
    story.append(PageBreak())
    story.append(IntroPage("基本操作 03：尺寸、孔洞與群組", "這三個觀念會在後面的 34 個步驟反覆出現。", [
        ("輸入尺寸，不要靠估", "選取物件，點白色控制點旁的數字，輸入數值後按 Enter。W 是左右寬、D 是前後深、H 是物件本身高度。"),
        ("Solid 和 Hole", "Solid 是實體；Hole 是要挖走的孔洞。選取 Box 後，在 Shape 面板把 Solid 改成 Hole，便可做窗戶凹位。"),
        ("Group／Union", "先選多件物件，再按 Group／Union。幾件實體可合成一件；多個 Hole 可合成一片孔洞，最後與大樓一起 Union 才會真正挖出窗戶。"),
        ("兩個檢查習慣", "每次輸入數字都按 Enter；每次複製後先看副本是否仍被選中。數量或位置不對時，立即 Undo。"),
    ], CONTENT_W, CONTENT_H))
    story.append(PageBreak())
    story.append(IntroPage("開始建模前：比例與安全檢查", "準備好才開始第一個模型步驟。", [
        ("單位", "右下 Settings → Units 選 Metric，使用 millimeters。1 cm = 10 mm。"),
        ("本課目標", "底座 48 x 48 x 2 mm；住宅大樓總高 114.3 mm。這是約 1:700 的示範模型，並非真實大廈測量圖。"),
        ("操作順序", "先完成基本操作頁，再由 STEP 01 開始。看到「完成檢查」的結果，才進入下一頁。"),
        ("保持整潔", "同一時間只選需要的物件。做窗戶時先隱藏大樓，完成孔洞群組後再 Show all 顯示全部。"),
        ("可以求助", "若畫面和截圖略有不同，把滑鼠停在圖示上看英文名稱；找不到按鈕時先按 Home，再請老師協助。"),
    ], CONTENT_W, CONTENT_H))
    story.append(PageBreak())

    for idx, step in enumerate(steps, start=1):
        img = ASSET_DIR / f"step-{int(step['shot']):02d}.jpg"
        if not img.exists():
            raise FileNotFoundError(img)
        step_for_page = dict(step)
        step_for_page['screenshotStep'] = step['shot']
        story.append(StepPage(idx, len(steps), step_for_page, img, CONTENT_W, CONTENT_H))
        story.append(PageBreak())

    story.append(IntroPage("完成後自我檢查", "把以下項目逐項打勾，再把 STL 交給老師。", [
        ("□ 外形", "有薄底座、中央塔身、四個住宅翼和天台機房。"),
        ("□ 窗戶", "四個方向都有淺凹窗戶，沒有整片穿透；物件已合成一件。"),
        ("□ 尺寸", "W = 48 mm、D = 48 mm、H = 114.3 mm。"),
        ("□ 顏色", "完成模型是藍色 Solid；窗戶孔洞已經 Union。"),
        ("□ 匯出", "只選完成的大樓，Export → .STL。以 mm 匯入切片軟件，底座朝下。"),
    ], CONTENT_W, CONTENT_H))

    doc.build(story, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
    print(OUT)


if __name__ == "__main__":
    build()
