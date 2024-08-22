import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { SubscriptionService } from '../subscription.service';
import { SubscriptionPlan } from '../../entities/subscription.entity';
import { DataLookup } from '../../entities/data-lookup.entity';
import { NotFoundException } from '@nestjs/common';

const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
};

const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
        },
    }),
};

describe('SubscriptionPlanService', () => {
    let service: SubscriptionService;
    let subscriptionPlanRepository: Repository<SubscriptionPlan>;
    let dataLookupRepository: Repository<DataLookup>;
    let dataSource: DataSource;
    let queryRunner: QueryRunner;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionService,
                { provide: getRepositoryToken(SubscriptionPlan), useValue: mockRepository },
                { provide: getRepositoryToken(DataLookup), useValue: mockRepository },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<SubscriptionService>(SubscriptionService);
        subscriptionPlanRepository = module.get<Repository<SubscriptionPlan>>(getRepositoryToken(SubscriptionPlan));
        dataLookupRepository = module.get<Repository<DataLookup>>(getRepositoryToken(DataLookup));
        dataSource = module.get<DataSource>(DataSource);
        queryRunner = dataSource.createQueryRunner();
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test to avoid state leaks
    });

    describe('create', () => {
        it('should create and return a subscription plan', async () => {
            const createSubscriptionPlanDto = {
                name: 'Basic Plan',
                price: 10,
                billingCycleDays: 30,
            };

            const objectState = { id: 'status-id', value: 'Active' } as DataLookup;
            const subscriptionPlan = { id: '1', ...createSubscriptionPlanDto, objectState } as SubscriptionPlan;

            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(objectState);
            jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(subscriptionPlan);
            mockRepository.create.mockReturnValue(subscriptionPlan);

            const result = await service.create(createSubscriptionPlanDto);

            expect(result).toEqual(subscriptionPlan);
            expect(queryRunner.manager.findOne).toHaveBeenCalledWith(DataLookup, { where: { id: 'status-id' } });
            expect(mockRepository.create).toHaveBeenCalledWith({
                name: createSubscriptionPlanDto.name,
                price: createSubscriptionPlanDto.price,
                billingCycleDays: createSubscriptionPlanDto.billingCycleDays,
                status,
            });
            expect(queryRunner.manager.save).toHaveBeenCalledWith(subscriptionPlan);
            expect(queryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException if status is not found', async () => {
            const createSubscriptionPlanDto = {
                name: 'Basic Plan',
                price: 10,
                billingCycleDays: 30,
                statusId: 'non-existing-status-id',
            };

            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(null);

            await expect(service.create(createSubscriptionPlanDto)).rejects.toThrowError(
                'Status with id non-existing-status-id not found',
            );

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        });

        it('should rollback transaction if an error occurs', async () => {
            const createSubscriptionPlanDto = {
                name: 'Basic Plan',
                price: 10,
                billingCycleDays: 30,
                statusId: 'status-id',
            };

            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue({ id: 'status-id' });
            jest.spyOn(queryRunner.manager, 'save').mockRejectedValue(new Error('Some error'));

            await expect(service.create(createSubscriptionPlanDto)).rejects.toThrowError('Some error');

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return an array of subscription plans', async () => {
            const subscriptionPlans = [
                { id: '1', name: 'Basic Plan' } as SubscriptionPlan,
                { id: '2', name: 'Premium Plan' } as SubscriptionPlan,
            ];

            mockRepository.find.mockResolvedValue(subscriptionPlans);

            const result = await service.findAll();
            expect(result).toEqual(subscriptionPlans);
            expect(mockRepository.find).toHaveBeenCalledWith({ relations: ['status'] });
        });
    });

    describe('findOne', () => {
        it('should return a subscription plan by ID', async () => {
            const subscriptionPlan = { id: '1', name: 'Basic Plan' } as SubscriptionPlan;

            mockRepository.findOne.mockResolvedValue(subscriptionPlan);

            const result = await service.findOne('1');
            expect(result).toEqual(subscriptionPlan);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['status'],
            });
        });

        it('should throw NotFoundException if subscription plan is not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existing-id')).rejects.toThrowError(
                'Subscription Plan with id non-existing-id not found',
            );
        });
    });

    describe('update', () => {
        it('should update and return the subscription plan', async () => {
            const updateSubscriptionPlanDto = {
                name: 'Updated Plan',
                price: 20,
                billingCycleDays: 60,
                statusId: 'new-status-id',
            };

            const status = { id: 'new-status-id', value: 'Active' } as DataLookup;
            const subscriptionPlan = { id: '1', name: 'Basic Plan', price: 10, billingCycleDays: 30, status: { id: 'old-status-id' } } as SubscriptionPlan;
            const updatedSubscriptionPlan = { ...subscriptionPlan, ...updateSubscriptionPlanDto, status };

            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(subscriptionPlan);
            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(status);
            jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(updatedSubscriptionPlan);

            const result = await service.update('1', updateSubscriptionPlanDto);

            expect(result).toEqual(updatedSubscriptionPlan);
            expect(queryRunner.manager.findOne).toHaveBeenCalledTimes(2); // Called twice: first for SubscriptionPlan, then for status
            expect(queryRunner.manager.save).toHaveBeenCalledWith(updatedSubscriptionPlan);
            expect(queryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException if subscription plan is not found', async () => {
            const updateSubscriptionPlanDto = { name: 'Updated Plan' };

            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(null);

            await expect(service.update('non-existing-id', updateSubscriptionPlanDto)).rejects.toThrowError(
                'Subscription Plan with id non-existing-id not found',
            );

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException if status is not found', async () => {
            const updateSubscriptionPlanDto = { name: 'Updated Plan', statusId: 'non-existing-status-id' };
            const subscriptionPlan = { id: '1', name: 'Basic Plan', status: { id: 'old-status-id' } } as SubscriptionPlan;

            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(subscriptionPlan);
            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(null);

            await expect(service.update('1', updateSubscriptionPlanDto)).rejects.toThrowError(
                'Status with id non-existing-status-id not found',
            );

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should remove the subscription plan', async () => {
            const subscriptionPlan = { id: '1', name: 'Basic Plan' } as SubscriptionPlan;

            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(subscriptionPlan);
            jest.spyOn(queryRunner.manager, 'remove').mockResolvedValue(undefined);

            await service.remove('1');

            expect(queryRunner.manager.findOne).toHaveBeenCalledWith(SubscriptionPlan, { where: { id: '1' } });
            expect(queryRunner.manager.remove).toHaveBeenCalledWith(subscriptionPlan);
            expect(queryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException if subscription plan is not found', async () => {
            jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(null);

            await expect(service.remove('non-existing-id')).rejects.toThrowError(
                'Subscription Plan with id non-existing-id not found',
            );

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });
});
