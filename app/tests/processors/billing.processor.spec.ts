import { Test, TestingModule } from '@nestjs/testing';
import { BillingProcessor } from '../../src/processors/billing.processor';
import { BillingService } from '../../src/services/billing.service';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { Job } from 'bull';
import { CustomerSubscription } from '@app/entities/customer.entity';

describe('BillingProcessor', () => {
    let billingProcessor: BillingProcessor;
    let billingService: BillingService;
    let dataSource: DataSource;
    let queryRunner: QueryRunner;
    let manager: EntityManager;

    beforeEach(async () => {
        // Mock the EntityManager
        manager = {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
        } as unknown as EntityManager;

        // Mock the QueryRunner
        queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager,  // Attach the mocked manager
        } as unknown as QueryRunner;

        // Mock the DataSource
        dataSource = {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        } as unknown as DataSource;

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
                {
                    provide: DataSource,
                    useValue: dataSource,
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
            const createInvoiceSpy = jest.spyOn(billingService, 'createInvoiceForSubscription').mockResolvedValue(undefined);

            await billingProcessor.handleGenerateInvoice(mockJob);

            expect(billingService.getSubscriptionById).toHaveBeenCalledWith('valid-subscription-id');
            expect(createInvoiceSpy).toHaveBeenCalledWith(mockSubscription, expect.any(Object));  // Check it was called with the subscription and manager
            expect(queryRunner.commitTransaction).toHaveBeenCalled();  // Ensure transaction was committed
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
            expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();  // Ensure no rollback since no error
        });
    });
});
