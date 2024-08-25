import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { BillingService } from '../services/billing.service';
import { JobQueues } from '../utils/enums';
import { DataSource } from 'typeorm';

/**
 * BillingProcessor is responsible for processing jobs related to billing,
 * specifically for generating invoices.
 */
@Processor(JobQueues.BILLING)
export class BillingProcessor {
  constructor(
    private readonly billingService: BillingService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Handles the 'generateInvoice' job from the billing queue.
   *
   * @param job - The Bull job containing the data needed to generate an invoice.
   */
  @Process('generateInvoice')
  async handleGenerateInvoice(job: Job): Promise<void> {
    const { subscriptionId } = job.data;

    try {
      // Start a transaction
      await this.dataSource.transaction(async (manager) => {
        const subscription = await this.billingService.getSubscriptionById(
          subscriptionId,
          manager,
        );
        if (subscription) {
          await this.billingService.createInvoiceForSubscription(
            subscription,
            manager,
          );
        } else {
          // Handle case where subscription is not found
          console.warn(`Subscription with ID ${subscriptionId} not found.`);
        }
      });
    } catch (error) {
      console.error(
        `Failed to generate invoice for subscription ID ${subscriptionId}:`,
        error,
      );
    }
  }
}
