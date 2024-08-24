import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from '../../src/controllers/webhooks.controller';
import { StripeService } from '../../src/services/stripe.service';
import { PaymentService } from '../../src/services/payment.service';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

describe('WebhooksController', () => {
    let controller: WebhooksController;
    let stripeService: StripeService;
    let paymentService: PaymentService;
    let dataSource: DataSource;
    let queryRunner: QueryRunner;

    beforeEach(async () => {
      queryRunner = {
          connect: jest.fn(),
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          rollbackTransaction: jest.fn(),
          release: jest.fn(),
          manager: {} as EntityManager,
      } as unknown as QueryRunner;

      dataSource = {
          createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      } as unknown as DataSource;

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
              findInvoiceById: jest.fn(),
                  handleSuccessfulPayment: jest.fn(),
                  handleFailedPayment: jest.fn(),
              },
          },
          {
              provide: DataSource,
              useValue: dataSource,
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
        const mockSession = {
            subscription: 'sub_12345',
            amount_total: 2000,
            metadata: {
                invoiceId: 'inv_12345',
            },
            payment_intent: 'pi_12345',
        } as unknown as Stripe.Checkout.Session;

        const mockEvent = {
            type: 'checkout.session.completed',
            data: {
              object: mockSession,
          },
      } as Stripe.Event;

        jest.spyOn(stripeService, 'constructEvent').mockReturnValue(mockEvent);
        jest.spyOn(paymentService, 'findInvoiceById').mockResolvedValue({} as any);

        await controller.handleStripeWebhook(payload, signature);

        expect(stripeService.constructEvent).toHaveBeenCalledWith(payload, signature);
        expect(queryRunner.startTransaction).toHaveBeenCalled();
        expect(paymentService.findInvoiceById).toHaveBeenCalledWith(
            'inv_12345',
            queryRunner.manager,
        );
        expect(paymentService.handleSuccessfulPayment).toHaveBeenCalledWith(
          expect.any(Object), // The found invoice
          mockSession.payment_intent,
          queryRunner.manager,
      );
        expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

      it('should handle invoice.payment_failed event', async () => {
          const payload = { /* mock payload */ };
          const signature = 'mock-signature';
        const mockInvoice = {
            subscription: 'sub_12345',
        } as unknown as Stripe.Invoice;

        const mockEvent = {
            type: 'invoice.payment_failed',
            data: {
                object: mockInvoice,
            },
        } as Stripe.Event;

        jest.spyOn(stripeService, 'constructEvent').mockReturnValue(mockEvent);

        await controller.handleStripeWebhook(payload, signature);

        expect(stripeService.constructEvent).toHaveBeenCalledWith(payload, signature);
        expect(queryRunner.startTransaction).toHaveBeenCalled();
        expect(paymentService.handleFailedPayment).toHaveBeenCalledWith(
            'sub_12345',
            queryRunner.manager,
        );
        expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

      it('should rollback transaction on error during checkout.session.completed', async () => {
          const payload = { /* mock payload */ };
          const signature = 'mock-signature';
          const mockSession = {
              subscription: 'sub_12345',
            amount_total: 2000,
            metadata: {
                invoiceId: 'inv_12345',
            },
            payment_intent: 'pi_12345',
        } as unknown as Stripe.Checkout.Session;

        const mockEvent = {
            type: 'checkout.session.completed',
            data: {
                object: mockSession,
          },
        } as Stripe.Event;

        jest.spyOn(stripeService, 'constructEvent').mockReturnValue(mockEvent);
        jest.spyOn(paymentService, 'findInvoiceById').mockRejectedValue(new Error('Test Error'));

        await expect(controller.handleStripeWebhook(payload, signature)).rejects.toThrow(BadRequestException);

        expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });

      it('should rollback transaction on error during invoice.payment_failed', async () => {
          const payload = { /* mock payload */ };
          const signature = 'mock-signature';
          const mockInvoice = {
              subscription: 'sub_12345',
          } as unknown as Stripe.Invoice;

          const mockEvent = {
              type: 'invoice.payment_failed',
              data: {
                  object: mockInvoice,
          },
      } as Stripe.Event;

        jest.spyOn(stripeService, 'constructEvent').mockReturnValue(mockEvent);
        jest.spyOn(paymentService, 'handleFailedPayment').mockRejectedValue(new Error('Test Error'));

        await expect(controller.handleStripeWebhook(payload, signature)).rejects.toThrow(BadRequestException);

        expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
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
