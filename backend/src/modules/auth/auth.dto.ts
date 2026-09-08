import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, MaxLength, MinLength } from "class-validator";

export class RegisterRequest {
  @ApiProperty() @IsString() @Length(2, 100) public name!: string;
  @ApiProperty() @IsEmail() @MaxLength(320) public email!: string;
  @ApiProperty() @IsString() @Length(8, 128) public password!: string;
}

export class LoginRequest {
  @ApiProperty() @IsEmail() @MaxLength(320) public email!: string;
  @ApiProperty() @IsString() @Length(1, 128) public password!: string;
}

export class GoogleLoginRequest {
  @ApiProperty() @IsString() @MinLength(100) public idToken!: string;
}

export class RefreshRequest {
  @ApiProperty() @IsString() @MinLength(40) public refreshToken!: string;
}

export class LogoutRequest {
  @ApiProperty() @IsString() @MinLength(40) public refreshToken!: string;
}

export class ForgotPasswordRequest {
  @ApiProperty() @IsEmail() @MaxLength(320) public email!: string;
}

export class ResetPasswordRequest {
  @ApiProperty() @IsString() @MinLength(40) public token!: string;
  @ApiProperty() @IsString() @Length(8, 128) public password!: string;
}
