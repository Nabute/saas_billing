import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Patch,
  Body,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionPlanService } from '../services/subscription-plan.service';
import { SubscriptionPlan } from '../entities/subscription.entity';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from '../dtos/subscription.dto';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

@ApiTags('Subscription-plans')
@Controller({ path: 'subscription-plans', version: config.get('API_VERSION') })
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiResponse({
    status: 201,
    description: 'The subscription plan has been successfully created.',
    type: SubscriptionPlan,
  })
  createSubscriptionPlan(
    @Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto,
    @Req() req: any,
  ): Promise<SubscriptionPlan> {
    return this.subscriptionPlanService.createSubscriptionPlan(
      createSubscriptionPlanDto,
      req.transactionManager,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'List of subscription plans.',
    type: [SubscriptionPlan],
  })
  getSubscriptionPlans(@Req() req: any): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanService.getSubscriptionPlans(req.transactionManager);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiResponse({
    status: 200,
    description: 'The subscription plan details.',
    type: SubscriptionPlan,
  })
  getSubscriptionPlanById(@Param('id') id: string, @Req() req: any): Promise<SubscriptionPlan> {
    return this.subscriptionPlanService.getSubscriptionPlanById(id, req.transactionManager);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription plan by ID' })
  @ApiResponse({
    status: 200,
    description: 'The subscription plan has been updated.',
    type: SubscriptionPlan,
  })
  updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
    @Req() req: any,
  ): Promise<SubscriptionPlan> {
    return this.subscriptionPlanService.updateSubscriptionPlan(
      id,
      updateSubscriptionPlanDto,
      req.transactionManager,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscription plan by ID' })
  @ApiResponse({
    status: 204,
    description: 'The subscription plan has been deleted.',
  })
  deleteSubscriptionPlan(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.subscriptionPlanService.deleteSubscriptionPlan(id, req.transactionManager);
  }
}
