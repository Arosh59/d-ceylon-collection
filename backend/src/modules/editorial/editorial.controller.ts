import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../../common/auth.decorators";
import type { PageQuery } from "../../common/pagination";
import { EditorialService } from "./editorial.service";

@ApiTags("Editorial")
@Public()
@Controller("api/v1/editorial")
export class EditorialController {
  public constructor(private readonly editorial: EditorialService) {}

  @Get("journal")
  @ApiOperation({ operationId: "GetJournalArticlesV1" })
  public journal(@Query() query: PageQuery): Promise<Record<string, unknown>> {
    return this.editorial.journal(query);
  }

  @Get("journal/:slug")
  @ApiOperation({ operationId: "GetJournalArticleBySlugV1" })
  public article(@Param("slug") slug: string): Promise<Record<string, unknown>> {
    return this.editorial.article(slug);
  }

  @Get("promotions")
  @ApiOperation({ operationId: "GetPromotionsV1" })
  public promotions(): Promise<Record<string, unknown>[]> {
    return this.editorial.promotions();
  }
}
