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
    private readonly dataSource: DataSource
  ) { }

  /**
   * Handles the 'generateInvoice' job from the billing queue.
   *
   * @param job - The Bull job containing the data needed to generate an invoice.
   */
  @Process('generateInvoice')
  async handleGenerateInvoice(job: Job): Promise<void> {
    const { subscriptionId } = job.data;

    // Create a QueryRunner to manage the transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      const subscription = await this.billingService.getSubscriptionById(subscriptionId);
      if (subscription) {
        // Pass the EntityManager from the QueryRunner to the billing service
        await this.billingService.createInvoiceForSubscription(subscription, queryRunner.manager);

        // Commit the transaction if all goes well
        await queryRunner.commitTransaction();
      } else {
        // Handle case where subscription is not found
        console.warn(`Subscription with ID ${subscriptionId} not found.`);
      }
    } catch (error) {
      // Rollback the transaction in case of an error
      await queryRunner.rollbackTransaction();
      console.error(
        `Failed to generate invoice for subscription ID ${subscriptionId}:`,
        error,
      );
    } finally {
      // Release the QueryRunner whether the transaction was successful or not
      await queryRunner.release();
    }
  }
}
