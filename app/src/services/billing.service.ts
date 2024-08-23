import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerSubscription } from '../entities/customer.entity';
import { Invoice } from '../entities/invoice.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { InvoiceStatus, JobQueues, SubscriptionStatus } from '../utils/enums';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationsService } from './notifications.service';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(CustomerSubscription)
        private readonly customerSubscriptionRepository: Repository<CustomerSubscription>,
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
        @InjectRepository(DataLookup)
        private readonly dataLookupRepository: Repository<DataLookup>,
        @InjectRepository(SubscriptionPlan)
        private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
        @InjectQueue(JobQueues.BILLING) private billingQueue: Queue,
        private readonly notificationsService: NotificationsService,
    ) { }

    async scheduleInvoiceGeneration(): Promise<void> {
        const today = new Date();
        const subscriptions = await this.customerSubscriptionRepository.find({
            where: {
                nextBillingDate: today,
                subscriptionStatus: { value: SubscriptionStatus.ACTIVE },
            },
            relations: ['subscriptionPlan', 'user'],
        });

        for (const subscription of subscriptions) {
            await this.billingQueue.add('generateInvoice', { subscriptionId: subscription.id });
        }
    }

    async createInvoiceForSubscription(subscription: CustomerSubscription): Promise<void> {
        const amountDue = subscription.subscriptionPlan.price;

        const invoice = this.invoiceRepository.create({
            customerId: subscription.user.id,
            amount: amountDue,
            status: await this.dataLookupRepository.findOne({ where: { value: InvoiceStatus.PENDING } }),
            paymentDueDate: this.calculateNextBillingDate(new Date(), subscription.subscriptionPlan.billingCycleDays),
            subscription: subscription,
        });

        await this.invoiceRepository.save(invoice);

        // Send notification after invoice is generated.
        await this.notificationsService.sendInvoiceGeneratedEmail(subscription.user.email, invoice.id);

        // Update subscription's next billing date
        subscription.nextBillingDate = this.calculateNextBillingDate(subscription.nextBillingDate, subscription.subscriptionPlan.billingCycleDays);
        await this.customerSubscriptionRepository.save(subscription);
    }

    private calculateNextBillingDate(startDate: Date, billingCycleDays: number): Date {
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setDate(nextBillingDate.getDate() + billingCycleDays);
        return nextBillingDate;
    }

    async handleSubscriptionChange(subscriptionId: string, newPlanId: string): Promise<void> {
        const subscription = await this.customerSubscriptionRepository.findOne({
            where: { id: subscriptionId },
            relations: ['subscriptionPlan'],
        });

        if (!subscription) {
            throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
        }

        const newPlan = await this.subscriptionPlanRepository.findOne({ where: { id: newPlanId } });

        if (!newPlan) {
            throw new NotFoundException(`Subscription plan with ID ${newPlanId} not found`);
        }

        const daysRemaining = this.getDaysRemainingInCycle(subscription.nextBillingDate);
        const proratedAmount = this.calculateProratedAmount(
            subscription.subscriptionPlan.price,
            newPlan.price,
            daysRemaining,
            subscription.subscriptionPlan.billingCycleDays
        );

        // Update the next invoice with the prorated amount
        const invoice = await this.invoiceRepository.findOne({
            where: { subscription: { id: subscriptionId }, status: { value: InvoiceStatus.PENDING } },
        });

        if (invoice) {
            invoice.amount += proratedAmount;
            await this.invoiceRepository.save(invoice);
        }

        // Update the subscription with the new plan
        subscription.subscriptionPlan = newPlan;
        await this.customerSubscriptionRepository.save(subscription);
    }

    private calculateProratedAmount(
        currentPlanPrice: number,
        newPlanPrice: number,
        daysRemaining: number,
        billingCycleDays: number
    ): number {
        const dailyCurrentPlanRate = currentPlanPrice / billingCycleDays;
        const dailyNewPlanRate = newPlanPrice / billingCycleDays;

        const currentPlanCostForRemainingDays = dailyCurrentPlanRate * daysRemaining;
        const newPlanCostForRemainingDays = dailyNewPlanRate * daysRemaining;

        return newPlanCostForRemainingDays - currentPlanCostForRemainingDays;
    }

    private getDaysRemainingInCycle(nextBillingDate: Date): number {
        const today = new Date();
        const timeDifference = nextBillingDate.getTime() - today.getTime();
        return Math.ceil(timeDifference / (1000 * 3600 * 24));
    }

    async getSubscriptionById(subscriptionId: string): Promise<CustomerSubscription> {
        const subscription = await this.customerSubscriptionRepository.findOne({
            where: { id: subscriptionId },
        });
        if (!subscription) {
            throw new NotFoundException(`Supplier with ID ${subscriptionId} not found`);
        }
        return subscription;
    }
}
