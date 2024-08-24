import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../../src/services/payment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, EntityManager } from 'typeorm';
import { Payment } from '../../src/entities/payment.entity';
import { PaymentMethod } from '../../src/entities/payment-method.entity';
import { Invoice } from '../../src/entities/invoice.entity';
import { CustomerSubscription } from '../../src/entities/customer.entity';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { SystemSetting } from '../../src/entities/system-settings.entity';
import { StripeService } from '../../src/services/stripe.service';
import { NotificationsService } from '../../src/services/notifications.service';
import { Queue } from 'bull';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InvoiceStatus, JobQueues, PaymentStatus, SubscriptionStatus } from '../../src/utils/enums';
import { getQueueToken } from '@nestjs/bull';
import Stripe from 'stripe';

describe('PaymentService', () => {
    let service: PaymentService;
    let paymentRepository: jest.Mocked<Repository<Payment>>;
    let paymentMethodRepository: jest.Mocked<Repository<PaymentMethod>>;
    let invoiceRepository: jest.Mocked<Repository<Invoice>>;
    let customerSubscriptionRepository: jest.Mocked<Repository<CustomerSubscription>>;
    let dataLookupRepository: jest.Mocked<Repository<DataLookup>>;
    let settingRepository: jest.Mocked<Repository<SystemSetting>>;
    let stripeService: jest.Mocked<StripeService>;
    let notificationsService: jest.Mocked<NotificationsService>;
    let paymentRetryQueue: jest.Mocked<Queue>;
    let dataSource: jest.Mocked<DataSource>;
    let queryRunner: jest.Mocked<QueryRunner>;
    let manager: jest.Mocked<EntityManager>;

    beforeEach(async () => {
        manager = {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
        } as unknown as jest.Mocked<EntityManager>;

        queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: manager,
        } as unknown as jest.Mocked<QueryRunner>;

        dataSource = {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        } as unknown as jest.Mocked<DataSource>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                {
                    provide: getRepositoryToken(Payment),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PaymentMethod),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Invoice),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(CustomerSubscription),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(DataLookup),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(SystemSetting),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: StripeService,
                    useValue: {
                        createPaymentIntent: jest.fn(),
                    },
                },
                {
                    provide: NotificationsService,
                    useValue: {
                        sendPaymentSuccessEmail: jest.fn(),
                        sendPaymentFailureEmail: jest.fn(),
                    },
                },
                {
                    provide: getQueueToken(JobQueues.PAYMENT_RETRY),
                    useValue: {
                        add: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: dataSource,
                },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
        paymentRepository = module.get(getRepositoryToken(Payment));
        paymentMethodRepository = module.get(getRepositoryToken(PaymentMethod));
        invoiceRepository = module.get(getRepositoryToken(Invoice));
        customerSubscriptionRepository = module.get(getRepositoryToken(CustomerSubscription));
        dataLookupRepository = module.get(getRepositoryToken(DataLookup));
        settingRepository = module.get(getRepositoryToken(SystemSetting));
        stripeService = module.get(StripeService);
        notificationsService = module.get(NotificationsService);
        paymentRetryQueue = module.get(getQueueToken(JobQueues.PAYMENT_RETRY));
    });

    describe('processNewPayment', () => {
        it('should throw InternalServerErrorException if an error occurs', async () => {
            const paymentDto = { invoiceId: 'inv_123', paymentMethodId: 'pm_123' };

            jest.spyOn<any, any>(service, 'findPendingInvoice').mockRejectedValue(new Error('Test Error'));

            await expect(service.processNewPayment(paymentDto)).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('handleSuccessfulPayment', () => {
        it('should handle a successful payment', async () => {
            const mockInvoice = {
                id: 'inv_123',
                amount: 1000,
                subscription: { id: 'sub_123', user: { email: 'test@example.com' }, subscriptionPlan: { name: 'Test Plan' } },
            } as any;
            const mockPaymentStatus = { id: 'status_123', value: PaymentStatus.VERIFIED } as any;
            const mockPaymentMethod = { id: 'method_123' } as any;
            const mockPaidInvoiceStatus = { id: 'paid_status_123', value: InvoiceStatus.PAID } as any;
            const mockPaymentIntent = { id: 'pi_123', status: 'succeeded' } as any;

            manager.findOne.mockResolvedValueOnce(mockPaymentStatus);
            manager.findOne.mockResolvedValueOnce(mockPaymentMethod);
            manager.create.mockReturnValue({ id: 'payment_123' } as any);
            manager.findOne.mockResolvedValueOnce(mockPaidInvoiceStatus);

            await service.handleSuccessfulPayment(mockInvoice, mockPaymentIntent, manager);

            expect(manager.create).toHaveBeenCalledWith(Payment, {
                invoice: mockInvoice,
                paymentMethod: mockPaymentMethod,
                status: mockPaymentStatus,
                amount: mockInvoice.amount,
                referenceNumber: mockPaymentIntent.id,
                payerName: expect.any(String),
                paymentDate: expect.any(String),
            });
            expect(manager.save).toHaveBeenCalledWith(Payment, expect.any(Object));
            expect(manager.save).toHaveBeenCalledWith(Invoice, mockInvoice);
            expect(notificationsService.sendPaymentSuccessEmail).toHaveBeenCalledWith(
                mockInvoice.subscription.user.email,
                mockInvoice.subscription.subscriptionPlan.name,
            );
        });

        it('should throw NotFoundException if status is not found', async () => {
            const mockInvoice = { id: 'inv_123', amount: 1000, subscription: { id: 'sub_123' } } as any;
            const mockPaymentIntent = { id: 'pi_123', status: 'succeeded' } as any;

            manager.findOne.mockResolvedValue(null);

            await expect(service.handleSuccessfulPayment(mockInvoice, mockPaymentIntent, manager)).rejects.toThrow(NotFoundException);
        });
    });

    describe('handleFailedPayment', () => {
        it('should handle a failed payment', async () => {
            const subscriptionId = 'sub_123';
            const mockSubscription = {
                id: subscriptionId,
                retryCount: 0,
                user: { email: 'test@example.com' },
                subscriptionPlan: { name: 'Test Plan' },
            } as CustomerSubscription;
            const mockOverdueStatus = { id: 'status_123', value: SubscriptionStatus.OVERDUE } as DataLookup;

            // Mock manager.findOne calls
            manager.findOne
                .mockResolvedValueOnce(mockSubscription) // findSubscriptionById
                .mockResolvedValueOnce(mockOverdueStatus); // findDataLookupByValue

            await service.handleFailedPayment(subscriptionId, manager);

            expect(manager.save).toHaveBeenCalledWith(CustomerSubscription, mockSubscription);
            expect(notificationsService.sendPaymentFailureEmail).toHaveBeenCalledWith('test@example.com', 'Test Plan');
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            const subscriptionId = 'sub_123';

            manager.findOne.mockResolvedValue(null); // Mock findOne to return null for the subscription

            await expect(service.handleFailedPayment(subscriptionId, manager)).rejects.toThrow(NotFoundException);
        });
    });

    describe('scheduleRetry', () => {
        it('should schedule a payment retry', async () => {
            const subscriptionId = 'sub_123';
            const mockSubscription = { id: subscriptionId, retryCount: 0 } as any;
            const mockMaxRetriesSetting = { currentValue: '3' } as any;
            const mockRetryDelaySetting = { currentValue: '5' } as any;

            manager.findOne.mockResolvedValueOnce(mockSubscription);
            manager.findOne.mockResolvedValueOnce(mockMaxRetriesSetting);
            manager.findOne.mockResolvedValueOnce(mockRetryDelaySetting);

            await service.scheduleRetry(subscriptionId, 1, manager);

            expect(paymentRetryQueue.add).toHaveBeenCalledWith(
                { subscriptionId, attempt: 1 },
                { delay: 5 * 60 * 1000 },
            );
            expect(manager.save).toHaveBeenCalledWith(CustomerSubscription, expect.any(Object));
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            const subscriptionId = 'sub_123';

            manager.findOne.mockResolvedValue(null);

            await expect(service.scheduleRetry(subscriptionId, 1, manager)).rejects.toThrow(NotFoundException);
        });

        it('should not schedule a retry if retry count exceeds max retries', async () => {
            const subscriptionId = 'sub_123';
            const mockSubscription = { id: subscriptionId, retryCount: 3 } as any;
            const mockMaxRetriesSetting = { currentValue: '3' } as any;

            manager.findOne.mockResolvedValueOnce(mockSubscription);
            manager.findOne.mockResolvedValueOnce(mockMaxRetriesSetting);

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            await service.scheduleRetry(subscriptionId, 1, manager);

            expect(consoleLogSpy).toHaveBeenCalledWith(`Subscription ID ${subscriptionId} has reached the maximum number of retries.`);
            expect(paymentRetryQueue.add).not.toHaveBeenCalled();
        });
    });

    describe('retryPayment', () => {
        it('should throw NotFoundException if no unpaid invoice is found', async () => {
            const subscriptionId = 'sub_123';

            manager.findOne.mockResolvedValue(null); // Mock findOne to return null

            await expect(service.retryPayment(subscriptionId, manager)).rejects.toThrow(NotFoundException);
        });

        it('should return false if payment fails', async () => {
            const subscriptionId = 'sub_123';
            const mockInvoice = { id: 'inv_123', amount: 100, subscription: { id: subscriptionId } } as any;
            const mockPaymentIntent = { id: 'pi_123', status: 'failed' } as any;

            manager.findOne.mockResolvedValue(mockInvoice);
            stripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

            const result = await service.retryPayment(subscriptionId, manager);

            expect(result.success).toBe(false);
        });

        it('should log an error and return success: false if an error occurs', async () => {
            const subscriptionId = 'sub_123';
            const mockInvoice = { id: 'inv_123', amount: 100, subscription: { id: subscriptionId } } as Invoice;
            const error = new Error('Test error');

            manager.findOne.mockResolvedValue(mockInvoice); // Mock finding the invoice
            stripeService.createPaymentIntent.mockRejectedValue(error); // Mock an error when creating a payment intent

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.retryPayment(subscriptionId, manager);

            expect(consoleErrorSpy).toHaveBeenCalledWith(`Failed to process payment for invoice ID ${mockInvoice.id}:`, error);
            expect(result.success).toBe(false);
        });
    });

    describe('confirmPayment', () => {
        it('should confirm payment and update subscription status', async () => {
            const subscriptionId = 'sub_123';
            const mockActiveStatus = { id: 'status_123', value: SubscriptionStatus.ACTIVE } as any;
            const mockSubscription = { id: subscriptionId, subscriptionStatus: {} } as any;

            manager.findOne.mockResolvedValueOnce(mockSubscription); // Mock subscription retrieval
            manager.findOne.mockResolvedValueOnce(mockActiveStatus); // Mock status retrieval

            await service.confirmPayment(subscriptionId, manager);

            expect(manager.findOne).toHaveBeenCalledWith(CustomerSubscription, {
                where: { id: subscriptionId },
                relations: ['subscriptionStatus'],
            });
            expect(manager.findOne).toHaveBeenCalledWith(DataLookup, {
                where: { value: SubscriptionStatus.ACTIVE },
            });
            expect(manager.save).toHaveBeenCalledWith(CustomerSubscription, { ...mockSubscription, subscriptionStatus: mockActiveStatus });
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            const subscriptionId = 'sub_123';

            manager.findOne.mockResolvedValue(null);

            await expect(service.confirmPayment(subscriptionId, manager)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if active status is not found', async () => {
            const subscriptionId = 'sub_123';
            const mockSubscription = { id: subscriptionId, subscriptionStatus: {} } as any;

            manager.findOne.mockResolvedValue(mockSubscription);
            manager.findOne.mockResolvedValue(null);

            await expect(service.confirmPayment(subscriptionId, manager)).rejects.toThrow(NotFoundException);
        });
    });
});
