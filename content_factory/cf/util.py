import hashlib
import json
import logging
import time
from pathlib import Path

log = logging.getLogger("factory")


def sha(*parts):
    """Stable short hash of strings, bytes or JSON-serialisable values."""
    h = hashlib.sha256()
    for p in parts:
        if isinstance(p, bytes):
            h.update(p)
        elif isinstance(p, str):
            h.update(p.encode("utf-8"))
        else:
            h.update(json.dumps(p, sort_keys=True, ensure_ascii=False).encode("utf-8"))
        h.update(b"\0")
    return h.hexdigest()[:16]


def file_sha(path):
    return sha(Path(path).read_bytes())


def read_json(path, default=None):
    p = Path(path)
    if not p.exists():
        return default
    return json.loads(p.read_text(encoding="utf-8"))


def write_json(path, data):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(p)


def retry(fn, what, attempts=3, base_delay=2.0):
    """Run fn(); on failure retry up to `attempts` times with backoff (DoD: retry 3 times, then log)."""
    for n in range(1, attempts + 1):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001 - every failure of an external call is retried
            if n == attempts:
                log.error("%s failed after %d attempts: %s", what, attempts, e)
                raise
            delay = base_delay * 2 ** (n - 1)
            log.warning("%s failed (attempt %d/%d): %s; retrying in %.0fs", what, n, attempts, e, delay)
            time.sleep(delay)
