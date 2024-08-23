import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner, Repository, EntityManager } from 'typeorm';
import { GenericService } from '../../src/services/base.service';
import { BaseEntity } from '../../src/entities/base.entity';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { NotFoundException } from '@nestjs/common';
import { ObjectState } from '../../src/utils/enums';

class TestEntity extends BaseEntity {
    id!: string;
}

describe('GenericService', () => {
    let service: GenericService<TestEntity>;
    let dataSourceMock: jest.Mocked<DataSource>;
    let repositoryMock: jest.Mocked<Repository<TestEntity>>;
    let queryRunnerMock: jest.Mocked<QueryRunner>;
    let entityManagerMock: jest.Mocked<EntityManager>;

    beforeEach(async () => {
        repositoryMock = {
            save: jest.fn(),
        } as unknown as jest.Mocked<Repository<TestEntity>>;

        entityManagerMock = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<EntityManager>;

        queryRunnerMock = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: entityManagerMock, // Assign the mocked EntityManager
        } as unknown as jest.Mocked<QueryRunner>;

        dataSourceMock = {
            getRepository: jest.fn().mockReturnValue(repositoryMock), // Mocking getRepository here
            createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
        } as unknown as jest.Mocked<DataSource>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: DataSource,
                    useValue: dataSourceMock, // Ensure the mock is passed here
                },
                {
                    provide: GenericService,
                    useFactory: () => new GenericService(TestEntity, dataSourceMock),
                },
            ],
        }).compile();

        service = module.get<GenericService<TestEntity>>(GenericService);
    });

    describe('destroy', () => {
        it('should throw NotFoundException if entity is not found', async () => {
            entityManagerMock.findOne.mockResolvedValue(null);

            await expect(service.destroy('test-id')).rejects.toThrow(
                new NotFoundException('TestEntity with id test-id not found'),
            );

            expect(queryRunnerMock.connect).toHaveBeenCalled();
            expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
            expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
            expect(queryRunnerMock.release).toHaveBeenCalled();
        });

        it('should throw NotFoundException if deleted state is not found', async () => {
            entityManagerMock.findOne
                .mockResolvedValueOnce({} as TestEntity)
                .mockResolvedValueOnce(null);

            await expect(service.destroy('test-id')).rejects.toThrow(
                new NotFoundException('Deleted state not found in DataLookup'),
            );

            expect(queryRunnerMock.connect).toHaveBeenCalled();
            expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
            expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
            expect(queryRunnerMock.release).toHaveBeenCalled();
        });

        it('should set entity state to DELETED and save it', async () => {
            const entity = { id: 'test-id' } as TestEntity;
            const deletedState = { value: ObjectState.DELETED } as DataLookup;

            entityManagerMock.findOne
                .mockResolvedValueOnce(entity)
                .mockResolvedValueOnce(deletedState);

            await service.destroy('test-id');

            expect(entity.objectState).toBe(deletedState);
            expect(entityManagerMock.save).toHaveBeenCalledWith(entity);
            expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
            expect(queryRunnerMock.release).toHaveBeenCalled();
        });
    });

    describe('saveEntityWithDefaultState', () => {
        it('should throw NotFoundException if default state is not found', async () => {
            dataSourceMock.getRepository = jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue(null),
            } as unknown as jest.Mocked<Repository<DataLookup>>);

            const entity = new TestEntity();

            await expect(service.saveEntityWithDefaultState(entity, 'test-type')).rejects.toThrow(
                new NotFoundException('Unable to find default state for type test-type, please seed fixture data.'),
            );
        });

        it('should save entity with default state if it is a new entity', async () => {
            const defaultState = { type: 'test-type', is_default: true } as DataLookup;
            dataSourceMock.getRepository = jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue(defaultState),
            } as unknown as jest.Mocked<Repository<DataLookup>>);

            const entity = new TestEntity();

            await service.saveEntityWithDefaultState(entity, 'test-type');

            expect(entity.objectState).toBe(defaultState);
            expect(repositoryMock.save).toHaveBeenCalledWith(entity);
        });

        it('should save entity without changing state if it is not new', async () => {
            const entity = new TestEntity();
            entity.id = 'existing-id';

            await service.saveEntityWithDefaultState(entity, 'test-type');

            expect(repositoryMock.save).toHaveBeenCalledWith(entity);
        });
    });
});