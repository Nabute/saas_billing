import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PaymentService } from '../services/payment.service';
import { JobQueues } from '../utils/enums';

/**
 * PaymentProcessor is responsible for processing payment retry jobs.
 */
@Processor(JobQueues.PAYMENT_RETRY)
export class PaymentProcessor {
    constructor(private readonly paymentService: PaymentService) { }

    /**
     * Handles the payment retry process.
     * 
     * @param job - The Bull job containing the subscription ID and attempt number.
     */
    @Process()
    async handleRetry(job: Job): Promise<void> {
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
            await this.paymentService.scheduleRetry(subscriptionId, attempt + 1);
        }
    }
}
