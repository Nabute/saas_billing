import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { StripeService } from '../services/stripe.service';
import { PaymentService } from '../services/payment.service';
import Stripe from 'stripe';
import { DataSource } from 'typeorm';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentService: PaymentService,
    private readonly dataSource: DataSource, // Inject DataSource for transaction management
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') sig: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructEvent(payload, sig);
    } catch (err) {
      console.error(`Webhook signature verification failed.`, err.message);
      throw new BadRequestException('Webhook signature verification failed.');
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await this.handleCheckoutSessionCompleted(session);
          break;
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          await this.handleInvoicePaymentFailed(failedInvoice);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.error(`Error handling event type ${event.type}`, error.message);
      throw new BadRequestException(
        `Error processing webhook event: ${event.type}`,
      );
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (session.subscription && session.amount_total !== null) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const invoice = await this.paymentService.findInvoiceById(
          session.metadata.invoiceId as string,
          queryRunner.manager, // Pass the EntityManager from the QueryRunner
        );

        if (invoice) {
          await this.paymentService.handleSuccessfulPayment(
            invoice,
            session.payment_intent as Stripe.PaymentIntent,
            queryRunner.manager, // Pass the EntityManager to handleSuccessfulPayment
          );
          await queryRunner.commitTransaction();
        } else {
          console.error(`Invoice not found for subscription ID: ${session.subscription}`);
          await queryRunner.rollbackTransaction();
        }
      } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error(
          `Failed to handle checkout session completed for subscription ID ${session.subscription}:`,
          error.message,
        );
        throw new BadRequestException('Failed to handle checkout session completed.');
      } finally {
        await queryRunner.release();
      }
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await this.paymentService.handleFailedPayment(
          invoice.subscription as string,
          queryRunner.manager,
        );
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error(
          `Failed to handle failed payment for subscription ID ${invoice.subscription}:`,
          error.message,
        );
        throw new BadRequestException('Failed to handle failed payment.');
      } finally {
        await queryRunner.release();
      }
    }
  }
}
