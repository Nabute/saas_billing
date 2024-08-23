import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { SystemSetting } from "../entities/system-settings.entity";
import { CreateSystemSettingDto, UpdateSystemSettingDto } from "../dtos/settings.dto";
import { GenericService } from "./base.service";

@Injectable()
export class SystemSettingService extends GenericService<SystemSetting> {
    constructor(
        @InjectRepository(SystemSetting)
        private readonly systemSettingRepository: Repository<SystemSetting>,
        dataSource: DataSource,
    ) {
        super(SystemSetting, dataSource)
    }

    async create(createSystemSettingDto: CreateSystemSettingDto): Promise<SystemSetting> {
        // Ensure currentValue is not set by the user and defaults to defaultValue
        createSystemSettingDto.currentValue = createSystemSettingDto.defaultValue;
        const systemSetting = this.systemSettingRepository.create(createSystemSettingDto);
        return await this.systemSettingRepository.save(systemSetting);
    }

    async findAll(): Promise<SystemSetting[]> {
        return await this.systemSettingRepository.find();
    }

    async findOne(id: string): Promise<SystemSetting> {
        const setting = await this.systemSettingRepository.findOne({ where: { id } });
        if (!setting) {
            throw new NotFoundException(`SystemSetting with ID ${id} not found`);
        }
        return setting;
    }

    async update(id: string, updateSystemSettingDto: UpdateSystemSettingDto): Promise<SystemSetting> {
        const setting = await this.findOne(id);
        Object.assign(setting, updateSystemSettingDto);
        return await this.systemSettingRepository.save(setting);
    }

    async remove(id: string): Promise<void> {
        await this.destroy(id);
    }

    async resetSetting(code: string): Promise<SystemSetting> {
        const setting = await this.systemSettingRepository.findOne({ where: { code } });
        if (!setting) {
            throw new NotFoundException(`SystemSetting with code ${code} not found`);
        }
        if (setting.currentValue !== setting.defaultValue) {
            setting.currentValue = setting.defaultValue;
            return await this.systemSettingRepository.save(setting);
        }
        throw new BadRequestException(`Current value is already the same as the default value`);
    }
}
