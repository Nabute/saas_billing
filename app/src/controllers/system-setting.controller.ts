import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateSystemSettingDto,
  ResetSystemSettingDto,
  UpdateSystemSettingDto,
} from '../dtos/settings.dto';
import { SystemSetting } from '../entities/system-settings.entity';
import { SystemSettingService } from '../services/setting.service';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

/**
 * Controller for managing system settings.
 */
@ApiTags('Configurations')
@Controller({ path: 'core/settings', version: config.get('API_VERSION') })
export class SystemSettingController {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  /**
   * Creates a new system setting.
   *
   * @param createSystemSettingDto - DTO containing data to create a new system setting.
   * @param req - The HTTP request object, which contains the transaction manager.
   * @returns The newly created SystemSetting entity.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new system setting' })
  @ApiResponse({
    status: 201,
    description: 'The setting has been successfully created.',
    type: SystemSetting,
  })
  async create(
    @Body() createSystemSettingDto: CreateSystemSettingDto,
    @Req() req: any,
  ): Promise<SystemSetting> {
    const entityManager = req.transactionManager;
    return await this.systemSettingService.create(
      createSystemSettingDto,
      entityManager,
    );
  }

  /**
   * Retrieves all system settings.
   *
   * @param req - The HTTP request object, which contains the transaction manager.
   * @returns An array of SystemSetting entities.
   */
  @Get()
  @ApiOperation({ summary: 'Retrieve all system settings' })
  @ApiResponse({
    status: 200,
    description: 'Array of settings retrieved.',
    type: [SystemSetting],
  })
  async findAll(@Req() req: any): Promise<SystemSetting[]> {
    const entityManager = req.transactionManager;
    return await this.systemSettingService.findAll(entityManager);
  }

  /**
   * Retrieves a single system setting by ID.
   *
   * @param id - The ID of the system setting to retrieve.
   * @param req - The HTTP request object, which contains the transaction manager.
   * @returns The found SystemSetting entity.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single system setting by ID' })
  @ApiResponse({
    status: 200,
    description: 'System setting retrieved.',
    type: SystemSetting,
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<SystemSetting> {
    const entityManager = req.transactionManager;
    return await this.systemSettingService.findOne(id, entityManager);
  }

  /**
   * Updates a system setting by ID.
   *
   * @param id - The ID of the system setting to update.
   * @param updateSystemSettingDto - DTO containing the updated data for the system setting.
   * @param req - The HTTP request object, which contains the transaction manager.
   * @returns The updated SystemSetting entity.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a system setting by ID' })
  @ApiResponse({
    status: 200,
    description: 'The setting has been successfully updated.',
    type: SystemSetting,
  })
  async update(
    @Param('id') id: string,
    @Body() updateSystemSettingDto: UpdateSystemSettingDto,
    @Req() req: any,
  ): Promise<SystemSetting> {
    const entityManager = req.transactionManager;
    return await this.systemSettingService.update(
      id,
      updateSystemSettingDto,
      entityManager,
    );
  }

  /**
   * Deletes a system setting by ID.
   *
   * @param id - The ID of the system setting to delete.
   * @param req - The HTTP request object, which contains the transaction manager.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a system setting by ID' })
  @ApiResponse({
    status: 200,
    description: 'The setting has been successfully deleted.',
  })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const entityManager = req.transactionManager;
    await this.systemSettingService.remove(id, entityManager);
  }

  /**
   * Resets a system setting to its default value by code.
   *
   * @param resetSystemSettingDto - DTO containing the code of the system setting to reset.
   * @param req - The HTTP request object, which contains the transaction manager.
   * @returns The reset SystemSetting entity.
   */
  @Patch('reset')
  @ApiOperation({ summary: 'Reset a system setting by code' })
  @ApiResponse({
    status: 200,
    description: 'The setting has been reset to its default value.',
    type: SystemSetting,
  })
  async resetSetting(
    @Body() resetSystemSettingDto: ResetSystemSettingDto,
    @Req() req: any,
  ): Promise<SystemSetting> {
    const entityManager = req.transactionManager;
    return await this.systemSettingService.resetSetting(
      resetSystemSettingDto.code,
      entityManager,
    );
  }
}
