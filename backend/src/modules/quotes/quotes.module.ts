import { Module } from "@nestjs/common";

import { TravelPlanningModule } from "../travel-planning/travel-planning.module";
import { AgentQuotesController, CustomerQuotesController } from "./quotes.controller";
import { QuotesService } from "./quotes.service";

@Module({
  imports: [TravelPlanningModule],
  controllers: [CustomerQuotesController, AgentQuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
