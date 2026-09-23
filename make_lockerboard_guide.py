from pathlib import Path
import html

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(r"C:\Users\ai\Documents\Codex\building")
IMG_DIR = Path(r"C:\Users\ai\Desktop\F.1")
OUT = ROOT / "output" / "pdf" / "CorelDRAW_Lockerboard_Student_Guide.pdf"

OUT.parent.mkdir(parents=True, exist_ok=True)

# Microsoft JhengHei is installed on the user's computer and supports Traditional Chinese.
FONT = "MicrosoftJhengHei"
FONT_BOLD = "MicrosoftJhengHeiBold"
pdfmetrics.registerFont(TTFont(FONT, r"C:\Windows\Fonts\msjh.ttc", subfontIndex=0))
pdfmetrics.registerFont(TTFont(FONT_BOLD, r"C:\Windows\Fonts\msjhbd.ttc", subfontIndex=0))

PAGE_W, PAGE_H = A4
LEFT = 18 * mm
RIGHT = 18 * mm
TOP = 18 * mm
BOTTOM = 18 * mm
CONTENT_W = PAGE_W - LEFT - RIGHT

NAVY = colors.HexColor("#183B56")
TEAL = colors.HexColor("#087E8B")
PINK = colors.HexColor("#F28BA8")
PINK_DARK = colors.HexColor("#C64F76")
YELLOW = colors.HexColor("#FFF3C4")
MINT = colors.HexColor("#E7F6F2")
PALE_BLUE = colors.HexColor("#EAF2F8")
INK = colors.HexColor("#24323D")
GREY = colors.HexColor("#637381")
LIGHT_GREY = colors.HexColor("#E9EEF2")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle", fontName=FONT_BOLD, fontSize=27, leading=35,
    textColor=NAVY, alignment=TA_CENTER, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="CoverSub", fontName=FONT, fontSize=13, leading=20,
    textColor=TEAL, alignment=TA_CENTER, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="CoverSmall", fontName=FONT, fontSize=10.5, leading=17,
    textColor=GREY, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="Kicker", fontName=FONT_BOLD, fontSize=9.5, leading=13,
    textColor=PINK_DARK, spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="H1Guide", fontName=FONT_BOLD, fontSize=21, leading=28,
    textColor=NAVY, spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="BodyGuide", fontName=FONT, fontSize=10.5, leading=17,
    textColor=INK, wordWrap="CJK", spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="BodySmall", fontName=FONT, fontSize=9.2, leading=14,
    textColor=INK, wordWrap="CJK", spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="CaptionGuide", fontName=FONT, fontSize=8.5, leading=12,
    textColor=GREY, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="BoxGuide", fontName=FONT, fontSize=10, leading=16,
    textColor=INK, wordWrap="CJK",
))
styles.add(ParagraphStyle(
    name="BoxCenter", fontName=FONT_BOLD, fontSize=11, leading=16,
    textColor=NAVY, alignment=TA_CENTER, wordWrap="CJK",
))


def P(text, style="BodyGuide"):
    return Paragraph(text, styles[style])


def section(title, kicker, subtitle=None):
    flow = [P(kicker.upper(), "Kicker"), P(title, "H1Guide")]
    if subtitle:
        flow.append(P(subtitle, "BodyGuide"))
    flow.append(Spacer(1, 4))
    return flow


def step(number, text):
    safe = html.escape(text)
    return P(
        f'<font color="#C64F76"><b>STEP {number}</b></font>&nbsp;&nbsp;{safe}',
        "BodyGuide",
    )


def callout(label, text, bg=YELLOW, border=colors.HexColor("#E2C45D")):
    content = P(
        f'<font color="#C64F76"><b>{html.escape(label)}</b></font>&nbsp;&nbsp;'
        f'{html.escape(text)}',
        "BoxGuide",
    )
    t = Table([[content]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.8, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def screenshot(filename, caption, max_w=CONTENT_W, max_h=360):
    path = IMG_DIR / filename
    with PILImage.open(path) as im:
        iw, ih = im.size
    scale = min(max_w / iw, max_h / ih)
    w, h = iw * scale, ih * scale
    img = Image(str(path), width=w, height=h, hAlign="CENTER", mask="auto")
    frame = Table([[img]], colWidths=[max_w], hAlign="CENTER")
    frame.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.8, LIGHT_GREY),
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return KeepTogether([frame, P(f"圖 {filename}｜{html.escape(caption)}", "CaptionGuide")])


def screenshot_pair(left_file, left_caption, right_file, right_caption, max_h=235):
    cells = []
    for filename, caption in ((left_file, left_caption), (right_file, right_caption)):
        path = IMG_DIR / filename
        with PILImage.open(path) as im:
            iw, ih = im.size
        max_w = (CONTENT_W - 12) / 2
        scale = min(max_w / iw, max_h / ih)
        img = Image(str(path), width=iw * scale, height=ih * scale, hAlign="CENTER", mask="auto")
        cells.append((img, P(f"圖 {filename}｜{html.escape(caption)}", "CaptionGuide")))
    t = Table(
        [[cells[0][0], cells[1][0]], [cells[0][1], cells[1][1]]],
        colWidths=[(CONTENT_W - 12) / 2] * 2,
        hAlign="CENTER",
    )
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, 0), 0.8, LIGHT_GREY),
        ("INNERGRID", (0, 0), (-1, 0), 0.8, LIGHT_GREY),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, 0), 5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
    ]))
    return t


def small_card(title, text, bg=PALE_BLUE):
    content = [P(title, "BoxCenter"), Spacer(1, 3), P(text, "BodySmall")]
    t = Table([[content]], colWidths=[(CONTENT_W - 12) / 2])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#BDD1DD")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return t


def page_header_footer(canvas, doc):
    canvas.saveState()
    page = doc.page
    if page > 1:
        canvas.setStrokeColor(LIGHT_GREY)
        canvas.setLineWidth(0.6)
        canvas.line(LEFT, PAGE_H - 12 * mm, PAGE_W - RIGHT, PAGE_H - 12 * mm)
        canvas.setFont(FONT, 8)
        canvas.setFillColor(GREY)
        canvas.drawString(LEFT, PAGE_H - 9 * mm, "CorelDRAW Lockerboard 學生使用指南")
        canvas.drawRightString(PAGE_W - RIGHT, PAGE_H - 9 * mm, "CorelDRAW 2019")
        canvas.line(LEFT, 12 * mm, PAGE_W - RIGHT, 12 * mm)
        canvas.setFont(FONT, 8)
        canvas.drawCentredString(PAGE_W / 2, 8 * mm, f"第 {page} 頁")
    canvas.restoreState()


story = []

# Cover
story += [Spacer(1, 27 * mm)]
accent = Table([["", "", ""]], colWidths=[38 * mm, 38 * mm, 38 * mm], rowHeights=[6 * mm])
accent.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, 0), TEAL),
    ("BACKGROUND", (1, 0), (1, 0), PINK),
    ("BACKGROUND", (2, 0), (2, 0), NAVY),
    ("BOX", (0, 0), (-1, -1), 0, colors.white),
]))
story += [accent, Spacer(1, 15 * mm)]
story += [P("CorelDRAW Lockerboard", "CoverTitle"), P("學生使用指南", "CoverTitle")]
story += [Spacer(1, 4 * mm), P("CorelDRAW 2019｜中一適用", "CoverSub")]
story += [Spacer(1, 18 * mm)]

cover_box = Table([
    [P("今次任務", "BoxCenter")],
    [P("製作一張 80 mm × 40 mm 的 lockerboard，加入姓名、班別符號及黑白圖片，最後交出 AI 檔案和 CDR 原檔。", "BodyGuide")],
], colWidths=[CONTENT_W * 0.78], hAlign="CENTER")
cover_box.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), MINT),
    ("BOX", (0, 0), (-1, -1), 1.2, TEAL),
    ("LEFTPADDING", (0, 0), (-1, -1), 15),
    ("RIGHTPADDING", (0, 0), (-1, -1), 15),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
]))
story += [cover_box, Spacer(1, 24 * mm), P("請按順序閱讀，每一頁只完成一小部分。", "CoverSmall"), P("完成後記得使用最後一頁的檢查表。", "CoverSmall"), PageBreak()]

# Page 2: overview
story += section("先知道你要完成甚麼", "開始前", "整份工作可以分成 8 個小步驟。完成後要有兩個檔案。")
cards = [
    ("1  建立文件", "A4、CMYK、300 dpi", PALE_BLUE),
    ("2  畫外框", "矩形 80 mm × 40 mm", MINT),
    ("3  加入文字", "姓名和班別符號", colors.HexColor("#FFF0F5")),
    ("4  準備圖片", "下載圖片並轉成 SVG", YELLOW),
    ("5  放入圖片", "拖入、縮放、排好位置", PALE_BLUE),
    ("6  Export AI", "U: → Class → 1A → 個人資料夾", MINT),
    ("7  Save CDR", "保留可以修改的原檔", colors.HexColor("#FFF0F5")),
    ("8  最後檢查", "確認檔案位置和格式", YELLOW),
]
rows = []
for i in range(0, len(cards), 2):
    row = []
    for title, text, bg in cards[i:i + 2]:
        row.append(small_card(title, text, bg))
    rows.append(row)
overview = Table(rows, colWidths=[(CONTENT_W - 12) / 2] * 2, hAlign="CENTER")
overview.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story += [overview, Spacer(1, 7), callout("檔案名稱", "兩個檔案都使用同一個名稱，例如 1a01_lockerboard；副檔名會分別是 .ai 和 .cdr。", MINT, TEAL), PageBreak()]

# Page 3: first launch
story += section("第一次開啟 CorelDRAW", "Step 0｜只在第一次出現", "如果電腦沒有顯示這個畫面，可以直接跳到下一頁。")
story += [step("0", "在歡迎畫面按「跳過」或「繼續」，進入 CorelDRAW。"), Spacer(1, 5), screenshot("1.png", "第一次使用時的歡迎及登入畫面", max_h=430), Spacer(1, 4), callout("注意", "這個登入步驟不是製作 lockerboard 的必要步驟。不要在指南內寫入任何帳戶或密碼。", YELLOW), PageBreak()]

# Page 4: new document
story += section("建立一份新的 CorelDRAW 文件", "Step 1｜建立文件", "先設定好紙張和色彩，之後才開始畫圖。")
story += [step("1A", "按「檔案 (File) → 新增 (New)」。"), Spacer(1, 3), screenshot("2.png", "開啟檔案選單，選擇新增", max_h=205), Spacer(1, 2), step("1B", "選擇 A4、CMYK、300 dpi，然後按「確定」。"), Spacer(1, 3), screenshot("3.png", "建立新文件的設定視窗", max_h=245), PageBreak()]

# Page 5: rectangle
story += section("畫出 lockerboard 外框", "Step 2｜製作外框", "外框大小是 80 mm × 40 mm。")
story += [step("2A", "在左邊工具列選擇「矩形工具」，快捷鍵是 F6。"), Spacer(1, 3), screenshot("4.png", "選擇矩形工具 F6", max_h=220), Spacer(1, 2), step("2B", "在頁面上拖曳畫出矩形，再在上方工具列輸入寬度 80.0 mm、高度 40.0 mm。"), Spacer(1, 3), screenshot("5.png", "調整矩形的寬度和高度", max_h=270), PageBreak()]

# Page 6: text
story += section("加入姓名和班別符號", "Step 3｜加入文字", "先輸入姓名，再加入代表班別的圓圈數字。")
story += [step("3A", "選擇文字工具，在矩形內輸入姓名。可使用 Bernard MT Condensed，字體大小約 48 pt。"), Spacer(1, 3), screenshot("6.png", "選擇字型、字體大小，並輸入姓名", max_h=235), Spacer(1, 2), step("3B", "在文字選單開啟字元／Character 工具，選擇需要的符號，例如「③」，再拖曳到作品中。"), Spacer(1, 3), screenshot("7.png", "選擇圓圈數字並拖到作品中", max_h=235), PageBreak()]

# Page 7: search and save image
story += section("搜尋及下載一張圖片", "Step 4A｜準備圖片", "以下例子使用 Google Images。請使用老師批准或可以合法使用的圖片。")
story += [step("4A", "在 Google 圖片搜尋想要的主題，例如 Rex。"), Spacer(1, 3), screenshot("8.png", "在 Google 搜尋圖片", max_h=215), Spacer(1, 2), step("4B", "在圖片上按右鍵，選擇「另存圖片為」。將圖片存到容易找到的位置，例如桌面。"), Spacer(1, 3), screenshot("9.png", "另存圖片到桌面", max_h=285), PageBreak()]

# Page 8: wrong format
story += section("檢查圖片格式", "Step 4B｜格式提醒", "圖片要先下載成 JPG 或 PNG，才方便之後處理。")
story += [step("4C", "在儲存類型選擇 JPEG Image 或 PNG Image。不要使用 WebP。"), Spacer(1, 3), screenshot("10.png", "WebP 格式不能使用的例子", max_h=285), Spacer(1, 4), callout("記住", "見到 WebP 時按取消，重新選擇 JPG 或 PNG 格式再儲存。", YELLOW), Spacer(1, 12), P("下一步會用 Cute Cutter 將圖片變成黑白 SVG。", "BodyGuide"), PageBreak()]

# Page 9: Cute Cutter upload
story += section("將圖片上載到 Cute Cutter", "Step 4C｜上載圖片", "Cute Cutter 可以幫我們把圖片處理成較容易使用的黑白圖案。")
story += [step("4D", "開啟 Cute Cutter，登入後按 Upload New Image。"), Spacer(1, 3), screenshot("11.png", "Cute Cutter 上載圖片頁面", max_h=250), Spacer(1, 2), step("4E", "在檔案視窗選擇剛才下載的 JPG 或 PNG，然後按開啟。"), Spacer(1, 3), screenshot("12.png", "選擇圖片並按開啟", max_h=285), PageBreak()]

# Page 10: adjust and download svg
story += section("調整黑白效果並下載 SVG", "Step 4D｜製作 SVG", "調整到圖案清楚、黑白分明即可。")
story += [step("4F", "調整 Blur、Edge Contrast、Threshold 等滑桿，直到圖案清楚。完成後按 Download。"), Spacer(1, 3), screenshot("13.png", "調整黑白效果並下載", max_h=300), Spacer(1, 2), step("4G", "檔案格式選擇 SVG，然後下載。"), Spacer(1, 3), screenshot("14.png", "選擇 Download SVG", max_h=230), PageBreak()]

# Page 11: insert and resize
story += section("將 SVG 放入 lockerboard", "Step 5｜放入圖片", "把下載好的 SVG 放到矩形內，並調整到合適大小。")
story += [step("5A", "開啟瀏覽器的下載記錄，將 SVG 檔案拖曳到 CorelDRAW 的矩形內。"), Spacer(1, 3), screenshot("15.png", "從下載記錄拖曳 SVG 到 CorelDRAW", max_h=255), Spacer(1, 2), step("5B", "選取圖片後，按住 Shift，再拖曳角落控制點調整大小，避免圖片變形。"), Spacer(1, 3), screenshot("16.png", "用角落控制點調整圖片大小", max_h=285), PageBreak()]

# Page 12: export start
story += section("開始匯出 AI 檔案", "Step 6｜Export AI", "AI 是交付用的匯出檔案。先完成設計，再進行匯出。")
story += [step("6A", "按「檔案 (File) → 匯出 (Export)」，或使用快捷鍵 Ctrl + E。"), Spacer(1, 4), screenshot("17.png", "從檔案選單選擇匯出", max_h=310), Spacer(1, 4), callout("檔案格式", "匯出視窗的儲存類型要選 AI - Adobe Illustrator。", MINT, TEAL), PageBreak()]

# Page 13: choose folder 1
story += section("選擇指定的儲存位置", "Step 6A｜找資料夾", "依照學校指定的路徑進入自己的資料夾。")
story += [step("6B", "在匯出視窗選擇 U: 磁碟機，檔案名稱先輸入 1a01_lockerboard，類型選 AI - Adobe Illustrator。"), Spacer(1, 3), screenshot("18.png", "選擇 U: 磁碟機、檔名和 AI 格式", max_h=330), Spacer(1, 2), step("6C", "依次開啟 Class，再開啟自己的班別資料夾，例如 1A。"), Spacer(1, 3), screenshot_pair("19.png", "開啟 Class 資料夾", "20.png", "開啟 1A 資料夾", max_h=190), PageBreak()]

# Page 14: choose folder 2
story += section("進入個人資料夾並按 Export", "Step 6B｜最後位置", "最後一層資料夾應該是你的個人編號，例如 1a01。")
story += [step("6D", "開啟自己的個人資料夾，例如 1a01。確認上方路徑正確，再按 Export。"), Spacer(1, 4), screenshot_pair("21.png", "進入 1a01 個人資料夾並按 Export", "18.png", "檢查檔名及 AI 格式", max_h=230), Spacer(1, 4), callout("正確路徑", r"U:\Class\1A\1a01\1a01_lockerboard.ai", MINT, TEAL), PageBreak()]

# Page 15: AI options
story += section("設定 AI 匯出選項", "Step 6C｜AI 設定", "中文或英文視窗的設定意思相同。")
story += [step("6E", "Export text as 選 Curves／曲線，並勾選 Convert outlines to objects。保留 Include placed images 和 Include preview image，然後按確定／OK。"), Spacer(1, 4), screenshot_pair("22a.png", "中文 AI 匯出選項", "22b.png", "英文 AI 匯出選項", max_h=240), Spacer(1, 4), callout("為甚麼選 Curves？", "將文字轉成曲線，可減少另一部電腦沒有相同字型而造成的變化。", YELLOW), PageBreak()]

# Page 16: save CDR
story += section("儲存 CDR 原檔", "Step 7｜Save CDR", "CDR 是日後可以重新開啟和修改的 CorelDRAW 原檔。")
story += [step("7A", "在相同的個人資料夾內，儲存檔案名稱 1a01_lockerboard，儲存類型選 CDR - CorelDRAW，然後按 Save。"), Spacer(1, 4), screenshot("23.png", "在指定資料夾儲存 CDR 原檔", max_h=390), Spacer(1, 5), callout("最後結果", "同一個資料夾內應該有 1a01_lockerboard.ai 和 1a01_lockerboard.cdr。", MINT, TEAL), PageBreak()]

# Page 17: checklist
story += section("交功課前最後檢查", "Step 8｜Checklist", "逐項打勾，確認沒有漏步驟。")
check_items = [
    "lockerboard 外框大小是 80 mm × 40 mm。",
    "姓名和班別符號已放在正確位置。",
    "圖片已處理成清楚的黑白 SVG。",
    "圖片沒有變形，並且留在矩形範圍內。",
    "AI 匯出格式是 AI - Adobe Illustrator。",
    "AI 匯出設定選了 Curves／曲線。",
    "CDR 儲存格式是 CDR - CorelDRAW。",
    r"AI 和 CDR 都在 U:\Class\1A\1a01。",
    "檔案名稱正確，例如 1a01_lockerboard。",
]
check_rows = [[P(f"□  {item}", "BodyGuide")] for item in check_items]
check_table = Table(check_rows, colWidths=[CONTENT_W])
check_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FBFC")),
    ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#BDD1DD")),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, LIGHT_GREY),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story += [check_table, Spacer(1, 10), callout("小提示", "如果找不到 AI 或 CDR 檔案，先檢查檔案名稱、儲存類型，以及上方的資料夾路徑。", YELLOW), Spacer(1, 18), P("完成！你已經學會用 CorelDRAW 製作 lockerboard，並正確匯出及儲存檔案。", "BoxCenter")]


doc = SimpleDocTemplate(
    str(OUT), pagesize=A4, leftMargin=LEFT, rightMargin=RIGHT,
    topMargin=TOP, bottomMargin=BOTTOM, title="CorelDRAW Lockerboard 學生使用指南",
    author="Codex",
)
doc.build(story, onFirstPage=page_header_footer, onLaterPages=page_header_footer)
print(OUT)
