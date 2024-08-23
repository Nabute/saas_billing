import { Test, TestingModule } from '@nestjs/testing';
import { PaymentProcessor } from '../../src/processors/payment.processor';
import { PaymentService } from '../../src/services/payment.service';
import { Job } from 'bull';

describe('PaymentProcessor', () => {
    let paymentProcessor: PaymentProcessor;
    let paymentService: PaymentService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentProcessor,
                {
                    provide: PaymentService,
                    useValue: {
                        retryPayment: jest.fn(),
                        scheduleRetry: jest.fn(),
                        confirmPayment: jest.fn(),
                    },
                },
            ],
        }).compile();

        paymentProcessor = module.get<PaymentProcessor>(PaymentProcessor);
        paymentService = module.get<PaymentService>(PaymentService);
    });

    it('should be defined', () => {
        expect(paymentProcessor).toBeDefined();
    });

    describe('handleRetry', () => {
        it('should confirm payment if retry is successful', async () => {
            const mockJob = {
                data: {
                    subscriptionId: 'valid-subscription-id',
                    attempt: 1,
                },
            } as Job;

            jest.spyOn(paymentService, 'retryPayment').mockResolvedValue({ success: true });
            const confirmPaymentSpy = jest.spyOn(paymentService, 'confirmPayment');

            await paymentProcessor.handleRetry(mockJob);

            expect(paymentService.retryPayment).toHaveBeenCalledWith('valid-subscription-id');
            expect(confirmPaymentSpy).toHaveBeenCalledWith('valid-subscription-id');
            expect(paymentService.scheduleRetry).not.toHaveBeenCalled();
        });

        it('should schedule another retry if retry fails', async () => {
            const mockJob = {
                data: {
                    subscriptionId: 'valid-subscription-id',
                    attempt: 1,
                },
            } as Job;

            jest.spyOn(paymentService, 'retryPayment').mockResolvedValue({ success: false });
            const scheduleRetrySpy = jest.spyOn(paymentService, 'scheduleRetry');

            await paymentProcessor.handleRetry(mockJob);

            expect(paymentService.retryPayment).toHaveBeenCalledWith('valid-subscription-id');
            expect(scheduleRetrySpy).toHaveBeenCalledWith('valid-subscription-id', 2);
            expect(paymentService.confirmPayment).not.toHaveBeenCalled();
        });

        it('should schedule another retry if an error occurs', async () => {
            const mockJob = {
                data: {
                    subscriptionId: 'valid-subscription-id',
                    attempt: 1,
                },
            } as Job;

            jest.spyOn(paymentService, 'retryPayment').mockRejectedValue(new Error('Payment error'));
            const scheduleRetrySpy = jest.spyOn(paymentService, 'scheduleRetry');

            await paymentProcessor.handleRetry(mockJob);

            expect(paymentService.retryPayment).toHaveBeenCalledWith('valid-subscription-id');
            expect(scheduleRetrySpy).toHaveBeenCalledWith('valid-subscription-id', 2);
            expect(paymentService.confirmPayment).not.toHaveBeenCalled();
        });
    });
});
