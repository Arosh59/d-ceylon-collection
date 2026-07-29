from pydantic import BaseModel, Field


class ApprovedTravelContext(BaseModel):
    """Minimum approved context supplied only by the authenticated backend gateway."""

    destination_slugs: list[str] = Field(default_factory=list, max_length=12)
    interests: list[str] = Field(default_factory=list, max_length=12)
    travel_start_date: str | None = Field(default=None, max_length=10)
    travel_end_date: str | None = Field(default=None, max_length=10)


class DraftItineraryRequest(BaseModel):
    approved_context: ApprovedTravelContext
    human_handoff_requested: bool = False


class DraftItineraryResponse(BaseModel):
    status: str = "draft-only"
    message: str
    limitations: list[str]
    human_handoff_required: bool
