import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DataLookupService } from '../../src/services/data-lookup.service';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { CreateDataLookupDto } from 'src/dtos/core.dto';

describe('DataLookupService', () => {
    let service: DataLookupService;
    let repository: jest.Mocked<Repository<DataLookup>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DataLookupService,
                {
                    provide: getRepositoryToken(DataLookup),
                    useValue: {
                        count: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        find: jest.fn(),
                        findOneBy: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<DataLookupService>(DataLookupService);
        repository = module.get<jest.Mocked<Repository<DataLookup>>>(getRepositoryToken(DataLookup));
    });

    describe('existsByValue', () => {
        it('should return true if the value exists', async () => {
            repository.count.mockResolvedValue(1);

            const result = await service.existsByValue('some-value');

            expect(result).toBe(true);
            expect(repository.count).toHaveBeenCalledWith({ where: { value: 'some-value' } });
        });

        it('should return false if the value does not exist', async () => {
            repository.count.mockResolvedValue(0);

            const result = await service.existsByValue('some-value');

            expect(result).toBe(false);
            expect(repository.count).toHaveBeenCalledWith({ where: { value: 'some-value' } });
        });
    });

    describe('create', () => {
        it('should create and save a DataLookup entity', async () => {
            const createDto: CreateDataLookupDto = { value: 'some-value', type: 'some-type' };
            const mockEntity = { id: '1', ...createDto } as DataLookup;

            repository.create.mockReturnValue(mockEntity);
            repository.save.mockResolvedValue(mockEntity);

            const result = await service.create(createDto);

            expect(repository.create).toHaveBeenCalledWith(createDto);
            expect(repository.save).toHaveBeenCalledWith(mockEntity);
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

            repository.create.mockImplementation(dto => mockEntities.find(e => e.value === dto.value));
            repository.save.mockImplementation(entity => Promise.resolve(entity as DataLookup));

            const result = await service.createBulk(createDtos);

            expect(result).toEqual(mockEntities);
            expect(repository.create).toHaveBeenCalledTimes(createDtos.length);
            expect(repository.save).toHaveBeenCalledTimes(1);
        });
    });

    describe('findAll', () => {
        it('should return an array of DataLookup entities', async () => {
            const mockEntities = [{ id: '1', value: 'value1', type: 'type1' } as DataLookup];
            repository.find.mockResolvedValue(mockEntities);

            const result = await service.findAll();

            expect(result).toBe(mockEntities);
            expect(repository.find).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a DataLookup entity if found', async () => {
            const mockEntity = { id: '1', value: 'value1', type: 'type1' } as DataLookup;
            repository.findOneBy.mockResolvedValue(mockEntity);

            const result = await service.findOne('1');

            expect(result).toBe(mockEntity);
            expect(repository.findOneBy).toHaveBeenCalledWith({ id: '1' });
        });

        it('should throw NotFoundException if the entity is not found', async () => {
            repository.findOneBy.mockResolvedValue(null);

            await expect(service.findOne('1')).rejects.toThrow(
                new NotFoundException(`Data Lookup with ID 1 not found`),
            );
            expect(repository.findOneBy).toHaveBeenCalledWith({ id: '1' });
        });
    });
});
