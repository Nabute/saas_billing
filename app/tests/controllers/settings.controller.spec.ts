import { Test, TestingModule } from '@nestjs/testing';
import { SystemSettingController } from '../../src/controllers/core.controller';
import { SystemSettingService } from '../../src/services/setting.service';
import { CreateSystemSettingDto, UpdateSystemSettingDto, ResetSystemSettingDto } from '../../src/dtos/settings.dto';
import { SystemSetting } from '../../src/entities/system-settings.entity';

describe('SystemSettingController', () => {
    let controller: SystemSettingController;
    let service: SystemSettingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SystemSettingController],
            providers: [
                {
                    provide: SystemSettingService,
                    useValue: {
                        create: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn(),
                        resetSetting: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<SystemSettingController>(SystemSettingController);
        service = module.get<SystemSettingService>(SystemSettingService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a new system setting', async () => {
            const createSystemSettingDto: CreateSystemSettingDto = { code: 'test', defaultValue: 'value' } as CreateSystemSettingDto;
            const systemSetting = { id: '1', ...createSystemSettingDto } as SystemSetting;

            jest.spyOn(service, 'create').mockResolvedValue(systemSetting);

            const result = await controller.create(createSystemSettingDto);
            expect(result).toEqual(systemSetting);
            expect(service.create).toHaveBeenCalledWith(createSystemSettingDto);
        });
    });

    describe('findAll', () => {
        it('should return an array of system settings', async () => {
            const systemSettings = [{ id: '1', code: 'test', defaultValue: 'value' }] as SystemSetting[];

            jest.spyOn(service, 'findAll').mockResolvedValue(systemSettings);

            const result = await controller.findAll();
            expect(result).toEqual(systemSettings);
            expect(service.findAll).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a single system setting by ID', async () => {
            const systemSetting = { id: '1', code: 'test', defaultValue: 'value' } as SystemSetting;

            jest.spyOn(service, 'findOne').mockResolvedValue(systemSetting);

            const result = await controller.findOne('1');
            expect(result).toEqual(systemSetting);
            expect(service.findOne).toHaveBeenCalledWith('1');
        });
    });

    describe('update', () => {
        it('should update a system setting by ID', async () => {
            const updateSystemSettingDto: UpdateSystemSettingDto = { currentValue: 'newValue' };
            const systemSetting = { id: '1', code: 'test', defaultValue: 'newValue' } as SystemSetting;

            jest.spyOn(service, 'update').mockResolvedValue(systemSetting);

            const result = await controller.update('1', updateSystemSettingDto);
            expect(result).toEqual(systemSetting);
            expect(service.update).toHaveBeenCalledWith('1', updateSystemSettingDto);
        });
    });

    describe('remove', () => {
        it('should delete a system setting by ID', async () => {
            jest.spyOn(service, 'remove').mockResolvedValue(undefined);

            const result = await controller.remove('1');
            expect(result).toBeUndefined();
            expect(service.remove).toHaveBeenCalledWith('1');
        });
    });

    describe('resetSetting', () => {
        it('should reset a system setting by code', async () => {
            const resetSystemSettingDto: ResetSystemSettingDto = { code: 'test' };
            const systemSetting = { id: '1', code: 'test', defaultValue: 'defaultValue' } as SystemSetting;

            jest.spyOn(service, 'resetSetting').mockResolvedValue(systemSetting);

            const result = await controller.resetSetting(resetSystemSettingDto);
            expect(result).toEqual(systemSetting);
            expect(service.resetSetting).toHaveBeenCalledWith('test');
        });
    });
});
