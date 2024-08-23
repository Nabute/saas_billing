import { Test, TestingModule } from '@nestjs/testing';
import { BillingProcessor } from '../../src/processors/billing.processor';
import { BillingService } from '../../src/services/billing.service';
import { Job } from 'bull';
import { CustomerSubscription } from '@app/entities/customer.entity';

describe('BillingProcessor', () => {
    let billingProcessor: BillingProcessor;
    let billingService: BillingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingProcessor,
                {
                    provide: BillingService,
                    useValue: {
                        getSubscriptionById: jest.fn(),
                        createInvoiceForSubscription: jest.fn(),
                    },
                },
            ],
        }).compile();

        billingProcessor = module.get<BillingProcessor>(BillingProcessor);
        billingService = module.get<BillingService>(BillingService);
    });

    it('should be defined', () => {
        expect(billingProcessor).toBeDefined();
    });

    describe('handleGenerateInvoice', () => {
        it('should generate an invoice if subscription exists', async () => {
            const mockJob = {
                data: {
                    subscriptionId: 'valid-subscription-id',
                },
            } as Job;

            const mockSubscription = {
                id: 'valid-subscription-id',
                // other properties...
            } as CustomerSubscription;

            jest.spyOn(billingService, 'getSubscriptionById').mockResolvedValue(mockSubscription);
            const createInvoiceSpy = jest.spyOn(billingService, 'createInvoiceForSubscription').mockResolvedValue();

            await billingProcessor.handleGenerateInvoice(mockJob);

            expect(billingService.getSubscriptionById).toHaveBeenCalledWith('valid-subscription-id');
            expect(createInvoiceSpy).toHaveBeenCalledWith(mockSubscription);
        });

        it('should not generate an invoice if subscription does not exist', async () => {
            const mockJob = {
                data: {
                    subscriptionId: 'invalid-subscription-id',
                },
            } as Job;

            jest.spyOn(billingService, 'getSubscriptionById').mockResolvedValue(null);
            const createInvoiceSpy = jest.spyOn(billingService, 'createInvoiceForSubscription');

            await billingProcessor.handleGenerateInvoice(mockJob);

            expect(billingService.getSubscriptionById).toHaveBeenCalledWith('invalid-subscription-id');
            expect(createInvoiceSpy).not.toHaveBeenCalled();
        });
    });
});
