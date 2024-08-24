import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../../src/services/payment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../src/entities/payment.entity';
import { PaymentMethod } from '../../src/entities/payment-method.entity';
import { Invoice } from '../../src/entities/invoice.entity';
import { CustomerSubscription } from '../../src/entities/customer.entity';
import { DataLookup } from '../../src/entities/data-lookup.entity';
import { SystemSetting } from '../../src/entities/system-settings.entity';
import { StripeService } from '../../src/services/stripe.service';
import { NotificationsService } from '../../src/services/notifications.service';
import { Queue } from 'bull';
import { NotFoundException } from '@nestjs/common';
import { InvoiceStatus, JobQueues, PaymentStatus, SubscriptionStatus } from '../../src/utils/enums';
import { getQueueToken } from '@nestjs/bull';

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

    beforeEach(async () => {
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

    describe('handleSuccessfulPayment', () => {
        it('should handle a successful payment', async () => {
            const subscriptionId = 'sub_123';
            const paymentAmount = 1000;
            const paymentMethodCode = 'card';

            const mockInvoice = { id: 'inv_123', subscription: { id: subscriptionId, user: { email: 'test@example.com' }, subscriptionPlan: { name: 'Test Plan' } } } as any;
            const mockPaymentStatus = { id: 'status_123', value: PaymentStatus.VERIFIED } as any;
            const mockPaymentMethod = { id: 'method_123' } as any;
            const mockPendingStatus = { id: 'status_456', value: InvoiceStatus.PENDING } as any; // Mock for 'PENDING' status
            const mockPaidInvoiceStatus = { id: 'paid_status_123', value: 'PAID' } as any;

            // Mocking findOne for pending status
            dataLookupRepository.findOne.mockResolvedValueOnce(mockPendingStatus);

            invoiceRepository.findOne.mockResolvedValue(mockInvoice);
            dataLookupRepository.findOne.mockResolvedValueOnce(mockPaymentStatus);
            paymentMethodRepository.findOne.mockResolvedValue(mockPaymentMethod);
            paymentRepository.create.mockReturnValue({ id: 'payment_123' } as any);
            dataLookupRepository.findOne.mockResolvedValueOnce(mockPaidInvoiceStatus);

            await service.handleSuccessfulPayment(subscriptionId, paymentAmount, paymentMethodCode);

            expect(invoiceRepository.findOne).toHaveBeenCalledWith({
                where: { subscription: { id: subscriptionId }, status: { value: mockPendingStatus.value } }, // Use mock value here
                relations: ['subscription'],
            });
            expect(paymentRepository.create).toHaveBeenCalledWith({
                invoice: mockInvoice,
                paymentMethod: mockPaymentMethod,
                status: mockPendingStatus,
                amount: paymentAmount,
                paymentDate: expect.any(String),
            });
            expect(paymentRepository.save).toHaveBeenCalledWith(expect.any(Object));
            expect(invoiceRepository.save).toHaveBeenCalledWith(mockInvoice);
            expect(notificationsService.sendPaymentSuccessEmail).toHaveBeenCalledWith('test@example.com', 'Test Plan');
        });

        it('should throw NotFoundException if invoice is not found', async () => {
            const subscriptionId = 'sub_123';

            invoiceRepository.findOne.mockResolvedValue(null);

            await expect(service.handleSuccessfulPayment(subscriptionId, 1000, 'card')).rejects.toThrow(NotFoundException);
        });
    });

    describe('handleFailedPayment', () => {
        it('should handle a failed payment', async () => {
            const subscriptionId = 'sub_123';
            const mockSubscription = { id: subscriptionId, retryCount: 0, user: { email: 'test@example.com' }, subscriptionPlan: { name: 'Test Plan' } } as any;
            const mockOverdueStatus = { id: 'status_123', value: 'OVERDUE' } as any;
            const mockMaxRetriesSetting = { currentValue: '3' } as any; // Mocked max retries setting
            const mockRetryDelaySetting = { currentValue: '5' } as any; // Mocked retry delay setting

            customerSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            dataLookupRepository.findOne.mockResolvedValue(mockOverdueStatus);
            settingRepository.findOne.mockResolvedValueOnce(mockMaxRetriesSetting); // Mock the max retries setting
            settingRepository.findOne.mockResolvedValueOnce(mockRetryDelaySetting); // Mock the retry delay setting

            await service.handleFailedPayment(subscriptionId);

            expect(customerSubscriptionRepository.findOne).toHaveBeenCalledWith({
                where: { id: subscriptionId },
                relations: ['subscriptionStatus'],
            });
            expect(customerSubscriptionRepository.save).toHaveBeenCalledWith(expect.any(Object));
            expect(notificationsService.sendPaymentFailureEmail).toHaveBeenCalledWith('test@example.com', 'Test Plan');
            expect(paymentRetryQueue.add).toHaveBeenCalledWith({ subscriptionId, attempt: 1 }, { delay: 5 * 60 * 1000 });
        });
        it('should throw NotFoundException if subscription is not found', async () => {
            const subscriptionId = 'sub_123';

            customerSubscriptionRepository.findOne.mockResolvedValue(null);

            await expect(service.handleFailedPayment(subscriptionId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('scheduleRetry', () => {
        it('should schedule a payment retry', async () => {
            const subscriptionId = 'sub_123';
            const mockSubscription = { id: subscriptionId, retryCount: 0 } as any;
            const mockMaxRetriesSetting = { currentValue: '3' } as any;
            const mockRetryDelaySetting = { currentValue: '5' } as any;

            customerSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            settingRepository.findOne.mockResolvedValueOnce(mockMaxRetriesSetting);
            settingRepository.findOne.mockResolvedValueOnce(mockRetryDelaySetting);

            await service.scheduleRetry(subscriptionId);

            expect(paymentRetryQueue.add).toHaveBeenCalledWith(
                { subscriptionId, attempt: 1 },
                { delay: 5 * 60 * 1000 },
            );
            expect(customerSubscriptionRepository.save).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            const subscriptionId = 'sub_123';

            customerSubscriptionRepository.findOne.mockResolvedValue(null);

            await expect(service.scheduleRetry(subscriptionId)).rejects.toThrow(NotFoundException);
        });

        it('should not schedule a retry if retry count exceeds max retries', async () => {
            const subscriptionId = 'sub_123';
            const mockSubscription = { id: subscriptionId, retryCount: 3 } as any;
            const mockMaxRetriesSetting = { currentValue: '3' } as any;

            customerSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            settingRepository.findOne.mockResolvedValueOnce(mockMaxRetriesSetting);

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            await service.scheduleRetry(subscriptionId);

            expect(consoleLogSpy).toHaveBeenCalledWith(`Subscription ID ${subscriptionId} has reached the maximum number of retries.`);
            expect(paymentRetryQueue.add).not.toHaveBeenCalled();
        });
    });

    describe('retryPayment', () => {
        it('should retry a payment and succeed', async () => {
            const subscriptionId = 'sub_123';
            const mockInvoice = { id: 'inv_123', amount: 100, status: { value: 'FAILED' } } as any;
            const mockPaymentIntent = { id: 'pi_123', status: 'succeeded' } as any;
            const mockPaidStatus = { id: 'paid_status_123', value: 'PAID' } as any;
            const mockPaymentMethod = { id: 'method_123' } as any;

            invoiceRepository.findOne.mockResolvedValue(mockInvoice);
            stripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
            dataLookupRepository.findOne.mockResolvedValue(mockPaidStatus);
            paymentMethodRepository.findOne.mockResolvedValue(mockPaymentMethod);
            paymentRepository.create.mockReturnValue({ id: 'payment_123' } as any);

            const result = await service.retryPayment(subscriptionId);

            expect(result.success).toBe(true);
            expect(invoiceRepository.save).toHaveBeenCalledWith(mockInvoice);
            expect(paymentRepository.create).toHaveBeenCalledWith({
                amount: mockInvoice.amount,
                status: mockPaidStatus,
                invoice: mockInvoice,
                paymentMethod: mockPaymentMethod,
                referenceNumber: mockPaymentIntent.id,
                payerName: expect.any(String),
                paymentDate: expect.any(String),
            });
            expect(paymentRepository.save).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should throw NotFoundException if no unpaid invoice is found', async () => {
            const subscriptionId = 'sub_123';

            invoiceRepository.findOne.mockResolvedValue(null);

            await expect(service.retryPayment(subscriptionId)).rejects.toThrow(NotFoundException);
        });

        it('should return false if payment fails', async () => {
            const subscriptionId = 'sub_123';
            const mockInvoice = { id: 'inv_123', amount: 100, status: { value: 'FAILED' } } as any;
            const mockPaymentIntent = { id: 'pi_123', status: 'failed' } as any;

            invoiceRepository.findOne.mockResolvedValue(mockInvoice);
            stripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

            const result = await service.retryPayment(subscriptionId);

            expect(result.success).toBe(false);
        });

        it('should log an error and return success: false if an error occurs', async () => {
            const subscriptionId = 'sub_123';
            const mockInvoice = { id: 'inv_123', amount: 100, status: { value: InvoiceStatus.FAILED } } as any;
            const error = new Error('Test error');

            invoiceRepository.findOne.mockResolvedValue(mockInvoice);
            stripeService.createPaymentIntent.mockRejectedValue(error);

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.retryPayment(subscriptionId);

            expect(consoleErrorSpy).toHaveBeenCalledWith(`Failed to process payment for invoice ID ${mockInvoice.id}:`, error);
            expect(result.success).toBe(false);
        });
    });

    describe('getCustomerInfo', () => {
        it('should return the customer name if available', () => {
            const mockCustomer = { name: 'Test Customer' } as any;

            const result = service.getCustomerInfo(mockCustomer);

            expect(result).toBe('Test Customer');
        });

        it('should return "Stripe Customer" if customer name is not available', () => {
            const mockCustomer = {} as any;

            const result = service.getCustomerInfo(mockCustomer);

            expect(result).toBe('Stripe Customer');
        });

        it('should return customer string if input is a string', () => {
            const result = service.getCustomerInfo('cus_123');

            expect(result).toBe('cus_123');
        });

        it('should return "Stripe Customer" if customer is null', () => {
            const result = service.getCustomerInfo(null);

            expect(result).toBe('Stripe Customer');
        });
    });

    describe('confirmPayment', () => {
        it('should confirm payment and update subscription status', async () => {
            const subscriptionId = 'sub_123';
            const mockSubscription = { id: subscriptionId, subscriptionStatus: {} } as any;
            const mockActiveStatus = { id: 'status_123', value: 'ACTIVE' } as any;

            customerSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            dataLookupRepository.findOne.mockResolvedValue(mockActiveStatus);

            await service.confirmPayment(subscriptionId);

            expect(customerSubscriptionRepository.findOne).toHaveBeenCalledWith({
                where: { id: subscriptionId },
                relations: ['subscriptionStatus'],
            });
            expect(dataLookupRepository.findOne).toHaveBeenCalledWith({
                where: { type: SubscriptionStatus.TYPE, value: SubscriptionStatus.ACTIVE },
            });
            expect(customerSubscriptionRepository.save).toHaveBeenCalledWith(mockSubscription);
        });

        it('should throw NotFoundException if subscription is not found', async () => {
            const subscriptionId = 'sub_123';

            customerSubscriptionRepository.findOne.mockResolvedValue(null);

            await expect(service.confirmPayment(subscriptionId)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if active status is not found', async () => {
            const subscriptionId = 'sub_123';
            const mockSubscription = { id: subscriptionId, subscriptionStatus: {} } as any;

            customerSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            dataLookupRepository.findOne.mockResolvedValue(null);

            await expect(service.confirmPayment(subscriptionId)).rejects.toThrow(NotFoundException);
        });
    });
});
