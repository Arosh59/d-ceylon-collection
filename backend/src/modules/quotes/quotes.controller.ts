import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Roles } from "../../common/auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../common/auth.types";
import type { PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { SecurityAuditService } from "../../database/security-audit.service";
import { QuotesService } from "./quotes.service";

@ApiTags("Customer quotes")
@Roles("customer")
@Controller("api/v1/customer/quotes")
export class CustomerQuotesController {
  public constructor(
    private readonly quotes: QuotesService,
    private readonly audit: SecurityAuditService,
  ) {}
  @Get() @ApiOperation({ operationId: "GetCustomerQuotesV1" }) list(
    @CurrentUser() u: AuthenticatedUser,
    @Query() q: PageQuery,
  ) {
    return this.quotes.customerList(customer(u), q);
  }
  @Get(":quoteId") @ApiOperation({ operationId: "GetCustomerQuoteV1" }) get(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
  ) {
    return this.quotes.customerGet(customer(u), id);
  }
  @Post() @HttpCode(201) @ApiOperation({ operationId: "RequestCustomerQuoteV1" }) async create(
    @CurrentUser() u: AuthenticatedUser,
    @Body() b: Record<string, unknown>,
    @Req() r: AuthenticatedRequest,
  ) {
    const x = await this.quotes.request(customer(u), b);
    await this.audit.record("quote-request-created", "succeeded", u.subject, r.correlationId);
    return x;
  }
  @Post(":quoteId/accept")
  @HttpCode(200)
  @ApiOperation({ operationId: "AcceptCustomerQuoteV1" })
  accept(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
    @Body() b: Record<string, unknown>,
    @Req() r: AuthenticatedRequest,
  ) {
    return this.mutate("accept", customer(u), id, b, u, r);
  }
  @Post(":quoteId/decline")
  @HttpCode(200)
  @ApiOperation({ operationId: "DeclineCustomerQuoteV1" })
  decline(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
    @Body() b: Record<string, unknown>,
    @Req() r: AuthenticatedRequest,
  ) {
    return this.mutate("decline", customer(u), id, b, u, r);
  }
  @Post(":quoteId/withdraw")
  @HttpCode(200)
  @ApiOperation({ operationId: "WithdrawCustomerQuoteV1" })
  withdraw(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
    @Body() b: Record<string, unknown>,
    @Req() r: AuthenticatedRequest,
  ) {
    return this.mutate("withdraw", customer(u), id, b, u, r);
  }
  private async mutate(
    action: "accept" | "decline" | "withdraw",
    owner: string,
    id: string,
    b: Record<string, unknown>,
    u: AuthenticatedUser,
    r: AuthenticatedRequest,
  ) {
    const x = await this.quotes.customerTransition(owner, id, action, b);
    await this.audit.record(
      action === "accept"
        ? "quote-accepted"
        : action === "decline"
          ? "quote-declined"
          : "quote-withdrawn-by-customer",
      "succeeded",
      u.subject,
      r.correlationId,
    );
    return x;
  }
}
@ApiTags("Agent quotes")
@Roles("agent")
@Controller("api/v1/agent/quotes")
export class AgentQuotesController {
  public constructor(
    private readonly quotes: QuotesService,
    private readonly audit: SecurityAuditService,
  ) {}
  @Get() @ApiOperation({ operationId: "GetAgentQuoteQueueV1" }) list(
    @CurrentUser() u: AuthenticatedUser,
    @Query() q: PageQuery,
  ) {
    return this.quotes.agentList(org(u), q);
  }
  @Get(":quoteId") @ApiOperation({ operationId: "GetAgentQuoteV1" }) get(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
  ) {
    return this.quotes.agentGet(org(u), id);
  }
  @Post(":quoteId/prepare")
  @HttpCode(200)
  @ApiOperation({ operationId: "PrepareAgentQuoteV1" })
  prepare(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
    @Body() b: Record<string, unknown>,
    @Req() r: AuthenticatedRequest,
  ) {
    return this.mutate("prepare", org(u), id, b, u, r);
  }
  @Put(":quoteId/draft") @ApiOperation({ operationId: "UpdateAgentQuoteDraftV1" }) draft(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
    @Body() b: Record<string, unknown>,
    @Req() r: AuthenticatedRequest,
  ) {
    return this.mutate("draft", org(u), id, b, u, r);
  }
  @Post(":quoteId/send") @HttpCode(200) @ApiOperation({ operationId: "SendAgentQuoteV1" }) send(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
    @Body() b: Record<string, unknown>,
    @Req() r: AuthenticatedRequest,
  ) {
    return this.mutate("send", org(u), id, { ...b, subject: u.subject }, u, r);
  }
  @Post(":quoteId/revise")
  @HttpCode(200)
  @ApiOperation({ operationId: "ReviseAgentQuoteV1" })
  revise(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
    @Body() b: Record<string, unknown>,
    @Req() r: AuthenticatedRequest,
  ) {
    return this.mutate("revise", org(u), id, b, u, r);
  }
  @Post(":quoteId/withdraw")
  @HttpCode(200)
  @ApiOperation({ operationId: "WithdrawAgentQuoteV1" })
  withdraw(
    @CurrentUser() u: AuthenticatedUser,
    @Param("quoteId") id: string,
    @Body() b: Record<string, unknown>,
    @Req() r: AuthenticatedRequest,
  ) {
    return this.mutate("withdraw", org(u), id, b, u, r);
  }
  private async mutate(
    action: "prepare" | "draft" | "send" | "revise" | "withdraw",
    owner: string,
    id: string,
    b: Record<string, unknown>,
    u: AuthenticatedUser,
    r: AuthenticatedRequest,
  ) {
    const x = await this.quotes.agentMutation(owner, id, action, b);
    const events = {
      prepare: "quote-preparation-started",
      draft: "quote-draft-updated",
      send: "quote-version-sent",
      revise: "quote-revision-started",
      withdraw: "quote-withdrawn-by-agent",
    };
    await this.audit.record(events[action], "succeeded", u.subject, r.correlationId);
    return x;
  }
}
function customer(u: AuthenticatedUser) {
  if (!u.customerId) throw new DomainError(403, "The customer claim is invalid.", "Forbidden");
  return u.customerId;
}
function org(u: AuthenticatedUser) {
  if (!u.organisationId)
    throw new DomainError(403, "The organisation claim is invalid.", "Forbidden");
  return u.organisationId;
}
