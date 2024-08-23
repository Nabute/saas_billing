import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
    private readonly stripe: Stripe;

    constructor(private readonly configService: ConfigService) {
        const stripeSecret = this.configService.get<string>('STRIPE_SECRET');
        if (!stripeSecret) {
            throw new BadRequestException('Stripe secret key not configured');
        }
        this.stripe = new Stripe(stripeSecret, {
            apiVersion: '2024-06-20',
        });
    }

    /**
     * Creates a payment intent with the specified data.
     * 
     * @param data - The payment intent creation parameters.
     * @returns A Promise that resolves to the created PaymentIntent.
     */
    async createPaymentIntent(data: Stripe.PaymentIntentCreateParams): Promise<Stripe.PaymentIntent> {
        return await this.stripe.paymentIntents.create(data);
    }

    /**
     * Retrieves an invoice by its ID.
     * 
     * @param invoiceId - The ID of the invoice to retrieve.
     * @returns A Promise that resolves to the retrieved Invoice.
     */
    async retrieveInvoice(invoiceId: string): Promise<Stripe.Invoice> {
        return await this.stripe.invoices.retrieve(invoiceId);
    }

    /**
     * Pays an invoice by its ID.
     * 
     * @param invoiceId - The ID of the invoice to pay.
     * @returns A Promise that resolves to the PaymentIntent associated with the paid invoice.
     */
    async payInvoice(invoiceId: string): Promise<Stripe.PaymentIntent> {
        const invoice = await this.stripe.invoices.pay(invoiceId);
        return invoice.payment_intent as Stripe.PaymentIntent;
    }

    /**
     * Constructs a Stripe event from a webhook payload and signature.
     * 
     * @param payload - The raw body of the incoming webhook request.
     * @param signature - The signature header sent by Stripe.
     * @returns The constructed Stripe event.
     * @throws Error if the event cannot be constructed.
     */
    constructEvent(payload: any, signature: string): Stripe.Event {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new BadRequestException('Stripe webhook secret not configured');
        }
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
}
