import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../../src/services/billing.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerSubscription } from '../../src/entities/customer.entity';
import { Invoice } from '../../src/entities/invoice.entity';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { SubscriptionPlan } from '../../src/entities/subscription.entity';
import { InvoiceStatus, SubscriptionStatus } from '../../src/utils/enums';
import { Queue } from 'bull';
import { NotificationsService } from '../../src/services/notifications.service';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';

describe('BillingService', () => {
    let service: BillingService;
    let customerSubscriptionRepository: jest.Mocked<Repository<CustomerSubscription>>;
    let invoiceRepository: jest.Mocked<Repository<Invoice>>;
    let dataLookupRepository: jest.Mocked<Repository<DataLookup>>;
    let subscriptionPlanRepository: jest.Mocked<Repository<SubscriptionPlan>>;
    let billingQueue: jest.Mocked<Queue>;
    let notificationsService: jest.Mocked<NotificationsService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingService,
                {
                    provide: getRepositoryToken(CustomerSubscription),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Invoice),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(DataLookup),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(SubscriptionPlan),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getQueueToken('billing'),
                    useValue: {
                        add: jest.fn(),
                    },
                },
                {
                    provide: NotificationsService,
                    useValue: {
                        sendInvoiceGeneratedEmail: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BillingService>(BillingService);
        customerSubscriptionRepository = module.get(getRepositoryToken(CustomerSubscription));
        invoiceRepository = module.get(getRepositoryToken(Invoice));
        dataLookupRepository = module.get(getRepositoryToken(DataLookup));
        subscriptionPlanRepository = module.get(getRepositoryToken(SubscriptionPlan));
        billingQueue = module.get(getQueueToken('billing'));
        notificationsService = module.get(NotificationsService);
    });

    describe('scheduleInvoiceGeneration', () => {
        it('should enqueue generateInvoice jobs for active subscriptions with billing today', async () => {
            const mockSubscriptions = [
                { id: '1', nextBillingDate: new Date(), subscriptionStatus: { value: SubscriptionStatus.ACTIVE }, user: { id: 'user1' } } as CustomerSubscription,
            ];

            customerSubscriptionRepository.find.mockResolvedValue(mockSubscriptions);

            await service.scheduleInvoiceGeneration();

            expect(customerSubscriptionRepository.find).toHaveBeenCalledWith({
                where: {
                    nextBillingDate: expect.any(Date),
                    subscriptionStatus: { value: SubscriptionStatus.ACTIVE },
                },
                relations: ['subscriptionPlan', 'user'],
            });

            expect(billingQueue.add).toHaveBeenCalledWith('generateInvoice', { subscriptionId: '1' });
        });
    });

    describe('createInvoiceForSubscription', () => {
        it('should create an invoice, send a notification, and update the subscription', async () => {
            const mockSubscription = {
                id: '1',
                subscriptionPlan: { price: 100, billingCycleDays: 30 },
                user: { id: 'user1', email: 'user1@example.com' },
                nextBillingDate: new Date(),
            } as unknown as CustomerSubscription;

            const mockPendingStatus = { value: InvoiceStatus.PENDING } as DataLookup;
            const mockInvoice = { id: 'invoice1' } as Invoice;

            dataLookupRepository.findOne.mockResolvedValue(mockPendingStatus);
            invoiceRepository.create.mockReturnValue(mockInvoice);
            invoiceRepository.save.mockResolvedValue(mockInvoice);

            await service.createInvoiceForSubscription(mockSubscription);

            expect(invoiceRepository.create).toHaveBeenCalledWith({
                customerId: 'user1',
                amount: 100,
                status: mockPendingStatus,
                paymentDueDate: expect.any(Date),
                subscription: mockSubscription,
            });

            expect(invoiceRepository.save).toHaveBeenCalledWith(mockInvoice);
            expect(notificationsService.sendInvoiceGeneratedEmail).toHaveBeenCalledWith('user1@example.com', 'invoice1');
            expect(customerSubscriptionRepository.save).toHaveBeenCalledWith({
                ...mockSubscription,
                nextBillingDate: expect.any(Date),
            });
        });
    });

    describe('handleSubscriptionChange', () => {
        it('should throw NotFoundException if subscription is not found', async () => {
            customerSubscriptionRepository.findOne.mockResolvedValue(null);

            await expect(service.handleSubscriptionChange('subscriptionId', 'newPlanId')).rejects.toThrow(
                new NotFoundException(`Subscription with ID subscriptionId not found`),
            );
        });

        it('should throw NotFoundException if new plan is not found', async () => {
            customerSubscriptionRepository.findOne.mockResolvedValue({ id: 'subscriptionId' } as CustomerSubscription);
            subscriptionPlanRepository.findOne.mockResolvedValue(null);

            await expect(service.handleSubscriptionChange('subscriptionId', 'newPlanId')).rejects.toThrow(
                new NotFoundException(`Subscription plan with ID newPlanId not found`),
            );
        });

        it('should update the subscription and invoice with the new plan', async () => {
            const mockSubscription = {
                id: 'subscriptionId',
                subscriptionPlan: { id: 'oldPlanId', price: 100, billingCycleDays: 30 },
                nextBillingDate: new Date(),
            } as unknown as CustomerSubscription;

            const mockNewPlan = { id: 'newPlanId', price: 200 } as SubscriptionPlan;
            const mockInvoice = { id: 'invoiceId', amount: 100, status: { value: InvoiceStatus.PENDING } } as Invoice;

            customerSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            subscriptionPlanRepository.findOne.mockResolvedValue(mockNewPlan);
            invoiceRepository.findOne.mockResolvedValue(mockInvoice);

            await service.handleSubscriptionChange('subscriptionId', 'newPlanId');

            expect(invoiceRepository.save).toHaveBeenCalledWith({
                ...mockInvoice,
                amount: expect.any(Number), // Prorated amount added
            });

            expect(customerSubscriptionRepository.save).toHaveBeenCalledWith({
                ...mockSubscription,
                subscriptionPlan: mockNewPlan,
            });
        });
    });

    describe('getSubscriptionById', () => {
        it('should return the subscription if found', async () => {
            const mockSubscription = { id: 'subscriptionId' } as CustomerSubscription;
            customerSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

            const result = await service.getSubscriptionById('subscriptionId');
            expect(result).toBe(mockSubscription);
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            customerSubscriptionRepository.findOne.mockResolvedValue(null);

            await expect(service.getSubscriptionById('subscriptionId')).rejects.toThrow(
                new NotFoundException(`Subscription with ID subscriptionId not found`),
            );
        });
    });
});