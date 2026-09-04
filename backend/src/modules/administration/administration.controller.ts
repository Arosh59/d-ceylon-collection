import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../../common/auth.decorators";
import { AdministrationService } from "./administration.service";

@ApiTags("Administration")
@Roles("administrator")
@Controller("api/v1/administration")
export class AdministrationController {
  public constructor(private readonly administration: AdministrationService) {}

  @Get("summary")
  @ApiOperation({ operationId: "GetAdministrationSummaryV1" })
  public summary() {
    return this.administration.summary();
  }
}
