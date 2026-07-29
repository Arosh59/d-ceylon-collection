from __future__ import annotations

from contextlib import asynccontextmanager
from hmac import compare_digest

from fastapi import FastAPI, Header, HTTPException, Request, status

from dceylon_ai.models import DraftItineraryRequest, DraftItineraryResponse
from dceylon_ai.settings import Settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.settings = Settings.from_environment()
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
    return {"status": "healthy", "retentionHours": settings.conversation_retention_hours}


@app.post("/v1/draft-itineraries", response_model=DraftItineraryResponse)
async def create_draft_itinerary(
    request: Request,
    input: DraftItineraryRequest,
    gateway_secret: str | None = Header(default=None, alias="X-AI-Gateway-Secret"),
) -> DraftItineraryResponse:
    settings: Settings = request.app.state.settings
    return create_draft_response(settings, gateway_secret, input)


def create_draft_response(
    settings: Settings,
    gateway_secret: str | None,
    input: DraftItineraryRequest,
) -> DraftItineraryResponse:
    if gateway_secret is None or not compare_digest(gateway_secret, settings.gateway_shared_secret):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Gateway authentication failed.")

    return DraftItineraryResponse(
        message="This is a draft assistance placeholder and requires human review.",
        limitations=[
            "No live availability was checked.",
            "No final price or quote was calculated.",
            "No booking, cancellation, payment, or data write was performed.",
            "No conversation or customer data was persisted.",
        ],
        human_handoff_required=True,
    )
