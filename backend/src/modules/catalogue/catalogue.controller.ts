import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../../common/auth.decorators";
import type { PageQuery } from "../../common/pagination";
import { CatalogueService, type ProductSearchQuery } from "./catalogue.service";

@ApiTags("Catalogue")
@Public()
@Controller("api/v1/catalogue")
export class CatalogueController {
  public constructor(private readonly catalogue: CatalogueService) {}

  @Get("products")
  @ApiOperation({ operationId: "GetProductsV1" })
  public products(@Query() query: ProductSearchQuery): Promise<Record<string, unknown>> {
    return this.catalogue.products(query);
  }

  @Get("products/:slug")
  @ApiOperation({ operationId: "GetProductBySlugV1" })
  public product(@Param("slug") slug: string): Promise<Record<string, unknown>> {
    return this.catalogue.product(slug);
  }

  @Get("product-types")
  @ApiOperation({ operationId: "GetProductTypesV1" })
  public productTypes(@Query() query: PageQuery): Promise<Record<string, unknown>> {
    return this.catalogue.namedPage("product_types", query);
  }

  @Get("categories")
  @ApiOperation({ operationId: "GetCategoriesV1" })
  public categories(@Query() query: PageQuery): Promise<Record<string, unknown>> {
    return this.catalogue.namedPage("categories", query);
  }

  @Get("tags")
  @ApiOperation({ operationId: "GetTagsV1" })
  public tags(@Query() query: PageQuery): Promise<Record<string, unknown>> {
    return this.catalogue.namedPage("tags", query);
  }

  @Get("collections")
  @ApiOperation({ operationId: "GetCollectionsV1" })
  public collections(@Query() query: PageQuery): Promise<Record<string, unknown>> {
    return this.catalogue.publishedNamedPage("collections", query);
  }

  @Get("collections/:slug")
  @ApiOperation({ operationId: "GetCollectionBySlugV1" })
  public collection(@Param("slug") slug: string): Promise<Record<string, unknown>> {
    return this.catalogue.collection(slug);
  }

  @Get("destinations")
  @ApiOperation({ operationId: "GetDestinationsV1" })
  public destinations(@Query() query: PageQuery): Promise<Record<string, unknown>> {
    return this.catalogue.publishedNamedPage("destinations", query);
  }

  @Get("destinations/:slug")
  @ApiOperation({ operationId: "GetDestinationBySlugV1" })
  public destination(@Param("slug") slug: string): Promise<Record<string, unknown>> {
    return this.catalogue.destination(slug);
  }
}
