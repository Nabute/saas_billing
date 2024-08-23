import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from '../../src/services/stripe.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

describe('StripeService', () => {
    let service: StripeService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StripeService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key: string) => {
                            if (key === 'STRIPE_SECRET') return 'test_stripe_secret';
                            if (key === 'STRIPE_WEBHOOK_SECRET') return 'test_webhook_secret';
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<StripeService>(StripeService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a payment intent', async () => {
        const paymentIntentData = {
            amount: 1000,
            currency: 'usd',
        } as Stripe.PaymentIntentCreateParams;

        const paymentIntent = {
            id: 'pi_123',
            ...paymentIntentData,
        } as Stripe.PaymentIntent;

        const mockResponse = {
            ...paymentIntent,
            lastResponse: {
                headers: {},
                requestId: 'req_test',
                statusCode: 200,
            },
        } as Stripe.Response<Stripe.PaymentIntent>;

        const createSpy = jest.spyOn(service['stripe'].paymentIntents, 'create').mockResolvedValue(mockResponse);

        const result = await service.createPaymentIntent(paymentIntentData);

        expect(result).toEqual(mockResponse);
        expect(createSpy).toHaveBeenCalledWith(paymentIntentData);
    });

    it('should retrieve an invoice', async () => {
        const invoiceId = 'in_123';
        const invoice = {
            id: invoiceId,
        } as Stripe.Invoice;

        const mockResponse = {
            ...invoice,
            lastResponse: {
                headers: {},
                requestId: 'req_test',
                statusCode: 200,
            },
        } as Stripe.Response<Stripe.Invoice>;

        const retrieveSpy = jest.spyOn(service['stripe'].invoices, 'retrieve').mockResolvedValue(mockResponse);

        const result = await service.retrieveInvoice(invoiceId);

        expect(result).toEqual(mockResponse);
        expect(retrieveSpy).toHaveBeenCalledWith(invoiceId);
    });

    it('should pay an invoice and return the payment intent', async () => {
        const invoiceId = 'in_123';
        const paymentIntent = {
            id: 'pi_123',
        } as Stripe.PaymentIntent;

        const invoice = {
            id: invoiceId,
            payment_intent: paymentIntent,
        } as Stripe.Invoice;

        const mockResponse = {
            ...invoice,
            lastResponse: {
                headers: {},
                requestId: 'req_test',
                statusCode: 200,
            },
        } as Stripe.Response<Stripe.Invoice>;

        const paySpy = jest.spyOn(service['stripe'].invoices, 'pay').mockResolvedValue(mockResponse);

        const result = await service.payInvoice(invoiceId);

        expect(result).toEqual(paymentIntent);
        expect(paySpy).toHaveBeenCalledWith(invoiceId);
    });

    it('should construct an event from webhook payload', () => {
        const payload = Buffer.from('test_payload');
        const signature = 'test_signature';
        const webhookSecret = 'test_webhook_secret';

        const event = {
            id: 'evt_123',
        } as Stripe.Event;

        const constructEventSpy = jest.spyOn(service['stripe'].webhooks, 'constructEvent').mockReturnValue(event);

        const result = service.constructEvent(payload, signature);

        expect(result).toEqual(event);
        expect(constructEventSpy).toHaveBeenCalledWith(payload, signature, webhookSecret);
    });
});
