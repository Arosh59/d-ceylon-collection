# Booking and Payment Limitations

Phase 9 creates owner-scoped booking records only from an accepted current immutable quote version.
It snapshots the quote lines and totals; it does not check supplier availability, reserve services,
or confirm a travel contract.

Payment instructions derive their amount and ISO currency only from the server-side outstanding
booking balance. Browser-supplied ownership, currency, and amount are not accepted. Idempotency
keys, concurrency tokens, ownership predicates, fixed-precision amounts, and correlated audit events
protect the workflow. No card number, CVV, raw payment credential, charge, capture, webhook result,
or refund operation is implemented in this phase.

Invoice and voucher records are foundations only. They are not issued documents, vouchers, receipts,
or proof of payment. Supplier operations, administration, live availability, bookings fulfilment,
and payment-provider integration remain out of scope.
