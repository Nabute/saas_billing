import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    dataSource: DataSource,
  ) {
    super(SystemSetting, dataSource);
  }

  /**
   * Creates a new system setting with the default value.
   *
   * @param createSystemSettingDto - DTO containing the data for creating a new system setting.
   * @returns The newly created SystemSetting entity.
   */
  async create(
    createSystemSettingDto: CreateSystemSettingDto,
  ): Promise<SystemSetting> {
    createSystemSettingDto.currentValue = createSystemSettingDto.defaultValue; // Enforce currentValue to match defaultValue
    const systemSetting = this.systemSettingRepository.create(
      createSystemSettingDto,
    );
    return await this.systemSettingRepository.save(systemSetting);
  }

  /**
   * Retrieves all system settings.
   *
   * @returns An array of SystemSetting entities.
   */
  async findAll(): Promise<SystemSetting[]> {
    return await this.systemSettingRepository.find();
  }

  /**
   * Retrieves a system setting by its ID.
   *
   * @param id - The ID of the system setting to retrieve.
   * @returns The found SystemSetting entity.
   * @throws NotFoundException if the system setting is not found.
   */
  async findOne(id: string): Promise<SystemSetting> {
    const setting = await this.systemSettingRepository.findOne({
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
   * @returns The updated SystemSetting entity.
   * @throws NotFoundException if the system setting is not found.
   */
  async update(
    id: string,
    updateSystemSettingDto: UpdateSystemSettingDto,
  ): Promise<SystemSetting> {
    const setting = await this.findOne(id);
    Object.assign(setting, updateSystemSettingDto);
    return await this.systemSettingRepository.save(setting);
  }

  /**
   * Removes a system setting by its ID.
   *
   * @param id - The ID of the system setting to remove.
   * @returns A promise that resolves when the system setting is removed.
   */
  async remove(id: string): Promise<void> {
    await this.destroy(id);
  }

  /**
   * Resets a system setting's current value to its default value based on its code.
   *
   * @param code - The code of the system setting to reset.
   * @returns The updated SystemSetting entity.
   * @throws NotFoundException if the system setting is not found.
   * @throws BadRequestException if the current value is already the same as the default value.
   */
  async resetSetting(code: string): Promise<SystemSetting> {
    const setting = await this.systemSettingRepository.findOne({
      where: { code },
    });
    if (!setting) {
      throw new NotFoundException(`SystemSetting with code ${code} not found`);
    }

    if (setting.currentValue !== setting.defaultValue) {
      setting.currentValue = setting.defaultValue;
      return await this.systemSettingRepository.save(setting);
    }

    throw new BadRequestException(
      `Current value is already the same as the default value`,
    );
  }
}
