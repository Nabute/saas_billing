import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ description: 'Name of the subscription plan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the subscription plan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the subscription plan', example: 29.99 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Number of days in the billing cycle', example: 30 })
  @IsNumber()
  billingCycleDays: number;

  @ApiPropertyOptional({ description: 'Number of trial period days', example: 14 })
  @IsOptional()
  @IsNumber()
  trialPeriodDays?: number;

  @ApiPropertyOptional({ description: 'ID of the status for the subscription plan', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusId?: string;

  @ApiPropertyOptional({ description: 'Maximum number of users allowed in the plan', example: 100 })
  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @ApiPropertyOptional({ description: 'Maximum storage allowed in the plan (in GB)', example: 100 })
  @IsOptional()
  @IsNumber()
  maxStorage?: number;

  @ApiPropertyOptional({ description: 'Overage charge per unit of usage', example: 1.5 })
  @IsOptional()
  @IsNumber()
  overageCharge?: number;

  @ApiPropertyOptional({ description: 'Whether the plan auto-renews', example: true })
  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @ApiPropertyOptional({ description: 'Setup fee for the plan', example: 50 })
  @IsOptional()
  @IsNumber()
  setupFee?: number;

  @ApiPropertyOptional({ description: 'Currency of the subscription plan', example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Discount applied to the plan', example: 10 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ description: 'Cancellation policy for the plan', example: '30 days notice required' })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Grace period in days before cancellation', example: 7 })
  @IsOptional()
  @IsNumber()
  gracePeriodDays?: number;

  @ApiPropertyOptional({ description: 'ID of the plan to upgrade to', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  upgradeToPlanId?: string;

  @ApiPropertyOptional({ description: 'ID of the plan to downgrade to', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  downgradeToPlanId?: string;

  @ApiPropertyOptional({ description: 'ID of the plan to convert to after the trial', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  trialConversionPlanId?: string;

  @ApiPropertyOptional({ description: 'Whether to prorate charges', example: true })
  @IsOptional()
  @IsBoolean()
  prorate?: boolean;
}

export class UpdateSubscriptionPlanDto extends PartialType(CreateSubscriptionPlanDto) {
  @ApiPropertyOptional({ description: 'ID of the status for the subscription plan', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusId?: string;
}
