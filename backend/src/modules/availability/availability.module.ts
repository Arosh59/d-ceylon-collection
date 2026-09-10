import { Module } from "@nestjs/common";

import { AvailabilityAdministrationController } from "./availability-admin.controller";
import { AvailabilityAdministrationService } from "./availability-admin.service";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityService } from "./availability.service";

@Module({
  controllers: [AvailabilityController, AvailabilityAdministrationController],
  providers: [AvailabilityService, AvailabilityAdministrationService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
