import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { DatabaseService } from "./database.service";

@Injectable()
export class SecurityAuditService {
  public constructor(private readonly database: DatabaseService) {}

  public async record(
    eventType: string,
    outcome: string,
    subject: string | null,
    correlationId: string,
  ): Promise<void> {
    const now = new Date();
    await this.database.$executeRaw`
      INSERT INTO identity_access.security_audit_events
        (id, event_type, outcome, subject, correlation_id, occurred_at_utc,
         created_at_utc, updated_at_utc, concurrency_token)
      VALUES (${randomUUID()}::uuid, ${eventType}, ${outcome}, ${subject}, ${correlationId}, ${now}, ${now}, ${now}, ${randomUUID()}::uuid)
    `;
  }
}
