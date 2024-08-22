import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionPlanService } from '../services/subscription-plan.service';
import { CreateSubscriptionPlanDto } from '../dtos/subscription-plan.dto';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

@ApiTags('Subscription Plans')
@Controller({ path: 'subscription-plans', version: '1' })
export class SubscriptionPlanController {
    constructor(private readonly subscriptionPlanService: SubscriptionPlanService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new subscription plan' })
    @ApiResponse({ status: 201, description: 'The subscription plan has been successfully created.', type: SubscriptionPlan })
    create(@Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto) {
        return this.subscriptionPlanService.create(createSubscriptionPlanDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all subscription plans' })
    @ApiResponse({ status: 200, description: 'List of subscription plans', type: [SubscriptionPlan] })
    findAll() {
        return this.subscriptionPlanService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific subscription plan by ID' })
    @ApiResponse({ status: 200, description: 'The subscription plan', type: SubscriptionPlan })
    findOne(@Param('id') id: string) {
        return this.subscriptionPlanService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a subscription plan' })
    @ApiResponse({ status: 200, description: 'The subscription plan has been successfully updated.', type: SubscriptionPlan })
    update(@Param('id') id: string, @Body() updateDto: CreateSubscriptionPlanDto) {
        return this.subscriptionPlanService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a subscription plan' })
    @ApiResponse({ status: 204, description: 'The subscription plan has been successfully deleted.' })
    remove(@Param('id') id: string) {
        return this.subscriptionPlanService.destroy(id);
    }
}
