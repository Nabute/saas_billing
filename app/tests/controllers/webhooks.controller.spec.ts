import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from '../../src/controllers/webhooks.controller';
import { StripeService } from '../../src/services/stripe.service';
import { PaymentService } from '../../src/services/payment.service';
import { PaymentMethodCode } from '../../src/utils/enums';
import Stripe from 'stripe';

describe('WebhooksController', () => {
    let controller: WebhooksController;
    let stripeService: StripeService;
    let paymentService: PaymentService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [WebhooksController],
            providers: [
                {
                    provide: StripeService,
                    useValue: {
                        constructEvent: jest.fn(),
                    },
                },
                {
                    provide: PaymentService,
                    useValue: {
                        handleSuccessfulPayment: jest.fn(),
                        handleFailedPayment: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<WebhooksController>(WebhooksController);
        stripeService = module.get<StripeService>(StripeService);
        paymentService = module.get<PaymentService>(PaymentService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('handleStripeWebhook', () => {
        it('should handle checkout.session.completed event', async () => {
            const payload = { /* mock payload */ };
            const signature = 'mock-signature';
            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        subscription: 'sub_12345',
                        amount_total: 2000,
                    },
                },
            } as Stripe.Event;

            jest.spyOn(stripeService, 'constructEvent').mockReturnValue(mockEvent);

            await controller.handleStripeWebhook(payload, signature);

            expect(stripeService.constructEvent).toHaveBeenCalledWith(payload, signature);
            expect(paymentService.handleSuccessfulPayment).toHaveBeenCalledWith(
                'sub_12345',
                2000,
                PaymentMethodCode.STRIPE,
            );
        });

        it('should handle invoice.payment_failed event', async () => {
            const payload = { /* mock payload */ };
            const signature = 'mock-signature';
            const mockEvent = {
                type: 'invoice.payment_failed',
                data: {
                    object: {
                        subscription: 'sub_12345',
                    },
                },
            } as Stripe.Event;

            jest.spyOn(stripeService, 'constructEvent').mockReturnValue(mockEvent);

            await controller.handleStripeWebhook(payload, signature);

            expect(stripeService.constructEvent).toHaveBeenCalledWith(payload, signature);
            expect(paymentService.handleFailedPayment).toHaveBeenCalledWith('sub_12345');
        });

        it('should handle unhandled event types gracefully', async () => {
            const payload = { /* mock payload */ };
            const signature = 'mock-signature';
            const mockEvent = {
                type: 'unknown.event',
                data: {
                    object: {},
                },
            } as unknown as Stripe.Event;

            jest.spyOn(stripeService, 'constructEvent').mockReturnValue(mockEvent);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await controller.handleStripeWebhook(payload, signature);

            expect(stripeService.constructEvent).toHaveBeenCalledWith(payload, signature);
            expect(consoleSpy).toHaveBeenCalledWith('Unhandled event type unknown.event');
            expect(result).toEqual({ received: true });

            consoleSpy.mockRestore();
        });
    });
});
