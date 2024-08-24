import {
    Controller,
    Post,
    Get,
    Param,
    Patch,
    Body,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomerSubscriptionService } from '../services/subscription.service';
import { CustomerSubscription } from '../entities/customer.entity';
import {
    CreateSubscriptionDto,
    UpdateSubscriptionStatusDto,
} from '../dtos/subscription.dto';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

@ApiTags('Subscription')
@Controller({ path: 'subscription', version: config.get('API_VERSION') })
export class CustomerSubscriptionController {
    constructor(
        private readonly customerSubscriptionService: CustomerSubscriptionService,
    ) { }

    @Post('subscribe')
    @ApiOperation({ summary: 'Create a new customer subscription' })
    @ApiResponse({
        status: 201,
        description: 'The subscription has been successfully created.',
        type: CustomerSubscription,
    })
    createCustomerSubscription(
        @Body() createSubscriptionDto: CreateSubscriptionDto,
        @Req() req: any,
    ): Promise<CustomerSubscription> {
        return this.customerSubscriptionService.createCustomerSubscription(
            createSubscriptionDto,
            req.transactionManager,
        );
    }

    @Get(':userId')
    @ApiOperation({ summary: 'Get all subscriptions for a user' })
    @ApiResponse({
        status: 200,
        description: 'List of subscriptions for the user.',
        type: [CustomerSubscription],
    })
    getCustomerSubscriptions(
        @Param('userId') userId: string,
        @Req() req: any,
    ): Promise<CustomerSubscription[]> {
        return this.customerSubscriptionService.getCustomerSubscriptions(
            userId,
            req.transactionManager,
        );
    }

    @Patch(':subscriptionId/status')
    @ApiOperation({ summary: 'Update the status of a customer subscription' })
    @ApiResponse({
        status: 200,
        description: 'The subscription status has been updated.',
        type: CustomerSubscription,
    })
    updateSubscriptionStatus(
        @Param('subscriptionId') subscriptionId: string,
        @Body() updateSubscriptionStatusDto: UpdateSubscriptionStatusDto,
        @Req() req: any,
    ): Promise<CustomerSubscription> {
        return this.customerSubscriptionService.updateSubscriptionStatus(
            subscriptionId,
            updateSubscriptionStatusDto,
            req.transactionManager,
        );
    }
}
