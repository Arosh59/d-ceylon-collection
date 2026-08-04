from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from hmac import compare_digest

from fastapi import FastAPI, Header, HTTPException, Request, status

from dceylon_ai.gemini import GeminiGatewayError, GeminiItineraryGenerator
from dceylon_ai.models import DraftItineraryRequest, DraftItineraryResponse, GeneratedItinerary
from dceylon_ai.settings import Settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings.from_environment()
    app.state.settings = settings
    app.state.generator = GeminiItineraryGenerator(settings)
    yield


app = FastAPI(
    title="D Ceylon Isolated AI Gateway",
    version="v1",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)


@app.get("/health/live")
async def live() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/health/ready")
async def ready(request: Request) -> dict[str, str | int]:
    settings: Settings = request.app.state.settings
    return {
        "status": "healthy",
        "provider": "gemini",
        "model": settings.gemini_model,
        "retentionHours": settings.conversation_retention_hours,
    }


@app.post("/v1/draft-itineraries", response_model=DraftItineraryResponse)
async def create_draft_itinerary(
    request: Request,
    input: DraftItineraryRequest,
    gateway_secret: str | None = Header(default=None, alias="X-AI-Gateway-Secret"),
) -> DraftItineraryResponse:
    settings: Settings = request.app.state.settings
    authorize_gateway(settings, gateway_secret)
    generator: GeminiItineraryGenerator = request.app.state.generator
    try:
        itinerary = await asyncio.to_thread(generator.generate, input)
    except GeminiGatewayError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Draft itinerary generation is temporarily unavailable.",
        ) from error
    return create_draft_response(input, itinerary)


def authorize_gateway(settings: Settings, gateway_secret: str | None) -> None:
    if gateway_secret is None or not compare_digest(gateway_secret, settings.gateway_shared_secret):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Gateway authentication failed.")


def create_draft_response(
    input: DraftItineraryRequest,
    itinerary: GeneratedItinerary,
) -> DraftItineraryResponse:
    return DraftItineraryResponse(
        message="This Gemini-assisted itinerary is a draft and requires human review.",
        limitations=[
            "No live availability was checked.",
            "No final price or quote was calculated.",
            "No booking, cancellation, payment, or data write was performed.",
            "No conversation or customer data was persisted.",
        ],
        human_handoff_required=True,
        itinerary=itinerary,
    )
