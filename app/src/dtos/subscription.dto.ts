import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Customer ID for the subscription' })
  @IsString()
  @IsNotEmpty()
  customerId: string; // UUID of the customer

  @ApiProperty({ description: 'Subscription plan ID' })
  @IsString()
  @IsNotEmpty()
  planId: string; // UUID of the subscription plan

  @ApiProperty({ description: 'Start date of the subscription' })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: 'End date of the subscription', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({ description: 'Status ID of the subscription' })
  @IsString()
  @IsNotEmpty()
  statusId: string; // UUID of the status from DataLookup
}

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) { }

export class AssignSubscriptionPlanDto {
  @ApiProperty({ description: 'UUID of the customer' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'UUID of the subscription plan' })
  @IsUUID()
  subscriptionPlanId: string;
}
