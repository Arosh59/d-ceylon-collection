import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../../common/auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "../../common/auth.types";
import {
  AdministrationContactWriteRequest,
  AdministrationContentWriteRequest,
  AdministrationUserUpdateRequest,
} from "./administration-content.dto";
import { AdministrationContentService } from "./administration-content.service";

@ApiTags("Administration content")
@ApiBearerAuth()
@Roles("administrator")
@Controller("api/v1/administration")
export class AdministrationContentController {
  public constructor(private readonly content: AdministrationContentService) {}

  @Get("content/options")
  @ApiOperation({ operationId: "GetAdministrationContentOptionsV1" })
  public options() {
    return this.content.options();
  }

  @Get("content/contact")
  @ApiOperation({ operationId: "GetAdministrationContactV1" })
  public contact() {
    return this.content.contact();
  }

  @Put("content/contact")
  @ApiOperation({ operationId: "UpdateAdministrationContactV1" })
  public updateContact(
    @Body() body: AdministrationContactWriteRequest,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.content.updateContact(body, user, request.correlationId);
  }

  @Get("content/:resource")
  @ApiOperation({ operationId: "GetAdministrationContentV1" })
  public list(@Param("resource") resource: string, @Query() query: Record<string, string>) {
    return this.content.list(resource, query);
  }

  @Post("content/:resource")
  @ApiOperation({ operationId: "CreateAdministrationContentV1" })
  public create(
    @Param("resource") resource: string,
    @Body() body: AdministrationContentWriteRequest,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.content.create(resource, body, user, request.correlationId);
  }

  @Get("content/:resource/:id")
  @ApiOperation({ operationId: "GetAdministrationContentRecordV1" })
  public get(@Param("resource") resource: string, @Param("id") id: string) {
    return this.content.get(resource, id);
  }

  @Put("content/:resource/:id")
  @ApiOperation({ operationId: "UpdateAdministrationContentV1" })
  public update(
    @Param("resource") resource: string,
    @Param("id") id: string,
    @Body() body: AdministrationContentWriteRequest,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.content.update(resource, id, body, user, request.correlationId);
  }

  @Delete("content/:resource/:id")
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiOperation({ operationId: "ArchiveAdministrationContentV1" })
  public archive(
    @Param("resource") resource: string,
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.content.archive(resource, id, user, request.correlationId);
  }

  @Get("users")
  @ApiOperation({ operationId: "GetAdministrationUsersV1" })
  public users(@Query() query: Record<string, string>) {
    return this.content.users(query);
  }

  @Put("users/:id")
  @ApiOperation({ operationId: "UpdateAdministrationUserV1" })
  public updateUser(
    @Param("id") id: string,
    @Body() body: AdministrationUserUpdateRequest,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.content.updateUser(id, body, user, request.correlationId);
  }
}
