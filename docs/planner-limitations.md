# Deterministic Planner Rules and Limitations

## What the planner does

Phase 7 creates customer-owned draft itineraries from validated dates, ordered destinations,
customer-owned traveller associations, pace, interests, accessibility and dietary considerations,
and Catalogue preferences.

Rule version `dceylon-deterministic-v1` is deliberately reviewable:

- `relaxed`, `balanced`, and `active` pace allow at most one, two, or three Catalogue items per day;
- requested destinations rotate by day in their submitted order;
- only published products associated with that day's destination are candidates;
- exact product-type, category, tag, and interest matches receive fixed scores;
- ties use ordinal product-slug order, and a product is not repeated within one generated revision;
  and
- days and items use stable identifiers derived from the normalized fingerprint and their position
  or Catalogue reference.

The SHA-256 fingerprint includes normalized planner input, the fixed rule version, and the sorted
published Catalogue snapshot used during generation. The same complete input produces the same
ordered draft. A changed request, rule, or Catalogue snapshot produces different metadata and may
produce different output. Regeneration creates a new numbered revision rather than overwriting
history.

## What the planner does not do

The planner is a discovery and editing aid, not an optimizer or transaction system. It does not use
generative AI, an external optimization service, randomness, geospatial routing, travel-time
matrices, live operating hours, weather, capacity, availability, supplier confirmation, final
prices, discounts, taxes, quotes, bookability, bookings, or payments.

Catalogue duration is descriptive metadata, not a guarantee that consecutive items fit safely in a
day. Accessibility and dietary text influences the retained planning context but is not a
professional accessibility, health, or supplier-suitability assessment. A person must review route
feasibility and requirements with providers before relying on a draft.

Every generated page therefore labels its output as a draft and must not present it as availability,
a final price, a quote, a booking option, or confirmation. Phase 8 may consume an explicitly
reviewed draft as quote-request context, but must not weaken these claims.
