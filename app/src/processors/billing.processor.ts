import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { BillingService } from '../services/billing.service';
import { JobQueues } from 'src/utils/enums';

@Processor(JobQueues.BILLING)
export class BillingProcessor {
  constructor(private readonly billingService: BillingService) {}

  @Process('generateInvoice')
  async handleGenerateInvoice(job: Job) {
    const { subscriptionId } = job.data;
    const subscription = await this.billingService.getSubscriptionById(subscriptionId);

    if (subscription) {
      await this.billingService.createInvoiceForSubscription(subscription);
    }
  }
}
