import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettingService } from '../../src/services/setting.service';
import { SystemSetting } from '../../src/entities/system-settings.entity';
import { CreateSystemSettingDto, UpdateSystemSettingDto } from '../../src/dtos/settings.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

jest.mock('../../src/services/base.service');

describe('SystemSettingService', () => {
    let service: SystemSettingService;
    let repositoryMock: jest.Mocked<Repository<SystemSetting>>;
    let dataSourceMock: jest.Mocked<DataSource>;

    beforeEach(async () => {
        repositoryMock = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
        } as unknown as jest.Mocked<Repository<SystemSetting>>;

        dataSourceMock = {
            getRepository: jest.fn().mockReturnValue(repositoryMock),
        } as unknown as jest.Mocked<DataSource>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SystemSettingService,
                {
                    provide: getRepositoryToken(SystemSetting),
                    useValue: repositoryMock,
                },
                {
                    provide: DataSource,
                    useValue: dataSourceMock,
                },
            ],
        }).compile();

        service = module.get<SystemSettingService>(SystemSettingService);
    });

    describe('create', () => {
        it('should create and save a new system setting with currentValue set to defaultValue', async () => {
            const createDto: CreateSystemSettingDto = { code: 'key1', defaultValue: 'default1', currentValue: '', name: 'Test' };
            const mockSetting = { id: '1', ...createDto, currentValue: 'default1' } as SystemSetting;

            repositoryMock.create.mockReturnValue(mockSetting);
            repositoryMock.save.mockResolvedValue(mockSetting);

            const result = await service.create(createDto);

            expect(repositoryMock.create).toHaveBeenCalledWith({ ...createDto, currentValue: 'default1' });
            expect(repositoryMock.save).toHaveBeenCalledWith(mockSetting);
            expect(result).toBe(mockSetting);
        });
    });

    describe('findAll', () => {
        it('should return an array of system settings', async () => {
            const mockSettings = [{ id: '1', code: 'key1', currentValue: 'value1' }] as SystemSetting[];
            repositoryMock.find.mockResolvedValue(mockSettings);

            const result = await service.findAll();

            expect(result).toBe(mockSettings);
            expect(repositoryMock.find).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a system setting if found', async () => {
            const mockSetting = { id: '1', code: 'key1', currentValue: 'value1' } as SystemSetting;
            repositoryMock.findOne.mockResolvedValue(mockSetting);

            const result = await service.findOne('1');

            expect(result).toBe(mockSetting);
            expect(repositoryMock.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
        });

        it('should throw NotFoundException if the system setting is not found', async () => {
            repositoryMock.findOne.mockResolvedValue(null);

            await expect(service.findOne('1')).rejects.toThrow(new NotFoundException(`SystemSetting with ID 1 not found`));
        });
    });

    describe('update', () => {
        it('should update and save the system setting', async () => {
            const mockSetting = { id: '1', code: 'key1', currentValue: 'value1' } as SystemSetting;
            const updateDto: UpdateSystemSettingDto = { currentValue: 'newValue' };

            repositoryMock.findOne.mockResolvedValue(mockSetting);
            repositoryMock.save.mockResolvedValue({ ...mockSetting, ...updateDto } as SystemSetting);

            const result = await service.update('1', updateDto);

            expect(result).toEqual({ ...mockSetting, ...updateDto });
            expect(repositoryMock.save).toHaveBeenCalledWith({ ...mockSetting, ...updateDto });
        });

        it('should throw NotFoundException if the system setting is not found', async () => {
            repositoryMock.findOne.mockResolvedValue(null);

            await expect(service.update('1', {} as UpdateSystemSettingDto)).rejects.toThrow(
                new NotFoundException(`SystemSetting with ID 1 not found`),
            );
        });
    });

    describe('remove', () => {
        it('should remove the system setting using destroy', async () => {
            const destroySpy = jest.spyOn(service, 'destroy').mockResolvedValue();

            await service.remove('1');

            expect(destroySpy).toHaveBeenCalledWith('1');
        });
    });

    describe('resetSetting', () => {
        it('should reset the currentValue to the defaultValue if they differ', async () => {
            const mockSetting = { id: '1', code: 'code1', currentValue: 'oldValue', defaultValue: 'defaultValue' } as SystemSetting;

            repositoryMock.findOne.mockResolvedValue(mockSetting);
            repositoryMock.save.mockResolvedValue({ ...mockSetting, currentValue: 'defaultValue' } as SystemSetting);

            const result = await service.resetSetting('code1');

            expect(result.currentValue).toBe('defaultValue');
            expect(repositoryMock.save).toHaveBeenCalledWith({ ...mockSetting, currentValue: 'defaultValue' });
        });

        it('should throw NotFoundException if the setting with the given code is not found', async () => {
            repositoryMock.findOne.mockResolvedValue(null);

            await expect(service.resetSetting('code1')).rejects.toThrow(
                new NotFoundException(`SystemSetting with code code1 not found`),
            );
        });

        it('should throw BadRequestException if currentValue is already the same as defaultValue', async () => {
            const mockSetting = { id: '1', code: 'code1', currentValue: 'defaultValue', defaultValue: 'defaultValue' } as SystemSetting;

            repositoryMock.findOne.mockResolvedValue(mockSetting);

            await expect(service.resetSetting('code1')).rejects.toThrow(
                new BadRequestException(`Current value is already the same as the default value`),
            );
        });
    });
});
