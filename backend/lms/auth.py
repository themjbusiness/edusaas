"""Phone + OTP login restricted to registered users, signed bearer tokens, and the API view decorator."""
import functools
import hashlib
import hmac
import json
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.backends import ModelBackend
from django.core import signing
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .fields import hash_phone
from .models import OTPCode, User, phone_validator

log = logging.getLogger("lms")
TOKEN_SALT = "edusaas.auth"


class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


def mask_phone(phone):
    """For logs: '+923991110001' -> '+92 3** ***0001'. Full numbers never go to the logs."""
    p = str(phone or "")
    return f"+92 3** ***{p[-4:]}" if len(p) >= 4 else "***"


def normalize_phone(raw):
    """Accept '3001234567', '03001234567', '923001234567' or '+923001234567'; return E.164 or raise."""
    digits = "".join(ch for ch in str(raw or "") if ch.isdigit())
    if digits.startswith("92"):
        digits = digits[2:]
    elif digits.startswith("0"):
        digits = digits[1:]
    phone = "+92" + digits
    try:
        phone_validator(phone)
    except ValidationError:
        raise ApiError(400, "invalid_phone", "Enter a mobile number like 3001234567.")
    return phone


def _hash(phone, code):
    return hmac.new(settings.SECRET_KEY.encode(), f"{phone}:{code}".encode(), hashlib.sha256).hexdigest()


def request_otp(phone):
    """Create an OTP for a registered, active user. Unknown numbers are refused (no open sign-up)."""
    user = User.objects.filter(phone_number_hash=hash_phone(phone)).first()
    if user is None:
        raise ApiError(404, "not_registered",
                       "This number is not registered with any college. Please contact your college office.")
    if not user.is_active:
        raise ApiError(403, "suspended", "This account is suspended. Please contact your college office.")
    if user.role not in (User.STUDENT, User.TEACHER, User.PARENT, User.COLLEGE_ADMIN):
        raise ApiError(403, "use_admin", "Admin accounts sign in at /admin.")
    hour_ago = timezone.now() - timedelta(hours=1)
    if not (settings.DEMO_MODE and phone.startswith("+92399")):
        if OTPCode.objects.filter(phone_number=phone, created_at__gte=hour_ago).count() >= settings.OTP_MAX_PER_HOUR:
            raise ApiError(429, "too_many_codes", "Too many codes requested. Please try again in an hour.")
    OTPCode.objects.filter(phone_number=phone, used=False).update(used=True)  # only the newest code works
    code = f"{secrets.randbelow(10 ** 6):06d}"
    OTPCode.objects.create(phone_number=phone, code_hash=_hash(phone, code),
                           expires_at=timezone.now() + timedelta(seconds=settings.OTP_TTL_SECONDS))
    # Never log the phone number or the code (project rule). Demo mode shows the code on screen instead.
    # Production: send `code` through the SMS gateway here.
    return user, code


def verify_otp(phone, code):
    otp = OTPCode.objects.filter(phone_number=phone, used=False).order_by("-created_at").first()
    if otp is None or otp.expires_at < timezone.now():
        raise ApiError(400, "otp_expired", "This code has expired. Please request a new one.")
    if not hmac.compare_digest(otp.code_hash, _hash(phone, str(code).strip())):
        otp.attempts += 1
        otp.used = otp.attempts >= settings.OTP_MAX_ATTEMPTS
        otp.save(update_fields=["attempts", "used"])
        if otp.used:
            raise ApiError(400, "otp_locked", "Too many wrong codes. Please request a new one.")
        raise ApiError(400, "otp_wrong", f"That code is wrong. {settings.OTP_MAX_ATTEMPTS - otp.attempts} tries left.")
    otp.used = True
    otp.save(update_fields=["used"])
    user = User.objects.get(phone_number_hash=hash_phone(phone))
    if not user.is_active:
        raise ApiError(403, "suspended", "This account is suspended.")
    return user


def issue_token(user):
    return signing.dumps({"u": str(user.id), "v": user.token_version}, salt=TOKEN_SALT)


def user_from_request(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        data = signing.loads(header[7:], salt=TOKEN_SALT, max_age=settings.TOKEN_MAX_AGE)
    except signing.BadSignature:
        return None
    user = User.objects.filter(id=data["u"], is_active=True).select_related("college").first()
    if user is None or user.token_version != data["v"]:
        return None
    return user


def api(methods=("GET",), roles=None):
    """JSON API view: method check, JSON body, bearer auth, role check and uniform errors."""
    def wrap(fn):
        @csrf_exempt  # bearer-token API, no cookies, so CSRF does not apply
        @functools.wraps(fn)
        def view(request, *args, **kwargs):
            try:
                if request.method not in methods:
                    raise ApiError(405, "method_not_allowed", "Method not allowed.")
                request.json = {}
                if request.body:
                    try:
                        request.json = json.loads(request.body)
                    except ValueError:
                        raise ApiError(400, "bad_json", "Request body must be JSON.")
                request.user = user_from_request(request)
                if roles is not None:
                    if request.user is None:
                        raise ApiError(401, "unauthenticated", "Please log in again.")
                    if request.user.role not in roles:
                        raise ApiError(403, "forbidden", "Your account does not have access to this.")
                result = fn(request, *args, **kwargs)
                return JsonResponse(result, safe=False)
            except ApiError as e:
                return JsonResponse({"error": e.code, "message": e.message}, status=e.status)
            except Exception:  # never leak a stack trace to the client
                log.exception("API error in %s", fn.__name__)
                return JsonResponse({"error": "server_error", "message": "Something went wrong. Please try again."},
                                    status=500)
        return view
    return wrap


class PhoneBackend(ModelBackend):
    """Allow superusers/staff to log into /admin using their plain phone number or hash."""
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        if not username or not password:
            return None
        try:
            phone_hash = hash_phone(normalize_phone(username))
        except Exception:
            phone_hash = username
        user = User.objects.filter(phone_number_hash=phone_hash).first()
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

