import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class AdministrationContentWriteRequest {
  @ApiProperty() @IsString() @MaxLength(240) public name!: string;
  @ApiProperty() @IsString() @MaxLength(200) public slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) public summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) public description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() public content?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2048) public heroImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) public assetKey?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) public altText?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() public width?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() public height?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() public heroMediaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(32) public publicationState?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(16) public status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() public productTypeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() public startingPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(3) public currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() public durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() public latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() public longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) public district?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) public province?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  public categoryIds?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  public collectionIds?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  public destinationIds?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  public tagIds?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  public mediaAssetIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsUUID() public concurrencyToken?: string;
}

export class AdministrationContactWriteRequest {
  @ApiProperty() @IsEmail() @MaxLength(320) public email!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) public phone?: string;
  @ApiProperty() @IsString() @MaxLength(120) public eyebrow!: string;
  @ApiProperty() @IsString() @MaxLength(240) public heading!: string;
  @ApiProperty() @IsString() @MaxLength(1000) public description!: string;
  @ApiProperty() @IsString() @MaxLength(1000) public promise!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() public concurrencyToken?: string;
}

export class AdministrationUserUpdateRequest {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() public isActive?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsIn(["customer", "agent", "staff", "administrator"], { each: true })
  public roles?: string[];
}
