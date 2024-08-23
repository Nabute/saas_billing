import { Controller, Post, Body, Get, Param, Patch, Delete } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CreateSystemSettingDto, ResetSystemSettingDto, UpdateSystemSettingDto } from "../dtos/settings.dto";
import { SystemSetting } from "../entities/system-settings.entity";
import { SystemSettingService } from "../services/setting.service";
import { CreateDataLookupDto } from "../dtos/core.dto";
import { DataLookupService } from "../services/data-lookup.service";
import { ConfigService } from "@nestjs/config";

const config = new ConfigService();

@ApiTags('Core')
@Controller({ path: 'core/settings', version: config.get('API_VERSION') })
export class SystemSettingController {
    constructor(private readonly systemSettingService: SystemSettingService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new system setting' })
    @ApiResponse({ status: 201, description: 'The setting has been successfully created.', type: SystemSetting })
    async create(@Body() createSystemSettingDto: CreateSystemSettingDto) {
        return await this.systemSettingService.create(createSystemSettingDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all system settings' })
    @ApiResponse({ status: 200, description: 'Array of settings retrieved.', type: [SystemSetting] })
    async findAll() {
        return await this.systemSettingService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Retrieve a single system setting by ID' })
    @ApiResponse({ status: 200, description: 'System setting retrieved.', type: SystemSetting })
    async findOne(@Param('id') id: string) {
        return await this.systemSettingService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a system setting by ID' })
    @ApiResponse({ status: 200, description: 'The setting has been successfully updated.', type: SystemSetting })
    async update(@Param('id') id: string, @Body() updateSystemSettingDto: UpdateSystemSettingDto) {
        return await this.systemSettingService.update(id, updateSystemSettingDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a system setting by ID' })
    @ApiResponse({ status: 200, description: 'The setting has been successfully deleted.' })
    async remove(@Param('id') id: string) {
        return await this.systemSettingService.remove(id);
    }

    @Patch('reset')
    @ApiOperation({ summary: 'Reset a system setting by code' })
    @ApiResponse({ status: 200, description: 'The setting has been reset to its default value.', type: SystemSetting })
    async resetSetting(@Body() resetSystemSettingDto: ResetSystemSettingDto) {
        return await this.systemSettingService.resetSetting(resetSystemSettingDto.code);
    }
}

@ApiTags('Core')
@Controller({ path: 'core/lookup-data', version: config.get('API_VERSION') })
export class DataLookupController {
    constructor(private readonly dataLookupService: DataLookupService) { }

    @Post()
    create(@Body() createDataLookupDto: CreateDataLookupDto) {
        return this.dataLookupService.create(createDataLookupDto);
    }

    @Post('bulk')
    createBulk(@Body() createDataLookupDtos: CreateDataLookupDto[]) {
        return this.dataLookupService.createBulk(createDataLookupDtos);
    }

    @Get()
    findAll() {
        return this.dataLookupService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.dataLookupService.findOne(id);
    }
}