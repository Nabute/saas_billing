import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { CustomerSubscription } from '../entities/customer.entity';
import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';
import { InvoiceStatus, JobQueues, PaymentMethodCode, PaymentRetrySettings, PaymentStatus, SubscriptionStatus } from '../utils/enums';
import { DataLookup } from '../entities/data-lookup.entity';
import { PaymentMethod } from 'src/entities/payment-method.entity';
import { SystemSetting } from 'src/entities/system-settings.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Stripe from 'stripe';

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
    ) { }

    async handleSuccessfulPayment(subscriptionId: string, paymentAmount: number, paymentMethodCode: string): Promise<void> {
        const invoice = await this.invoiceRepository.findOne({
            where: { subscription: { id: subscriptionId }, status: { value: InvoiceStatus.PENDING } },
            relations: ['subscription'],
        });

        if (!invoice) {
            throw new NotFoundException(`Invoice not found for subscription ID ${subscriptionId}`);
        }

        // Record the payment
        const verifiedPaymentStatus = await this.dataLookupRepository.findOne({ where: { value: PaymentStatus.VERIFIED } })
        const paymentMethod = await this.paymentMethodRepository.findOne({ where: { code: paymentMethodCode } })
        const payment = this.paymentRepository.create({
            invoice,
            paymentMethod,
            status: verifiedPaymentStatus,
            amount: paymentAmount,
            paymentDate: new Date().toISOString(),
        });

        await this.paymentRepository.save(payment);

        // Update the invoice status to 'paid'
        const paidInvoiceStatus = await this.dataLookupRepository.findOne({ where: { value: InvoiceStatus.PAID } })
        invoice.status = paidInvoiceStatus;
        invoice.paymentDate = new Date();
        await this.invoiceRepository.save(invoice);
    }

    // Handle failed payment event
    async handleFailedPayment(subscriptionId: string): Promise<void> {
        const subscription = await this.customerSubscriptionRepository.findOne({
            where: { id: subscriptionId },
            relations: ['subscriptionStatus'],
        });

        if (!subscription) {
            throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
        }

        // Mark subscription as overdue or retry payment logic here
        const overdueStatus = await this.dataLookupRepository.findOne({
            where: { type: SubscriptionStatus.TYPE, value: SubscriptionStatus.OVERDUE },
        });
        subscription.subscriptionStatus = overdueStatus;
        await this.customerSubscriptionRepository.save(subscription);

        // Optionally, schedule a retry
        await this.scheduleRetry(subscriptionId);
    }

    async scheduleRetry(subscriptionId: string, attempt = 1) {
        const subscription = await this.customerSubscriptionRepository.findOne({
            where: { id: subscriptionId },
        });

        if (!subscription) {
            throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
        }

        // Check if the maximum number of retries has been reached
        const maxRetriesSetting = await this.settingRepository.findOne({ where: { code: PaymentRetrySettings.MAX_RETRIES } })
        if (subscription.retryCount >= parseInt(maxRetriesSetting.currentValue)) {
            console.log(`Subscription ID ${subscription.id} has reached the maximum number of retries.`);
            return;
        }

        // Increment the retry count and set the next retry time
        const retryDelaySetting = await this.settingRepository.findOne({ where: { code: PaymentRetrySettings.RETRY_DELAY_MINUTES } })
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

    async retryPayment(subscriptionId: string): Promise<{ success: boolean }> {
        // Find the latest unpaid invoice for the subscription
        const invoice = await this.invoiceRepository.findOne({
            where: { subscription: { id: subscriptionId }, status: { value: InvoiceStatus.FAILED } },
            order: { paymentDueDate: 'DESC' },
        });

        if (!invoice) {
            throw new NotFoundException(`No unpaid invoice found for subscription ID ${subscriptionId}`);
        }

        try {
            // Attempt to charge the customer via Stripe for the invoice amount
            const paymentIntent = await this.stripeService.createPaymentIntent({
                amount: Math.round(invoice.amount * 100),
                currency: 'usd',
                payment_method_types: ['card'], // Assuming card payment
                description: `Payment for Invoice #${invoice.id}`,
                metadata: {
                    invoiceId: invoice.id,
                    subscriptionId: subscriptionId,
                },
            });

            if (paymentIntent.status === 'succeeded') {
                // Update the invoice status to 'paid'
                const paidStatus = await this.dataLookupRepository.findOne({ where: { value: InvoiceStatus.PAID } });
                invoice.status = paidStatus;
                invoice.paymentDate = new Date();
                await this.invoiceRepository.save(invoice);

                //TODO: needs more work here.
                const paymentMethod = await this.getDefaultPaymentMethod();
                // Create a new Payment record
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
                // If payment did not succeed, return false
                return { success: false };
            }
        } catch (error) {
            console.error(`Failed to process payment for invoice ID ${invoice.id}:`, error);
            return { success: false };
        }
    }

    async getDefaultPaymentMethod(): Promise<PaymentMethod> {
        return this.paymentMethodRepository.findOne({ where: { code: PaymentMethodCode.STRIPE } })
    }

    getCustomerInfo(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
        if (typeof customer === 'string') {
            return customer;
        }

        if (customer && 'name' in customer) {
            return customer.name || 'Stripe Customer';
        }

        return 'Stripe Customer';
    }

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

    @Cron(CronExpression.EVERY_HOUR)
    async retryFailedPayments() {
        const failedSubscriptions = await this.customerSubscriptionRepository.find({
            where: { subscriptionStatus: { value: SubscriptionStatus.OVERDUE } },
        });

        for (const subscription of failedSubscriptions) {
            try {
                // Retry payment using Stripe or another payment service
                const paymentResult = await this.retryPayment(subscription.id);
                if (paymentResult.success) {
                    await this.confirmPayment(subscription.id);
                } else {
                    await this.scheduleRetry(subscription.id);
                }
            } catch (error) {
                console.error(`Failed to retry payment for subscription ID ${subscription.id}:`, error);
            }
        }
    }
}
