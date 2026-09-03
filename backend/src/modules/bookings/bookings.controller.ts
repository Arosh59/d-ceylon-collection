import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../../common/auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../common/auth.types";
import type { PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { SecurityAuditService } from "../../database/security-audit.service";
import { BookingsService } from "./bookings.service";

@ApiTags("Customer bookings")
@Roles("customer")
@Controller("api/v1/customer/bookings")
export class CustomerBookingsController {
  public constructor(
    private readonly bookings: BookingsService,
    private readonly audit: SecurityAuditService,
  ) {}

  @Get()
  @ApiOperation({ operationId: "GetCustomerBookingsV1" })
  public list(@CurrentUser() user: AuthenticatedUser, @Query() query: PageQuery) {
    return this.bookings.customerList(customerId(user), query);
  }

  @Get(":bookingId")
  @ApiOperation({ operationId: "GetCustomerBookingV1" })
  public get(@CurrentUser() user: AuthenticatedUser, @Param("bookingId") bookingId: string) {
    return this.bookings.customerGet(customerId(user), bookingId);
  }

  @Get(":bookingId/vouchers/:voucherId")
  @ApiOperation({ operationId: "GetCustomerVoucherV1" })
  public voucher(
    @CurrentUser() user: AuthenticatedUser,
    @Param("bookingId") bookingId: string,
    @Param("voucherId") voucherId: string,
  ) {
    return this.bookings.customerVoucher(customerId(user), bookingId, voucherId);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateCustomerBookingV1" })
  public async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: Record<string, unknown>,
    @Req() request: AuthenticatedRequest,
  ) {
    const booking = await this.bookings.create(customerId(user), body);
    await this.audit.record("booking-created", "succeeded", user.subject, request.correlationId);
    return booking;
  }

  @Post(":bookingId/request-cancellation")
  @HttpCode(200)
  @ApiOperation({ operationId: "RequestBookingCancellationV1" })
  public async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("bookingId") bookingId: string,
    @Body() body: Record<string, unknown>,
    @Req() request: AuthenticatedRequest,
  ) {
    const booking = await this.bookings.requestCancellation(customerId(user), bookingId, body);
    await this.audit.record(
      "booking-cancellation-requested",
      "succeeded",
      user.subject,
      request.correlationId,
    );
    return booking;
  }
}

@ApiTags("Agent bookings")
@Roles("agent")
@Controller("api/v1/agent/bookings")
export class AgentBookingsController {
  public constructor(private readonly bookings: BookingsService) {}

  @Get()
  @ApiOperation({ operationId: "GetAgentBookingsV1" })
  public list(@CurrentUser() user: AuthenticatedUser, @Query() query: PageQuery) {
    return this.bookings.agentList(organisationId(user), query);
  }

  @Get(":bookingId")
  @ApiOperation({ operationId: "GetAgentBookingV1" })
  public get(@CurrentUser() user: AuthenticatedUser, @Param("bookingId") bookingId: string) {
    return this.bookings.agentGet(organisationId(user), bookingId);
  }
}

function customerId(user: AuthenticatedUser): string {
  if (!user.customerId) throw new DomainError(403, "The customer claim is invalid.", "Forbidden");
  return user.customerId;
}

function organisationId(user: AuthenticatedUser): string {
  if (!user.organisationId)
    throw new DomainError(403, "The organisation claim is invalid.", "Forbidden");
  return user.organisationId;
}
