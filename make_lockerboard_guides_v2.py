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
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

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


def register_fonts(lang):
    if lang == "zh":
        regular, bold = "MJGuide", "MJGuideBold"
        pdfmetrics.registerFont(TTFont(regular, r"C:\Windows\Fonts\msjh.ttc", subfontIndex=0))
        pdfmetrics.registerFont(TTFont(bold, r"C:\Windows\Fonts\msjhbd.ttc", subfontIndex=0))
    else:
        regular, bold = "ArialGuide", "ArialGuideBold"
        pdfmetrics.registerFont(TTFont(regular, r"C:\Windows\Fonts\arial.ttf"))
        pdfmetrics.registerFont(TTFont(bold, r"C:\Windows\Fonts\arialbd.ttf"))
    return regular, bold


def make_styles(lang, regular, bold):
    suffix = lang
    styles = getSampleStyleSheet()
    h1_size, h1_leading = (19, 24) if lang == "en" else (21, 28)
    body_size, body_leading = (9.8, 15.5) if lang == "en" else (10.5, 17)
    small_size, small_leading = (8.8, 13) if lang == "en" else (9.2, 14)
    caption_size, caption_leading = (8.2, 11) if lang == "en" else (8.5, 12)
    box_size, box_leading = (9.4, 14) if lang == "en" else (10, 16)
    center_size, center_leading = (10.5, 15) if lang == "en" else (11, 16)
    styles.add(ParagraphStyle(
        name=f"CoverTitle_{suffix}", fontName=bold, fontSize=27, leading=35,
        textColor=NAVY, alignment=TA_CENTER, spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name=f"CoverSub_{suffix}", fontName=regular, fontSize=13, leading=20,
        textColor=TEAL, alignment=TA_CENTER, spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name=f"CoverSmall_{suffix}", fontName=regular, fontSize=10.5, leading=17,
        textColor=GREY, alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name=f"Kicker_{suffix}", fontName=bold, fontSize=9.5, leading=13,
        textColor=PINK_DARK, spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name=f"H1_{suffix}", fontName=bold, fontSize=h1_size, leading=h1_leading,
        textColor=NAVY, spaceAfter=5,
    ))
    styles.add(ParagraphStyle(
        name=f"Body_{suffix}", fontName=regular, fontSize=body_size, leading=body_leading,
        textColor=INK, wordWrap="CJK", spaceAfter=5,
    ))
    styles.add(ParagraphStyle(
        name=f"Small_{suffix}", fontName=regular, fontSize=small_size, leading=small_leading,
        textColor=INK, wordWrap="CJK", spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name=f"Caption_{suffix}", fontName=regular, fontSize=caption_size, leading=caption_leading,
        textColor=GREY, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name=f"Box_{suffix}", fontName=regular, fontSize=box_size, leading=box_leading,
        textColor=INK, wordWrap="CJK",
    ))
    styles.add(ParagraphStyle(
        name=f"Center_{suffix}", fontName=bold, fontSize=center_size, leading=center_leading,
        textColor=NAVY, alignment=TA_CENTER, wordWrap="CJK",
    ))
    return styles


def build_pdf(lang, out_path):
    regular, bold = register_fonts(lang)
    styles = make_styles(lang, regular, bold)
    style = lambda key: styles[f"{key}_{lang}"]

    def P(text, key="Body"):
        return Paragraph(text, style(key))

    def esc(text):
        return html.escape(str(text))

    def section(kicker, title, subtitle):
        return [
            P(kicker.upper(), "Kicker"),
            P(title, "H1"),
            P(subtitle, "Body"),
            Spacer(1, 4),
        ]

    def step(number, text):
        return P(
            f'<font color="#C64F76"><b>STEP {esc(number)}</b></font>&nbsp;&nbsp;{esc(text)}',
            "Body",
        )

    def callout(label, text, bg=YELLOW, border=colors.HexColor("#E2C45D")):
        content = P(
            f'<font color="#C64F76"><b>{esc(label)}</b></font>&nbsp;&nbsp;{esc(text)}',
            "Box",
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
        if lang == "en":
            max_h *= 0.9
        path = IMG_DIR / filename
        with PILImage.open(path) as im:
            iw, ih = im.size
        scale = min(max_w / iw, max_h / ih)
        img = Image(str(path), width=iw * scale, height=ih * scale, hAlign="CENTER", mask="auto")
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
        return KeepTogether([frame, P(f"{'Figure' if lang == 'en' else '圖'} {filename} | {esc(caption)}", "Caption")])

    def screenshot_pair(left_file, left_caption, right_file, right_caption, max_h=235):
        if lang == "en":
            max_h *= 0.9
        cells = []
        for filename, caption in ((left_file, left_caption), (right_file, right_caption)):
            path = IMG_DIR / filename
            with PILImage.open(path) as im:
                iw, ih = im.size
            max_w = (CONTENT_W - 12) / 2
            scale = min(max_w / iw, max_h / ih)
            img = Image(str(path), width=iw * scale, height=ih * scale, hAlign="CENTER", mask="auto")
            cells.append((img, P(f"{'Figure' if lang == 'en' else '圖'} {filename} | {esc(caption)}", "Caption")))
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
        content = [P(title, "Center"), Spacer(1, 3), P(text, "Small")]
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
        if doc.page > 1:
            header_left = "CorelDRAW Lockerboard Student Guide" if lang == "en" else "CorelDRAW Lockerboard 學生使用指南"
            header_right = "CorelDRAW 2019"
            canvas.setStrokeColor(LIGHT_GREY)
            canvas.setLineWidth(0.6)
            canvas.line(LEFT, PAGE_H - 12 * mm, PAGE_W - RIGHT, PAGE_H - 12 * mm)
            canvas.setFont(regular, 8)
            canvas.setFillColor(GREY)
            canvas.drawString(LEFT, PAGE_H - 9 * mm, header_left)
            canvas.drawRightString(PAGE_W - RIGHT, PAGE_H - 9 * mm, header_right)
            canvas.line(LEFT, 12 * mm, PAGE_W - RIGHT, 12 * mm)
            canvas.drawCentredString(PAGE_W / 2, 8 * mm, f"Page {doc.page}" if lang == "en" else f"第 {doc.page} 頁")
        canvas.restoreState()

    if lang == "zh":
        title1, title2 = "CorelDRAW Lockerboard", "學生使用指南"
        cover_sub = "CorelDRAW 2019｜中一適用"
        mission_title = "今次任務"
        mission = "製作一張 80 mm × 40 mm 的 lockerboard，加入姓名、班別符號及黑白圖片，最後交出 AI 檔案和 CDR 原檔。"
        cover_note1, cover_note2 = "請按順序閱讀，每一頁只完成一小部分。", "完成後記得使用最後一頁的檢查表。"
        start_kicker, start_title, start_sub = "開始前", "先知道你要完成甚麼", "整份工作可以分成 8 個小步驟。完成後要有兩個檔案。"
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
        file_label, file_note = "檔案名稱", "兩個檔案都使用同一個名稱，例如 1a01_lockerboard；副檔名會分別是 .ai 和 .cdr。"
        p3 = ("Step 0｜只在第一次出現", "第一次開啟 CorelDRAW", "如果電腦沒有顯示這個畫面，可以直接跳到下一頁。", "在歡迎畫面按「跳過」或「繼續」，進入 CorelDRAW。", "第一次使用時的歡迎及登入畫面", "注意", "這個登入步驟不是製作 lockerboard 的必要步驟。不要在指南內寫入任何帳戶或密碼。")
        p4 = ("Step 1｜建立文件", "建立一份新的 CorelDRAW 文件", "先設定好紙張和色彩，之後才開始畫圖。", "按「檔案 (File) → 新增 (New)」。", "開啟檔案選單，選擇新增", "選擇 A4、CMYK、300 dpi，然後按「確定」。", "建立新文件的設定視窗")
        p5 = ("Step 2｜製作外框", "畫出 lockerboard 外框", "外框大小是 80 mm × 40 mm。", "在左邊工具列選擇「矩形工具」，快捷鍵是 F6。", "選擇矩形工具 F6", "在頁面上拖曳畫出矩形，再在上方工具列輸入寬度 80.0 mm、高度 40.0 mm。", "調整矩形的寬度和高度")
        p6 = ("Step 3｜加入文字", "加入姓名和班別符號", "先輸入姓名，再加入代表班別的圓圈數字。", "選擇文字工具，在矩形內輸入姓名。可使用 Bernard MT Condensed，字體大小約 48 pt。", "選擇字型、字體大小，並輸入姓名", "在文字選單開啟字元／Character 工具，選擇需要的符號，例如「③」，再拖曳到作品中。", "選擇圓圈數字並拖到作品中")
        p7 = ("Step 4A｜準備圖片", "搜尋及下載一張圖片", "以下例子使用 Google Images。請使用老師批准或可以合法使用的圖片。", "在 Google 圖片搜尋想要的主題，例如 Rex。", "在 Google 搜尋圖片", "在圖片上按右鍵，選擇「另存圖片為」。將圖片存到容易找到的位置，例如桌面。", "另存圖片到桌面")
        p8 = ("Step 4B｜格式提醒", "檢查圖片格式", "圖片要先下載成 JPG 或 PNG，才方便之後處理。", "在儲存類型選擇 JPEG Image 或 PNG Image。不要使用 WebP。", "WebP 格式不能使用的例子", "記住", "見到 WebP 時按取消，重新選擇 JPG 或 PNG 格式再儲存。", "下一步會用 Cute Cutter 將圖片變成黑白 SVG。")
        p9 = ("Step 4C｜上載圖片", "將圖片上載到 Cute Cutter", "Cute Cutter 可以幫我們把圖片處理成較容易使用的黑白圖案。", "開啟 Cute Cutter，登入後按 Upload New Image。", "Cute Cutter 上載圖片頁面", "在檔案視窗選擇剛才下載的 JPG 或 PNG，然後按開啟。", "選擇圖片並按開啟")
        p10 = ("Step 4D｜製作 SVG", "調整黑白效果並下載 SVG", "調整到圖案清楚、黑白分明即可。", "調整 Blur、Edge Contrast、Threshold 等滑桿，直到圖案清楚。完成後按 Download。", "調整黑白效果並下載", "檔案格式選擇 SVG，然後下載。", "選擇 Download SVG")
        p11 = ("Step 5｜放入圖片", "將 SVG 放入 lockerboard", "把下載好的 SVG 放到矩形內，並調整到合適大小。", "開啟瀏覽器的下載記錄，將 SVG 檔案拖曳到 CorelDRAW 的矩形內。", "從下載記錄拖曳 SVG 到 CorelDRAW", "選取圖片後，按住 Shift，再拖曳角落控制點調整大小，避免圖片變形。", "用角落控制點調整圖片大小")
        p12 = ("Step 6｜Export AI", "開始匯出 AI 檔案", "AI 是交付用的匯出檔案。先完成設計，再進行匯出。", "按「檔案 (File) → 匯出 (Export)」，或使用快捷鍵 Ctrl + E。", "從檔案選單選擇匯出", "檔案格式", "匯出視窗的儲存類型要選 AI - Adobe Illustrator。")
        p13 = ("Step 6A｜找資料夾", "選擇指定的儲存位置", "依照學校指定的路徑進入自己的資料夾。", "在匯出視窗選擇 U: 磁碟機，檔案名稱先輸入 1a01_lockerboard，類型選 AI - Adobe Illustrator。", "選擇 U: 磁碟機、檔名和 AI 格式", "依次開啟 Class，再開啟自己的班別資料夾，例如 1A。", "開啟 Class 資料夾", "開啟 1A 資料夾")
        p14 = ("Step 6B｜最後位置", "進入個人資料夾並按 Export", "最後一層資料夾應該是你的個人編號，例如 1a01。", "開啟自己的個人資料夾，例如 1a01。確認上方路徑正確，再按 Export。", "進入 1a01 個人資料夾並按 Export", "檢查檔名及 AI 格式", "正確路徑", r"U:\Class\1A\1a01\1a01_lockerboard.ai")
        p15 = ("Step 6C｜AI 設定", "設定 AI 匯出選項", "中文或英文視窗的設定意思相同。", "Export text as 選 Curves／曲線，並勾選 Convert outlines to objects。保留 Include placed images 和 Include preview image，然後按確定／OK。", "中文 AI 匯出選項", "英文 AI 匯出選項", "為甚麼選 Curves？", "將文字轉成曲線，可減少另一部電腦沒有相同字型而造成的變化。")
        p16 = ("Step 7｜Save CDR", "儲存 CDR 原檔", "CDR 是日後可以重新開啟和修改的 CorelDRAW 原檔。", "在相同的個人資料夾內，儲存檔案名稱 1a01_lockerboard，儲存類型選 CDR - CorelDRAW，然後按 Save。", "在指定資料夾儲存 CDR 原檔", "最後結果", "同一個資料夾內應該有 1a01_lockerboard.ai 和 1a01_lockerboard.cdr。")
        check_title, check_sub = "交功課前最後檢查", "逐項打勾，確認沒有漏步驟。"
        checks = [
            "lockerboard 大小是 80 mm × 40 mm。",
            "姓名和圖片已加入。",
            "圖片清晰。",
            "已匯出 AI 檔案。",
            "已儲存 CDR 檔案。",
            "AI 和 CDR 都在正確的個人資料夾。",
            "檔案名稱正確。",
        ]
        final_tip, final_text = "小提示", "如果找不到 AI 或 CDR 檔案，先檢查檔案名稱、儲存類型，以及上方的資料夾路徑。"
        final_done = "完成！你已經學會用 CorelDRAW 製作 lockerboard，並正確匯出及儲存檔案。"
    else:
        title1, title2 = "CorelDRAW Lockerboard", "Student Guide"
        cover_sub = "CorelDRAW 2019 | For Form 1 students"
        mission_title = "Your task"
        mission = "Create an 80 mm x 40 mm lockerboard with your name, class symbol and a black-and-white picture. Then submit an AI file and the original CDR file."
        cover_note1, cover_note2 = "Read the pages in order and complete one small part at a time.", "Use the final checklist before submitting your work."
        start_kicker, start_title, start_sub = "Before you start", "Know what you will make", "The task has 8 small steps. You will finish with two files."
        cards = [
            ("1  Create file", "A4, CMYK, 300 dpi", PALE_BLUE),
            ("2  Draw frame", "Rectangle 80 mm x 40 mm", MINT),
            ("3  Add text", "Name and class symbol", colors.HexColor("#FFF0F5")),
            ("4  Prepare picture", "Download and convert to SVG", YELLOW),
            ("5  Place picture", "Drag in, resize and arrange", PALE_BLUE),
            ("6  Export AI", "U: -> Class -> 1A -> personal folder", MINT),
            ("7  Save CDR", "Keep an editable original", colors.HexColor("#FFF0F5")),
            ("8  Final check", "Check folder and file types", YELLOW),
        ]
        file_label, file_note = "File name", "Use the same name for both files, for example 1a01_lockerboard. The extensions will be .ai and .cdr."
        p3 = ("Step 0 | First time only", "Open CorelDRAW for the first time", "If this screen does not appear, go to the next page.", "On the welcome screen, click Skip or Continue to enter CorelDRAW.", "First-use welcome and sign-in screen", "Note", "Signing in is not required for this lockerboard task. Do not write any account details or passwords in the guide.")
        p4 = ("Step 1 | Create a file", "Create a new CorelDRAW document", "Set the page and colour settings before you start drawing.", "Click File -> New.", "Open the File menu and choose New", "Choose A4, CMYK and 300 dpi, then click OK.", "New document settings")
        p5 = ("Step 2 | Make the frame", "Draw the lockerboard frame", "The frame size is 80 mm x 40 mm.", "Choose the Rectangle tool from the left toolbar. The shortcut is F6.", "Choose Rectangle tool F6", "Drag a rectangle on the page. Then enter 80.0 mm for width and 40.0 mm for height in the top toolbar.", "Set the rectangle width and height")
        p6 = ("Step 3 | Add text", "Add your name and class symbol", "Type your name first, then add the circled number for your class.", "Choose the Text tool and type your name inside the rectangle. Bernard MT Condensed at about 48 pt can be used.", "Choose font, size and type the name", "Open the Character tool from the Text menu, choose the symbol you need, such as ③, and drag it into the design.", "Choose a circled number and drag it into the design")
        p7 = ("Step 4A | Prepare picture", "Search for and download a picture", "The example uses Google Images. Use a picture approved by your teacher or one you are allowed to use.", "Search Google Images for a subject, such as Rex.", "Search for a picture in Google", "Right-click the picture and choose Save image as. Save it somewhere easy to find, such as the Desktop.", "Save the picture to the Desktop")
        p8 = ("Step 4B | Format reminder", "Check the picture format", "Download the picture as JPG or PNG so it can be processed.", "Choose JPEG Image or PNG Image in the file type list. Do not use WebP.", "Example of an unusable WebP format", "Remember", "If you see WebP, click Cancel and save again as JPG or PNG.", "Next, Cute Cutter will turn the picture into a black-and-white SVG.")
        p9 = ("Step 4C | Upload picture", "Upload the picture to Cute Cutter", "Cute Cutter helps turn the picture into an easy-to-use black-and-white design.", "Open Cute Cutter, sign in and click Upload New Image.", "Cute Cutter upload page", "In the file window, choose the JPG or PNG you downloaded, then click Open.", "Choose the picture and click Open")
        p10 = ("Step 4D | Make SVG", "Adjust the black-and-white effect and download SVG", "Adjust the picture until the black and white areas are clear.", "Adjust the Blur, Edge Contrast and Threshold sliders until the design is clear. Then click Download.", "Adjust the black-and-white effect and download", "Choose SVG as the file format, then download it.", "Choose Download SVG")
        p11 = ("Step 5 | Place picture", "Put the SVG into the lockerboard", "Place the downloaded SVG inside the rectangle and resize it.", "Open the browser downloads list and drag the SVG file into the CorelDRAW rectangle.", "Drag the SVG from Downloads into CorelDRAW", "Select the picture. Hold Shift and drag a corner handle to resize it without changing its shape.", "Resize the picture with a corner handle")
        p12 = ("Step 6 | Export AI", "Start exporting the AI file", "The AI file is the file you submit. Finish the design before exporting.", "Click File -> Export, or press Ctrl + E.", "Choose Export from the File menu", "File type", "Choose AI - Adobe Illustrator in the Export window.")
        p13 = ("Step 6A | Find folder", "Choose the required save location", "Follow the school path to your personal folder.", "In the Export window, choose the U: drive. Enter 1a01_lockerboard as the file name and choose AI - Adobe Illustrator.", "Choose U: drive, file name and AI format", "Open Class, then open your class folder, for example 1A.", "Open the Class folder", "Open the 1A folder")
        p14 = ("Step 6B | Final location", "Open your personal folder and click Export", "The last folder should be your personal number, for example 1a01.", "Open your personal folder, such as 1a01. Check the path at the top, then click Export.", "Open the 1a01 personal folder and click Export", "Check the file name and AI format", "Correct path", r"U:\Class\1A\1a01\1a01_lockerboard.ai")
        p15 = ("Step 6C | AI settings", "Set the AI export options", "The Chinese and English windows have the same settings.", "Set Export text as to Curves and tick Convert outlines to objects. Keep Include placed images and Include preview image selected, then click OK.", "Chinese AI export options", "English AI export options", "Why choose Curves?", "Turning text into curves reduces changes caused by missing fonts on another computer.")
        p16 = ("Step 7 | Save CDR", "Save the original CDR file", "The CDR file can be reopened and edited in CorelDRAW later.", "In the same personal folder, use the file name 1a01_lockerboard, choose CDR - CorelDRAW as the file type, and click Save.", "Save the CDR original in the required folder", "Final result", "The folder should contain 1a01_lockerboard.ai and 1a01_lockerboard.cdr.")
        check_title, check_sub = "Final submission checklist", "Tick each item to make sure nothing is missing."
        checks = [
            "The lockerboard size is 80 mm x 40 mm.",
            "The name and picture have been added.",
            "The picture is clear.",
            "The AI file has been exported.",
            "The CDR file has been saved.",
            "Both AI and CDR files are in the correct personal folder.",
            "The file name is correct.",
        ]
        final_tip, final_text = "Tip", "If you cannot find the AI or CDR file, check the file name, file type and folder path."
        final_done = "Finished! You have learned how to make a lockerboard in CorelDRAW and save the correct files."

    story = []
    story += [Spacer(1, 27 * mm)]
    accent = Table([["", "", ""]], colWidths=[38 * mm, 38 * mm, 38 * mm], rowHeights=[6 * mm])
    accent.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), TEAL),
        ("BACKGROUND", (1, 0), (1, 0), PINK),
        ("BACKGROUND", (2, 0), (2, 0), NAVY),
        ("BOX", (0, 0), (-1, -1), 0, colors.white),
    ]))
    story += [accent, Spacer(1, 15 * mm), P(title1, "CoverTitle"), P(title2, "CoverTitle")]
    story += [Spacer(1, 4 * mm), P(cover_sub, "CoverSub"), Spacer(1, 18 * mm)]
    cover_box = Table([
        [P(mission_title, "Center")],
        [P(mission, "Body")],
    ], colWidths=[CONTENT_W * 0.78], hAlign="CENTER")
    cover_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), MINT),
        ("BOX", (0, 0), (-1, -1), 1.2, TEAL),
        ("LEFTPADDING", (0, 0), (-1, -1), 15),
        ("RIGHTPADDING", (0, 0), (-1, -1), 15),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story += [cover_box, Spacer(1, 24 * mm), P(cover_note1, "CoverSmall"), P(cover_note2, "CoverSmall"), PageBreak()]

    story += section(start_kicker, start_title, start_sub)
    rows = []
    for i in range(0, len(cards), 2):
        rows.append([small_card(*cards[i]), small_card(*cards[i + 1])])
    overview = Table(rows, colWidths=[(CONTENT_W - 12) / 2] * 2, hAlign="CENTER")
    overview.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story += [overview, Spacer(1, 7), callout(file_label, file_note, MINT, TEAL), PageBreak()]

    k, t, sub, action, cap, note_label, note_text = p3
    story += section(k, t, sub)
    story += [step("0", action), Spacer(1, 5), screenshot("1.png", cap, max_h=430), Spacer(1, 4), callout(note_label, note_text), PageBreak()]

    k, t, sub, a1, c1, a2, c2 = p4
    story += section(k, t, sub)
    story += [step("1A", a1), Spacer(1, 3), screenshot("2.png", c1, max_h=205), Spacer(1, 2), step("1B", a2), Spacer(1, 3), screenshot("3.png", c2, max_h=245), PageBreak()]

    k, t, sub, a1, c1, a2, c2 = p5
    story += section(k, t, sub)
    story += [step("2A", a1), Spacer(1, 3), screenshot("4.png", c1, max_h=220), Spacer(1, 2), step("2B", a2), Spacer(1, 3), screenshot("5.png", c2, max_h=270), PageBreak()]

    k, t, sub, a1, c1, a2, c2 = p6
    story += section(k, t, sub)
    story += [step("3A", a1), Spacer(1, 3), screenshot("6.png", c1, max_h=235), Spacer(1, 2), step("3B", a2), Spacer(1, 3), screenshot("7.png", c2, max_h=235), PageBreak()]

    k, t, sub, a1, c1, a2, c2 = p7
    story += section(k, t, sub)
    story += [step("4A", a1), Spacer(1, 3), screenshot("8.png", c1, max_h=215), Spacer(1, 2), step("4B", a2), Spacer(1, 3), screenshot("9.png", c2, max_h=285), PageBreak()]

    k, t, sub, a1, c1, note_label, note_text, after = p8
    story += section(k, t, sub)
    story += [step("4C", a1), Spacer(1, 3), screenshot("10.png", c1, max_h=285), Spacer(1, 4), callout(note_label, note_text), Spacer(1, 12), P(after, "Body"), PageBreak()]

    k, t, sub, a1, c1, a2, c2 = p9
    story += section(k, t, sub)
    story += [step("4D", a1), Spacer(1, 3), screenshot("11.png", c1, max_h=250), Spacer(1, 2), step("4E", a2), Spacer(1, 3), screenshot("12.png", c2, max_h=285), PageBreak()]

    k, t, sub, a1, c1, a2, c2 = p10
    story += section(k, t, sub)
    story += [step("4F", a1), Spacer(1, 3), screenshot("13.png", c1, max_h=300), Spacer(1, 2), step("4G", a2), Spacer(1, 3), screenshot("14.png", c2, max_h=230), PageBreak()]

    k, t, sub, a1, c1, a2, c2 = p11
    story += section(k, t, sub)
    story += [step("5A", a1), Spacer(1, 3), screenshot("15.png", c1, max_h=255), Spacer(1, 2), step("5B", a2), Spacer(1, 3), screenshot("16.png", c2, max_h=285), PageBreak()]

    k, t, sub, a1, c1, label, text = p12
    story += section(k, t, sub)
    story += [step("6A", a1), Spacer(1, 4), screenshot("17.png", c1, max_h=310), Spacer(1, 4), callout(label, text, MINT, TEAL), PageBreak()]

    k, t, sub, a1, c1, a2, c2, c3 = p13
    story += section(k, t, sub)
    story += [step("6B", a1), Spacer(1, 3), screenshot("18.png", c1, max_h=330), Spacer(1, 2), step("6C", a2), Spacer(1, 3), screenshot_pair("19.png", c2, "20.png", c3, max_h=190), PageBreak()]

    k, t, sub, a1, c1, c2, label, text = p14
    story += section(k, t, sub)
    story += [step("6D", a1), Spacer(1, 4), screenshot_pair("21.png", c1, "18.png", c2, max_h=230), Spacer(1, 4), callout(label, text, MINT, TEAL), PageBreak()]

    k, t, sub, a1, c1, c2, label, text = p15
    story += section(k, t, sub)
    story += [step("6E", a1), Spacer(1, 4), screenshot_pair("22a.png", c1, "22b.png", c2, max_h=240), Spacer(1, 4), callout(label, text), PageBreak()]

    k, t, sub, a1, c1, label, text = p16
    story += section(k, t, sub)
    story += [step("7A", a1), Spacer(1, 4), screenshot("23.png", c1, max_h=390), Spacer(1, 5), callout(label, text, MINT, TEAL), PageBreak()]

    story += section("Step 8 | Checklist" if lang == "en" else "Step 8｜Checklist", check_title, check_sub)
    check_rows = [[P(f"□  {item}", "Body")] for item in checks]
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
    story += [check_table, Spacer(1, 10), callout(final_tip, final_text), Spacer(1, 18), P(final_done, "Center")]

    doc = SimpleDocTemplate(
        str(out_path), pagesize=A4, leftMargin=LEFT, rightMargin=RIGHT,
        topMargin=TOP, bottomMargin=BOTTOM,
        title=f"CorelDRAW Lockerboard {'Student Guide' if lang == 'en' else '學生使用指南'}",
        author="Codex",
    )
    doc.build(story, onFirstPage=page_header_footer, onLaterPages=page_header_footer)
    print(out_path)


if __name__ == "__main__":
    build_pdf("zh", OUTPUT_DIR / "CorelDRAW_Lockerboard_Student_Guide_Chinese.pdf")
    build_pdf("en", OUTPUT_DIR / "CorelDRAW_Lockerboard_Student_Guide_English.pdf")
