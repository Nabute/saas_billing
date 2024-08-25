import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'UUID of the invoice' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Payment method ID' })
  @IsString()
  paymentMethodId: string;
}
