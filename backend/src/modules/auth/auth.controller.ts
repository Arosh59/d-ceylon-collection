import { Body, Controller, Get, HttpCode, Post, Req, type RawBodyRequest } from "@nestjs/common";
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";

import { CurrentUser, Public } from "../../common/auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../common/auth.types";
import {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "./auth.dto";
import { AuthService } from "./auth.service";
import type { AuthenticationContext, AuthenticationIdentity } from "./auth.types";
import { PasswordResetService } from "./password-reset.service";

@ApiTags("Authentication")
@Controller("api/v1/auth")
export class AuthController {
  public constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Public()
  @Post("register")
  @HttpCode(200)
  @ApiOkResponse()
  public register(@Body() body: RegisterRequest, @Req() request: Request) {
    return this.auth.register(body.name, body.email, body.password, contextFor(request));
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOkResponse()
  public login(@Body() body: LoginRequest, @Req() request: Request) {
    return this.auth.login(body.email, body.password, contextFor(request));
  }

  @Public()
  @Post("google")
  @HttpCode(200)
  @ApiOkResponse()
  public google(@Body() body: GoogleLoginRequest, @Req() request: Request) {
    return this.auth.google(body.idToken, contextFor(request));
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  @ApiOkResponse()
  public refresh(@Body() body: RefreshRequest, @Req() request: Request) {
    return this.auth.refresh(body.refreshToken, contextFor(request));
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  @ApiNoContentResponse()
  public async logout(@Body() body: LogoutRequest, @Req() request: Request): Promise<void> {
    await this.auth.logout(body.refreshToken, contextFor(request));
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(202)
  @ApiAcceptedResponse()
  public async forgotPassword(
    @Body() body: ForgotPasswordRequest,
    @Req() request: Request,
  ): Promise<{ message: string }> {
    await this.passwordReset.request(body.email, contextFor(request));
    return { message: "If the account exists, a password reset email has been sent." };
  }

  @Public()
  @Post("reset-password")
  @HttpCode(204)
  @ApiNoContentResponse()
  public async resetPassword(
    @Body() body: ResetPasswordRequest,
    @Req() request: Request,
  ): Promise<void> {
    await this.passwordReset.reset(body.token, body.password, contextFor(request));
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOkResponse()
  public me(@CurrentUser() user: AuthenticatedUser): AuthenticationIdentity {
    return {
      subject: user.subject,
      displayName: user.displayName,
      email: user.email ?? null,
      roles: user.roles,
      permissions: user.permissions,
      customerId: user.customerId ?? null,
      organisationId: user.organisationId ?? null,
    };
  }
}

function contextFor(request: RawBodyRequest<Request> | Request): AuthenticationContext {
  const authenticated = request as AuthenticatedRequest;
  return {
    correlationId: authenticated.correlationId ?? "unknown",
    ipAddress: request.ip,
    userAgent: request.get("user-agent"),
  };
}
