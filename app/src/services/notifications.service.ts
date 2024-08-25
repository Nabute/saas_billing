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
    name: string,
    email: string,
    subscriptionPlan: string,
    invoiceAmount: string,
    invoiceDate: string,
    billingPeriod: string,
    invoiceLink: string,
  ): Promise<void> {
    const subject = 'Your Invoice is Ready!';

    const text = `Dear ${name},
  
  Your invoice for the ${subscriptionPlan} subscription has been generated.
  
  Details:
  - Subscription Plan: ${subscriptionPlan}
  - Invoice Amount: ${invoiceAmount}
  - Invoice Date: ${invoiceDate}
  - Billing Period: ${billingPeriod}
  
  You can view and download your invoice using the following link: ${invoiceLink}.
  
  If you have any questions or need assistance, please contact our support team.
  
  Thank you for your continued business!
  
  Best regards,
  The SaaS Company`;

    const html = `
      <p>Dear ${name},</p>
      <p>Your invoice for the <strong>${subscriptionPlan}</strong> subscription has been generated.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li><strong>Subscription Plan:</strong> ${subscriptionPlan}</li>
        <li><strong>Invoice Amount:</strong> ${invoiceAmount}</li>
        <li><strong>Invoice Date:</strong> ${invoiceDate}</li>
        <li><strong>Billing Period:</strong> ${billingPeriod}</li>
      </ul>
      <p>You can view and download your invoice using the following link: <a href="${invoiceLink}">View Invoice</a>.</p>
      <p>If you have any questions or need assistance, please contact our <a href="mailto:support@saas.com">support team</a>.</p>
      <p>Thank you for your continued business!</p>
      <p>Best regards,<br>The SaaS Company</p>`;

    await this.sendEmail(email, subject, text, html);
  }

  /**
   * Sends an email notification when a payment is successful.
   *
   * @param email - The recipient's email address.
   * @param subscriptionPlan - The name of the subscription plan for which the payment was successful.
   * @param amountPaid - The amount that was successfully paid.
   * @param transactionDate - The date of the successful payment transaction.
   * @param invoiceLink - A link to view the invoice or transaction details.
   * @returns A Promise that resolves when the email is sent.
   */
  async sendPaymentSuccessEmail(
    name: string,
    email: string,
    subscriptionPlan: string,
    amountPaid: string,
    transactionDate: string,
    invoiceLink: string,
  ): Promise<void> {
    const subject = 'Payment Confirmation - Thank You for Your Purchase!';

    const text = `Dear ${name},

We are pleased to inform you that your payment for the ${subscriptionPlan} subscription was successful.

Payment Details:
- Subscription Plan: ${subscriptionPlan}
- Amount Paid: ${amountPaid}
- Transaction Date: ${transactionDate}

You can view and download your invoice using the following link: ${invoiceLink}.

Thank you for your prompt payment! If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The SaaS Company`;

    const html = `
    <p>Dear ${name},</p>
    <p>We are pleased to inform you that your payment for the <strong>${subscriptionPlan}</strong> subscription was successful.</p>
    <p><strong>Payment Details:</strong></p>
    <ul>
      <li><strong>Subscription Plan:</strong> ${subscriptionPlan}</li>
      <li><strong>Amount Paid:</strong> ${amountPaid}</li>
      <li><strong>Transaction Date:</strong> ${transactionDate}</li>
    </ul>
    <p>You can view and download your invoice using the following link: <a href="${invoiceLink}">View Invoice</a>.</p>
    <p>Thank you for your prompt payment! If you have any questions or need assistance, please don't hesitate to contact our <a href="mailto:support@saas.com">support team</a>.</p>
    <p>Best regards,<br>The SaaS Company</p>`;

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
