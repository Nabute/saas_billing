import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsString, IsInt, IsNumber } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'UUID of the user who owns the subscription' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'UUID of the subscription plan' })
  @IsUUID()
  subscriptionPlanId: string;
}

export class UpdateSubscriptionStatusDto {
  @ApiProperty({ description: 'UUID of the subscription status to update to' })
  @IsUUID()
  subscriptionStatusId: string;

  @ApiProperty({ description: 'End date of the subscription (optional)', type: 'string', format: 'date-time' })
  @IsOptional()
  endDate?: Date;
}


export class CreateSubscriptionPlanDto {
  @ApiProperty({ description: 'Name of the subscription plan' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the subscription plan', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the subscription plan' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Billing cycle duration in days' })
  @IsInt()
  billingCycleDays: number;

  @ApiProperty({ description: 'UUID of the status (e.g., active, inactive)' })
  @IsUUID()
  statusId: string;

  @ApiProperty({ description: 'Indicates if the plan supports prorated billing' })
  @IsOptional()
  @IsNumber()
  prorate: boolean;
}

export class UpdateSubscriptionPlanDto extends PartialType(CreateSubscriptionPlanDto) { }
