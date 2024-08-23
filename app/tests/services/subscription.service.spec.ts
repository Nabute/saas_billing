import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from '../../src/services/subscription.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerSubscription } from '../../src/entities/customer.entity';
import { User } from '../../src/entities/user.entity';
import { SubscriptionPlan } from '../../src/entities/subscription.entity';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateSubscriptionDto, CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto, UpdateSubscriptionStatusDto } from '../../src/dtos/subscription.dto';

jest.mock('../../src/services/base.service');

describe('SubscriptionService', () => {
    let service: SubscriptionService;
    let customerSubscriptionRepository: jest.Mocked<Repository<CustomerSubscription>>;
    let userRepository: jest.Mocked<Repository<User>>;
    let subscriptionPlanRepository: jest.Mocked<Repository<SubscriptionPlan>>;
    let dataLookupRepository: jest.Mocked<Repository<DataLookup>>;
    let dataSource: DataSource;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionService,
                {
                    provide: getRepositoryToken(CustomerSubscription),
                    useValue: {
                        findOne: jest.fn(),
                        findOneBy: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        find: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOneBy: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(SubscriptionPlan),
                    useValue: {
                        findOne: jest.fn(),
                        findOneBy: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        find: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(DataLookup),
                    useValue: {
                        findOneBy: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<SubscriptionService>(SubscriptionService);
        customerSubscriptionRepository = module.get(getRepositoryToken(CustomerSubscription));
        userRepository = module.get(getRepositoryToken(User));
        subscriptionPlanRepository = module.get(getRepositoryToken(SubscriptionPlan));
        dataLookupRepository = module.get(getRepositoryToken(DataLookup));
        dataSource = module.get(DataSource);
    });

    describe('createCustomerSubscription', () => {
        it('should create a new customer subscription', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = {
                userId: 'user_1',
                subscriptionPlanId: 'plan_1',
                subscriptionStatusId: 'status_1',
                startDate: new Date(),
            };

            const mockUser = { id: 'user_1' } as User;
            const mockPlan = { id: 'plan_1', billingCycleDays: 30 } as SubscriptionPlan;
            const mockStatus = { id: 'status_1' } as DataLookup;
            const mockSubscription = { id: 'sub_1' } as CustomerSubscription;

            userRepository.findOneBy.mockResolvedValue(mockUser);
            subscriptionPlanRepository.findOneBy.mockResolvedValue(mockPlan);
            dataLookupRepository.findOneBy.mockResolvedValue(mockStatus);
            customerSubscriptionRepository.create.mockReturnValue(mockSubscription);
            customerSubscriptionRepository.save.mockResolvedValue(mockSubscription);

            const result = await service.createCustomerSubscription(createSubscriptionDto);

            expect(result).toEqual(mockSubscription);
            expect(customerSubscriptionRepository.create).toHaveBeenCalledWith({
                user: mockUser,
                subscriptionPlan: mockPlan,
                subscriptionStatus: mockStatus,
                startDate: createSubscriptionDto.startDate,
                endDate: null,
                nextBillingDate: expect.any(Date),
            });
            expect(customerSubscriptionRepository.save).toHaveBeenCalledWith(mockSubscription);
        });

        it('should throw NotFoundException if user is not found', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = {
                userId: 'user_1',
                subscriptionPlanId: 'plan_1',
                subscriptionStatusId: 'status_1',
                startDate: new Date(),
            };

            userRepository.findOneBy.mockResolvedValue(null);

            await expect(service.createCustomerSubscription(createSubscriptionDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if subscription plan is not found', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = {
                userId: 'user_1',
                subscriptionPlanId: 'plan_1',
                subscriptionStatusId: 'status_1',
                startDate: new Date(),
            };

            const mockUser = { id: 'user_1' } as User;
            userRepository.findOneBy.mockResolvedValue(mockUser);
            subscriptionPlanRepository.findOneBy.mockResolvedValue(null);

            await expect(service.createCustomerSubscription(createSubscriptionDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if subscription status is not found', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = {
                userId: 'user_1',
                subscriptionPlanId: 'plan_1',
                subscriptionStatusId: 'status_1',
                startDate: new Date(),
            };

            const mockUser = { id: 'user_1' } as User;
            const mockPlan = { id: 'plan_1', billingCycleDays: 30 } as SubscriptionPlan;
            userRepository.findOneBy.mockResolvedValue(mockUser);
            subscriptionPlanRepository.findOneBy.mockResolvedValue(mockPlan);
            dataLookupRepository.findOneBy.mockResolvedValue(null);

            await expect(service.createCustomerSubscription(createSubscriptionDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getCustomerSubscriptions', () => {
        it('should return customer subscriptions', async () => {
            const userId = 'user_1';
            const mockUser = { id: 'user_1' } as User;
            const mockSubscriptions = [{ id: 'sub_1' }] as CustomerSubscription[];

            userRepository.findOneBy.mockResolvedValue(mockUser);
            customerSubscriptionRepository.find.mockResolvedValue(mockSubscriptions);

            const result = await service.getCustomerSubscriptions(userId);

            expect(result).toEqual(mockSubscriptions);
            expect(customerSubscriptionRepository.find).toHaveBeenCalledWith({
                where: { user: mockUser },
                relations: ['subscriptionPlan', 'subscriptionStatus'],
            });
        });

        it('should throw NotFoundException if user is not found', async () => {
            const userId = 'user_1';

            userRepository.findOneBy.mockResolvedValue(null);

            await expect(service.getCustomerSubscriptions(userId)).rejects.toThrow(NotFoundException);
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

            customerSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            dataLookupRepository.findOneBy.mockResolvedValue(mockStatus);
            customerSubscriptionRepository.save.mockResolvedValue(mockSubscription);

            const result = await service.updateSubscriptionStatus(subscriptionId, updateSubscriptionStatusDto);

            expect(result).toEqual(mockSubscription);
            expect(customerSubscriptionRepository.findOne).toHaveBeenCalledWith({
                where: { id: subscriptionId },
                relations: ['subscriptionStatus'],
            });
            expect(dataLookupRepository.findOneBy).toHaveBeenCalledWith({ id: updateSubscriptionStatusDto.subscriptionStatusId });
            expect(customerSubscriptionRepository.save).toHaveBeenCalledWith(mockSubscription);
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            const subscriptionId = 'sub_1';
            const updateSubscriptionStatusDto: UpdateSubscriptionStatusDto = {
                subscriptionStatusId: 'status_1',
                endDate: new Date(),
            };

            customerSubscriptionRepository.findOne.mockResolvedValue(null);

            await expect(service.updateSubscriptionStatus(subscriptionId, updateSubscriptionStatusDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if subscription status is not found', async () => {
            const subscriptionId = 'sub_1';
            const updateSubscriptionStatusDto: UpdateSubscriptionStatusDto = {
                subscriptionStatusId: 'status_1',
                endDate: new Date(),
            };

            const mockSubscription = { id: 'sub_1', subscriptionStatus: {} } as CustomerSubscription;

            customerSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            dataLookupRepository.findOneBy.mockResolvedValue(null);

            await expect(service.updateSubscriptionStatus(subscriptionId, updateSubscriptionStatusDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('createSubscriptionPlan', () => {
        it('should create a new subscription plan', async () => {
            const createSubscriptionPlanDto: CreateSubscriptionPlanDto = {
                name: 'Plan A',
                description: 'Basic Plan',
                price: 100,
                billingCycleDays: 30,
                prorate: true,
            } as CreateSubscriptionPlanDto;

            const mockPlanState = { id: 'state_1' } as DataLookup;
            const mockPlan = { id: 'plan_1' } as SubscriptionPlan;

            dataLookupRepository.findOneBy.mockResolvedValue(mockPlanState);
            subscriptionPlanRepository.create.mockReturnValue(mockPlan);
            service.saveEntityWithDefaultState = jest.fn().mockResolvedValue(mockPlan);

            const result = await service.createSubscriptionPlan(createSubscriptionPlanDto);

            expect(result).toEqual(mockPlan);
            expect(subscriptionPlanRepository.create).toHaveBeenCalledWith({
                ...createSubscriptionPlanDto,
                status: mockPlanState,
            });
            expect(service.saveEntityWithDefaultState).toHaveBeenCalledWith(mockPlan, expect.any(String));
        });

        it('should throw NotFoundException if default state is not found', async () => {
            const createSubscriptionPlanDto: CreateSubscriptionPlanDto = {
                name: 'Plan A',
                description: 'Basic Plan',
                price: 100,
                billingCycleDays: 30,
                prorate: true,
            } as CreateSubscriptionPlanDto;

            dataLookupRepository.findOneBy.mockResolvedValue(null);

            await expect(service.createSubscriptionPlan(createSubscriptionPlanDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getSubscriptionPlans', () => {
        it('should return subscription plans', async () => {
            const mockPlans = [{ id: 'plan_1' }] as SubscriptionPlan[];

            subscriptionPlanRepository.find.mockResolvedValue(mockPlans);

            const result = await service.getSubscriptionPlans();

            expect(result).toEqual(mockPlans);
            expect(subscriptionPlanRepository.find).toHaveBeenCalledWith({
                relations: ['status', 'objectState'],
            });
        });
    });

    describe('getSubscriptionPlanById', () => {
        it('should return a subscription plan by id', async () => {
            const planId = 'plan_1';
            const mockPlan = { id: 'plan_1' } as SubscriptionPlan;

            subscriptionPlanRepository.findOne.mockResolvedValue(mockPlan);

            const result = await service.getSubscriptionPlanById(planId);

            expect(result).toEqual(mockPlan);
            expect(subscriptionPlanRepository.findOne).toHaveBeenCalledWith({
                where: { id: planId },
                relations: ['status', 'objectState'],
            });
        });

        it('should throw NotFoundException if subscription plan is not found', async () => {
            const planId = 'plan_1';

            subscriptionPlanRepository.findOne.mockResolvedValue(null);

            await expect(service.getSubscriptionPlanById(planId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateSubscriptionPlan', () => {
        it('should update a subscription plan', async () => {
            const planId = 'plan_1';
            const updateSubscriptionPlanDto: UpdateSubscriptionPlanDto = {
                name: 'Updated Plan',
                description: 'Updated Description',
                price: 200,
                billingCycleDays: 45,
                statusId: 'status_2',
                prorate: false,
            };

            const mockPlan = { id: 'plan_1' } as SubscriptionPlan;
            const mockStatus = { id: 'status_2' } as DataLookup;

            service.getSubscriptionPlanById = jest.fn().mockResolvedValue(mockPlan);
            dataLookupRepository.findOneBy.mockResolvedValue(mockStatus);
            subscriptionPlanRepository.save.mockResolvedValue(mockPlan);

            const result = await service.updateSubscriptionPlan(planId, updateSubscriptionPlanDto);

            expect(result).toEqual(mockPlan);
            expect(service.getSubscriptionPlanById).toHaveBeenCalledWith(planId);
            expect(dataLookupRepository.findOneBy).toHaveBeenCalledWith({ id: updateSubscriptionPlanDto.statusId });
            expect(subscriptionPlanRepository.save).toHaveBeenCalledWith(mockPlan);
        });

        it('should throw NotFoundException if status is not found', async () => {
            const planId = 'plan_1';
            const updateSubscriptionPlanDto: UpdateSubscriptionPlanDto = {
                name: 'Updated Plan',
                description: 'Updated Description',
                price: 200,
                billingCycleDays: 45,
                statusId: 'status_2',
                prorate: false,
            };

            const mockPlan = { id: 'plan_1' } as SubscriptionPlan;

            service.getSubscriptionPlanById = jest.fn().mockResolvedValue(mockPlan);
            dataLookupRepository.findOneBy.mockResolvedValue(null);

            await expect(service.updateSubscriptionPlan(planId, updateSubscriptionPlanDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteSubscriptionPlan', () => {
        it('should delete a subscription plan', async () => {
            service.destroy = jest.fn().mockResolvedValue(undefined);

            await service.deleteSubscriptionPlan('plan_1');

            expect(service.destroy).toHaveBeenCalledWith('plan_1');
        });
    });
});
