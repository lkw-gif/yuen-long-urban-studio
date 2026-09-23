from pathlib import Path

from pypdf import PdfReader

root = Path(r"C:\Users\ai\Desktop\F.2\教學\水印版")
expected = {
    "coreldraw建築教學 - watermarked.pdf": 31,
    "coreldraw建築教學eng - watermarked.pdf": 31,
    "Residential building manual - watermarked.pdf": 47,
    "住宅基本教學 - watermarked.pdf": 49,
    "Different buildings manual - watermarked.pdf": 52,
    "各類建築教學 - watermarked.pdf": 52,
}

files = sorted(root.glob("*.pdf"))
assert {p.name for p in files} == set(expected), "Unexpected output set"

for path in files:
    reader = PdfReader(str(path))
    page_count = len(reader.pages)
    watermark = reader.metadata.get("/Watermark")
    sample_indexes = [0, page_count // 2, page_count - 1]
    samples_ok = all(len((reader.pages[i].extract_text() or "").strip()) > 50 for i in sample_indexes)
    assert page_count == expected[path.name], (path.name, page_count)
    assert watermark == "Keilong College - Mr. Lui", (path.name, watermark)
    assert samples_ok, path.name
    print(f"OK | {path.name} | {page_count} pages | watermark metadata present | sample text present")
