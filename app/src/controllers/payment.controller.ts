import { Controller, Post, NotFoundException, InternalServerErrorException, Body } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { ApiTags } from '@nestjs/swagger';
import { CreatePaymentDto } from '@app/dtos/payment.dto';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

/**
 * Controller for managing payments.
 */
@ApiTags('Payment')
@Controller({ path: 'payments', version: config.get('API_VERSION') })
export class PaymentsController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('process')
    async processPayment(@Body() paymentDto: CreatePaymentDto) {
        try {
            const paymentIntent = await this.paymentService.processNewPayment(paymentDto);
            return {
                success: true,
                paymentIntent,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw new InternalServerErrorException('Failed to process payment.');
        }
    }
}
