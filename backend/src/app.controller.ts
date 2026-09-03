import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiExcludeEndpoint } from "@nestjs/swagger";

import { Public } from "./common/auth.decorators";
import { DatabaseService } from "./database/database.service";

@Controller()
export class AppController {
  public constructor(private readonly database: DatabaseService) {}

  @Get()
  @Public()
  @ApiExcludeEndpoint()
  public root(): { service: string; version: string } {
    return { service: "D Ceylon Collection API", version: "v1" };
  }

  @Get("health/live")
  @Public()
  @ApiExcludeEndpoint()
  public live(): { status: string; checks: { name: string; status: string }[] } {
    return { status: "Healthy", checks: [{ name: "self", status: "Healthy" }] };
  }

  @Get("health/ready")
  @Public()
  @ApiExcludeEndpoint()
  public async ready(): Promise<{ status: string; checks: { name: string; status: string }[] }> {
    try {
      await this.database.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException("PostgreSQL is not ready.");
    }
    return {
      status: "Healthy",
      checks: [{ name: "postgres-database", status: "Healthy" }],
    };
  }
}
