"""Settings for the EduSaas demo backend (Delivery Platform, System B).

Demo defaults: SQLite and simulated WhatsApp/SMS. For production, set DJANGO_SECRET_KEY,
DATABASE_URL-style Postgres settings, DEMO_MODE=0, and real notification providers.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent
WEB_DIST_DIR = PROJECT_DIR / "web" / "dist"                # the web app (React, built by `npm run build`), served at /
MEDIA_DIR = PROJECT_DIR / "media"                          # lesson page images and audio, served at /media/
CONTENT_DIR = PROJECT_DIR / "content_factory" / "output"   # Lesson Objects from the Content Factory


def env_bool(name, default):
    return os.environ.get(name, "1" if default else "0").lower() in ("1", "true", "yes")


DEBUG = env_bool("DJANGO_DEBUG", False)
# DEMO_MODE shows the OTP on screen instead of sending an SMS, and simulates WhatsApp delivery.
DEMO_MODE = env_bool("DEMO_MODE", True)

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if not DEMO_MODE:
        raise RuntimeError("Set DJANGO_SECRET_KEY outside demo mode")
    SECRET_KEY = "demo-only-insecure-key-change-me"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CSRF_TRUSTED_ORIGINS",
        "https://*.onrender.com,https://*.up.railway.app,https://*.railway.app,http://localhost:8000,http://127.0.0.1:8000",
    ).split(",")
    if origin.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "lms",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "edusaas.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "edusaas.wsgi.application"

import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Hosting and Operations (F6) - Storage
if os.environ.get("AWS_ACCESS_KEY_ID"):
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {
                "endpoint_url": os.environ.get("AWS_S3_ENDPOINT_URL"),
                "access_key": os.environ.get("AWS_ACCESS_KEY_ID"),
                "secret_key": os.environ.get("AWS_SECRET_ACCESS_KEY"),
                "bucket_name": os.environ.get("AWS_STORAGE_BUCKET_NAME"),
                "region_name": os.environ.get("AWS_S3_REGION_NAME", "auto"),
                "signature_version": "s3v4",
            },
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }

# Hosting and Operations (F6) - Sentry
SENTRY_DSN = os.environ.get("SENTRY_DSN")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )

AUTH_USER_MODEL = "lms.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Karachi"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Auth and messaging rules
TOKEN_MAX_AGE = 30 * 24 * 3600      # a student stays logged in for 30 days
OTP_TTL_SECONDS = 300               # an OTP expires after 5 minutes
OTP_MAX_ATTEMPTS = 5                # wrong codes before the OTP is burned
OTP_MAX_PER_HOUR = 5                # OTP requests per phone number per hour
PASS_MARK = 4                       # out of 5 quiz questions (80%)
QUIZ_SIZE = 5
UNLOCK_SHARE = 0.9                  # share of narration that must be heard before the quiz
MAX_MESSAGES_PER_PARENT_PER_DAY = 5

LOGGING = {
    "version": 1,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {"lms": {"handlers": ["console"], "level": "INFO"}},
}
QUIZ_RETRY_COOLDOWN = 30            # seconds before a failed quiz can be retried

# Students only see lessons a teacher has approved. The demo shows drafts too (with a "Draft" badge),
# because no lesson has been approved yet. Always off outside demo mode unless set explicitly.
SHOW_DRAFT_LESSONS = env_bool("SHOW_DRAFT_LESSONS", DEMO_MODE)

# Decision D6: free messaging only (in-app inbox + web push, and teachers' one-tap WhatsApp links).
# Set PAID_MESSAGING=1 to use a WhatsApp gateway with SMS fallback instead (simulated in demo mode).
PAID_MESSAGING = env_bool("PAID_MESSAGING", False)
VAPID_SUBJECT = os.environ.get("VAPID_SUBJECT", "mailto:alerts@edusaas.local")  # set a real contact in production

# Demo only: parents at these numbers behave as if they are not on WhatsApp, to show the SMS fallback.
SIMULATE_WHATSAPP_FAILURE = {"+923993330003"}
