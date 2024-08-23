import { Controller, Post, Body, Headers } from '@nestjs/common';
import { StripeService } from '../services/stripe.service';
import { PaymentService } from '../services/payment.service';
import { PaymentMethodCode } from 'src/utils/enums';

@Controller('webhooks')
export class WebhooksController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly paymentService: PaymentService,
    ) { }

    @Post('stripe')
    async handleStripeWebhook(@Body() payload: any, @Headers('stripe-signature') sig: string) {
        const event = this.stripeService.constructEvent(payload, sig);

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                await this.paymentService.handleSuccessfulPayment(
                    session.subscription as string, session.amount_total, PaymentMethodCode.STRIPE
                );
                break;
            case 'invoice.payment_failed':
                const failedSession = event.data.object;
                await this.paymentService.handleFailedPayment(
                    failedSession.subscription as string
                );
                break;
            // Handle other event types...
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return { received: true };
    }
}
