"""Stage 1: render textbook pages to WebP (max 1080 px wide, per the architecture brief)."""
from pathlib import Path

from PIL import Image

from .util import log

MAX_WIDTH = 1080
DEFAULT_WIDTH = 900  # the scanned pages are ~826 px wide, so 900 keeps full detail
SMALL_WIDTH = 600    # phone version (about half the bytes); the full page stays for zoom and wide screens


def render_pages(pdf_path, page_numbers, out_dir, offset=0, width=DEFAULT_WIDTH, force=False):
    """Render book pages to <out_dir>/p<N>.webp. Returns {page_number: path}. Skips existing files."""
    import pymupdf

    width = min(width, MAX_WIDTH)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    result, doc = {}, None
    for n in sorted(set(page_numbers)):
        target, small = out_dir / f"p{n}.webp", out_dir / f"p{n}-sm.webp"
        result[n] = target
        if target.exists() and small.exists() and not force:
            continue
        if doc is None:
            doc = pymupdf.open(pdf_path)
        index = n - 1 + offset
        if not 0 <= index < doc.page_count:
            raise ValueError(f"page {n} is outside the PDF ({doc.page_count} pages, offset {offset})")
        page = doc[index]
        zoom = width / page.rect.width
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        img.save(target, "WEBP", quality=70)
        img.resize((SMALL_WIDTH, round(img.height * SMALL_WIDTH / img.width)), Image.LANCZOS).save(small, "WEBP", quality=68)
        log.info("page %d -> %s (%d KB), %s (%d KB)", n, target.name, target.stat().st_size // 1024,
                 small.name, small.stat().st_size // 1024)
    return result
