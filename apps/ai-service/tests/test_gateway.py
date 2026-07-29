from os import environ
from unittest import TestCase
from unittest.mock import patch

from fastapi import HTTPException

from dceylon_ai.main import create_draft_response
from dceylon_ai.models import DraftItineraryRequest
from dceylon_ai.settings import Settings


class SettingsTests(TestCase):
    def test_rejects_database_environment(self) -> None:
        with patch.dict(
            environ,
            {
                "AI_GATEWAY_SHARED_SECRET": "x" * 32,
                "BACKEND_API_BASE_URL": "http://127.0.0.1:8080",
                "POSTGRES_PASSWORD": "must-not-be-present",
            },
            clear=True,
        ):
            with self.assertRaisesRegex(RuntimeError, "database configuration"):
                Settings.from_environment()


class GatewayTests(TestCase):
    def test_draft_endpoint_requires_gateway_secret_and_returns_limitations(self) -> None:
        secret = "x" * 32
        settings = Settings("http://127.0.0.1:8080", secret, 24)
        request = DraftItineraryRequest.model_validate(
            {"approved_context": {"destination_slugs": ["ella"]}}
        )

        with self.assertRaises(HTTPException) as unauthorized:
            create_draft_response(settings, None, request)
        authorized = create_draft_response(settings, secret, request)

        self.assertEqual(401, unauthorized.exception.status_code)
        self.assertEqual("draft-only", authorized.status)
        self.assertTrue(authorized.human_handoff_required)
