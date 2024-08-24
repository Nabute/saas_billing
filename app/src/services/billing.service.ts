import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CustomerSubscription } from '../entities/customer.entity';
import { Invoice } from '../entities/invoice.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { InvoiceStatus, JobQueues, SubscriptionStatus } from '../utils/enums';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationsService } from './notifications.service';
import { v4 as uuidv4 } from 'uuid';

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
    @InjectQueue(JobQueues.BILLING) private readonly billingQueue: Queue,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Schedules the generation of invoices for all active subscriptions that are due for billing today.
   */
  async scheduleInvoiceGeneration(): Promise<void> {
    const today = new Date();
    const subscriptions = await this.customerSubscriptionRepository.find({
      where: {
        nextBillingDate: today,
        subscriptionStatus: { value: SubscriptionStatus.ACTIVE },
      },
      relations: ['subscriptionPlan', 'user'],
    });

    const jobs = subscriptions.map((subscription) =>
      this.billingQueue.add('generateInvoice', {
        subscriptionId: subscription.id,
      }),
    );
    await Promise.all(jobs); // Schedule invoice generation in parallel
  }

  /**
   * Creates an invoice for a specific customer subscription.
   *
   * @param subscription - The customer subscription for which the invoice is to be created.
   */
  async createInvoiceForSubscription(
    subscription: CustomerSubscription,
    manager: EntityManager,
  ): Promise<Invoice> {
    const invoiceStatus = await this.getInvoiceStatus(InvoiceStatus.PENDING, manager);

    const invoice = manager.create(Invoice, {
      code: await this.generateUniqueInvoiceCode(),
      customerId: subscription.user.id,
      amount: subscription.subscriptionPlan.price,
      status: invoiceStatus,
      paymentDueDate: this.calculateNextBillingDate(
        new Date(),
        subscription.subscriptionPlan.billingCycleDays,
      ),
      subscription: subscription,
    });

    await manager.save(Invoice, invoice);

    // Send notification after invoice is generated
    await this.notificationsService.sendInvoiceGeneratedEmail(
      subscription.user.email,
      invoice.id,
    );

    // Update subscription's next billing date
    subscription.nextBillingDate = this.calculateNextBillingDate(
      subscription.nextBillingDate,
      subscription.subscriptionPlan.billingCycleDays,
    );
    await manager.save(CustomerSubscription, subscription);
    return invoice;
  }

  /**
   * Handles changes to a customer's subscription, such as upgrading or downgrading the plan.
   *
   * @param subscriptionId - The ID of the subscription to be changed.
   * @param newPlanId - The ID of the new subscription plan.
   * @throws NotFoundException if the subscription or the new plan is not found.
   */
  async handleSubscriptionChange(
    subscriptionId: string,
    newPlanId: string,
  ): Promise<void> {
    const subscription = await this.findSubscriptionById(subscriptionId);
    const newPlan = await this.findSubscriptionPlanById(newPlanId);

    const proratedAmount = this.calculateProratedAmount(
      subscription.subscriptionPlan.price,
      newPlan.price,
      this.getDaysRemainingInCycle(subscription.nextBillingDate),
      subscription.subscriptionPlan.billingCycleDays,
    );

    await this.updateInvoiceAmount(subscriptionId, proratedAmount);

    subscription.subscriptionPlan = newPlan;
    await this.customerSubscriptionRepository.save(subscription);
  }

  /**
   * Retrieves a customer subscription by its ID.
   *
   * @param subscriptionId - The ID of the subscription to be retrieved.
   * @returns The found subscription.
   * @throws NotFoundException if the subscription is not found.
   */
  async getSubscriptionById(
    subscriptionId: string,
  ): Promise<CustomerSubscription> {
    return await this.findSubscriptionById(subscriptionId);
  }

  /**
   * Calculates the next billing date based on the given start date and billing cycle duration.
   *
   * @param startDate - The starting date for the billing cycle.
   * @param billingCycleDays - The number of days in the billing cycle.
   * @returns The calculated next billing date.
   */
  private calculateNextBillingDate(
    startDate: Date,
    billingCycleDays: number,
  ): Date {
    const nextBillingDate = new Date(startDate);
    nextBillingDate.setDate(nextBillingDate.getDate() + billingCycleDays);
    return nextBillingDate;
  }

  /**
   * Calculates the prorated amount when changing a subscription plan.
   *
   * @param currentPlanPrice - The price of the current subscription plan.
   * @param newPlanPrice - The price of the new subscription plan.
   * @param daysRemaining - The number of days remaining in the current billing cycle.
   * @param billingCycleDays - The total number of days in the billing cycle.
   * @returns The calculated prorated amount.
   */
  private calculateProratedAmount(
    currentPlanPrice: number,
    newPlanPrice: number,
    daysRemaining: number,
    billingCycleDays: number,
  ): number {
    const dailyCurrentPlanRate = currentPlanPrice / billingCycleDays;
    const dailyNewPlanRate = newPlanPrice / billingCycleDays;

    const currentPlanCostForRemainingDays =
      dailyCurrentPlanRate * daysRemaining;
    const newPlanCostForRemainingDays = dailyNewPlanRate * daysRemaining;

    return newPlanCostForRemainingDays - currentPlanCostForRemainingDays;
  }

  /**
   * Gets the number of days remaining in the current billing cycle.
   *
   * @param nextBillingDate - The next scheduled billing date.
   * @returns The number of days remaining until the next billing date.
   */
  private getDaysRemainingInCycle(nextBillingDate: Date): number {
    const today = new Date();
    const timeDifference = nextBillingDate.getTime() - today.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
  }

  /**
   * Updates the invoice amount for a subscription if a pending invoice exists.
   *
   * @param subscriptionId - The ID of the subscription.
   * @param proratedAmount - The amount to be added to the existing invoice.
   */
  private async updateInvoiceAmount(
    subscriptionId: string,
    proratedAmount: number,
  ): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        subscription: { id: subscriptionId },
        status: { value: InvoiceStatus.PENDING },
      },
    });

    if (invoice) {
      invoice.amount += proratedAmount;
      await this.invoiceRepository.save(invoice);
    }
  }

  /**
   * Retrieves the invoice status from the DataLookup table.
   *
   * @param statusValue - The value of the invoice status.
   * @returns The found DataLookup entity representing the status.
   */
  private async getInvoiceStatus(statusValue: string, manager: EntityManager): Promise<DataLookup> {
    const status = await manager.findOne(DataLookup, {
      where: { value: statusValue },
    });
    if (!status) {
      throw new NotFoundException(`Invoice status ${statusValue} not found`);
    }
    return status;
  }

  /**
   * Retrieves a subscription by its ID, throwing a NotFoundException if not found.
   *
   * @param subscriptionId - The ID of the subscription to find.
   * @returns The found CustomerSubscription entity.
   * @throws NotFoundException if the subscription is not found.
   */
  private async findSubscriptionById(
    subscriptionId: string,
  ): Promise<CustomerSubscription> {
    const subscription = await this.customerSubscriptionRepository.findOne({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }
    return subscription;
  }

  /**
   * Retrieves a subscription plan by its ID, throwing a NotFoundException if not found.
   *
   * @param planId - The ID of the subscription plan to find.
   * @returns The found SubscriptionPlan entity.
   * @throws NotFoundException if the subscription plan is not found.
   */
  private async findSubscriptionPlanById(
    planId: string,
  ): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException(
        `Subscription plan with ID ${planId} not found`,
      );
    }
    return plan;
  }


  async generateUniqueInvoiceCode(): Promise<string> {
    let isUnique = false;
    let newCode: string;

    while (!isUnique) {
      // Generate a new invoice code
      const timestamp = Date.now().toString(36); // Convert timestamp to base36
      const randomString = uuidv4().split('-')[0]; // Use part of UUID for randomness
      newCode = `INV-${timestamp}-${randomString}`;

      // Check if the code is unique in the database
      const existingInvoice = await this.invoiceRepository.findOne({ where: { code: newCode } });

      if (!existingInvoice) {
        isUnique = true;
      }
    }

    return newCode;
  }
}
