import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Matches, Max, Min } from "class-validator";

export class AvailabilityQueryRequest {
  @ApiProperty({ format: "date", example: "2026-12-10" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/u)
  public startDate!: string;

  @ApiProperty({ format: "date", example: "2026-12-11" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/u)
  public endDate!: string;

  @ApiPropertyOptional({ default: 1, maximum: 30, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  public adults?: number;

  @ApiPropertyOptional({ default: 0, maximum: 20, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  public children?: number;

  @ApiPropertyOptional({ default: 1, maximum: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  public rooms?: number;
}

export class AvailabilitySearchResponse {
  @ApiProperty({ format: "date" }) public startDate!: string;
  @ApiProperty({ format: "date" }) public endDate!: string;
  @ApiProperty() public adults!: number;
  @ApiProperty() public children!: number;
  @ApiProperty() public rooms!: number;
  @ApiProperty() public dayCount!: number;
  @ApiPropertyOptional() public participants?: number;
}

export class ExperienceSlotAvailabilityResponse {
  @ApiProperty({ format: "uuid" }) public id!: string;
  @ApiProperty({ format: "date-time" }) public startsAtUtc!: string;
  @ApiProperty({ format: "date-time", nullable: true, type: String })
  public endsAtUtc!: string | null;
  @ApiProperty() public remainingCapacity!: number;
  @ApiProperty() public minimumParticipants!: number;
  @ApiProperty({ nullable: true, type: Number }) public price!: number | null;
  @ApiProperty({ example: "USD" }) public currency!: string;
  @ApiProperty() public instantConfirmation!: boolean;
}

export class ExperienceAvailabilityResponse {
  @ApiProperty({ enum: ["experience"] }) public kind!: "experience";
  @ApiProperty({ format: "uuid" }) public productId!: string;
  @ApiProperty() public productSlug!: string;
  @ApiProperty({ enum: ["instant", "request"] }) public bookingMode!: string;
  @ApiProperty({ enum: ["person", "group"] }) public pricingUnit!: string;
  @ApiProperty({ example: "Asia/Colombo" }) public timeZone!: string;
  @ApiProperty({ type: AvailabilitySearchResponse }) public search!: AvailabilitySearchResponse;
  @ApiProperty({ type: [ExperienceSlotAvailabilityResponse] })
  public slots!: ExperienceSlotAvailabilityResponse[];
}

export class RoomTypeAvailabilityResponse {
  @ApiProperty({ format: "uuid" }) public id!: string;
  @ApiProperty() public name!: string;
  @ApiProperty() public slug!: string;
  @ApiProperty({ nullable: true, type: String }) public description!: string | null;
  @ApiProperty() public maximumAdults!: number;
  @ApiProperty() public maximumChildren!: number;
  @ApiProperty({ nullable: true, type: String }) public beds!: string | null;
  @ApiProperty() public bathrooms!: number;
  @ApiProperty({ isArray: true, type: String }) public amenities!: string[];
  @ApiProperty({ nullable: true, type: String }) public mealPlan!: string | null;
  @ApiProperty({ example: "USD" }) public currency!: string;
  @ApiProperty({ nullable: true, type: String }) public cancellationPolicy!: string | null;
  @ApiProperty() public availableUnits!: number;
  @ApiProperty() public totalPrice!: number;
  @ApiProperty() public minimumStayNights!: number;
}

export class StayAvailabilityResponse {
  @ApiProperty({ enum: ["stay"] }) public kind!: "stay";
  @ApiProperty({ format: "uuid" }) public productId!: string;
  @ApiProperty() public productSlug!: string;
  @ApiProperty({ enum: ["instant", "request"] }) public bookingMode!: string;
  @ApiProperty({ enum: ["night", "room"] }) public pricingUnit!: string;
  @ApiProperty({ example: "Asia/Colombo" }) public timeZone!: string;
  @ApiProperty({ type: AvailabilitySearchResponse }) public search!: AvailabilitySearchResponse;
  @ApiProperty({ type: [RoomTypeAvailabilityResponse] })
  public roomTypes!: RoomTypeAvailabilityResponse[];
}
