import { Module } from "@nestjs/common";

import { ApplicationJwtService } from "./application-jwt.service";
import { AuthAuditService } from "./auth-audit.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { FirebaseAuthService } from "./firebase-auth.service";
import { MailService } from "./mail.service";
import { PasswordResetService } from "./password-reset.service";
import { PasswordService } from "./password.service";
import { RefreshTokenService } from "./refresh-token.service";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthAuditService,
    ApplicationJwtService,
    FirebaseAuthService,
    MailService,
    PasswordResetService,
    PasswordService,
    RefreshTokenService,
  ],
  exports: [AuthService, ApplicationJwtService],
})
export class AuthModule {}
