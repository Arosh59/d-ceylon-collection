# Threat Model

## Scope and status

This model was reviewed for the Phase 6 customer-data boundary. It must be revisited whenever
payments, private documents, new external providers, or AI capabilities are introduced.

## Assets

- customer, traveller, passport, accessibility, dietary, and contact data;
- staff, agent, driver, and guide identities and authorization grants;
- organisation ownership and commercial rate boundaries;
- product pricing, availability, quotes, commissions, and discounts;
- bookings, payments, refunds, invoices, and vouchers;
- private documents and expiring access links;
- supplier and operations records;
- authentication credentials, sessions, tokens, signing keys, and secrets;
- audit events, logs, backups, and recovery material; and
- approved editorial content, prompts, tool results, and AI conversations.

## Actors

- anonymous visitors;
- customers and travellers;
- agent administrators and agent users;
- staff roles across content, sales, operations, finance, and administration;
- drivers, guides, and suppliers;
- external identity, payment, content, storage, email, mapping, and AI providers;
- service operators; and
- malicious or compromised users and automated attackers.

## Trust boundaries

1. Browser or mobile client to the public/admin applications.
2. Frontend applications to the versioned application API.
3. Application API to PostgreSQL, Redis, private object storage, and providers.
4. Editorial applications and integration code to Directus.
5. Payment providers to signed webhook endpoints.
6. Private networks and cloud control planes to workloads and data services.
7. Application API to the isolated AI service.
8. CI/CD systems to build artifacts, registries, secrets, and deployments.

Data crossing a boundary requires authentication where applicable, server-side validation, explicit
authorization, transport protection, safe logging, and bounded timeouts and resource use.

## Threats and required mitigations

| Threat                              | Example impact                                   | Required mitigations                                                                                                     |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Broken access control               | Customer or agent reads another owner's records  | Deny-by-default policies, ownership predicates, organisation scoping, authorization tests, audit events                  |
| Credential or session compromise    | Account takeover or privileged action            | Managed identity abstraction, staff MFA, secure cookies, CSRF protection, rotation/revocation, lockout, anti-enumeration |
| Injection and unsafe input          | Data loss, code execution, or stored XSS         | Server validation, EF parameterization, output encoding, CSP, safe file handling, dependency review                      |
| Sensitive-data exposure             | Passport, payment, token, or document disclosure | Data minimization, encryption, redacted logs, private storage, expiring signed links, retention and deletion controls    |
| Malicious uploads                   | Malware distribution or parser exploitation      | Extension/MIME/size validation, quarantine, malware-scanning abstraction, private storage, access audit                  |
| Payment or webhook replay           | Duplicate charge, refund, or booking mutation    | Signature validation, timestamp tolerance, idempotency keys, durable event records, reconciliation                       |
| Quote/version tampering             | Changed price after customer acceptance          | Immutable sent versions, concurrency controls, complete change history, explicit approval records                        |
| Denial of service and abuse         | Service exhaustion or credential attacks         | Rate limiting, bounded pagination, request limits, caching, timeouts, health signals, monitoring                         |
| Supply-chain compromise             | Malicious dependency or image reaches production | Lockfiles, reviewed updates, secret/dependency/static/container scans, signed or attributable artifacts                  |
| Infrastructure or secret compromise | Unauthorized data or control-plane access        | Managed identities, least privilege, private networking, secret manager, rotation, environment isolation                 |
| AI prompt/tool abuse                | Data leakage or unauthorized commercial action   | No direct database access, authenticated allow-listed tools, scoped retrieval, injection defenses, human approval, audit |
| Backup loss or corruption           | Irrecoverable records or prolonged outage        | Encrypted retained backups, isolated restore tests, integrity checks, documented RPO/RTO                                 |

## Security invariants

- AI output cannot confirm availability, set a final price, create/cancel a booking, or charge a
  payment method.
- A booking originates only from an accepted quote or an explicitly authorized administrative
  workflow.
- Sent quote versions are immutable.
- Private documents never have public URLs.
- Card numbers, CVV values, and raw payment credentials are never stored.
- Customer and agent organisation ownership is enforced by the server, not trusted from client
  filters.
- The API denies access by default; anonymous routes must be explicitly marked.
- Browser session state never exposes the API bearer token through the public session response.
- Development and test token issuers cannot be enabled in Production.
- Identity-provider secrets, signing keys, tokens, and test keys never enter source control or
  client-visible environment values.
- Customer ownership comes only from validated claims and is included in every customer-record
  query and mutation.
- Sensitive traveller/contact values never appear in audit event payloads or structured logs.
- Passport documents and numbers are not stored in Phase 6.

## Phase 5 authentication abuse cases

| Abuse case                                    | Implemented control                                                             | Remaining operational control                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Forged, wrong-issuer, or wrong-audience token | JWT signature, issuer, audience, lifetime, and required-claim validation        | Provider signing-key rotation monitoring                               |
| Expired or missing token                      | Deny-by-default fallback policy and correlated 401 Problem Details              | Session-expiry support runbook                                         |
| Customer accesses another customer            | Resource handler plus owner predicates on every customer query and mutation      | Periodic authorization regression testing                             |
| Agent crosses organisation boundary           | Agent policy plus server-side organisation resource handler                     | Explicit grant workflow if cross-organisation access is later required |
| Open redirect during sign-in/logout           | Relative/same-origin redirect validation                                        | Provider redirect URI allow-list                                       |
| Test authentication exposed outside tests     | Dual API/web environment gates, required random test keys, no OpenAPI route     | Never deploy Testing configurations to shared environments             |
| Token/session disclosure                      | HTTP-only encrypted cookie, no bearer token in public session, no token logging | Managed secret store, TLS, cookie/key rotation                         |
| Authentication endpoint abuse                 | Per-IP fixed-window test-auth rate limit                                        | Provider-side throttling, bot controls, alerting                       |

## Phase 6 customer-data abuse cases

| Abuse case                                    | Implemented control                                                       | Remaining operational control                             |
| --------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| Customer reads or mutates another owner       | Claim-derived owner predicate on every query/mutation; indistinct 404     | Periodic authorization regression testing                 |
| Browser forges a customer identifier          | Customer IDs are absent from request DTOs and customer route parameters   | API gateway schema monitoring                             |
| Concurrent edit silently overwrites changes   | Per-record concurrency tokens and correlated 409 Problem Details          | User-support conflict-resolution guidance                 |
| Excess sensitive traveller data is collected  | Optional bounded fields, paired emergency contact, minimisation copy      | Retention, erasure, and support-access procedures          |
| Sensitive values leak through diagnostics     | DTO boundaries and metadata-only audit writer                             | Production log redaction verification and access controls |
| Deleted data remains indefinitely in backups  | Explicit record deletion endpoints                                        | Backup expiry and account-erasure schedule before go-live |

## Open questions

- Managed identity provider selection, staff MFA policy, and recovery operations
- Azure topology, private-network boundaries, and key management
- Payment and local-provider selection
- Object storage and malware-scanning providers
- Data classification, jurisdiction, retention, and deletion schedules
- Operational alert thresholds and incident response ownership
- Directus deployment and editorial publishing controls

## Review triggers

Review this model before each major phase, after material architecture changes, after a security
incident, and at least annually once the platform is live.
