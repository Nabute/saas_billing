import { Test, TestingModule } from '@nestjs/testing';
import { CustomerSubscriptionController } from '../../src/controllers/subscription.controller';
import { CustomerSubscriptionService } from '../../src/services/subscription.service';
import { CreateSubscriptionDto, UpdateSubscriptionStatusDto } from '../../src/dtos/subscription.dto';
import { CustomerSubscription } from '../../src/entities/customer.entity';
import { SubscriptionStatus } from '../../src/utils/enums';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { User } from '../../src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { SubscriptionPlan } from '../../src/entities/subscription.entity';

describe('CustomerSubscriptionController', () => {
    let controller: CustomerSubscriptionController;
    let service: CustomerSubscriptionService;
    let entityManager: jest.Mocked<EntityManager>;

    beforeEach(async () => {
        entityManager = {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CustomerSubscriptionController],
            providers: [
                {
                    provide: CustomerSubscriptionService,
                    useValue: {
                        createCustomerSubscription: jest.fn(),
                        getCustomerSubscriptions: jest.fn(),
                        updateSubscriptionStatus: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<CustomerSubscriptionController>(CustomerSubscriptionController);
        service = module.get<CustomerSubscriptionService>(CustomerSubscriptionService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createCustomerSubscription', () => {
        it('should create a new customer subscription', async () => {
            const createSubscriptionDto: CreateSubscriptionDto = { userId: '1', subscriptionPlanId: 'plan1' };
            const subscription = { id: '1', user: { id: '1' }, subscriptionPlan: { id: 'plan1' } } as CustomerSubscription;

            jest.spyOn(service, 'createCustomerSubscription').mockResolvedValue(subscription);

            const result = await controller.createCustomerSubscription(createSubscriptionDto, { transactionManager: entityManager });
            expect(result).toEqual(subscription);
            expect(service.createCustomerSubscription).toHaveBeenCalledWith(createSubscriptionDto, entityManager);
        });
    });

    describe('getCustomerSubscriptions', () => {
        it('should return a list of subscriptions for a user', async () => {
            const subscriptions = [{ id: '1', user: { id: '1' }, subscriptionPlan: { id: 'plan1' } }] as CustomerSubscription[];

            jest.spyOn(service, 'getCustomerSubscriptions').mockResolvedValue(subscriptions);

            const result = await controller.getCustomerSubscriptions('1', { transactionManager: entityManager });
            expect(result).toEqual(subscriptions);
            expect(service.getCustomerSubscriptions).toHaveBeenCalledWith('1', entityManager);
        });
    });

    describe('updateSubscriptionStatus', () => {
        it('should update the status of a subscription', async () => {
            const updateSubscriptionStatusDto: UpdateSubscriptionStatusDto = { subscriptionStatusId: SubscriptionStatus.ACTIVE };
            const subscription = {
                id: '1',
                user: { id: '1' } as User,
                subscriptionPlan: { id: 'plan1' } as SubscriptionPlan,
                status: { id: "slkdjf", value: SubscriptionStatus.PENDING } as DataLookup,
            } as unknown as CustomerSubscription;

            jest.spyOn(service, 'updateSubscriptionStatus').mockResolvedValue(subscription);

            const result = await controller.updateSubscriptionStatus('1', updateSubscriptionStatusDto, { transactionManager: entityManager });
            expect(result).toEqual(subscription);
            expect(service.updateSubscriptionStatus).toHaveBeenCalledWith('1', updateSubscriptionStatusDto, entityManager);
        });
    });
});
