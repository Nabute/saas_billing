import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { StripeService } from '../services/stripe.service';
import { PaymentService } from '../services/payment.service';
import { PaymentMethodCode } from '../utils/enums';
import Stripe from 'stripe';

/**
 * Controller to handle incoming webhooks from various services.
 */
@Controller('webhooks')
export class WebhooksController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly paymentService: PaymentService,
    ) { }

    /**
     * Handles Stripe webhook events.
     *
     * @param payload - The raw body of the incoming Stripe webhook request.
     * @param sig - The Stripe signature header used to verify the webhook.
     * @returns Acknowledgment of the event receipt.
     * @throws BadRequestException if the event cannot be verified.
     */
    @Post('stripe')
    async handleStripeWebhook(@Body() payload: any, @Headers('stripe-signature') sig: string) {
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
                    await this.paymentService.handleSuccessfulPayment(
                        session.subscription as string, session.amount_total, PaymentMethodCode.STRIPE
                    );
                    break;
                case 'invoice.payment_failed':
                    const failedSession = event.data.object as Stripe.Invoice;
                    await this.paymentService.handleFailedPayment(
                        failedSession.subscription as string
                    );
                    break;
                // Handle other event types...
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
        } catch (error) {
            console.error(`Error handling event type ${event.type}`, error.message);
            throw new BadRequestException(`Error processing webhook event: ${event.type}`);
        }

        return { received: true };
    }
}
