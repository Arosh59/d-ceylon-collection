import { Body, Controller, Get, HttpCode, Param, Post, Put, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../../common/auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../common/auth.types";
import { SecurityAuditService } from "../../database/security-audit.service";
import {
  BookingProfileWriteRequest,
  ExperienceSlotWriteRequest,
  RoomInventoryWriteRequest,
  RoomTypeWriteRequest,
} from "./availability-admin.dto";
import { AvailabilityAdministrationService } from "./availability-admin.service";

@ApiTags("Administration availability")
@ApiBearerAuth()
@Roles("administrator")
@Controller("api/v1/administration/products/:productId/availability")
export class AvailabilityAdministrationController {
  public constructor(
    private readonly availability: AvailabilityAdministrationService,
    private readonly audit: SecurityAuditService,
  ) {}

  @Get()
  @ApiOperation({ operationId: "GetAdministrationProductAvailabilityV1" })
  public summary(@Param("productId") productId: string) {
    return this.availability.summary(productId);
  }

  @Put("profile")
  @HttpCode(200)
  @ApiOperation({ operationId: "SaveAdministrationProductBookingProfileV1" })
  public async saveProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param("productId") productId: string,
    @Body() body: BookingProfileWriteRequest,
  ) {
    const result = await this.availability.saveProfile(productId, body);
    await this.record("admin-booking-profile-saved", user, request);
    return result;
  }

  @Post("experience-slots")
  @ApiOperation({ operationId: "CreateAdministrationExperienceSlotV1" })
  public async createExperienceSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param("productId") productId: string,
    @Body() body: ExperienceSlotWriteRequest,
  ) {
    const result = await this.availability.createExperienceSlot(productId, body);
    await this.record("admin-experience-slot-created", user, request);
    return result;
  }

  @Put("experience-slots/:slotId")
  @HttpCode(200)
  @ApiOperation({ operationId: "UpdateAdministrationExperienceSlotV1" })
  public async updateExperienceSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param("productId") productId: string,
    @Param("slotId") slotId: string,
    @Body() body: ExperienceSlotWriteRequest,
  ) {
    const result = await this.availability.updateExperienceSlot(productId, slotId, body);
    await this.record("admin-experience-slot-updated", user, request);
    return result;
  }

  @Post("room-types")
  @ApiOperation({ operationId: "CreateAdministrationRoomTypeV1" })
  public async createRoomType(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param("productId") productId: string,
    @Body() body: RoomTypeWriteRequest,
  ) {
    const result = await this.availability.createRoomType(productId, body);
    await this.record("admin-room-type-created", user, request);
    return result;
  }

  @Put("room-types/:roomTypeId")
  @HttpCode(200)
  @ApiOperation({ operationId: "UpdateAdministrationRoomTypeV1" })
  public async updateRoomType(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param("productId") productId: string,
    @Param("roomTypeId") roomTypeId: string,
    @Body() body: RoomTypeWriteRequest,
  ) {
    const result = await this.availability.updateRoomType(productId, roomTypeId, body);
    await this.record("admin-room-type-updated", user, request);
    return result;
  }

  @Put("room-types/:roomTypeId/inventory")
  @HttpCode(200)
  @ApiOperation({ operationId: "SaveAdministrationRoomInventoryV1" })
  public async saveRoomInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Param("productId") productId: string,
    @Param("roomTypeId") roomTypeId: string,
    @Body() body: RoomInventoryWriteRequest,
  ) {
    const result = await this.availability.saveRoomInventory(productId, roomTypeId, body);
    await this.record("admin-room-inventory-saved", user, request);
    return result;
  }

  private record(event: string, user: AuthenticatedUser, request: AuthenticatedRequest) {
    return this.audit.record(event, "succeeded", user.subject, request.correlationId ?? "unknown");
  }
}
