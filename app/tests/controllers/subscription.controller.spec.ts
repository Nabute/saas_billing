import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from '../../src/controllers/subscription.controller';
import { SubscriptionService } from '../../src/services/subscription.service';
import { CreateSubscriptionDto, CreateSubscriptionPlanDto, UpdateSubscriptionStatusDto, UpdateSubscriptionPlanDto } from '../../src/dtos/subscription.dto';
import { CustomerSubscription } from '../../src/entities/customer.entity';
import { SubscriptionPlan } from '../../src/entities/subscription.entity';
import { SubscriptionStatus } from '../../src/utils/enums';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { User } from '../../src/entities/user.entity';

describe('SubscriptionController', () => {
    let controller: SubscriptionController;
    let service: SubscriptionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubscriptionController],
            providers: [
                {
                    provide: SubscriptionService,
                    useValue: {
                        createCustomerSubscription: jest.fn(),
                        createSubscriptionPlan: jest.fn(),
                        getSubscriptionPlans: jest.fn(),
                        getCustomerSubscriptions: jest.fn(),
                        updateSubscriptionStatus: jest.fn(),
                        getSubscriptionPlanById: jest.fn(),
                        updateSubscriptionPlan: jest.fn(),
                        deleteSubscriptionPlan: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<SubscriptionController>(SubscriptionController);
        service = module.get<SubscriptionService>(SubscriptionService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createCustomerSubscription', () => {
        it('should create a new customer subscription', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = { userId: '1', subscriptionPlanId: 'plan1' };
            const subscription = { id: '1', user: { id: '1' }, subscriptionPlan: { id: 'plan1' } } as CustomerSubscription;

            jest.spyOn(service, 'createCustomerSubscription').mockResolvedValue(subscription);

            const result = await controller.createCustomerSubscription(createSubscriptionDto);
            expect(result).toEqual(subscription);
            expect(service.createCustomerSubscription).toHaveBeenCalledWith(createSubscriptionDto);
        });
    });

    describe('createSubscriptionPlan', () => {
        it('should create a new subscription plan', async () => {
            const createSubscriptionPlanDto: CreateSubscriptionPlanDto = { name: 'Basic Plan', price: 10 } as CreateSubscriptionPlanDto;
            const plan = { id: '1', ...createSubscriptionPlanDto } as unknown as SubscriptionPlan;

            jest.spyOn(service, 'createSubscriptionPlan').mockResolvedValue(plan);

            const result = await controller.createSubscriptionPlan(createSubscriptionPlanDto);
            expect(result).toEqual(plan);
            expect(service.createSubscriptionPlan).toHaveBeenCalledWith(createSubscriptionPlanDto);
        });
    });

    describe('plans', () => {
        it('should return a list of subscription plans', async () => {
            const plans = [{ id: '1', name: 'Basic Plan', price: 10 }] as SubscriptionPlan[];

            jest.spyOn(service, 'getSubscriptionPlans').mockResolvedValue(plans);

            const result = await controller.plans();
            expect(result).toEqual(plans);
            expect(service.getSubscriptionPlans).toHaveBeenCalled();
        });
    });

    describe('getCustomerSubscriptions', () => {
        it('should return a list of subscriptions for a user', async () => {
            const subscriptions = [{ id: '1', user: { id: '1' }, subscriptionPlan: { id: 'plan1' } }] as CustomerSubscription[];

            jest.spyOn(service, 'getCustomerSubscriptions').mockResolvedValue(subscriptions);

            const result = await controller.getCustomerSubscriptions('1');
            expect(result).toEqual(subscriptions);
            expect(service.getCustomerSubscriptions).toHaveBeenCalledWith('1');
        });
    });

    describe('updateSubscriptionStatus', () => {
        it('should update the status of a subscription', async () => {
            const updateSubscriptionStatusDto: UpdateSubscriptionStatusDto = { subscriptionStatusId: SubscriptionStatus.ACTIVE };
            const subscription = { id: '1', user: { id: '1' } as User, subscriptionPlan: { id: 'plan1' } as SubscriptionPlan, status: { id: "slkdjf", value: SubscriptionStatus.PENDING } as DataLookup } as unknown as CustomerSubscription;

            jest.spyOn(service, 'updateSubscriptionStatus').mockResolvedValue(subscription);

            const result = await controller.updateSubscriptionStatus('1', updateSubscriptionStatusDto);
            expect(result).toEqual(subscription);
            expect(service.updateSubscriptionStatus).toHaveBeenCalledWith('1', updateSubscriptionStatusDto);
        });
    });

    describe('getSubscriptionPlanById', () => {
        it('should return a subscription plan by ID', async () => {
            const plan = { id: '1', name: 'Basic Plan', price: 10 } as SubscriptionPlan;

            jest.spyOn(service, 'getSubscriptionPlanById').mockResolvedValue(plan);

            const result = await controller.getSubscriptionPlanById('1');
            expect(result).toEqual(plan);
            expect(service.getSubscriptionPlanById).toHaveBeenCalledWith('1');
        });
    });

    describe('updateSubscriptionPlan', () => {
        it('should update a subscription plan by ID', async () => {
            const updateSubscriptionPlanDto: UpdateSubscriptionPlanDto = { name: 'Pro Plan', price: 20 };
            const plan = { id: '1', ...updateSubscriptionPlanDto } as SubscriptionPlan;

            jest.spyOn(service, 'updateSubscriptionPlan').mockResolvedValue(plan);

            const result = await controller.updateSubscriptionPlan('1', updateSubscriptionPlanDto);
            expect(result).toEqual(plan);
            expect(service.updateSubscriptionPlan).toHaveBeenCalledWith('1', updateSubscriptionPlanDto);
        });
    });

    describe('deleteSubscriptionPlan', () => {
        it('should delete a subscription plan by ID', async () => {
            jest.spyOn(service, 'deleteSubscriptionPlan').mockResolvedValue(undefined);

            const result = await controller.deleteSubscriptionPlan('1');
            expect(result).toBeUndefined();
            expect(service.deleteSubscriptionPlan).toHaveBeenCalledWith('1');
        });
    });
});
