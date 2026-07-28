# Customer Data and Privacy

## Phase 6 scope

The Customers and Travellers module stores only information needed to support customer-controlled
travel discovery and future planning. It does not store passport documents or numbers, identity
documents, medical records, generated travel plans, quotes, bookings, or payment data.

## Data-minimisation rules

- Profile contact fields are optional except for the channel the customer selects as preferred.
- Traveller date of birth, accessibility needs, dietary needs, and emergency contact are optional.
- Accessibility and dietary text is bounded to 1,000 characters and must describe practical travel
  support, not diagnoses or unrelated history.
- Emergency-contact name and phone are accepted only as a pair and are bounded.
- Wishlist notes and saved-itinerary summaries are private planning notes with strict length limits.
- Client applications never submit or choose a customer owner ID. Ownership comes from validated
  authentication claims on every API query and mutation.
- Persistence entities, access tokens, and customer identifiers are not exposed as browser session
  data.

## Access, change, and deletion

Customers can read and change their own profile, travellers, wishlist entries, and saved-itinerary
metadata. Profile and child records have explicit deletion operations. Cross-customer access
returns the same not-found response as an absent record. Updates and deletes use concurrency tokens
to prevent silent overwrites.

Security/privacy-sensitive creates, changes, and deletions write an audit event containing the
event type, outcome, authenticated subject, time, and correlation ID. Audit records must not include
contact values, dietary/accessibility text, emergency details, notes, or bearer tokens.

## Operational requirements

Production deployment must define retention and account-erasure schedules, backup expiry,
jurisdiction and residency requirements, support access procedures, breach response ownership, and
encryption/key-management controls before accepting real customer information. Logs and monitoring
must use identifiers and correlation IDs rather than field values. New sensitive fields require a
privacy and threat-model review before migration approval.
