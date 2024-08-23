import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
    private readonly stripe: Stripe;

    constructor(private readonly configService: ConfigService) {
        this.stripe = new Stripe(this.configService.get("STRIPE_SECRET"), {
            apiVersion: '2024-06-20',
        });
    }

    async createPaymentIntent(data: Stripe.PaymentIntentCreateParams): Promise<Stripe.PaymentIntent> {
        return this.stripe.paymentIntents.create(data);
    }

    async retrieveInvoice(invoiceId: string): Promise<Stripe.Invoice> {
        return this.stripe.invoices.retrieve(invoiceId);
    }

    async payInvoice(invoiceId: string): Promise<Stripe.PaymentIntent> {
        const invoice = await this.stripe.invoices.pay(invoiceId);
        return invoice.payment_intent as Stripe.PaymentIntent;
    }

    constructEvent(payload: any, signature: string): Stripe.Event {
        return this.stripe.webhooks.constructEvent(payload, signature, this.configService.get("STRIPE_WEBHOOK_SECRET"));
    }
}
