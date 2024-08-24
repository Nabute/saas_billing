import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { DataLookupService } from '../../src/services/data-lookup.service';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { CreateDataLookupDto } from '../../src/dtos/core.dto';

describe('DataLookupService', () => {
    let service: DataLookupService;
    let repository: jest.Mocked<Repository<DataLookup>>;
    let entityManager: jest.Mocked<EntityManager>;

    beforeEach(async () => {
        repository = {
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
        } as unknown as jest.Mocked<Repository<DataLookup>>;

        entityManager = {
            count: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<EntityManager>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DataLookupService,
                {
                    provide: getRepositoryToken(DataLookup),
                    useValue: repository,
                },
                {
                    provide: EntityManager,
                    useValue: entityManager,
                },
            ],
        }).compile();

        service = module.get<DataLookupService>(DataLookupService);
    });

    describe('existsByValue', () => {
        it('should return true if the value exists', async () => {
            entityManager.count.mockResolvedValue(1);

            const result = await service.existsByValue('some-value', entityManager);

            expect(result).toBe(true);
            expect(entityManager.count).toHaveBeenCalledWith(DataLookup, { where: { value: 'some-value' } });
        });

        it('should return false if the value does not exist', async () => {
            entityManager.count.mockResolvedValue(0);

            const result = await service.existsByValue('some-value', entityManager);

            expect(result).toBe(false);
            expect(entityManager.count).toHaveBeenCalledWith(DataLookup, { where: { value: 'some-value' } });
        });
    });


    describe('create', () => {
        it('should create and save a DataLookup entity', async () => {
            const createDto: CreateDataLookupDto = { value: 'some-value', type: 'some-type' };
            const mockEntity = { id: '1', ...createDto } as DataLookup;

            entityManager.create.mockReturnValue(mockEntity as any);
            entityManager.save.mockResolvedValue(mockEntity);

            const result = await service.create(createDto, entityManager);

            expect(entityManager.create).toHaveBeenCalledWith(DataLookup, createDto);
            expect(entityManager.save).toHaveBeenCalledWith(DataLookup, mockEntity);
            expect(result).toBe(mockEntity);
        });
    });

    describe('createBulk', () => {
        it('should create and save multiple DataLookup entities', async () => {
            const createDtos: CreateDataLookupDto[] = [
                { value: 'value1', type: 'type1' },
                { value: 'value2', type: 'type2' },
            ];
            const mockEntities = createDtos.map((dto, index) => ({ id: String(index + 1), ...dto } as DataLookup));

            createDtos.forEach((dto, index) => {
                entityManager.create.mockReturnValueOnce(mockEntities[index] as any);
            });

            entityManager.save.mockResolvedValue(mockEntities);

            const result = await service.createBulk(createDtos, entityManager);

            expect(result).toEqual(mockEntities);
            expect(entityManager.create).toHaveBeenCalledTimes(createDtos.length);
            createDtos.forEach(dto => {
                expect(entityManager.create).toHaveBeenCalledWith(DataLookup, dto);
            });
            expect(entityManager.save).toHaveBeenCalledWith(DataLookup, mockEntities);
        });
    });

    describe('findAll', () => {
        it('should return an array of DataLookup entities', async () => {
            const mockEntities = [{ id: '1', value: 'value1', type: 'type1' } as DataLookup];
            entityManager.find.mockResolvedValue(mockEntities);

            const result = await service.findAll(entityManager);

            expect(result).toBe(mockEntities);
            expect(entityManager.find).toHaveBeenCalledWith(DataLookup);
        });
    });

    describe('findOne', () => {
        it('should return a DataLookup entity if found', async () => {
            const mockEntity = { id: '1', value: 'value1', type: 'type1' } as DataLookup;
            entityManager.findOneBy.mockResolvedValue(mockEntity);

            const result = await service.findOne('1', entityManager);

            expect(result).toBe(mockEntity);
            expect(entityManager.findOneBy).toHaveBeenCalledWith(DataLookup, { id: '1' });
        });

        it('should throw NotFoundException if the entity is not found', async () => {
            entityManager.findOneBy.mockResolvedValue(null);

            await expect(service.findOne('1', entityManager)).rejects.toThrow(
                new NotFoundException(`Data Lookup with ID 1 not found`),
            );
            expect(entityManager.findOneBy).toHaveBeenCalledWith(DataLookup, { id: '1' });
        });
    });
});
