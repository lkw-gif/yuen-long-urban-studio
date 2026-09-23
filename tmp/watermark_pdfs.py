from pathlib import Path
from io import BytesIO

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color


TEXT = "Keilong College - Mr. Lui"
SOURCE_ROOT = Path(r"C:\Users\ai\Desktop\F.2\教學")
OUTPUT_ROOT = SOURCE_ROOT / "水印版"
FILES = [
    SOURCE_ROOT / "coreldraw建築教學.pdf",
    SOURCE_ROOT / "coreldraw建築教學eng.pdf",
    SOURCE_ROOT / "住宅" / "Residential building manual.pdf",
    SOURCE_ROOT / "住宅" / "住宅基本教學.pdf",
    SOURCE_ROOT / "各類建築" / "Different buildings manual.pdf",
    SOURCE_ROOT / "各類建築" / "各類建築教學.pdf",
]


def watermark_page(width: float, height: float):
    stream = BytesIO()
    pdf = canvas.Canvas(stream, pagesize=(width, height), pageCompression=1)
    pdf.saveState()
    pdf.translate(width / 2, height / 2)
    pdf.rotate(32)
    try:
        pdf.setFillAlpha(0.085)
    except AttributeError:
        pass
    pdf.setFillColor(Color(0.38, 0.40, 0.42))
    font_size = max(18, min(26, min(width, height) * 0.038))
    pdf.setFont("Helvetica-Bold", font_size)
    pdf.drawCentredString(0, 0, TEXT)
    pdf.restoreState()
    pdf.save()
    stream.seek(0)
    return PdfReader(stream).pages[0]


def make_copy(source: Path):
    reader = PdfReader(str(source))
    writer = PdfWriter()
    overlays = {}
    for page in reader.pages:
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        key = (round(width, 4), round(height, 4))
        if key not in overlays:
            overlays[key] = watermark_page(width, height)
        page.merge_page(overlays[key], over=True)
        writer.add_page(page)
    writer.add_metadata({
        "/Title": f"{source.stem} - Watermarked",
        "/Watermark": TEXT,
        "/Producer": "Keilong College teaching materials",
    })
    output = OUTPUT_ROOT / f"{source.stem} - watermarked.pdf"
    with output.open("wb") as handle:
        writer.write(handle)
    return output, len(reader.pages)


def main():
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for source in FILES:
        if not source.exists():
            raise FileNotFoundError(source)
        output, pages = make_copy(source)
        print(f"{output}\t{pages}")


if __name__ == "__main__":
    main()
