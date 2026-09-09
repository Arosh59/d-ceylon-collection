import { Module } from "@nestjs/common";

import { AdministrationController } from "./administration.controller";
import { AdministrationContentController } from "./administration-content.controller";
import { AdministrationContentService } from "./administration-content.service";
import { AdministrationService } from "./administration.service";

@Module({
  controllers: [AdministrationController, AdministrationContentController],
  providers: [AdministrationService, AdministrationContentService],
})
export class AdministrationModule {}
