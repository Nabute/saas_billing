import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { AssignSubscriptionPlanDto, CreateSubscriptionDto } from '../dtos/subscription.dto';
import { Subscription } from '../entities/subscription.entity';
import { Customer } from 'src/entities/customer.entity';

@ApiTags('Subscriptions')
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    @Post('subscribe')
    @ApiOperation({ summary: 'Subscribe to a plan' })
    async assignSubscriptionPlan(
        @Body() assignDto: AssignSubscriptionPlanDto,
    ): Promise<Customer> {
        return this.subscriptionService.assignSubscriptionPlan(assignDto);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new subscription' })
    @ApiResponse({ status: 201, description: 'The subscription has been successfully created.', type: Subscription })
    create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
        return this.subscriptionService.create(createSubscriptionDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all subscriptions' })
    @ApiResponse({ status: 200, description: 'List of subscriptions', type: [Subscription] })
    findAll() {
        return this.subscriptionService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific subscription by ID' })
    @ApiResponse({ status: 200, description: 'The subscription', type: Subscription })
    findOne(@Param('id') id: string) {
        return this.subscriptionService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a subscription' })
    @ApiResponse({ status: 200, description: 'The subscription has been successfully updated.', type: Subscription })
    update(@Param('id') id: string, @Body() updateDto: CreateSubscriptionDto) {
        return this.subscriptionService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a subscription' })
    @ApiResponse({ status: 204, description: 'The subscription has been successfully deleted.' })
    remove(@Param('id') id: string) {
        return this.subscriptionService.destroy(id);
    }
}
