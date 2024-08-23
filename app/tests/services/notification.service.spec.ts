import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../../src/services/notifications.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('NotificationsService', () => {
    let service: NotificationsService;
    let configService: jest.Mocked<ConfigService>;
    let transporterMock: jest.Mocked<nodemailer.Transporter>;

    beforeEach(async () => {
        transporterMock = {
            sendMail: jest.fn(),
        } as unknown as jest.Mocked<nodemailer.Transporter>;

        (nodemailer.createTransport as jest.Mock).mockReturnValue(transporterMock);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
        configService = module.get(ConfigService);
    });

    describe('sendInvoiceGeneratedEmail', () => {
        it('should send an invoice generated email', async () => {
            configService.get.mockImplementation((key: string) => {
                switch (key) {
                    case 'EMAIL_HOST':
                        return 'smtp.test.com';
                    case 'EMAIL_PORT':
                        return 587;
                    case 'EMAIL_USER':
                        return 'testuser';
                    case 'EMAIL_PASS':
                        return 'testpass';
                    default:
                        return null;
                }
            });

            await service.sendInvoiceGeneratedEmail('test@example.com', 'Pro Plan');

            expect(transporterMock.sendMail).toHaveBeenCalledWith({
                from: 'Salla SaaS <no-reply@salla.com>',
                to: 'test@example.com',
                subject: 'Invoice Generated',
                text: 'Your invoice for Pro Plan subscription has been generated.',
                html: '<p>Your invoice for Pro Plan subscription has been generated.</p>',
            });
        });
    });

    describe('sendPaymentSuccessEmail', () => {
        it('should send a payment success email', async () => {
            await service.sendPaymentSuccessEmail('test@example.com', 'Pro Plan');

            expect(transporterMock.sendMail).toHaveBeenCalledWith({
                from: 'Salla SaaS <no-reply@salla.com>',
                to: 'test@example.com',
                subject: 'Payment Successful',
                text: 'Your subscription payment for Pro Plan was successful.',
                html: '<p>Your subscription payment for Pro Plan was successful.</p>',
            });
        });
    });

    describe('sendPaymentFailureEmail', () => {
        it('should send a payment failure email', async () => {
            await service.sendPaymentFailureEmail('test@example.com', 'Pro Plan');

            expect(transporterMock.sendMail).toHaveBeenCalledWith({
                from: 'Salla SaaS <no-reply@salla.com>',
                to: 'test@example.com',
                subject: 'Payment Failed',
                text: 'Your payment for Pro Plan subscription has failed. Please try again.',
                html: '<p>Your payment for Pro Plan subscription has failed. Please try again.</p>',
            });
        });
    });
});
