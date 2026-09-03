import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../../common/auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../common/auth.types";
import type { PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { SecurityAuditService } from "../../database/security-audit.service";
import { TravelPlanningService, type TravelPlanInput } from "./travel-planning.service";

@ApiTags("Travel planning")
@Roles("customer")
@Controller("api/v1/customer/travel-plans")
export class TravelPlanningController {
  public constructor(
    private readonly plans: TravelPlanningService,
    private readonly audit: SecurityAuditService,
  ) {}
  @Get()
  @ApiOperation({ operationId: "GetCustomerTravelPlansV1" })
  public list(@CurrentUser() user: AuthenticatedUser, @Query() query: PageQuery) {
    return this.plans.list(cid(user), query);
  }
  @Get(":planId")
  @ApiOperation({ operationId: "GetCustomerTravelPlanV1" })
  public get(@CurrentUser() user: AuthenticatedUser, @Param("planId") id: string) {
    return this.plans.get(cid(user), id);
  }
  @Post()
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateCustomerTravelPlanV1" })
  public async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: TravelPlanInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.plans.create(cid(user), body);
    await this.audit.record("travel-plan-generated", "succeeded", user.subject, req.correlationId);
    return result;
  }
  @Put(":planId/input")
  @ApiOperation({ operationId: "UpdateCustomerTravelPlanInputV1" })
  public async updateInput(
    @CurrentUser() user: AuthenticatedUser,
    @Param("planId") id: string,
    @Body() body: TravelPlanInput & { concurrencyToken?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.plans.updateInput(cid(user), id, body);
    await this.audit.record(
      "travel-plan-input-updated",
      "succeeded",
      user.subject,
      req.correlationId,
    );
    return result;
  }
  @Post(":planId/generate")
  @HttpCode(200)
  @ApiOperation({ operationId: "GenerateCustomerTravelPlanV1" })
  public async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("planId") id: string,
    @Body() body: { concurrencyToken?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.plans.generate(cid(user), id, body.concurrencyToken);
    await this.audit.record(
      "travel-plan-regenerated",
      "succeeded",
      user.subject,
      req.correlationId,
    );
    return result;
  }
  @Put(":planId/days/:dayId")
  @ApiOperation({ operationId: "UpdateCustomerItineraryDayV1" })
  public async day(
    @CurrentUser() user: AuthenticatedUser,
    @Param("planId") planId: string,
    @Param("dayId") dayId: string,
    @Body() body: { title?: string; concurrencyToken?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.plans.updateDay(cid(user), planId, dayId, body);
    await this.audit.record("itinerary-day-updated", "succeeded", user.subject, req.correlationId);
    return result;
  }
  @Post(":planId/days/:dayId/items")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateCustomerItineraryItemV1" })
  public async createItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("planId") planId: string,
    @Param("dayId") dayId: string,
    @Body() body: Record<string, unknown>,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.plans.createItem(cid(user), planId, dayId, body);
    await this.audit.record("itinerary-item-created", "succeeded", user.subject, req.correlationId);
    return result;
  }
  @Put(":planId/items/:itemId")
  @ApiOperation({ operationId: "UpdateCustomerItineraryItemV1" })
  public async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("planId") planId: string,
    @Param("itemId") itemId: string,
    @Body() body: Record<string, unknown>,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.plans.updateItem(cid(user), planId, itemId, body);
    await this.audit.record("itinerary-item-updated", "succeeded", user.subject, req.correlationId);
    return result;
  }
  @Post(":planId/items/:itemId/reorder")
  @HttpCode(200)
  @ApiOperation({ operationId: "ReorderCustomerItineraryItemV1" })
  public async reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Param("planId") planId: string,
    @Param("itemId") itemId: string,
    @Body() body: { targetDayId?: string; position?: number; concurrencyToken?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.plans.reorder(cid(user), planId, itemId, body);
    await this.audit.record(
      "itinerary-item-reordered",
      "succeeded",
      user.subject,
      req.correlationId,
    );
    return result;
  }
}
function cid(user: AuthenticatedUser): string {
  if (!user.customerId) throw new DomainError(403, "The customer claim is invalid.", "Forbidden");
  return user.customerId;
}
