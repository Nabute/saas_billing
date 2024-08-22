import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SubscriptionService } from '../subscription.service';
import { Subscription } from '../../entities/subscription.entity';
import { CustomerSubscription } from '../../entities/customer.entity';
import { SubscriptionPlan } from '../../entities/subscription.entity';
import { DataLookup } from '../../entities/data-lookup.entity';
import { NotFoundException } from '@nestjs/common';
import { UpdateSubscriptionDto } from 'src/dtos/subscription.dto';

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
        },
    }),
};

describe('SubscriptionService', () => {
    let service: SubscriptionService;
    let subscriptionRepository: Repository<Subscription>;
    let customerRepository: Repository<CustomerSubscription>;
    let subscriptionPlanRepository: Repository<SubscriptionPlan>;
    let dataLookupRepository: Repository<DataLookup>;
    let dataSource: DataSource;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionService,
                { provide: getRepositoryToken(Subscription), useValue: mockRepository },
                { provide: getRepositoryToken(CustomerSubscription), useValue: mockRepository },
                { provide: getRepositoryToken(SubscriptionPlan), useValue: mockRepository },
                { provide: getRepositoryToken(DataLookup), useValue: mockRepository },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<SubscriptionService>(SubscriptionService);
        subscriptionRepository = module.get<Repository<Subscription>>(getRepositoryToken(Subscription));
        customerRepository = module.get<Repository<CustomerSubscription>>(getRepositoryToken(CustomerSubscription));
        subscriptionPlanRepository = module.get<Repository<SubscriptionPlan>>(getRepositoryToken(SubscriptionPlan));
        dataLookupRepository = module.get<Repository<DataLookup>>(getRepositoryToken(DataLookup));
        dataSource = module.get<DataSource>(DataSource);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new subscription', async () => {
            const createSubscriptionDto = {
                customerId: 'customer-id',
                planId: 'plan-id',
                startDate: new Date(),
                endDate: null,
                statusId: 'status-id',
            };

            const customer = { id: 'customer-id' } as CustomerSubscription;
            const plan = { id: 'plan-id' } as SubscriptionPlan;
            const status = { id: 'status-id' } as DataLookup;
            const subscription = { id: 'generated-id', ...createSubscriptionDto, customer, plan, status } as unknown as Subscription;

            const mockQueryRunner = mockDataSource.createQueryRunner();

            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce(customer);
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce(plan);
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce(status);
            mockRepository.create.mockReturnValue(subscription);
            mockQueryRunner.manager.save.mockResolvedValue(subscription);

            const result = await service.create(createSubscriptionDto);

            expect(result).toEqual(subscription);
            expect(mockQueryRunner.manager.findOne).toHaveBeenCalledTimes(3);
            expect(mockRepository.create).toHaveBeenCalledWith({
                customer,
                plan,
                startDate: createSubscriptionDto.startDate,
                endDate: createSubscriptionDto.endDate,
                status,
            });
            expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(subscription);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException if customer is not found', async () => {
            const createSubscriptionDto = {
                customerId: 'non-existing-customer-id',
                planId: 'plan-id',
                startDate: new Date(),
                endDate: null,
                statusId: 'status-id',
            };

            const mockQueryRunner = mockDataSource.createQueryRunner();
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce(null);

            await expect(service.create(createSubscriptionDto)).rejects.toThrowError('Customer with id non-existing-customer-id not found');
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException if plan is not found', async () => {
            const createSubscriptionDto = {
                customerId: 'customer-id',
                planId: 'non-existing-plan-id',
                startDate: new Date(),
                endDate: null,
                statusId: 'status-id',
            };

            const mockQueryRunner = mockDataSource.createQueryRunner();
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce({ id: 'customer-id' });
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce(null);

            await expect(service.create(createSubscriptionDto)).rejects.toThrowError('Subscription Plan with id non-existing-plan-id not found');
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });

        it('should throw NotFoundException if status is not found', async () => {
            const createSubscriptionDto = {
                customerId: 'customer-id',
                planId: 'plan-id',
                startDate: new Date(),
                endDate: null,
                statusId: 'non-existing-status-id',
            };

            const mockQueryRunner = mockDataSource.createQueryRunner();
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce({ id: 'customer-id' });
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce({ id: 'plan-id' });
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce(null);

            await expect(service.create(createSubscriptionDto)).rejects.toThrowError('Status with id non-existing-status-id not found');
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return an array of subscriptions', async () => {
            const subscriptions = [{ id: '1', startDate: new Date(), endDate: null } as Subscription];
            mockRepository.find.mockResolvedValue(subscriptions);

            const result = await service.findAll();
            expect(result).toEqual(subscriptions);
            expect(mockRepository.find).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a subscription by ID', async () => {
            const subscription = { id: '1', startDate: new Date(), endDate: null } as Subscription;
            mockRepository.findOne.mockResolvedValue(subscription);

            const result = await service.findOne('1');
            expect(result).toEqual(subscription);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['customer', 'plan', 'status'],
            });
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existing-id')).rejects.toThrowError('Subscription with id non-existing-id not found');
        });
    });

    describe('update', () => {
        it('should update and return the subscription', async () => {
            const updateSubscriptionDto = { endDate: new Date() } as UpdateSubscriptionDto;
            const subscription = { id: '1', startDate: new Date(), endDate: null } as Subscription;
            const updatedSubscription = { ...subscription, ...updateSubscriptionDto };

            const mockQueryRunner = mockDataSource.createQueryRunner();
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce(subscription);
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce({ id: 'customer-id' });
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce({ id: 'plan-id' });
            jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValueOnce({ id: 'status-id' });
            mockRepository.save.mockResolvedValue(updatedSubscription);

            const result = await service.update('1', updateSubscriptionDto);
            expect(result.endDate).not.toBeNull();
            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(mockRepository.save).toHaveBeenCalledWith(updatedSubscription);
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.update('1', {})).rejects.toThrowError('Subscription with id 1 not found');
        });
    });

    describe('remove', () => {
        it('should remove the subscription', async () => {
            const subscription = { id: '1', startDate: new Date(), endDate: null } as Subscription;
            mockRepository.findOne.mockResolvedValue(subscription);
            mockRepository.remove.mockResolvedValue(undefined);

            await service.remove('1');
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['customer', 'plan', 'status'],
            });
            expect(mockRepository.remove).toHaveBeenCalledWith(subscription);
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.remove('non-existing-id')).rejects.toThrowError('Subscription with id non-existing-id not found');
        });
    });
});
