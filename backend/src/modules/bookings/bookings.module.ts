import { Module } from "@nestjs/common";

import { QuotesModule } from "../quotes/quotes.module";
import { AgentBookingsController, CustomerBookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";

@Module({
  imports: [QuotesModule],
  controllers: [CustomerBookingsController, AgentBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
