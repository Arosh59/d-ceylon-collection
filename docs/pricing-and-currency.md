# Pricing and Currency Guidance

Phase 8 uses the explicit Pricing boundary for quote arithmetic. It supports only `EUR`, `GBP`,
`LKR`, and `USD` ISO 4217 codes. Codes are normalized to uppercase and every line item and price
component in a draft must use the quote currency.

Amounts use PostgreSQL fixed precision `numeric(18,2)` and two fractional digits. The server rejects
unsupported currencies, values outside the configured maximum, invalid sign rules, and values with
more than two decimal places. Line totals, subtotal, tax total, adjustment total, and grand total
are calculated server-side with deterministic banker’s rounding; browser totals are informational.

- Line items require a positive quantity and a non-negative unit amount.
- `tax` components are non-negative fixed amounts.
- `adjustment` components may be positive or negative fixed amounts.
- A sent version snapshots the complete item and component set with its calculated totals.

The system does not convert currencies, fetch exchange rates, calculate jurisdiction-specific tax,
apply supplier pricing, or charge payment instruments. Agents must state any currency, tax, and
supplier assumptions in the quote’s customer-visible terms before sending it.
