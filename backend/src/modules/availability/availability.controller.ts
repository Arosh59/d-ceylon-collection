import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";

import { Public } from "../../common/auth.decorators";
import {
  AvailabilityQueryRequest,
  ExperienceAvailabilityResponse,
  StayAvailabilityResponse,
} from "./availability.dto";
import { AvailabilityService } from "./availability.service";

@ApiTags("Availability")
@ApiExtraModels(ExperienceAvailabilityResponse, StayAvailabilityResponse)
@Public()
@Controller("api/v1/catalogue/products")
export class AvailabilityController {
  public constructor(private readonly availability: AvailabilityService) {}

  @Get(":slug/availability")
  @ApiOperation({ operationId: "GetProductAvailabilityV1" })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ExperienceAvailabilityResponse) },
        { $ref: getSchemaPath(StayAvailabilityResponse) },
      ],
    },
  })
  public product(@Param("slug") slug: string, @Query() query: AvailabilityQueryRequest) {
    return this.availability.product(slug, query);
  }
}
