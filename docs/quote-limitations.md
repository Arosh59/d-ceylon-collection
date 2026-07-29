# Quote Limitations

Phase 8 quotes are a reviewed commercial proposal derived from one explicit, versioned itinerary
draft. They are not a booking, supplier confirmation, live-availability response, payment request,
invoice, voucher, or travel contract.

## What a quote contains

- a customer request tied to a stable itinerary revision and its deterministic rule/fingerprint;
- an organisation-owned agent draft with itemized services, price components, assumptions,
  inclusions, exclusions, terms, expiry, and customer-visible notes; and
- immutable sent versions. Later revisions never change a previously sent version.

Only the current sent version can be accepted or declined. A customer acceptance records a decision
only; it cannot reserve services, create a booking, collect a payment, or establish live pricing.
Expired, withdrawn, and declined quotes cannot be accepted. Agents can revise an eligible sent,
declined, or expired quote into a new draft version.

## Availability and supplier limits

No supplier connection, inventory check, availability hold, exchange-rate feed, tax engine, payment
provider, invoice generator, or booking conversion exists in Phase 8. Prices are agent-entered,
fixed-precision estimates subject to the stated assumptions and terms. A customer must not treat a
quote as confirmation that any itinerary item is available or bookable.

## Access and change history

Customer access is derived only from validated customer claims. Agent access is limited to the
validated active organisation claim. Cross-customer and cross-organisation records are
indistinguishable from absent records. Quote mutations use concurrency tokens; sensitive commercial
transitions write correlated audit events. Internal agent notes never appear in customer DTOs or
pages.
