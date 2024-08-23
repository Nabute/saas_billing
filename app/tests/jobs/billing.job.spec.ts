import { Test, TestingModule } from '@nestjs/testing';
import { BillingJob } from '../../src/jobs/billing.job';
import { BillingService } from '../../src/services/billing.service';

describe('BillingJob', () => {
    let billingJob: BillingJob;
    let billingService: BillingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingJob,
                {
                    provide: BillingService,
                    useValue: {
                        scheduleInvoiceGeneration: jest.fn(),
                    },
                },
            ],
        }).compile();

        billingJob = module.get<BillingJob>(BillingJob);
        billingService = module.get<BillingService>(BillingService);
    });

    it('should schedule daily invoice generation', async () => {
        await billingJob.scheduleDailyInvoices();
        expect(billingService.scheduleInvoiceGeneration).toHaveBeenCalled();
    });
});
