import { IsString, IsNotEmpty, IsOptional, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSystemSettingDto {
    @ApiProperty({ description: 'Name of the setting', example: 'Site Title' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Unique code for the setting', example: 'SITE_TITLE' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: 'Default value of the setting', example: 'My Awesome Site' })
    @IsString()
    @IsNotEmpty()
    defaultValue: string;

    @ApiProperty({ description: 'Current value of the setting', example: 'My Awesome Site' })
    @IsString()
    @IsNotEmpty()
    currentValue: string;
}


export class UpdateSystemSettingDto {
    @ApiProperty({ description: 'Name of the setting', example: 'Site Title', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: 'Current value of the setting', example: 'My Updated Site Title', required: false })
    @IsString()
    @IsOptional()
    currentValue?: string;
}

export class ResetSystemSettingDto {
    @ApiProperty({ description: 'Unique code for the setting', example: 'SITE_TITLE' })
    @IsString()
    @IsNotEmpty()
    code: string;
}