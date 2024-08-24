import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanController } from '../../src/controllers/subscription-plan.controller';
import { SubscriptionPlanService } from '../../src/services/subscription-plan.service';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../../src/dtos/subscription.dto';
import { SubscriptionPlan } from '../../src/entities/subscription.entity';
import { EntityManager } from 'typeorm';

describe('SubscriptionPlanController', () => {
    let controller: SubscriptionPlanController;
    let service: SubscriptionPlanService;
    let entityManager: jest.Mocked<EntityManager>;

    beforeEach(async () => {
        entityManager = {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubscriptionPlanController],
            providers: [
                {
                    provide: SubscriptionPlanService,
                    useValue: {
                        createSubscriptionPlan: jest.fn(),
                        getSubscriptionPlans: jest.fn(),
                        getSubscriptionPlanById: jest.fn(),
                        updateSubscriptionPlan: jest.fn(),
                        deleteSubscriptionPlan: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<SubscriptionPlanController>(SubscriptionPlanController);
        service = module.get<SubscriptionPlanService>(SubscriptionPlanService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createSubscriptionPlan', () => {
        it('should create a new subscription plan', async () => {
            const createSubscriptionPlanDto: CreateSubscriptionPlanDto = { name: 'Basic Plan', price: 10 } as CreateSubscriptionPlanDto;
            const plan = { id: '1', ...createSubscriptionPlanDto } as unknown as SubscriptionPlan;

            jest.spyOn(service, 'createSubscriptionPlan').mockResolvedValue(plan);

            const result = await controller.createSubscriptionPlan(createSubscriptionPlanDto, { transactionManager: entityManager });
            expect(result).toEqual(plan);
            expect(service.createSubscriptionPlan).toHaveBeenCalledWith(createSubscriptionPlanDto, entityManager);
        });
    });

    describe('getSubscriptionPlans', () => {
        it('should return a list of subscription plans', async () => {
            const plans = [{ id: '1', name: 'Basic Plan', price: 10 }] as SubscriptionPlan[];

            jest.spyOn(service, 'getSubscriptionPlans').mockResolvedValue(plans);

            const result = await controller.getSubscriptionPlans({ transactionManager: entityManager });
            expect(result).toEqual(plans);
            expect(service.getSubscriptionPlans).toHaveBeenCalledWith(entityManager);
        });
    });

    describe('getSubscriptionPlanById', () => {
        it('should return a subscription plan by ID', async () => {
            const plan = { id: '1', name: 'Basic Plan', price: 10 } as SubscriptionPlan;

            jest.spyOn(service, 'getSubscriptionPlanById').mockResolvedValue(plan);

            const result = await controller.getSubscriptionPlanById('1', { transactionManager: entityManager });
            expect(result).toEqual(plan);
            expect(service.getSubscriptionPlanById).toHaveBeenCalledWith('1', entityManager);
        });
    });

    describe('updateSubscriptionPlan', () => {
        it('should update a subscription plan by ID', async () => {
            const updateSubscriptionPlanDto: UpdateSubscriptionPlanDto = { name: 'Pro Plan', price: 20 };
            const plan = { id: '1', ...updateSubscriptionPlanDto } as SubscriptionPlan;

            jest.spyOn(service, 'updateSubscriptionPlan').mockResolvedValue(plan);

            const result = await controller.updateSubscriptionPlan('1', updateSubscriptionPlanDto, { transactionManager: entityManager });
            expect(result).toEqual(plan);
            expect(service.updateSubscriptionPlan).toHaveBeenCalledWith('1', updateSubscriptionPlanDto, entityManager);
        });
    });

    describe('deleteSubscriptionPlan', () => {
        it('should delete a subscription plan by ID', async () => {
            jest.spyOn(service, 'deleteSubscriptionPlan').mockResolvedValue(undefined);

            const result = await controller.deleteSubscriptionPlan('1', { transactionManager: entityManager });
            expect(result).toBeUndefined();
            expect(service.deleteSubscriptionPlan).toHaveBeenCalledWith('1', entityManager);
        });
    });
});
