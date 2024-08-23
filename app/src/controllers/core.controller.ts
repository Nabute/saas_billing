import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateSystemSettingDto, ResetSystemSettingDto, UpdateSystemSettingDto } from '../dtos/settings.dto';
import { SystemSetting } from '../entities/system-settings.entity';
import { SystemSettingService } from '../services/setting.service';
import { CreateDataLookupDto } from '../dtos/core.dto';
import { DataLookupService } from '../services/data-lookup.service';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

/**
 * Controller for managing system settings.
 */
@ApiTags('Core')
@Controller({ path: 'core/settings', version: config.get('API_VERSION') })
export class SystemSettingController {
    constructor(private readonly systemSettingService: SystemSettingService) { }

    /**
     * Creates a new system setting.
     *
     * @param createSystemSettingDto - DTO containing data to create a new system setting.
     * @returns The newly created SystemSetting entity.
     */
    @Post()
    @ApiOperation({ summary: 'Create a new system setting' })
    @ApiResponse({ status: 201, description: 'The setting has been successfully created.', type: SystemSetting })
    async create(@Body() createSystemSettingDto: CreateSystemSettingDto): Promise<SystemSetting> {
        return await this.systemSettingService.create(createSystemSettingDto);
    }

    /**
     * Retrieves all system settings.
     *
     * @returns An array of SystemSetting entities.
     */
    @Get()
    @ApiOperation({ summary: 'Retrieve all system settings' })
    @ApiResponse({ status: 200, description: 'Array of settings retrieved.', type: [SystemSetting] })
    async findAll(): Promise<SystemSetting[]> {
        return await this.systemSettingService.findAll();
    }

    /**
     * Retrieves a single system setting by ID.
     *
     * @param id - The ID of the system setting to retrieve.
     * @returns The found SystemSetting entity.
     */
    @Get(':id')
    @ApiOperation({ summary: 'Retrieve a single system setting by ID' })
    @ApiResponse({ status: 200, description: 'System setting retrieved.', type: SystemSetting })
    async findOne(@Param('id') id: string): Promise<SystemSetting> {
        return await this.systemSettingService.findOne(id);
    }

    /**
     * Updates a system setting by ID.
     *
     * @param id - The ID of the system setting to update.
     * @param updateSystemSettingDto - DTO containing the updated data for the system setting.
     * @returns The updated SystemSetting entity.
     */
    @Patch(':id')
    @ApiOperation({ summary: 'Update a system setting by ID' })
    @ApiResponse({ status: 200, description: 'The setting has been successfully updated.', type: SystemSetting })
    async update(
        @Param('id') id: string,
        @Body() updateSystemSettingDto: UpdateSystemSettingDto,
    ): Promise<SystemSetting> {
        return await this.systemSettingService.update(id, updateSystemSettingDto);
    }

    /**
     * Deletes a system setting by ID.
     *
     * @param id - The ID of the system setting to delete.
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a system setting by ID' })
    @ApiResponse({ status: 200, description: 'The setting has been successfully deleted.' })
    async remove(@Param('id') id: string): Promise<void> {
        await this.systemSettingService.remove(id);
    }

    /**
     * Resets a system setting to its default value by code.
     *
     * @param resetSystemSettingDto - DTO containing the code of the system setting to reset.
     * @returns The reset SystemSetting entity.
     */
    @Patch('reset')
    @ApiOperation({ summary: 'Reset a system setting by code' })
    @ApiResponse({ status: 200, description: 'The setting has been reset to its default value.', type: SystemSetting })
    async resetSetting(@Body() resetSystemSettingDto: ResetSystemSettingDto): Promise<SystemSetting> {
        return await this.systemSettingService.resetSetting(resetSystemSettingDto.code);
    }
}

/**
 * Controller for managing lookup data.
 */
@ApiTags('Core')
@Controller({ path: 'core/lookup-data', version: config.get('API_VERSION') })
export class DataLookupController {
    constructor(private readonly dataLookupService: DataLookupService) { }

    /**
     * Creates a new data lookup entry.
     *
     * @param createDataLookupDto - DTO containing the data to create a new data lookup entry.
     * @returns The newly created DataLookup entity.
     */
    @Post()
    @ApiOperation({ summary: 'Create a new data lookup entry' })
    async create(@Body() createDataLookupDto: CreateDataLookupDto) {
        return this.dataLookupService.create(createDataLookupDto);
    }

    /**
     * Creates multiple data lookup entries in bulk.
     *
     * @param createDataLookupDtos - Array of DTOs containing the data to create multiple data lookup entries.
     * @returns An array of created DataLookup entities.
     */
    @Post('bulk')
    @ApiOperation({ summary: 'Create multiple data lookup entries in bulk' })
    async createBulk(@Body() createDataLookupDtos: CreateDataLookupDto[]) {
        return this.dataLookupService.createBulk(createDataLookupDtos);
    }

    /**
     * Retrieves all data lookup entries.
     *
     * @returns An array of DataLookup entities.
     */
    @Get()
    @ApiOperation({ summary: 'Retrieve all data lookup entries' })
    async findAll() {
        return this.dataLookupService.findAll();
    }

    /**
     * Retrieves a single data lookup entry by ID.
     *
     * @param id - The ID of the data lookup entry to retrieve.
     * @returns The found DataLookup entity.
     */
    @Get(':id')
    @ApiOperation({ summary: 'Retrieve a single data lookup entry by ID' })
    async findOne(@Param('id') id: string) {
        return this.dataLookupService.findOne(id);
    }
}
