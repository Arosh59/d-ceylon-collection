import { Global, Module } from "@nestjs/common";

import { DatabaseService } from "./database.service";
import { SecurityAuditService } from "./security-audit.service";

@Global()
@Module({
  providers: [DatabaseService, SecurityAuditService],
  exports: [DatabaseService, SecurityAuditService],
})
export class DatabaseModule {}
