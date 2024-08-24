import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PaymentService } from '../services/payment.service';
import { JobQueues } from '../utils/enums';
import { DataSource } from 'typeorm';

@Processor(JobQueues.PAYMENT_RETRY)
export class PaymentProcessor {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly dataSource: DataSource,
  ) {}

  @Process()
  async handleRetry(job: Job): Promise<void> {
    const { subscriptionId, attempt } = job.data;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      console.log(`Processing retry #${attempt} for subscription ID ${subscriptionId}`);
      const result = await this.paymentService.retryPayment(subscriptionId, queryRunner.manager);

      if (!result.success) {
        console.log(`Retry #${attempt} for subscription ID ${subscriptionId} failed`);
        await this.paymentService.scheduleRetry(subscriptionId, attempt + 1, queryRunner.manager);
      } else {
        console.log(`Payment successful for subscription ID ${subscriptionId}`);
        await this.paymentService.confirmPayment(subscriptionId, queryRunner.manager);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`Error during retry #${attempt} for subscription ID ${subscriptionId}:`, error.message);
      
      // It's important to handle what happens after rollback, like re-scheduling a retry attempt
      await this.paymentService.scheduleRetry(subscriptionId, attempt + 1);

    } finally {
      await queryRunner.release();
    }
  }
}
