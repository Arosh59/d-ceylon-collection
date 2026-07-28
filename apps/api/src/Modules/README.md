# API Modules

The API is deployed as a modular monolith. A module owns its domain model, application behavior,
persistence mappings, contracts, and HTTP endpoints. Modules communicate through explicit contracts
rather than reaching into one another's database sets or internal types.

Phases 2 and 4 implement **Catalogue**, including its internal PostgreSQL search-provider boundary.
Phase 5 adds **Identity and Access** and **Organisations and Agents**. Phase 6 adds **Customers and
Travellers**, including customer-owned profile, traveller, wishlist, and saved-itinerary records.
Each owns a separate assembly, EF Core context, schema, migration set, and readiness check.
Cross-module user and
organisation references are stable identifiers rather than navigation into another module's
DbContext.

The planned later boundaries are:

- Destinations
- Product Catalogue
- Pricing
- Availability
- Itineraries
- Quotes
- Bookings
- Payments
- Documents
- Suppliers
- Transportation
- Drivers and Guides
- Operations
- Notifications
- Journal and Media
- Search
- Reporting
- Audit
- AI Integration Gateway

Directories and assemblies for later modules will be created only when their implementation phase
begins.
