import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'UUID of the invoice' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Amount of the payment' })
  @IsNumber()
  amount: number;
}
