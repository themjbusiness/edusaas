"""Serve the web app (web/dist) and lesson media (media/), with HTTP Range support so audio seeking works."""
import gzip
import mimetypes
import os
import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse

mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("audio/mpeg", ".mp3")
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("text/javascript", ".js")  # Windows registries sometimes map .js to text/plain
RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")


def serve(request, path):
    """The web app (React, F1), built into web/dist by `npm run build`. Unknown routes fall back to index.html."""
    root = Path(settings.WEB_DIST_DIR).resolve()
    if not (root / "index.html").exists():
        return HttpResponse("The web app has not been built yet. Install Node.js, then run: cd web && npm install && npm run build",
                            status=503, content_type="text/plain")
    return _serve(request, path, root)


def serve_media(request, path):
    """Lesson page images and audio (with Range support for audio seeking)."""
    return _serve(request, path, Path(settings.MEDIA_DIR).resolve(), fallback=False, media=True)


def _serve(request, path, root, fallback=True, media=False):
    target = (root / (path or "index.html")).resolve()
    if root not in target.parents and target != root:
        raise Http404
    if target.is_dir():
        target = target / "index.html"
    if not target.is_file():
        if "." in Path(path).name or not fallback:
            raise Http404
        target = root / "index.html"  # client-side routes fall back to the app shell
    size = target.stat().st_size
    ctype = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
    match = RANGE_RE.fullmatch(request.headers.get("Range", "").strip())
    if match and (match.group(1) or match.group(2)):
        start, end = match.group(1), match.group(2)
        if start:
            start, end = int(start), min(int(end) if end else size - 1, size - 1)
        else:  # suffix range: last N bytes
            start, end = max(0, size - int(end)), size - 1
        if start > end or start >= size:
            resp = HttpResponse(status=416)
            resp["Content-Range"] = f"bytes */{size}"
            return resp
        with open(target, "rb") as f:
            f.seek(start)
            data = f.read(end - start + 1)
        resp = HttpResponse(data, status=206, content_type=ctype)
        resp["Content-Range"] = f"bytes {start}-{end}/{size}"
    elif ctype in COMPRESSIBLE and "gzip" in request.headers.get("Accept-Encoding", ""):
        # Text (JavaScript, CSS, HTML, SVG, JSON) is about 3x smaller gzipped; audio and images are already compressed.
        resp = HttpResponse(_gzipped(target), content_type=ctype)
        resp["Content-Encoding"] = "gzip"
        resp["Vary"] = "Accept-Encoding"
        return _cache(resp, path, media)
    else:
        resp = FileResponse(open(target, "rb"), content_type=ctype)
        resp["Content-Length"] = str(size)
    resp["Accept-Ranges"] = "bytes"
    return _cache(resp, path, media)


COMPRESSIBLE = {"text/html", "text/css", "text/javascript", "application/javascript", "image/svg+xml",
                "application/json", "application/manifest+json"}
_GZ_CACHE = {}


def _gzipped(target):
    key = (str(target), target.stat().st_mtime_ns)
    if key not in _GZ_CACHE:
        _GZ_CACHE[key] = gzip.compress(target.read_bytes(), compresslevel=6)
    return _GZ_CACHE[key]


def _cache(resp, path, media=False):
    if path.startswith("assets/"):  # Vite build output: the file name changes with the content
        resp["Cache-Control"] = "public, max-age=31536000, immutable"
    elif media:  # media is immutable per build
        resp["Cache-Control"] = "public, max-age=86400"
    else:  # app shell and code are revalidated on every load
        resp["Cache-Control"] = "no-cache"
    return resp
