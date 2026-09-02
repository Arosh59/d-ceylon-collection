from __future__ import annotations

from dataclasses import dataclass
from os import environ
from re import fullmatch
from urllib.parse import urlparse


@dataclass(frozen=True)
class Settings:
    backend_api_base_url: str
    gateway_shared_secret: str
    conversation_retention_hours: int
    gemini_api_key: str
    gemini_model: str
    gemini_request_timeout_seconds: float

    @classmethod
    def from_environment(cls) -> "Settings":
        forbidden = [
            key
            for key in environ
            if "DATABASE" in key
            or "POSTGRES" in key
            or "SQL" in key
            or "REDIS" in key
            or "DIRECTUS" in key
        ]
        if forbidden:
            raise RuntimeError("The AI service must not receive database configuration.")

        secret = environ.get("AI_GATEWAY_SHARED_SECRET", "").strip()
        if len(secret) < 32:
            raise RuntimeError("AI_GATEWAY_SHARED_SECRET must contain at least 32 characters.")

        backend_url = environ.get("BACKEND_API_BASE_URL", "").strip()
        parsed = urlparse(backend_url)
        if parsed.scheme not in {"https", "http"} or not parsed.netloc or parsed.username or parsed.password:
            raise RuntimeError("BACKEND_API_BASE_URL must be an HTTP(S) origin without credentials.")
        if parsed.scheme == "http" and parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
            raise RuntimeError("BACKEND_API_BASE_URL must use HTTPS outside local development.")

        try:
            retention_hours = int(environ.get("AI_CONVERSATION_RETENTION_HOURS", "24"))
        except ValueError as error:
            raise RuntimeError("AI_CONVERSATION_RETENTION_HOURS must be an integer.") from error
        if retention_hours < 1 or retention_hours > 168:
            raise RuntimeError("AI_CONVERSATION_RETENTION_HOURS must be between 1 and 168.")

        gemini_api_key = environ.get("GEMINI_API_KEY", "").strip()
        if not gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required.")

        gemini_model = environ.get("GEMINI_MODEL", "gemini-3.5-flash").strip()
        if not fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}", gemini_model):
            raise RuntimeError("GEMINI_MODEL must be a valid Gemini model identifier.")

        try:
            gemini_request_timeout_seconds = float(
                environ.get("GEMINI_REQUEST_TIMEOUT_SECONDS", "20")
            )
        except ValueError as error:
            raise RuntimeError("GEMINI_REQUEST_TIMEOUT_SECONDS must be a number.") from error
        if not 1 <= gemini_request_timeout_seconds <= 60:
            raise RuntimeError("GEMINI_REQUEST_TIMEOUT_SECONDS must be between 1 and 60.")

        return cls(
            backend_url.rstrip("/"),
            secret,
            retention_hours,
            gemini_api_key,
            gemini_model,
            gemini_request_timeout_seconds,
        )
