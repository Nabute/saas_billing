import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
    private transporter;

    constructor(
        private readonly configService: ConfigService
    ) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get("EMAIL_HOST"),
            port: this.configService.get("EMAIL_PORT"),
            secure: false,
            auth: {
                user: this.configService.get("EMAIL_USER"),
                pass: this.configService.get("EMAIL_PASS"),
            },
        });
    }

    async sendInvoiceGeneratedEmail(email: string, subscriptionPlan: string): Promise<void> {
        const mailOptions = {
            from: 'Salla SaaS <no-reply@salla.com>',
            to: email,
            subject: 'Invoice Generated',
            text: `Your invoice for ${subscriptionPlan} subscription has been generated.`,
            html: `<p>Your invoice ${subscriptionPlan} subscription has been generated.</p>`,
        };
        await this.transporter.sendMail(mailOptions);
    }

    async sendPaymentSuccessEmail(email: string, subscriptionPlan: string): Promise<void> {
        const mailOptions = {
            from: 'Salla SaaS <no-reply@salla.com>',
            to: email,
            subject: 'Payment Successful',
            text: `Your subscription payment for ${subscriptionPlan} was successful.`,
            html: `<p>Your subscription payment for ${subscriptionPlan} was successful.</p>`,
        };
        await this.transporter.sendMail(mailOptions);
    }

    async sendPaymentFailureEmail(email: string, subscriptionPlan: string): Promise<void> {
        const mailOptions = {
            from: 'Salla SaaS <no-reply@salla.com>',
            to: email,
            subject: 'Payment Failed',
            text: `Your payment for ${subscriptionPlan} subscription has failed. Please try again.`,
            html: `<p>Your payment for ${subscriptionPlan} subscription has failed. Please try again.`,
        };
        await this.transporter.sendMail(mailOptions);
    }
}
