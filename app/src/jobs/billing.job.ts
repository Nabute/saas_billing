import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingService } from '../services/billing.service';

@Injectable()
export class BillingJob {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Schedules the daily invoice generation job to run at midnight every day.
   * This job triggers the `scheduleInvoiceGeneration` method in the BillingService.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleDailyInvoices(): Promise<void> {
    await this.billingService.scheduleInvoiceGeneration();
  }
}
