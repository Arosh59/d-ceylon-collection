import { Injectable } from "@nestjs/common";

import { SecurityAuditService } from "../../database/security-audit.service";

@Injectable()
export class AuthAuditService {
  public constructor(private readonly audit: SecurityAuditService) {}

  public async record(
    eventType: string,
    outcome: "denied" | "succeeded",
    subject: string | null,
    correlationId: string,
  ): Promise<void> {
    try {
      await this.audit.record(eventType, outcome, subject, correlationId);
    } catch {
      // Authentication must remain available if audit persistence is temporarily unavailable.
    }
  }
}
