import hashlib
import hmac
import base64
from cryptography.fernet import Fernet
from django.conf import settings
from django.db import models

def get_fernet():
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))

def hash_phone(phone: str) -> str:
    if not phone:
        return ""
    return hmac.new(
        settings.SECRET_KEY.encode(),
        str(phone).encode(),
        hashlib.sha256
    ).hexdigest()

class EncryptedCharField(models.CharField):
    """A CharField that encrypts its contents before saving to the DB, and decrypts when reading."""
    
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        try:
            return get_fernet().decrypt(value.encode()).decode()
        except Exception:
            # Fallback if the data is not encrypted (e.g. legacy data before migration)
            return value

    def to_python(self, value):
        # We can assume it is already decrypted if passed through from_db_value.
        # But if it's assigned directly, it's plain text.
        return super().to_python(value)

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value is None:
            return value
        # Don't re-encrypt if somehow it's already an encrypted string.
        if value.startswith('gAAAAA'):
            return value
        return get_fernet().encrypt(value.encode()).decode()
