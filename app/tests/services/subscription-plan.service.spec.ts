import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanService } from '../../src/services/subscription-plan.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { SubscriptionPlan } from '../../src/entities/subscription.entity';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../../src/dtos/subscription.dto';

jest.mock('../../src/services/base.service');

describe('SubscriptionPlanService', () => {
    let service: SubscriptionPlanService;
    let subscriptionPlanRepository: jest.Mocked<Repository<SubscriptionPlan>>;
    let dataLookupRepository: jest.Mocked<Repository<DataLookup>>;
    let entityManager: jest.Mocked<EntityManager>;
    let dataSource: jest.Mocked<DataSource>;

    beforeEach(async () => {
        dataSource = {
            manager: entityManager,
        } as unknown as jest.Mocked<DataSource>;

        entityManager = {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
        } as unknown as jest.Mocked<EntityManager>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionPlanService,
                {
                    provide: getRepositoryToken(SubscriptionPlan),
                    useValue: {
                        findOne: jest.fn(),
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
                    provide: EntityManager,
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: dataSource,
                },
            ],
        }).compile();

        service = module.get<SubscriptionPlanService>(SubscriptionPlanService);
        subscriptionPlanRepository = module.get(getRepositoryToken(SubscriptionPlan));
        dataLookupRepository = module.get(getRepositoryToken(DataLookup));
        entityManager = module.get(EntityManager);
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

            entityManager.findOne.mockResolvedValueOnce(mockPlanState); // PlanState found
            subscriptionPlanRepository.create.mockReturnValue(mockPlan);
            entityManager.save.mockResolvedValueOnce(mockPlan)

            const result = await service.createSubscriptionPlan(createSubscriptionPlanDto, entityManager);

            expect(result).toEqual(mockPlan);
            expect(subscriptionPlanRepository.create).toHaveBeenCalledWith({
                ...createSubscriptionPlanDto,
                status: mockPlanState,
            });
            expect(entityManager.save).toHaveBeenCalledWith(SubscriptionPlan, mockPlan);
        });

        it('should throw NotFoundException if default state is not found', async () => {
            const createSubscriptionPlanDto: CreateSubscriptionPlanDto = {
                name: 'Plan A',
                description: 'Basic Plan',
                price: 100,
                billingCycleDays: 30,
                prorate: true,
            } as CreateSubscriptionPlanDto;

            entityManager.findOne.mockResolvedValueOnce(null); // PlanState not found

            await expect(service.createSubscriptionPlan(createSubscriptionPlanDto, entityManager)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getSubscriptionPlans', () => {
        it('should return subscription plans', async () => {
            const mockPlans = [{ id: 'plan_1' }] as SubscriptionPlan[];

            entityManager.find.mockResolvedValueOnce(mockPlans); // Plans found

            const result = await service.getSubscriptionPlans(entityManager);

            expect(result).toEqual(mockPlans);
            expect(entityManager.find).toHaveBeenCalledWith(SubscriptionPlan, {
                relations: ['status', 'objectState'],
            });
        });
    });

    describe('getSubscriptionPlanById', () => {
        it('should return a subscription plan by id', async () => {
            const planId = 'plan_1';
            const mockPlan = { id: 'plan_1' } as SubscriptionPlan;

            entityManager.findOne.mockResolvedValueOnce(mockPlan); // Plan found

            const result = await service.getSubscriptionPlanById(planId, entityManager);

            expect(result).toEqual(mockPlan);
            expect(entityManager.findOne).toHaveBeenCalledWith(SubscriptionPlan, {
                where: { id: planId },
                relations: ['status', 'objectState'],
            });
        });

        it('should throw NotFoundException if subscription plan is not found', async () => {
            const planId = 'plan_1';

            entityManager.findOne.mockResolvedValueOnce(null); // Plan not found

            await expect(service.getSubscriptionPlanById(planId, entityManager)).rejects.toThrow(NotFoundException);
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
            entityManager.findOne.mockResolvedValueOnce(mockStatus); // Status found
            entityManager.save.mockResolvedValueOnce(mockPlan); // Save the updated plan

            const result = await service.updateSubscriptionPlan(planId, updateSubscriptionPlanDto, entityManager);

            expect(result).toEqual(mockPlan);
            expect(service.getSubscriptionPlanById).toHaveBeenCalledWith(planId, entityManager);
            expect(entityManager.findOne).toHaveBeenCalledWith(DataLookup, { where: { id: updateSubscriptionPlanDto.statusId } });
            expect(entityManager.save).toHaveBeenCalledWith(SubscriptionPlan, mockPlan);
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
            entityManager.findOne.mockResolvedValueOnce(null); // Status not found

            await expect(service.updateSubscriptionPlan(planId, updateSubscriptionPlanDto, entityManager)).rejects.toThrow(NotFoundException);
        });
    });

});
