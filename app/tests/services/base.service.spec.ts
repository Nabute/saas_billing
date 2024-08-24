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
    let entityManagerMock: jest.Mocked<EntityManager>;

    beforeEach(async () => {
        repositoryMock = {
            save: jest.fn(),
        } as unknown as jest.Mocked<Repository<TestEntity>>;

        entityManagerMock = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<EntityManager>;

        dataSourceMock = {
            getRepository: jest.fn().mockReturnValue(repositoryMock), // Mocking getRepository here
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

            await expect(service.destroy('test-id', entityManagerMock)).rejects.toThrow(
                new NotFoundException('TestEntity with id test-id not found'),
            );

            expect(entityManagerMock.findOne).toHaveBeenCalledWith(TestEntity, { where: { id: 'test-id' } });
        });

        it('should throw NotFoundException if deleted state is not found', async () => {
            entityManagerMock.findOne
                .mockResolvedValueOnce({} as TestEntity) // Entity found
                .mockResolvedValueOnce(null); // Deleted state not found

            await expect(service.destroy('test-id', entityManagerMock)).rejects.toThrow(
                new NotFoundException('Deleted state not found in DataLookup'),
            );

            expect(entityManagerMock.findOne).toHaveBeenCalledWith(TestEntity, { where: { id: 'test-id' } });
            expect(entityManagerMock.findOne).toHaveBeenCalledWith(DataLookup, {
                where: { value: ObjectState.DELETED },
            });
        });

        it('should set entity state to DELETED and save it', async () => {
            const entity = { id: 'test-id' } as TestEntity;
            const deletedState = { value: ObjectState.DELETED } as DataLookup;

            entityManagerMock.findOne
                .mockResolvedValueOnce(entity) // Entity found
                .mockResolvedValueOnce(deletedState); // Deleted state found

            await service.destroy('test-id', entityManagerMock);

            expect(entity.objectState).toBe(deletedState);
            expect(entityManagerMock.save).toHaveBeenCalledWith(entity);
        });
    });
});
