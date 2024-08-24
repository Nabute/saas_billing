import { Test, TestingModule } from '@nestjs/testing';
import { CustomerSubscriptionService } from '../../src/services/subscription.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { CustomerSubscription } from '../../src/entities/customer.entity';
import { User } from '../../src/entities/user.entity';
import { SubscriptionPlan } from '../../src/entities/subscription.entity';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateSubscriptionDto, UpdateSubscriptionStatusDto } from '../../src/dtos/subscription.dto';

jest.mock('../../src/services/base.service');

describe('CustomerSubscriptionService', () => {
    let service: CustomerSubscriptionService;
    let customerSubscriptionRepository: jest.Mocked<Repository<CustomerSubscription>>;
    let userRepository: jest.Mocked<Repository<User>>;
    let subscriptionPlanRepository: jest.Mocked<Repository<SubscriptionPlan>>;
    let dataLookupRepository: jest.Mocked<Repository<DataLookup>>;
    let entityManager: jest.Mocked<EntityManager>;
    let dataSourceMock: jest.Mocked<DataSource>;

    beforeEach(async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-08-24T23:05:09.009Z'));
        customerSubscriptionRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
        } as unknown as jest.Mocked<Repository<CustomerSubscription>>;

        userRepository = {
            findOneBy: jest.fn(),
        } as unknown as jest.Mocked<Repository<User>>;

        subscriptionPlanRepository = {
            findOneBy: jest.fn(),
        } as unknown as jest.Mocked<Repository<SubscriptionPlan>>;

        dataLookupRepository = {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
        } as unknown as jest.Mocked<Repository<DataLookup>>;

        entityManager = {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
        } as unknown as jest.Mocked<EntityManager>;

        dataSourceMock = {
            createEntityManager: jest.fn().mockReturnValue(entityManager),
        } as unknown as jest.Mocked<DataSource>;
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CustomerSubscriptionService,
                {
                    provide: getRepositoryToken(CustomerSubscription),
                    useValue: customerSubscriptionRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: userRepository,
                },
                {
                    provide: getRepositoryToken(SubscriptionPlan),
                    useValue: subscriptionPlanRepository,
                },
                {
                    provide: getRepositoryToken(DataLookup),
                    useValue: dataLookupRepository,
                },
                {
                    provide: DataSource,
                    useValue: dataSourceMock,
                },
            ],
        }).compile();

        service = module.get<CustomerSubscriptionService>(CustomerSubscriptionService);
        customerSubscriptionRepository = module.get(getRepositoryToken(CustomerSubscription));
        userRepository = module.get(getRepositoryToken(User));
        subscriptionPlanRepository = module.get(getRepositoryToken(SubscriptionPlan));
        dataLookupRepository = module.get(getRepositoryToken(DataLookup));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('createCustomerSubscription', () => {
        it('should create a new customer subscription', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = {
                userId: 'user_1',
                subscriptionPlanId: 'plan_1',
            };

            const mockUser = { id: 'user_1' } as User;
            const mockPlan = { id: 'plan_1', billingCycleDays: 30 } as SubscriptionPlan;
            const mockStatus = { id: 'status_1' } as DataLookup;
            const mockSubscription = { id: 'sub_1' } as CustomerSubscription;

            entityManager.findOne.mockResolvedValueOnce(mockUser); // First call for User
            entityManager.findOne.mockResolvedValueOnce(mockPlan); // Second call for SubscriptionPlan
            entityManager.findOne.mockResolvedValueOnce(mockStatus); // Third call for DataLookup
            customerSubscriptionRepository.create.mockReturnValue(mockSubscription);
            entityManager.save.mockResolvedValue(mockSubscription);

            const result = await service.createCustomerSubscription(createSubscriptionDto, entityManager);

            expect(result).toEqual(mockSubscription);
            expect(customerSubscriptionRepository.create).toHaveBeenCalledWith({
                user: mockUser,
                subscriptionPlan: mockPlan,
                subscriptionStatus: mockStatus,
                startDate: new Date('2024-08-24T23:05:09.009Z'),
                nextBillingDate: new Date('2024-09-23T23:05:09.009Z'),
            });
            expect(entityManager.save).toHaveBeenCalledWith(CustomerSubscription, mockSubscription);
        });

        it('should throw NotFoundException if user is not found', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = {
                userId: 'user_1',
                subscriptionPlanId: 'plan_1',
            };

            entityManager.findOne.mockResolvedValueOnce(null); // User not found

            await expect(service.createCustomerSubscription(createSubscriptionDto, entityManager)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if subscription plan is not found', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = {
                userId: 'user_1',
                subscriptionPlanId: 'plan_1',
            };

            const mockUser = { id: 'user_1' } as User;
            entityManager.findOne.mockResolvedValueOnce(mockUser); // User found
            entityManager.findOne.mockResolvedValueOnce(null); // SubscriptionPlan not found

            await expect(service.createCustomerSubscription(createSubscriptionDto, entityManager)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if subscription status is not found', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = {
                userId: 'user_1',
                subscriptionPlanId: 'plan_1',
            };

            const mockUser = { id: 'user_1' } as User;
            const mockPlan = { id: 'plan_1', billingCycleDays: 30 } as SubscriptionPlan;
            entityManager.findOne.mockResolvedValueOnce(mockUser); // User found
            entityManager.findOne.mockResolvedValueOnce(mockPlan); // SubscriptionPlan found
            entityManager.findOne.mockResolvedValueOnce(null); // DataLookup not found

            await expect(service.createCustomerSubscription(createSubscriptionDto, entityManager)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getCustomerSubscriptions', () => {
        it('should return customer subscriptions', async () => {
            const userId = 'user_1';
            const mockUser = { id: 'user_1' } as User;
            const mockSubscriptions = [{ id: 'sub_1' }] as CustomerSubscription[];

            entityManager.findOne.mockResolvedValueOnce(mockUser); // User found
            entityManager.find.mockResolvedValueOnce(mockSubscriptions); // Subscriptions found

            const result = await service.getCustomerSubscriptions(userId, entityManager);

            expect(result).toEqual(mockSubscriptions);
            expect(entityManager.find).toHaveBeenCalledWith(CustomerSubscription, {
                where: { user: mockUser },
                relations: ['subscriptionPlan', 'subscriptionStatus'],
            });
        });

        it('should throw NotFoundException if user is not found', async () => {
            const userId = 'user_1';

            entityManager.findOne.mockResolvedValueOnce(null); // User not found

            await expect(service.getCustomerSubscriptions(userId, entityManager)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateSubscriptionStatus', () => {
        it('should update subscription status', async () => {
            const subscriptionId = 'sub_1';
            const updateSubscriptionStatusDto: UpdateSubscriptionStatusDto = {
                subscriptionStatusId: 'status_1',
                endDate: new Date(),
            };

            const mockSubscription = { id: 'sub_1', subscriptionStatus: {} } as CustomerSubscription;
            const mockStatus = { id: 'status_1' } as DataLookup;

            entityManager.findOne.mockResolvedValueOnce(mockSubscription); // Subscription found
            entityManager.findOne.mockResolvedValueOnce(mockStatus); // SubscriptionStatus found
            entityManager.save.mockResolvedValueOnce(mockSubscription); // Save the updated subscription

            const result = await service.updateSubscriptionStatus(subscriptionId, updateSubscriptionStatusDto, entityManager);

            expect(result).toEqual(mockSubscription);
            expect(entityManager.findOne).toHaveBeenCalledWith(CustomerSubscription, {
                where: { id: subscriptionId },
                relations: ['subscriptionStatus'],
            });
            expect(entityManager.findOne).toHaveBeenCalledWith(DataLookup, { where: { id: updateSubscriptionStatusDto.subscriptionStatusId } });
            expect(entityManager.save).toHaveBeenCalledWith(CustomerSubscription, mockSubscription);
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            const subscriptionId = 'sub_1';
            const updateSubscriptionStatusDto: UpdateSubscriptionStatusDto = {
                subscriptionStatusId: 'status_1',
                endDate: new Date(),
            };

            entityManager.findOne.mockResolvedValueOnce(null); // Subscription not found

            await expect(service.updateSubscriptionStatus(subscriptionId, updateSubscriptionStatusDto, entityManager)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if subscription status is not found', async () => {
            const subscriptionId = 'sub_1';
            const updateSubscriptionStatusDto: UpdateSubscriptionStatusDto = {
                subscriptionStatusId: 'status_1',
                endDate: new Date(),
            };

            const mockSubscription = { id: 'sub_1', subscriptionStatus: {} } as CustomerSubscription;

            entityManager.findOne.mockResolvedValueOnce(mockSubscription); // Subscription found
            entityManager.findOne.mockResolvedValueOnce(null); // SubscriptionStatus not found

            await expect(service.updateSubscriptionStatus(subscriptionId, updateSubscriptionStatusDto, entityManager)).rejects.toThrow(NotFoundException);
        });
    });
});
