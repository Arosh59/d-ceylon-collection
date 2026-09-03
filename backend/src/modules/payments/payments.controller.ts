import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../../common/auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../common/auth.types";
import type { PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { SecurityAuditService } from "../../database/security-audit.service";
import { PaymentsService } from "./payments.service";

@ApiTags("Customer payments")
@Roles("customer")
@Controller("api/v1/customer")
export class PaymentsController {
  public constructor(
    private readonly payments: PaymentsService,
    private readonly audit: SecurityAuditService,
  ) {}

  @Get("bookings/:bookingId/payments")
  @ApiOperation({ operationId: "GetCustomerPaymentsV1" })
  public list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("bookingId") bookingId: string,
    @Query() query: PageQuery,
  ) {
    return this.payments.list(customerId(user), bookingId, query);
  }

  @Post("bookings/:bookingId/payments")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateCustomerPaymentV1" })
  public async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param("bookingId") bookingId: string,
    @Body() body: Record<string, unknown>,
    @Req() request: AuthenticatedRequest,
  ) {
    const payment = await this.payments.create(customerId(user), bookingId, body);
    await this.audit.record("payment-created", "succeeded", user.subject, request.correlationId);
    return payment;
  }

  @Get("payments/:paymentId")
  @ApiOperation({ operationId: "GetCustomerPaymentV1" })
  public get(@CurrentUser() user: AuthenticatedUser, @Param("paymentId") paymentId: string) {
    return this.payments.get(customerId(user), paymentId);
  }
}

function customerId(user: AuthenticatedUser): string {
  if (!user.customerId) throw new DomainError(403, "The customer claim is invalid.", "Forbidden");
  return user.customerId;
}
