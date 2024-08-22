import { Controller, Post, Get, Param, Delete, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { CustomerSubscription } from '../entities/customer.entity';
import { CreateSubscriptionDto, CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto, UpdateSubscriptionStatusDto } from '../dtos/subscription.dto';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan } from 'src/entities/subscription.entity';

const config = new ConfigService();

@ApiTags('subscriptions')
@Controller({ path: 'subscriptions', version: config.get('API_VERSION') })
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new customer subscription' })
  @ApiResponse({ status: 201, description: 'The subscription has been successfully created.', type: CustomerSubscription })
  createCustomerSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto): Promise<CustomerSubscription> {
    return this.subscriptionService.createCustomerSubscription(createSubscriptionDto);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get all subscriptions for a user' })
  @ApiResponse({ status: 200, description: 'List of subscriptions for the user.', type: [CustomerSubscription] })
  getCustomerSubscriptions(@Param('userId') userId: string): Promise<CustomerSubscription[]> {
    return this.subscriptionService.getCustomerSubscriptions(userId);
  }

  @Patch(':subscriptionId/status')
  @ApiOperation({ summary: 'Update the status of a customer subscription' })
  @ApiResponse({ status: 200, description: 'The subscription status has been updated.', type: CustomerSubscription })
  updateSubscriptionStatus(
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateSubscriptionStatusDto: UpdateSubscriptionStatusDto,
  ): Promise<CustomerSubscription> {
    return this.subscriptionService.updateSubscriptionStatus(subscriptionId, updateSubscriptionStatusDto);
  }

  @Post('plan')
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiResponse({ status: 201, description: 'The subscription plan has been successfully created.', type: SubscriptionPlan })
  createSubscriptionPlan(@Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.subscriptionService.createSubscriptionPlan(createSubscriptionPlanDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans.', type: [SubscriptionPlan] })
  getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionService.getSubscriptionPlans();
  }

  @Get('plan/:id')
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'The subscription plan details.', type: SubscriptionPlan })
  getSubscriptionPlanById(@Param('id') id: string): Promise<SubscriptionPlan> {
    return this.subscriptionService.getSubscriptionPlanById(id);
  }

  @Patch('plan/:id')
  @ApiOperation({ summary: 'Update a subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'The subscription plan has been updated.', type: SubscriptionPlan })
  updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    return this.subscriptionService.updateSubscriptionPlan(id, updateSubscriptionPlanDto);
  }

  @Delete('plan/:id')
  @ApiOperation({ summary: 'Delete a subscription plan by ID' })
  @ApiResponse({ status: 204, description: 'The subscription plan has been deleted.' })
  deleteSubscriptionPlan(@Param('id') id: string): Promise<void> {
    return this.subscriptionService.deleteSubscriptionPlan(id);
  }
}
