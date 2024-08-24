import { Test, TestingModule } from '@nestjs/testing';
import { PaymentProcessor } from '../../src/processors/payment.processor';
import { PaymentService } from '../../src/services/payment.service';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';

describe('PaymentProcessor', () => {
    let paymentProcessor: PaymentProcessor;
    let paymentService: jest.Mocked<PaymentService>;
    let dataSource: jest.Mocked<DataSource>;
    let queryRunner: jest.Mocked<QueryRunner>;
    let manager: jest.Mocked<EntityManager>;

    beforeEach(async () => {
      manager = {
          findOne: jest.fn(),
          save: jest.fn(),
          create: jest.fn(),
      } as unknown as jest.Mocked<EntityManager>;

      queryRunner = {
          connect: jest.fn(),
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          rollbackTransaction: jest.fn(),
          release: jest.fn(),
          manager, // Attach the mocked manager to the query runner
      } as unknown as jest.Mocked<QueryRunner>;

      dataSource = {
          createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      } as unknown as jest.Mocked<DataSource>;

      paymentService = {
          retryPayment: jest.fn(),
          scheduleRetry: jest.fn(),
          confirmPayment: jest.fn(),
      } as unknown as jest.Mocked<PaymentService>;

      const module: TestingModule = await Test.createTestingModule({
          providers: [
              PaymentProcessor,
              { provide: PaymentService, useValue: paymentService },
              { provide: DataSource, useValue: dataSource },
          ],
      }).compile();

      paymentProcessor = module.get<PaymentProcessor>(PaymentProcessor);
  });

    it('should be defined', () => {
        expect(paymentProcessor).toBeDefined();
    });

    describe('handleRetry', () => {
        it('should confirm payment if retry is successful', async () => {
        const job = {
            data: { subscriptionId: 'sub_123', attempt: 1 },
        } as any;

        paymentService.retryPayment.mockResolvedValue({ success: true });

        await paymentProcessor.handleRetry(job);

        expect(paymentService.confirmPayment).toHaveBeenCalledWith('sub_123', manager);
        expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

      it('should schedule another retry if retry fails', async () => {
        const job = {
            data: { subscriptionId: 'sub_123', attempt: 1 },
        } as any;

        paymentService.retryPayment.mockResolvedValue({ success: false });

        await paymentProcessor.handleRetry(job);

        expect(paymentService.scheduleRetry).toHaveBeenCalledWith('sub_123', 2, manager);
        expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

      it('should schedule another retry if an error occurs', async () => {
        const job = {
            data: { subscriptionId: 'sub_123', attempt: 1 },
        } as any;

        const error = new Error('Test error');
        paymentService.retryPayment.mockRejectedValue(error);

        await paymentProcessor.handleRetry(job);

        expect(paymentService.scheduleRetry).toHaveBeenCalledWith('sub_123', 2);
        expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
