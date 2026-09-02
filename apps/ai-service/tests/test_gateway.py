import json
from os import environ
from unittest import TestCase
from unittest.mock import patch

from fastapi import HTTPException

from dceylon_ai.gemini import GeminiGatewayError, GeminiItineraryGenerator
from dceylon_ai.main import authorize_gateway, create_draft_response
from dceylon_ai.models import DraftItineraryRequest, GeneratedItinerary
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

    def test_requires_gemini_key(self) -> None:
        with patch.dict(
            environ,
            {
                "AI_GATEWAY_SHARED_SECRET": "x" * 32,
                "BACKEND_API_BASE_URL": "http://127.0.0.1:8080",
            },
            clear=True,
        ):
            with self.assertRaisesRegex(RuntimeError, "GEMINI_API_KEY is required"):
                Settings.from_environment()


class GatewayTests(TestCase):
    def test_draft_endpoint_requires_gateway_secret_and_returns_limitations(self) -> None:
        secret = "x" * 32
        settings = Settings("http://127.0.0.1:8080", secret, 24, "test-key", "gemini-3.5-flash", 20)
        request = DraftItineraryRequest.model_validate(
            {"approved_context": {"destination_slugs": ["ella"]}}
        )

        with self.assertRaises(HTTPException) as unauthorized:
            authorize_gateway(settings, None)
        authorize_gateway(settings, secret)
        authorized = create_draft_response(
            request,
            GeneratedItinerary.model_validate({"summary": "Human review needed.", "days": []}),
        )

        self.assertEqual(401, unauthorized.exception.status_code)
        self.assertEqual("draft-only", authorized.status)
        self.assertTrue(authorized.human_handoff_required)


class GeminiGeneratorTests(TestCase):
    def setUp(self) -> None:
        self.settings = Settings(
            "http://127.0.0.1:8080", "x" * 32, 24, "test-key", "gemini-3.5-flash", 20
        )
        self.request = DraftItineraryRequest.model_validate(
            {
                "approved_context": {
                    "destination_slugs": ["ella"],
                    "catalogue_items": [
                        {
                            "id": "tea-estate-walk",
                            "title": "Tea Estate Walk",
                            "destination_slug": "ella",
                            "item_type": "experience",
                            "duration_minutes": 180,
                        }
                    ],
                }
            }
        )

    def test_posts_json_schema_and_validates_approved_references(self) -> None:
        response_body = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps(
                                    {
                                        "summary": "A gentle Ella draft.",
                                        "days": [
                                            {
                                                "day_number": 1,
                                                "title": "Arrive in Ella",
                                                "rationale": "A paced introduction.",
                                                "catalogue_item_ids": ["tea-estate-walk"],
                                            }
                                        ],
                                    }
                                )
                            }
                        ]
                    }
                }
            ]
        }

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json.dumps(response_body).encode("utf-8")

        generator = GeminiItineraryGenerator(self.settings)
        with patch("dceylon_ai.gemini.urlopen", return_value=FakeResponse()) as open_request:
            result = generator.generate(self.request)

        self.assertEqual(["tea-estate-walk"], result.days[0].catalogue_item_ids)
        request_body = json.loads(open_request.call_args.args[0].data.decode("utf-8"))
        self.assertEqual("application/json", request_body["generationConfig"]["responseMimeType"])
        self.assertIn("responseJsonSchema", request_body["generationConfig"])

    def test_rejects_unapproved_catalogue_references(self) -> None:
        response_body = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps(
                                    {
                                        "summary": "Unsafe draft.",
                                        "days": [
                                            {
                                                "day_number": 1,
                                                "title": "Unsafe",
                                                "rationale": "Unsafe.",
                                                "catalogue_item_ids": ["invented-product"],
                                            }
                                        ],
                                    }
                                )
                            }
                        ]
                    }
                }
            ]
        }

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json.dumps(response_body).encode("utf-8")

        with patch("dceylon_ai.gemini.urlopen", return_value=FakeResponse()):
            with self.assertRaisesRegex(GeminiGatewayError, "unapproved catalogue reference"):
                GeminiItineraryGenerator(self.settings).generate(self.request)
