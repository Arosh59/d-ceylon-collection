import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from "@nestjs/swagger";
import { timingSafeEqual } from "node:crypto";

import { CurrentUser, Public, Roles } from "../../common/auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../common/auth.types";
import { DomainError } from "../../common/problem-details.filter";
import { requireUuid } from "../../common/pagination";
import { SecurityAuditService } from "../../database/security-audit.service";
import { TestingTokenService } from "./testing-token.service";

@ApiTags("Identity and Access")
@Controller("api/v1/access")
export class AccessController {
  public constructor(
    private readonly tokens: TestingTokenService,
    private readonly auditWriter: SecurityAuditService,
  ) {}

  @Get("me")
  @ApiOperation({ operationId: "GetCurrentAccessV1" })
  public me(@CurrentUser() user: AuthenticatedUser): Record<string, unknown> {
    return {
      subject: user.subject,
      displayName: user.displayName,
      email: user.email ?? null,
      roles: [...new Set(user.roles)].sort(),
      permissions: [...new Set(user.permissions)].sort(),
      customerId: user.customerId ?? null,
      organisationId: user.organisationId ?? null,
    };
  }

  @Get("customer/:customerId")
  @Roles("customer")
  @ApiOperation({ operationId: "GetCustomerPortalV1" })
  public customer(
    @Param("customerId") customerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): { portal: string; access: string } {
    requireUuid(customerId, "customerId");
    if (user.customerId !== customerId && !user.roles.includes("administrator")) {
      throw new ForbiddenException("The authenticated identity does not own this resource.");
    }
    return { portal: "customer", access: "authorised" };
  }

  @Get("agent/:organisationId")
  @Roles("agent")
  @ApiOperation({ operationId: "GetAgentPortalV1" })
  public agent(
    @Param("organisationId") organisationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): { portal: string; access: string } {
    requireUuid(organisationId, "organisationId");
    if (user.organisationId !== organisationId && !user.roles.includes("administrator")) {
      throw new ForbiddenException("The authenticated identity does not own this resource.");
    }
    return { portal: "agent", access: "authorised" };
  }

  @Get("staff")
  @Roles("staff", "administrator")
  @ApiOperation({ operationId: "GetStaffPortalV1" })
  public staff(): { portal: string; access: string } {
    return { portal: "staff", access: "authorised" };
  }

  @Get("administrator")
  @Roles("administrator")
  @ApiOperation({ operationId: "GetAdministratorPortalV1" })
  public administrator(): { portal: string; access: string } {
    return { portal: "administrator", access: "authorised" };
  }

  @Post("testing/token")
  @HttpCode(200)
  @Public()
  @ApiExcludeEndpoint()
  public async testingToken(
    @Body() body: { persona?: string },
    @Headers("x-test-authentication-key") suppliedKey: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<Record<string, unknown>> {
    if (process.env.APP_ENVIRONMENT !== "Testing") throw new NotFoundException();
    const expected = process.env.AUTH_TEST_ENDPOINT_KEY ?? "";
    if (!expected || !suppliedKey || !constantTimeEquals(suppliedKey, expected)) {
      await this.auditWriter.record("testing-token", "denied", null, request.correlationId);
      throw new UnauthorizedException("A valid testing authentication key is required.");
    }
    if (!body.persona) {
      throw new DomainError(
        400,
        "Use customer, agent, staff, or administrator.",
        "Validation failed",
        {
          persona: ["Use customer, agent, staff, or administrator."],
        },
      );
    }
    const token = await this.tokens.issue(body.persona);
    await this.auditWriter.record(
      "testing-token",
      "issued",
      (token.identity as { subject: string }).subject,
      request.correlationId,
    );
    return token;
  }
}

function constantTimeEquals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
