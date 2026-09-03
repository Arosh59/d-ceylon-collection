import { Module } from "@nestjs/common";

import { AccessController } from "./access.controller";
import { TestingTokenService } from "./testing-token.service";

@Module({ controllers: [AccessController], providers: [TestingTokenService] })
export class AccessModule {}
