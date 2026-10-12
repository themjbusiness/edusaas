"""Free web push alerts (F3, decision D6).

Keys: VAPID_PRIVATE_KEY (PEM) and VAPID_PUBLIC_KEY in the environment, or generated once into
backend/vapid.json. That file is a secret: don't share it or put it in the repository.
Browsers only allow push on HTTPS or http://localhost.
"""
import base64
import json
import logging
import os
from pathlib import Path

from django.conf import settings

log = logging.getLogger("lms")
_KEYS = None


def _keys():
    """Return (Vapid01 private key, public key as base64url) and cache them."""
    global _KEYS
    if _KEYS:
        return _KEYS
    from cryptography.hazmat.primitives import serialization
    from py_vapid import Vapid01
    pem = os.environ.get("VAPID_PRIVATE_KEY")
    path = Path(settings.BASE_DIR) / "vapid.json"
    if pem:
        vapid = Vapid01.from_pem(pem.encode())
    elif path.exists():
        vapid = Vapid01.from_pem(json.loads(path.read_text())["private_pem"].encode())
    else:
        vapid = Vapid01()
        vapid.generate_keys()
        path.write_text(json.dumps({"private_pem": vapid.private_pem().decode()}))
    raw = vapid.public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    _KEYS = (vapid, base64.urlsafe_b64encode(raw).rstrip(b"=").decode())
    return _KEYS


def public_key():
    return _keys()[1]


def webpush(**kwargs):  # indirection so tests can replace the network call
    from pywebpush import webpush as _webpush
    return _webpush(**kwargs)


def send(user, title, body, url="/"):
    """Push one alert to every browser the user subscribed. Returns (delivered, total). Never raises."""
    subs = list(user.push_subscriptions.all())
    if not subs:
        return 0, 0
    from pywebpush import WebPushException
    vapid = _keys()[0]
    payload = json.dumps({"title": title, "body": body[:400], "url": url})
    ok = 0
    for s in subs:
        try:
            webpush(subscription_info={"endpoint": s.endpoint, "keys": {"p256dh": s.p256dh, "auth": s.auth}},
                    data=payload, vapid_private_key=vapid, vapid_claims={"sub": settings.VAPID_SUBJECT},
                    ttl=86400, timeout=10)
            ok += 1
        except WebPushException as e:
            code = getattr(e.response, "status_code", None)
            if code in (404, 410):  # the browser dropped this subscription
                s.delete()
            log.warning("push to subscription %s failed with status %s", s.id, code)
        except Exception as e:  # network trouble must never break attendance or quizzes
            log.warning("push to subscription %s failed: %s", s.id, type(e).__name__)
    return ok, len(subs)
