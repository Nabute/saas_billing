import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly transporter: Transporter;

  /**
   * Constructor to initialize the NotificationsService.
   * Sets up the nodemailer transporter using configuration values from the ConfigService.
   *
   * @param configService - Service to access application configuration values.
   */
  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
  }

  /**
   * Creates and configures the nodemailer transporter.
   *
   * @returns A configured nodemailer Transporter instance.
   */
  private createTransporter(): Transporter {
    return nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false, // Use STARTTLS or unencrypted connection
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  /**
   * Sends an email notification.
   *
   * @param to - The recipient's email address.
   * @param subject - The subject of the email.
   * @param text - The plain text body of the email.
   * @param html - The HTML body of the email.
   * @returns A Promise that resolves when the email is sent.
   */
  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<void> {
    const mailOptions = {
      from: 'Salla SaaS <no-reply@salla.com>',
      to,
      subject,
      text,
      html,
    };
    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Sends an email notification when an invoice is generated.
   *
   * @param email - The recipient's email address.
   * @param subscriptionPlan - The name of the subscription plan for which the invoice was generated.
   * @returns A Promise that resolves when the email is sent.
   */
  async sendInvoiceGeneratedEmail(
    email: string,
    subscriptionPlan: string,
  ): Promise<void> {
    const subject = 'Invoice Generated';
    const text = `Your invoice for ${subscriptionPlan} subscription has been generated.`;
    const html = `<p>Your invoice for ${subscriptionPlan} subscription has been generated.</p>`;
    await this.sendEmail(email, subject, text, html);
  }

  /**
   * Sends an email notification when a payment is successful.
   *
   * @param email - The recipient's email address.
   * @param subscriptionPlan - The name of the subscription plan for which the payment was successful.
   * @returns A Promise that resolves when the email is sent.
   */
  async sendPaymentSuccessEmail(
    email: string,
    subscriptionPlan: string,
  ): Promise<void> {
    const subject = 'Payment Successful';
    const text = `Your subscription payment for ${subscriptionPlan} was successful.`;
    const html = `<p>Your subscription payment for ${subscriptionPlan} was successful.</p>`;
    await this.sendEmail(email, subject, text, html);
  }

  /**
   * Sends an email notification when a payment fails.
   *
   * @param email - The recipient's email address.
   * @param subscriptionPlan - The name of the subscription plan for which the payment failed.
   * @returns A Promise that resolves when the email is sent.
   */
  async sendPaymentFailureEmail(
    email: string,
    subscriptionPlan: string,
  ): Promise<void> {
    const subject = 'Payment Failed';
    const text = `Your payment for ${subscriptionPlan} subscription has failed. Please try again.`;
    const html = `<p>Your payment for ${subscriptionPlan} subscription has failed. Please try again.</p>`;
    await this.sendEmail(email, subject, text, html);
  }
}
