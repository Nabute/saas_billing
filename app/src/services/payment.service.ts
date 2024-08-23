import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { CustomerSubscription } from '../entities/customer.entity';
import { StripeService } from './stripe.service';
import { InvoiceStatus, JobQueues, PaymentMethodCode, PaymentRetrySettings, PaymentStatus, SubscriptionStatus } from '../utils/enums';
import { DataLookup } from '../entities/data-lookup.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { SystemSetting } from '../entities/system-settings.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Stripe from 'stripe';
import { NotificationsService } from './notifications.service';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(PaymentMethod)
        private readonly paymentMethodRepository: Repository<PaymentMethod>,
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
        @InjectRepository(CustomerSubscription)
        private readonly customerSubscriptionRepository: Repository<CustomerSubscription>,
        @InjectRepository(DataLookup)
        private readonly dataLookupRepository: Repository<DataLookup>,
        @InjectRepository(SystemSetting)
        private readonly settingRepository: Repository<SystemSetting>,
        @InjectQueue(JobQueues.PAYMENT_RETRY) private paymentRetryQueue: Queue,
        private readonly stripeService: StripeService,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Handles successful payment processing.
     * 
     * @param subscriptionId - The ID of the subscription associated with the payment.
     * @param paymentAmount - The amount paid.
     * @param paymentMethodCode - The code of the payment method used.
     * @throws NotFoundException if the related invoice or payment method is not found.
     */
    async handleSuccessfulPayment(subscriptionId: string, paymentAmount: number, paymentMethodCode: string): Promise<void> {
        const invoice = await this.invoiceRepository.findOne({
            where: { subscription: { id: subscriptionId }, status: { value: InvoiceStatus.PENDING } },
            relations: ['subscription'],
        });

        if (!invoice) {
            throw new NotFoundException(`Invoice not found for subscription ID ${subscriptionId}`);
        }

        const verifiedPaymentStatus = await this.dataLookupRepository.findOne({ where: { value: PaymentStatus.VERIFIED } });
        const paymentMethod = await this.paymentMethodRepository.findOne({ where: { code: paymentMethodCode } });

        const payment = this.paymentRepository.create({
            invoice,
            paymentMethod,
            status: verifiedPaymentStatus,
            amount: paymentAmount,
            paymentDate: new Date().toISOString(),
        });

        await this.paymentRepository.save(payment);

        const paidInvoiceStatus = await this.dataLookupRepository.findOne({ where: { value: InvoiceStatus.PAID } });
        invoice.status = paidInvoiceStatus;
        invoice.paymentDate = new Date();
        await this.invoiceRepository.save(invoice);

        await this.notificationsService.sendPaymentSuccessEmail(invoice.subscription.user.email, invoice.subscription.subscriptionPlan.name);
    }

    /**
     * Handles failed payment processing.
     * 
     * @param subscriptionId - The ID of the subscription associated with the failed payment.
     * @throws NotFoundException if the subscription is not found.
     */
    async handleFailedPayment(subscriptionId: string): Promise<void> {
        const subscription = await this.customerSubscriptionRepository.findOne({
            where: { id: subscriptionId },
            relations: ['subscriptionStatus'],
        });

        if (!subscription) {
            throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
        }

        const overdueStatus = await this.dataLookupRepository.findOne({
            where: { type: SubscriptionStatus.TYPE, value: SubscriptionStatus.OVERDUE },
        });

        subscription.subscriptionStatus = overdueStatus;
        await this.customerSubscriptionRepository.save(subscription);

        await this.notificationsService.sendPaymentFailureEmail(subscription.user.email, subscription.subscriptionPlan.name);
        await this.scheduleRetry(subscriptionId);
    }

    /**
     * Schedules a retry for a failed payment.
     * 
     * @param subscriptionId - The ID of the subscription to retry payment for.
     * @param attempt - The current retry attempt number.
     * @throws NotFoundException if the subscription is not found.
     */
    async scheduleRetry(subscriptionId: string, attempt = 1): Promise<void> {
        const subscription = await this.customerSubscriptionRepository.findOne({
            where: { id: subscriptionId },
        });

        if (!subscription) {
            throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
        }

        const maxRetriesSetting = await this.settingRepository.findOne({ where: { code: PaymentRetrySettings.MAX_RETRIES } });
        if (subscription.retryCount >= parseInt(maxRetriesSetting.currentValue)) {
            console.log(`Subscription ID ${subscription.id} has reached the maximum number of retries.`);
            return;
        }

        const retryDelaySetting = await this.settingRepository.findOne({ where: { code: PaymentRetrySettings.RETRY_DELAY_MINUTES } });
        const nextRun = parseInt(retryDelaySetting.currentValue) * 60 * 1000;

        await this.paymentRetryQueue.add(
            {
                subscriptionId,
                attempt,
            },
            {
                delay: nextRun,
            },
        );

        subscription.retryCount = attempt;
        subscription.nextRetry = new Date(Date.now() + nextRun);
        await this.customerSubscriptionRepository.save(subscription);

        console.log(`Scheduled retry #${subscription.retryCount} for subscription ID ${subscription.id} at ${subscription.nextRetry}`);
    }

    /**
     * Attempts to retry a failed payment.
     * 
     * @param subscriptionId - The ID of the subscription to retry payment for.
     * @returns An object indicating the success status of the payment retry.
     * @throws NotFoundException if no unpaid invoice is found for the subscription.
     */
    async retryPayment(subscriptionId: string): Promise<{ success: boolean }> {
        const invoice = await this.invoiceRepository.findOne({
            where: { subscription: { id: subscriptionId }, status: { value: InvoiceStatus.FAILED } },
            order: { paymentDueDate: 'DESC' },
        });

        if (!invoice) {
            throw new NotFoundException(`No unpaid invoice found for subscription ID ${subscriptionId}`);
        }

        try {
            const paymentIntent = await this.stripeService.createPaymentIntent({
                amount: Math.round(invoice.amount * 100),
                currency: 'usd',
                payment_method_types: ['card'],
                description: `Payment for Invoice #${invoice.id}`,
                metadata: {
                    invoiceId: invoice.id,
                    subscriptionId: subscriptionId,
                },
            });

            if (paymentIntent.status === 'succeeded') {
                const paidStatus = await this.dataLookupRepository.findOne({ where: { value: InvoiceStatus.PAID } });
                invoice.status = paidStatus;
                invoice.paymentDate = new Date();
                await this.invoiceRepository.save(invoice);

                const paymentMethod = await this.getDefaultPaymentMethod();
                const payment = this.paymentRepository.create({
                    amount: invoice.amount,
                    status: paidStatus,
                    invoice: invoice,
                    paymentMethod: paymentMethod,
                    referenceNumber: paymentIntent.id,
                    payerName: this.getCustomerInfo(paymentIntent.customer),
                    paymentDate: invoice.paymentDate.toISOString(),
                });
                await this.paymentRepository.save(payment);

                return { success: true };
            } else {
                return { success: false };
            }
        } catch (error) {
            console.error(`Failed to process payment for invoice ID ${invoice.id}:`, error);
            return { success: false };
        }
    }

    /**
     * Retrieves the default payment method for the system.
     * 
     * @returns The PaymentMethod entity corresponding to the default payment method.
     */
    async getDefaultPaymentMethod(): Promise<PaymentMethod> {
        return this.paymentMethodRepository.findOne({ where: { code: PaymentMethodCode.STRIPE } });
    }

    /**
     * Extracts customer information from the Stripe customer object.
     * 
     * @param customer - The Stripe customer object or customer ID.
     * @returns The customer's name or a default value if not available.
     */
    getCustomerInfo(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
        if (typeof customer === 'string') {
            return customer;
        }

        if (customer && 'name' in customer) {
            return customer.name || 'Stripe Customer';
        }

        return 'Stripe Customer';
    }

    /**
     * Confirms a successful payment and updates the subscription status to active.
     * 
     * @param subscriptionId - The ID of the subscription to confirm payment for.
     * @throws NotFoundException if the subscription or active status is not found.
     */
    async confirmPayment(subscriptionId: string): Promise<void> {
        const subscription = await this.customerSubscriptionRepository.findOne({
            where: { id: subscriptionId },
            relations: ['subscriptionStatus'],
        });

        if (!subscription) {
            throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
        }

        const activeStatus = await this.dataLookupRepository.findOne({
            where: { type: SubscriptionStatus.TYPE, value: SubscriptionStatus.ACTIVE },
        });

        if (!activeStatus) {
            throw new NotFoundException(`Active status not found.`);
        }

        subscription.subscriptionStatus = activeStatus;
        await this.customerSubscriptionRepository.save(subscription);
    }
}
