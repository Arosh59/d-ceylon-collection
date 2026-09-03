import { Module } from "@nestjs/common";

import { CatalogueModule } from "../catalogue/catalogue.module";
import { TravelPlanningController } from "./travel-planning.controller";
import { TravelPlanningService } from "./travel-planning.service";

@Module({
  imports: [CatalogueModule],
  controllers: [TravelPlanningController],
  providers: [TravelPlanningService],
  exports: [TravelPlanningService],
})
export class TravelPlanningModule {}
