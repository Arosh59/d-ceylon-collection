import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AuthGuard } from "./common/auth.guard";
import { CorrelationIdMiddleware } from "./common/correlation-id.middleware";
import { RateLimitMiddleware } from "./common/rate-limit.middleware";
import { RequestLoggingMiddleware } from "./common/request-logging.middleware";
import { DatabaseModule } from "./database/database.module";
import { AccessModule } from "./modules/access/access.module";
import { AdministrationModule } from "./modules/administration/administration.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { CatalogueModule } from "./modules/catalogue/catalogue.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { EditorialModule } from "./modules/editorial/editorial.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { QuotesModule } from "./modules/quotes/quotes.module";
import { TravelPlanningModule } from "./modules/travel-planning/travel-planning.module";
import { validateEnvironment } from "./configuration";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    AccessModule,
    AdministrationModule,
    CatalogueModule,
    CustomersModule,
    EditorialModule,
    TravelPlanningModule,
    QuotesModule,
    BookingsModule,
    PaymentsModule,
    OperationsModule,
  ],
  controllers: [AppController],
  providers: [RequestLoggingMiddleware, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggingMiddleware, RateLimitMiddleware)
      .forRoutes("*");
  }
}
