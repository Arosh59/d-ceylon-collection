import { Body, Controller, Get, HttpCode, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../../common/auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../common/auth.types";
import type { PageQuery } from "../../common/pagination";
import { SecurityAuditService } from "../../database/security-audit.service";
import { OperationsService, type OperationResource } from "./operations.service";

@ApiTags("Supplier operations")
@Roles("staff", "administrator")
@Controller("api/v1/operations")
export class OperationsController {
  public constructor(
    private readonly operations: OperationsService,
    private readonly audit: SecurityAuditService,
  ) {}

  @Get("suppliers")
  @ApiOperation({ operationId: "GetOperationSuppliersV1" })
  public suppliers(@Query() query: PageQuery) {
    return this.operations.list("suppliers", query);
  }
  @Post("suppliers")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateOperationSupplierV1" })
  public createSupplier(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.create("suppliers", body, user, req);
  }

  @Get("tasks")
  @ApiOperation({ operationId: "GetBookingOperationTasksV1" })
  public tasks(@Query() query: PageQuery) {
    return this.operations.list("tasks", query);
  }
  @Post("tasks")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateBookingOperationTaskV1" })
  public createTask(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.create("tasks", body, user, req);
  }

  @Get("vehicles")
  @ApiOperation({ operationId: "GetOperationVehiclesV1" })
  public vehicles(@Query() query: PageQuery) {
    return this.operations.list("vehicles", query);
  }
  @Post("vehicles")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateOperationVehicleV1" })
  public createVehicle(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.create("vehicles", body, user, req);
  }

  @Get("drivers")
  @ApiOperation({ operationId: "GetOperationDriversV1" })
  public drivers(@Query() query: PageQuery) {
    return this.operations.list("drivers", query);
  }
  @Post("drivers")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateOperationDriverV1" })
  public createDriver(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.create("drivers", body, user, req);
  }

  @Get("guides")
  @ApiOperation({ operationId: "GetOperationGuidesV1" })
  public guides(@Query() query: PageQuery) {
    return this.operations.list("guides", query);
  }
  @Post("guides")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateOperationGuideV1" })
  public createGuide(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.create("guides", body, user, req);
  }

  @Get("arrivals")
  @ApiOperation({ operationId: "GetOperationArrivalsV1" })
  public arrivals(@Query() query: PageQuery) {
    return this.operations.list("arrivals", query);
  }
  @Post("arrivals")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateOperationArrivalV1" })
  public createArrival(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.create("arrivals", body, user, req);
  }

  @Get("assignments")
  @ApiOperation({ operationId: "GetOperationBookingResourceAssignmentsV1" })
  public assignments(@Query() query: PageQuery) {
    return this.operations.list("assignments", query);
  }
  @Post("assignments")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateOperationBookingResourceAssignmentV1" })
  public createAssignment(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.create("assignments", body, user, req);
  }

  private async create(
    resource: OperationResource,
    body: Record<string, unknown>,
    user: AuthenticatedUser,
    request: AuthenticatedRequest,
  ) {
    const result = await this.operations.create(resource, body);
    const event =
      resource === "tasks"
        ? "booking-operation-task-created"
        : resource === "assignments"
          ? "booking-resource-assignment-created"
          : `${resource.slice(0, -1)}-created`;
    await this.audit.record(event, "succeeded", user.subject, request.correlationId);
    return result;
  }
}
