# API Modules

The API is deployed as a modular monolith. A module owns its domain model,
application behavior, persistence mappings, contracts, and HTTP endpoints.
Modules communicate through explicit contracts rather than reaching into one
another's database sets or internal types.

Phases 2 and 4 implement only the **Catalogue** module, including its internal
PostgreSQL search-provider boundary. The planned later boundaries are:

- Identity and Access
- Organisations and Agents
- Customers and Travellers
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

Directories and assemblies for later modules will be created only when their
implementation phase begins.
