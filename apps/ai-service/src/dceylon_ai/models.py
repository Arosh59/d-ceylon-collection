from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ApprovedCatalogueItem(StrictModel):
    """A non-sensitive candidate supplied and authorised by the backend only."""

    id: str = Field(min_length=1, max_length=128)
    title: str = Field(min_length=1, max_length=160)
    destination_slug: str = Field(min_length=1, max_length=80)
    item_type: str = Field(min_length=1, max_length=80)
    duration_minutes: int | None = Field(default=None, ge=1, le=1_440)


class ApprovedTravelContext(StrictModel):
    """Minimum approved context supplied only by the authenticated backend gateway."""

    destination_slugs: list[str] = Field(default_factory=list, max_length=12)
    interests: list[str] = Field(default_factory=list, max_length=12)
    travel_start_date: date | None = None
    travel_end_date: date | None = None
    catalogue_items: list[ApprovedCatalogueItem] = Field(default_factory=list, max_length=80)

    @model_validator(mode="after")
    def validate_date_range(self) -> "ApprovedTravelContext":
        if self.travel_start_date and self.travel_end_date and self.travel_end_date < self.travel_start_date:
            raise ValueError("travel_end_date must be on or after travel_start_date.")
        return self

    @model_validator(mode="after")
    def validate_catalogue_item_ids(self) -> "ApprovedTravelContext":
        ids = [item.id for item in self.catalogue_items]
        if len(ids) != len(set(ids)):
            raise ValueError("catalogue_items must have unique IDs.")
        return self


class DraftItineraryRequest(StrictModel):
    approved_context: ApprovedTravelContext
    human_handoff_requested: bool = False


class GeneratedItineraryDay(StrictModel):
    day_number: int = Field(ge=1, le=60)
    title: str = Field(min_length=1, max_length=120)
    rationale: str = Field(min_length=1, max_length=500)
    catalogue_item_ids: list[str] = Field(default_factory=list, max_length=12)


class GeneratedItinerary(StrictModel):
    summary: str = Field(min_length=1, max_length=800)
    days: list[GeneratedItineraryDay] = Field(default_factory=list, max_length=60)

    @model_validator(mode="after")
    def validate_day_order(self) -> "GeneratedItinerary":
        day_numbers = [day.day_number for day in self.days]
        if day_numbers != list(range(1, len(day_numbers) + 1)):
            raise ValueError("days must be ordered consecutively from 1.")
        return self


class DraftItineraryResponse(StrictModel):
    status: str = "draft-only"
    provider: str = "gemini"
    message: str
    limitations: list[str]
    human_handoff_required: bool
    itinerary: GeneratedItinerary
