import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class BookingProfileWriteRequest {
  @ApiProperty() @IsIn(["instant", "request"]) public bookingMode!: string;
  @ApiProperty() @IsIn(["person", "group", "night", "room"]) public pricingUnit!: string;
  @ApiProperty() @IsString() @MaxLength(80) public timeZone!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) public meetingPoint?: string;
  @ApiProperty() @IsBoolean() public pickupAvailable!: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  public pickupInstructions?: string;
  @ApiProperty() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) public languages!: string[];
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(120) public minimumAge?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  public maximumGroupSize?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  public accessibilityInformation?: string;
  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  public inclusions!: string[];
  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  public exclusions!: string[];
  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  public whatToBring!: string[];
  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  public importantInformation!: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  public cancellationPolicy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) public weatherPolicy?: string;
  @ApiProperty() @IsBoolean() public instantConfirmation!: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() public concurrencyToken?: string;
}

export class ExperienceSlotWriteRequest {
  @ApiProperty() @IsDateString() public startsAtUtc!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() public endsAtUtc?: string;
  @ApiProperty() @IsInt() @Min(1) @Max(10000) public capacity!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(10000) public minimumParticipants!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) public priceOverride?: number;
  @ApiProperty() @Matches(/^[A-Za-z]{3}$/u) public currency!: string;
  @ApiProperty() @IsIn(["open", "closed"]) public status!: string;
  @ApiProperty() @IsInt() @Min(0) @Max(525600) public bookingCutoffMinutes!: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() public concurrencyToken?: string;
}

export class RoomTypeWriteRequest {
  @ApiProperty() @IsString() @MaxLength(160) public name!: string;
  @ApiProperty() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u) public slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) public description?: string;
  @ApiProperty() @IsInt() @Min(1) @Max(100) public maximumAdults!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(100) public maximumChildren!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(10000) public roomQuantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) public beds?: string;
  @ApiProperty() @IsInt() @Min(0) @Max(100) public bathrooms!: number;
  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  public amenities!: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) public mealPlan?: string;
  @ApiProperty() @IsNumber() @Min(0) public basePrice!: number;
  @ApiProperty() @Matches(/^[A-Za-z]{3}$/u) public currency!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  public cancellationPolicy?: string;
  @ApiProperty() @IsBoolean() public isActive!: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() public concurrencyToken?: string;
}

export class RoomInventoryWriteRequest {
  @ApiProperty() @IsDateString() public stayDate!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(10000) public capacity!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) public priceOverride?: number;
  @ApiProperty() @IsInt() @Min(1) @Max(365) public minimumStayNights!: number;
  @ApiProperty() @IsBoolean() public isClosed!: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() public concurrencyToken?: string;
}
