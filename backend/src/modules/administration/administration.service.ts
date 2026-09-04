import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { apiValue } from "../../common/serialization";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class AdministrationService {
  public constructor(private readonly database: DatabaseService) {}

  public async summary(): Promise<Record<string, unknown>> {
    const [counts, activity, bookingStatuses, quoteStatuses] = await Promise.all([
      this.database.rows<Record<string, unknown>>(Prisma.sql`
        SELECT
          (SELECT COUNT(*) FROM identity_access.users) AS "users",
          (SELECT COUNT(*) FROM customers_travellers.customer_profiles) AS "customers",
          (SELECT COUNT(*) FROM catalogue.products WHERE publication_state = 'Published') AS "publishedProducts",
          (SELECT COUNT(*) FROM catalogue.destinations WHERE publication_state = 'Published') AS "publishedDestinations",
          (SELECT COUNT(*) FROM bookings.bookings) AS "bookings",
          (SELECT COUNT(*) FROM bookings.bookings WHERE status IN ('pending-confirmation', 'cancellation-requested')) AS "pendingBookings",
          (SELECT COUNT(*) FROM quotes.quote_requests) AS "quoteRequests",
          (SELECT COUNT(*) FROM quotes.quotes WHERE status IN ('draft', 'sent')) AS "pendingQuotes",
          (SELECT COUNT(*) FROM supplier_operations.booking_operation_tasks WHERE \"Status\" = 'open') AS "openTasks"
      `),
      this.database.rows<Record<string, unknown>>(Prisma.sql`
        SELECT event_type AS "eventType", outcome, subject, occurred_at_utc AS "occurredAtUtc"
          FROM identity_access.security_audit_events
         ORDER BY occurred_at_utc DESC
         LIMIT 8
      `),
      this.database.rows<{ status: string; count: bigint }>(Prisma.sql`
        SELECT status, COUNT(*)::bigint AS count
          FROM bookings.bookings
         GROUP BY status
         ORDER BY count DESC, status
      `),
      this.database.rows<{ status: string; count: bigint }>(Prisma.sql`
        SELECT status, COUNT(*)::bigint AS count
          FROM quotes.quotes
         GROUP BY status
         ORDER BY count DESC, status
      `),
    ]);

    return apiValue({
      counts: counts[0] ?? {},
      recentActivity: activity,
      bookingStatuses,
      quoteStatuses,
    });
  }
}
