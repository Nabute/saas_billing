import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PaymentService } from '../services/payment.service';
import { JobQueues } from 'src/utils/enums';

@Processor(JobQueues.PAYMENT_RETRY)
export class PaymentProcessor {
    constructor(private readonly paymentService: PaymentService) { }

    @Process()
    async handleRetry(job: Job) {
        const { subscriptionId, attempt } = job.data;

        try {
            console.log(`Processing retry #${attempt} for subscription ID ${subscriptionId}`);
            const result = await this.paymentService.retryPayment(subscriptionId);

            if (!result.success) {
                console.log(`Retry #${attempt} for subscription ID ${subscriptionId} failed`);
                await this.paymentService.scheduleRetry(subscriptionId, attempt + 1);
            } else {
                console.log(`Payment successful for subscription ID ${subscriptionId}`);
                await this.paymentService.confirmPayment(subscriptionId);
            }
        } catch (error) {
            console.error(`Error processing retry for subscription ID ${subscriptionId}:`, error);
            await this.paymentService.scheduleRetry(subscriptionId, attempt + 1);
        }
    }
}
