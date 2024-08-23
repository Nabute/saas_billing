// src/dtos/create-user.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Name of the user' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unique email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Unique username for authentication' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Password for authentication', minLength: 8 })
  @MinLength(8)
  @IsString()
  password: string;

  @ApiProperty({ description: 'Phone number of the user', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Unique email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password for authentication', minLength: 8 })
  @MinLength(8)
  @IsString()
  password: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
