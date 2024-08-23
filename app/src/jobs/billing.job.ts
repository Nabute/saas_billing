import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingService } from '../services/billing.service';

@Injectable()
export class BillingJob {
    constructor(private readonly billingService: BillingService) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async scheduleDailyInvoices() {
        await this.billingService.scheduleInvoiceGeneration();
    }
}
