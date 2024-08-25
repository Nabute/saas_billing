import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { CustomerSubscription } from '../entities/customer.entity';
import { StripeService } from './stripe.service';
import {
  InvoiceStatus,
  JobQueues,
  ObjectState,
  PaymentMethodCode,
  PaymentRetrySettings,
  PaymentStatus,
  SubscriptionStatus,
} from '../utils/enums';
import { DataLookup } from '../entities/data-lookup.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { SystemSetting } from '../entities/system-settings.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Stripe from 'stripe';
import { NotificationsService } from './notifications.service';
import { CreatePaymentDto } from '@app/dtos/payment.dto';
import { DataLookupService } from './data-lookup.service';
import * as dayjs from 'dayjs';

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
    private readonly dataLookupService: DataLookupService,
    private readonly dataSource: DataSource,
  ) {}

  async processNewPayment({ invoiceId, paymentMethodId }: CreatePaymentDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = await this.findPendingInvoice(
        invoiceId,
        queryRunner.manager,
      );

      const paymentIntent = await this.createPaymentIntent(
        invoice,
        paymentMethodId,
      );

      await this.handlePaymentStatus(
        invoice,
        paymentIntent,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error processing payment:', error.message);
      throw new InternalServerErrorException('Failed to process payment.');
    } finally {
      await queryRunner.release();
    }
  }

  private async findPendingInvoice(
    invoiceId: string,
    manager: EntityManager,
  ): Promise<Invoice> {
    const invoice = await manager.findOne(Invoice, {
      where: {
        id: invoiceId,
        status: { value: InvoiceStatus.PENDING },
      },
      relations: [
        'subscription',
        'subscription.user',
        'subscription.subscriptionPlan',
      ],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or already been paid.');
    }
    return invoice;
  }

  private async createPaymentIntent(
    invoice: Invoice,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripeService.createPaymentIntent({
      amount: Math.round(invoice.amount * 100),
      currency: 'usd',
      payment_method_types: ['card'],
      payment_method: paymentMethodId,
      description: `Payment for Invoice #${invoice.code}`,
      confirm: true,
      metadata: {
        invoiceId: invoice.id,
        invoiceCode: invoice.code,
      },
    });
  }

  private async handlePaymentStatus(
    invoice: Invoice,
    paymentIntent: Stripe.PaymentIntent,
    manager: EntityManager,
  ) {
    if (paymentIntent.status === 'succeeded') {
      await this.handleSuccessfulPayment(invoice, paymentIntent, manager);
      console.log('Payment succeeded, invoice marked as PAID.');
    } else {
      await this.handleFailedPayment(invoice.subscription.id, manager);
    }
  }

  async handleSuccessfulPayment(
    invoice: Invoice,
    paymentIntent: Stripe.PaymentIntent,
    manager: EntityManager,
  ) {
    if (!invoice.subscription?.user) {
      throw new NotFoundException('User or subscription not found.');
    }

    await this.saveSuccessfulPayment(invoice, paymentIntent, manager);
    await this.updateInvoiceStatus(invoice, InvoiceStatus.PAID, manager);
    await this.updateSubscriptionStatus(
      invoice,
      SubscriptionStatus.ACTIVE,
      manager,
    );
    await this.notificationsService.sendPaymentSuccessEmail(
      invoice.subscription.user.name,
      invoice.subscription.user.email,
      invoice.subscription.subscriptionPlan.name,
      invoice.amount.toString(),
      dayjs(invoice.paymentDate).format('MMMM D, YY'),
      `https://media.saas.billing/subscriptions/invoices/${invoice.id}`,
    );
  }

  private async saveSuccessfulPayment(
    invoice: Invoice,
    paymentIntent: Stripe.PaymentIntent,
    manager: EntityManager,
  ) {
    const verifiedPaymentStatus = await this.findDataLookupByValue(
      PaymentStatus.VERIFIED,
      manager,
    );
    const paymentMethod = await this.findPaymentMethodByCode(
      PaymentMethodCode.STRIPE,
      manager,
    );

    const objectDefaultState = await this.dataLookupService.getDefaultData(
      ObjectState.TYPE,
    );

    const payment = manager.create(Payment, {
      invoice,
      paymentMethod,
      status: verifiedPaymentStatus,
      objectState: objectDefaultState,
      amount: invoice.amount,
      referenceNumber: paymentIntent.id,
      payerName: this.getCustomerInfo(paymentIntent.customer),
      paymentDate: new Date().toISOString(),
    });

    await manager.save(Payment, payment);
  }

  private async updateInvoiceStatus(
    invoice: Invoice,
    statusValue: InvoiceStatus,
    manager: EntityManager,
  ) {
    const status = await this.findDataLookupByValue(statusValue, manager);
    invoice.status = status;
    invoice.paymentDate = new Date();
    await manager.save(Invoice, invoice);
  }

  private async updateSubscriptionStatus(
    invoice: Invoice,
    subscriptionStatus: SubscriptionStatus,
    manager: EntityManager,
  ) {
    const status = await this.findDataLookupByValue(
      subscriptionStatus,
      manager,
    );
    const subscription = invoice.subscription;
    subscription.subscriptionStatus = status;
    await manager.save(CustomerSubscription, subscription);
  }

  private async findDataLookupByValue(
    value: string,
    manager: EntityManager,
  ): Promise<DataLookup> {
    return manager.findOne(DataLookup, { where: { value } });
  }

  private async findPaymentMethodByCode(
    code: string,
    manager: EntityManager,
  ): Promise<PaymentMethod> {
    return manager.findOne(PaymentMethod, { where: { code } });
  }

  async handleFailedPayment(
    subscriptionId: string,
    manager: EntityManager,
  ): Promise<void> {
    try {
      const subscription = await this.findSubscriptionById(
        subscriptionId,
        manager,
      );
      if (!subscription) {
        throw new NotFoundException(
          `Subscription with ID ${subscriptionId} not found.`,
        );
      }

      const overdueStatus = await this.findDataLookupByValue(
        SubscriptionStatus.OVERDUE,
        manager,
      );

      subscription.subscriptionStatus = overdueStatus;
      await manager.save(CustomerSubscription, subscription);

      await this.notificationsService.sendPaymentFailureEmail(
        subscription.user.email,
        subscription.subscriptionPlan.name,
      );

      await this.scheduleRetry(subscriptionId, 1, manager);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw specific known exceptions
      }
      throw new InternalServerErrorException(
        'Failed to handle failed payment.',
      );
    }
  }

  private async findSubscriptionById(
    subscriptionId: string,
    manager: EntityManager,
  ): Promise<CustomerSubscription> {
    const subscription = await manager.findOne(CustomerSubscription, {
      where: { id: subscriptionId },
      relations: ['subscriptionStatus'],
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }
    return subscription;
  }

  async scheduleRetry(
    subscriptionId: string,
    attempt: number,
    manager?: EntityManager,
  ): Promise<void> {
    const subscription = await this.findSubscriptionById(
      subscriptionId,
      manager,
    );
    const maxRetries = await this.getSystemSetting(
      PaymentRetrySettings.MAX_RETRIES,
      manager,
    );

    if (subscription.retryCount >= parseInt(maxRetries.currentValue)) {
      console.log(
        `Subscription ID ${subscription.id} has reached the maximum number of retries.`,
      );
      return;
    }

    const retryDelay = await this.getSystemSetting(
      PaymentRetrySettings.RETRY_DELAY_MINUTES,
      manager,
    );
    const nextRun = parseInt(retryDelay.currentValue) * 60 * 1000;

    await this.paymentRetryQueue.add(
      { subscriptionId, attempt },
      { delay: nextRun },
    );

    subscription.retryCount = attempt;
    subscription.nextRetry = new Date(Date.now() + nextRun);
    if (manager) {
      await manager.save(CustomerSubscription, subscription);
    } else {
      await this.customerSubscriptionRepository.save(subscription);
    }

    console.log(
      `Scheduled retry #${subscription.retryCount} for subscription ID ${subscription.id} at ${subscription.nextRetry}`,
    );
  }

  private async getSystemSetting(
    code: string,
    manager?: EntityManager,
  ): Promise<SystemSetting> {
    return manager.findOne(SystemSetting, {
      where: { code },
    });
  }

  async retryPayment(
    subscriptionId: string,
    manager: EntityManager,
  ): Promise<{ success: boolean }> {
    const invoice = await this.findFailedInvoice(subscriptionId, manager);

    if (!invoice) {
      throw new NotFoundException(
        `No unpaid invoice found for subscription ID ${subscriptionId}`,
      );
    }

    const paymentIntent = await this.createRetryPaymentIntent(invoice);

    if (paymentIntent.status === 'succeeded') {
      await this.updateInvoiceStatus(invoice, InvoiceStatus.PAID, manager);
      await this.saveSuccessfulPayment(invoice, paymentIntent, manager);
      return { success: true };
    } else {
      return { success: false };
    }
  }

  private async findFailedInvoice(
    subscriptionId: string,
    manager: EntityManager,
  ): Promise<Invoice> {
    const invoice = await manager.findOne(Invoice, {
      where: {
        subscription: { id: subscriptionId },
        status: { value: InvoiceStatus.FAILED },
      },
      order: { paymentDueDate: 'DESC' },
    });

    if (!invoice) {
      throw new NotFoundException(
        `No unpaid invoice found for subscription ID ${subscriptionId}`,
      );
    }
    return invoice;
  }

  private async createRetryPaymentIntent(
    invoice: Invoice,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripeService.createPaymentIntent({
      amount: Math.round(invoice.amount * 100),
      currency: 'usd',
      payment_method_types: ['card'],
      description: `Payment for Invoice #${invoice.id}`,
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription.id,
      },
    });
  }

  async confirmPayment(
    subscriptionId: string,
    manager: EntityManager,
  ): Promise<void> {
    const subscription = await this.findSubscriptionById(
      subscriptionId,
      manager,
    );
    const activeStatus = await this.findDataLookupByValue(
      SubscriptionStatus.ACTIVE,
      manager,
    );

    if (!activeStatus) {
      throw new NotFoundException('Active status not found.');
    }

    subscription.subscriptionStatus = activeStatus;
    await manager.save(CustomerSubscription, subscription);
  }

  getCustomerInfo(
    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
  ): string | null {
    if (typeof customer === 'string') {
      return customer;
    }

    if (customer && 'name' in customer) {
      return customer.name || 'Stripe Customer';
    }

    return 'Stripe Customer';
  }

  async findInvoiceById(
    invoiceId: string,
    manager: EntityManager,
  ): Promise<Invoice | null> {
    return manager.findOne(Invoice, {
      where: {
        id: invoiceId,
        status: { value: InvoiceStatus.PENDING },
      },
      relations: ['subscription'],
    });
  }
}
