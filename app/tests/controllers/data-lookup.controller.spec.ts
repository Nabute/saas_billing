import { Test, TestingModule } from '@nestjs/testing';
import { DataLookupController } from '../../src/controllers/data-lookup.controller';
import { DataLookupService } from '../../src/services/data-lookup.service';
import { CreateDataLookupDto } from '../../src/dtos/core.dto';
import { DataLookup } from '../../src/entities/data-lookup.entity';  // Adjust the import path as needed
import { EntityManager } from 'typeorm';

describe('DataLookupController', () => {
    let controller: DataLookupController;
    let service: DataLookupService;
    let entityManager: jest.Mocked<EntityManager>;

    beforeEach(async () => {
        entityManager = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<EntityManager>;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [DataLookupController],
            providers: [
                {
                    provide: DataLookupService,
                    useValue: {
                        create: jest.fn(),
                        createBulk: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: EntityManager,
                    useValue: entityManager,
                },
            ],
        }).compile();

        controller = module.get<DataLookupController>(DataLookupController);
        service = module.get<DataLookupService>(DataLookupService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a data lookup entry', async () => {
            const createDataLookupDto: CreateDataLookupDto = { type: 'test', value: 'value' };
            const dataLookup = { id: '1', ...createDataLookupDto } as DataLookup;

            jest.spyOn(service, 'create').mockResolvedValue(dataLookup);

            const result = await controller.create(createDataLookupDto, { transactionManager: entityManager });
            expect(result).toEqual(dataLookup);
            expect(service.create).toHaveBeenCalledWith(createDataLookupDto, entityManager);
        });
    });

    describe('createBulk', () => {
        it('should create multiple data lookup entries', async () => {
            const createDataLookupDtos: CreateDataLookupDto[] = [
                { type: 'test1', value: 'value1' },
                { type: 'test2', value: 'value2' },
            ];
            const dataLookups = [
                { id: '1', type: 'test1', value: 'value1' },
                { id: '2', type: 'test2', value: 'value2' },
            ] as Array<DataLookup>;

            jest.spyOn(service, 'createBulk').mockResolvedValue(dataLookups);

            const result = await controller.createBulk(createDataLookupDtos, { transactionManager: entityManager });
            expect(result).toEqual(dataLookups);
            expect(service.createBulk).toHaveBeenCalledWith(createDataLookupDtos, entityManager);
        });
    });

    describe('findAll', () => {
        it('should return an array of data lookup entries', async () => {
            const dataLookups = [{ id: '1', type: 'test', value: 'value' }] as Array<DataLookup>;

            jest.spyOn(service, 'findAll').mockResolvedValue(dataLookups);

            const result = await controller.findAll(entityManager);
            expect(result).toEqual(dataLookups);
            expect(service.findAll).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a single data lookup entry by ID', async () => {
            const dataLookup = { id: '1', type: 'test', value: 'value' } as DataLookup;

            jest.spyOn(service, 'findOne').mockResolvedValue(dataLookup);

            const result = await controller.findOne('1', { transactionManager: entityManager });
            expect(result).toEqual(dataLookup);
            expect(service.findOne).toHaveBeenCalledWith('1', entityManager);
        });
    });
});
