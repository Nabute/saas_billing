import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { SystemSetting } from '../entities/system-settings.entity';
import {
  CreateSystemSettingDto,
  UpdateSystemSettingDto,
} from '../dtos/settings.dto';
import { GenericService } from './base.service';

@Injectable()
export class SystemSettingService extends GenericService<SystemSetting> {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
    protected readonly dataSource: DataSource,
  ) {
    super(SystemSetting, dataSource);
  }

  /**
   * Creates a new system setting with the default value.
   *
   * @param createSystemSettingDto - DTO containing the data for creating a new system setting.
   * @param manager - The EntityManager provided by the transaction.
   * @returns The newly created SystemSetting entity.
   */
  async create(
    createSystemSettingDto: CreateSystemSettingDto,
    manager: EntityManager, // Accept EntityManager as a parameter
  ): Promise<SystemSetting> {
    createSystemSettingDto.currentValue = createSystemSettingDto.defaultValue; // Enforce currentValue to match defaultValue
    const systemSetting = this.systemSettingRepository.create(
      createSystemSettingDto,
    );
    return await manager.save(SystemSetting, systemSetting);
  }

  /**
   * Retrieves all system settings.
   *
   * @param manager - The EntityManager provided by the transaction.
   * @returns An array of SystemSetting entities.
   */
  async findAll(manager: EntityManager): Promise<SystemSetting[]> {
    return await manager.find(SystemSetting);
  }

  /**
   * Retrieves a system setting by its ID.
   *
   * @param id - The ID of the system setting to retrieve.
   * @param manager - The EntityManager provided by the transaction.
   * @returns The found SystemSetting entity.
   * @throws NotFoundException if the system setting is not found.
   */
  async findOne(id: string, manager: EntityManager): Promise<SystemSetting> {
    const setting = await manager.findOne(SystemSetting, {
      where: { id },
    });
    if (!setting) {
      throw new NotFoundException(`SystemSetting with ID ${id} not found`);
    }
    return setting;
  }

  /**
   * Updates a system setting by its ID.
   *
   * @param id - The ID of the system setting to update.
   * @param updateSystemSettingDto - DTO containing the updated data for the system setting.
   * @param manager - The EntityManager provided by the transaction.
   * @returns The updated SystemSetting entity.
   * @throws NotFoundException if the system setting is not found.
   */
  async update(
    id: string,
    updateSystemSettingDto: UpdateSystemSettingDto,
    manager: EntityManager, // Accept EntityManager as a parameter
  ): Promise<SystemSetting> {
    const setting = await this.findOne(id, manager);
    Object.assign(setting, updateSystemSettingDto);
    return await manager.save(SystemSetting, setting);
  }

  /**
   * Removes a system setting by its ID.
   *
   * @param id - The ID of the system setting to remove.
   * @param manager - The EntityManager provided by the transaction.
   * @returns A promise that resolves when the system setting is removed.
   */
  async remove(id: string, manager: EntityManager): Promise<void> {
    await manager.delete(SystemSetting, id);
  }

  /**
   * Resets a system setting's current value to its default value based on its code.
   *
   * @param code - The code of the system setting to reset.
   * @param manager - The EntityManager provided by the transaction.
   * @returns The updated SystemSetting entity.
   * @throws NotFoundException if the system setting is not found.
   * @throws BadRequestException if the current value is already the same as the default value.
   */
  async resetSetting(
    code: string,
    manager: EntityManager,
  ): Promise<SystemSetting> {
    const setting = await manager.findOne(SystemSetting, {
      where: { code },
    });
    if (!setting) {
      throw new NotFoundException(`SystemSetting with code ${code} not found`);
    }

    if (setting.currentValue !== setting.defaultValue) {
      setting.currentValue = setting.defaultValue;
      return await manager.save(SystemSetting, setting);
    }

    throw new BadRequestException(
      `Current value is already the same as the default value`,
    );
  }
}
