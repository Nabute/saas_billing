import { Controller, Post, Get, Param, Delete, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { CustomerSubscription } from '../entities/customer.entity';
import { CreateSubscriptionDto, CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto, UpdateSubscriptionStatusDto } from '../dtos/subscription.dto';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan } from '../entities/subscription.entity';

const config = new ConfigService();

/**
 * Controller for managing customer subscriptions and subscription plans.
 */
@ApiTags('subscriptions')
@Controller({ path: 'subscriptions', version: config.get('API_VERSION') })
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  /**
   * Creates a new customer subscription.
   *
   * @param createSubscriptionDto - DTO containing data to create a new customer subscription.
   * @returns The newly created CustomerSubscription entity.
   */
  @Post('subscribe')
  @ApiOperation({ summary: 'Create a new customer subscription' })
  @ApiResponse({ status: 201, description: 'The subscription has been successfully created.', type: CustomerSubscription })
  createCustomerSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto): Promise<CustomerSubscription> {
    return this.subscriptionService.createCustomerSubscription(createSubscriptionDto);
  }

  /**
   * Creates a new subscription plan.
   *
   * @param createSubscriptionPlanDto - DTO containing data to create a new subscription plan.
   * @returns The newly created SubscriptionPlan entity.
   */
  @Post('plan')
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiResponse({ status: 201, description: 'The subscription plan has been successfully created.', type: SubscriptionPlan })
  createSubscriptionPlan(@Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.subscriptionService.createSubscriptionPlan(createSubscriptionPlanDto);
  }

  /**
   * Retrieves all active subscription plans.
   *
   * @returns An array of SubscriptionPlan entities.
   */
  @Get('plans')
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans.', type: [SubscriptionPlan] })
  plans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionService.getSubscriptionPlans();
  }

  /**
   * Retrieves all subscriptions for a specific user.
   *
   * @param userId - The ID of the user.
   * @returns An array of CustomerSubscription entities.
   */
  @Get(':userId')
  @ApiOperation({ summary: 'Get all subscriptions for a user' })
  @ApiResponse({ status: 200, description: 'List of subscriptions for the user.', type: [CustomerSubscription] })
  getCustomerSubscriptions(@Param('userId') userId: string): Promise<CustomerSubscription[]> {
    return this.subscriptionService.getCustomerSubscriptions(userId);
  }

  /**
   * Updates the status of a customer subscription.
   *
   * @param subscriptionId - The ID of the subscription to update.
   * @param updateSubscriptionStatusDto - DTO containing the new subscription status.
   * @returns The updated CustomerSubscription entity.
   */
  @Patch(':subscriptionId/status')
  @ApiOperation({ summary: 'Update the status of a customer subscription' })
  @ApiResponse({ status: 200, description: 'The subscription status has been updated.', type: CustomerSubscription })
  updateSubscriptionStatus(
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateSubscriptionStatusDto: UpdateSubscriptionStatusDto,
  ): Promise<CustomerSubscription> {
    return this.subscriptionService.updateSubscriptionStatus(subscriptionId, updateSubscriptionStatusDto);
  }

  /**
   * Retrieves a subscription plan by its ID.
   *
   * @param id - The ID of the subscription plan to retrieve.
   * @returns The found SubscriptionPlan entity.
   */
  @Get('plan/:id')
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'The subscription plan details.', type: SubscriptionPlan })
  getSubscriptionPlanById(@Param('id') id: string): Promise<SubscriptionPlan> {
    return this.subscriptionService.getSubscriptionPlanById(id);
  }

  /**
   * Updates a subscription plan by its ID.
   *
   * @param id - The ID of the subscription plan to update.
   * @param updateSubscriptionPlanDto - DTO containing the updated data for the subscription plan.
   * @returns The updated SubscriptionPlan entity.
   */
  @Patch('plan/:id')
  @ApiOperation({ summary: 'Update a subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'The subscription plan has been updated.', type: SubscriptionPlan })
  updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    return this.subscriptionService.updateSubscriptionPlan(id, updateSubscriptionPlanDto);
  }

  /**
   * Deletes a subscription plan by its ID.
   *
   * @param id - The ID of the subscription plan to delete.
   */
  @Delete('plan/:id')
  @ApiOperation({ summary: 'Delete a subscription plan by ID' })
  @ApiResponse({ status: 204, description: 'The subscription plan has been deleted.' })
  deleteSubscriptionPlan(@Param('id') id: string): Promise<void> {
    return this.subscriptionService.deleteSubscriptionPlan(id);
  }
}
