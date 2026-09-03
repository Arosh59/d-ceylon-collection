import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../../common/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth.types";
import type { PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import {
  CustomersService,
  type CustomerInput,
  type SavedItineraryInput,
  type TravellerInput,
} from "./customers.service";

@ApiTags("Customer records")
@Roles("customer")
@Controller("api/v1/customer")
export class CustomersController {
  public constructor(private readonly records: CustomersService) {}

  @Get("profile")
  @ApiOperation({ operationId: "GetCustomerProfileV1" })
  public profile(@CurrentUser() user: AuthenticatedUser) {
    return this.records.getProfile(customerId(user));
  }

  @Post("profile")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateCustomerProfileV1" })
  public createProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: CustomerInput) {
    return this.records.createProfile(customerId(user), body);
  }

  @Put("profile")
  @ApiOperation({ operationId: "UpdateCustomerProfileV1" })
  public updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CustomerInput & { concurrencyToken?: string },
  ) {
    return this.records.updateProfile(customerId(user), body);
  }

  @Delete("profile")
  @HttpCode(204)
  @ApiOperation({ operationId: "DeleteCustomerProfileV1" })
  public deleteProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Query("concurrencyToken") token: string,
  ) {
    return this.records.delete("customer_profiles", customerId(user), undefined, token);
  }

  @Get("travellers")
  @ApiOperation({ operationId: "GetCustomerTravellersV1" })
  public travellers(@CurrentUser() user: AuthenticatedUser, @Query() query: PageQuery) {
    return this.records.getTravellers(customerId(user), query);
  }

  @Get("travellers/:travellerId")
  @ApiOperation({ operationId: "GetCustomerTravellerV1" })
  public traveller(@CurrentUser() user: AuthenticatedUser, @Param("travellerId") id: string) {
    return this.records.getTraveller(customerId(user), id);
  }

  @Post("travellers")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateCustomerTravellerV1" })
  public createTraveller(@CurrentUser() user: AuthenticatedUser, @Body() body: TravellerInput) {
    return this.records.createTraveller(customerId(user), body);
  }

  @Put("travellers/:travellerId")
  @ApiOperation({ operationId: "UpdateCustomerTravellerV1" })
  public updateTraveller(
    @CurrentUser() user: AuthenticatedUser,
    @Param("travellerId") id: string,
    @Body() body: TravellerInput & { concurrencyToken?: string },
  ) {
    return this.records.updateTraveller(customerId(user), id, body);
  }

  @Delete("travellers/:travellerId")
  @HttpCode(204)
  @ApiOperation({ operationId: "DeleteCustomerTravellerV1" })
  public deleteTraveller(
    @CurrentUser() user: AuthenticatedUser,
    @Param("travellerId") id: string,
    @Query("concurrencyToken") token: string,
  ) {
    return this.records.delete("travellers", customerId(user), id, token);
  }

  @Get("wishlist")
  @ApiOperation({ operationId: "GetCustomerWishlistV1" })
  public wishlist(@CurrentUser() user: AuthenticatedUser, @Query() query: PageQuery) {
    return this.records.getWishlist(customerId(user), query);
  }

  @Post("wishlist")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateCustomerWishlistEntryV1" })
  public createWishlist(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { productSlug?: string; note?: string | null },
  ) {
    return this.records.createWishlist(customerId(user), body);
  }

  @Put("wishlist/:entryId")
  @ApiOperation({ operationId: "UpdateCustomerWishlistEntryV1" })
  public updateWishlist(
    @CurrentUser() user: AuthenticatedUser,
    @Param("entryId") id: string,
    @Body() body: { note?: string | null; concurrencyToken?: string },
  ) {
    return this.records.updateWishlist(customerId(user), id, body);
  }

  @Delete("wishlist/:entryId")
  @HttpCode(204)
  @ApiOperation({ operationId: "DeleteCustomerWishlistEntryV1" })
  public deleteWishlist(
    @CurrentUser() user: AuthenticatedUser,
    @Param("entryId") id: string,
    @Query("concurrencyToken") token: string,
  ) {
    return this.records.delete("wishlist_entries", customerId(user), id, token);
  }

  @Get("saved-itineraries")
  @ApiOperation({ operationId: "GetCustomerSavedItinerariesV1" })
  public itineraries(@CurrentUser() user: AuthenticatedUser, @Query() query: PageQuery) {
    return this.records.getSavedItineraries(customerId(user), query);
  }

  @Get("saved-itineraries/:itineraryId")
  @ApiOperation({ operationId: "GetCustomerSavedItineraryV1" })
  public itinerary(@CurrentUser() user: AuthenticatedUser, @Param("itineraryId") id: string) {
    return this.records.getSavedItinerary(customerId(user), id);
  }

  @Post("saved-itineraries")
  @HttpCode(201)
  @ApiOperation({ operationId: "CreateCustomerSavedItineraryV1" })
  public createItinerary(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SavedItineraryInput,
  ) {
    return this.records.createSavedItinerary(customerId(user), body);
  }

  @Put("saved-itineraries/:itineraryId")
  @ApiOperation({ operationId: "UpdateCustomerSavedItineraryV1" })
  public updateItinerary(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itineraryId") id: string,
    @Body() body: SavedItineraryInput & { concurrencyToken?: string },
  ) {
    return this.records.updateSavedItinerary(customerId(user), id, body);
  }

  @Delete("saved-itineraries/:itineraryId")
  @HttpCode(204)
  @ApiOperation({ operationId: "DeleteCustomerSavedItineraryV1" })
  public deleteItinerary(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itineraryId") id: string,
    @Query("concurrencyToken") token: string,
  ) {
    return this.records.delete("saved_itineraries", customerId(user), id, token, true);
  }
}

function customerId(user: AuthenticatedUser): string {
  if (!user.customerId)
    throw new DomainError(403, "The authenticated customer claim is missing.", "Forbidden");
  return user.customerId;
}
