import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, DataSource, In } from 'typeorm';
import { CustomerSubscription } from '../entities/customer.entity';
import { User } from '../entities/user.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionStatusDto,
} from '../dtos/subscription.dto';
import { GenericService } from './base.service';
import {
  ObjectState,
  SubscriptionPlanState,
  SubscriptionStatus,
} from '../utils/enums';
import { DataLookupService } from './data-lookup.service';
import { BillingService } from './billing.service';

@Injectable()
export class CustomerSubscriptionService extends GenericService<CustomerSubscription> {
  constructor(
    @InjectRepository(CustomerSubscription)
    private readonly customerSubscriptionRepository: Repository<CustomerSubscription>,
    private readonly dataLookupService: DataLookupService,
    private readonly billingService: BillingService,
    dataSource: DataSource,
  ) {
    super(CustomerSubscription, dataSource);
  }

  async createCustomerSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
    manager: EntityManager,
  ): Promise<CustomerSubscription> {
    const { userId, subscriptionPlanId } = createSubscriptionDto;

    const user = await manager.findOne(User, { where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const subscriptionPlan = await manager.findOne(SubscriptionPlan, {
      where: { id: subscriptionPlanId },
      relations: ['status'],
    });
    if (
      !subscriptionPlan ||
      subscriptionPlan.status.value != SubscriptionPlanState.ACTIVE
    ) {
      throw new NotFoundException(
        `Active subscription plan with ID ${subscriptionPlanId} not found`,
      );
    }

    // Check if the user already has an active subscription for this plan
    // Assuming that the user can only subscribe to same plan if their subscription is in the
    // allowed list
    const resubscriptionAllowedList = [
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.ARCHIVED,
    ];
    const existingSubscription = await manager.findOne(CustomerSubscription, {
      where: {
        user: { id: userId },
        subscriptionPlan: { id: subscriptionPlanId },
        subscriptionStatus: {
          value: In(resubscriptionAllowedList),
        },
      },
    });

    if (existingSubscription) {
      throw new Error(
        `You can't subscribe to ${subscriptionPlan.name}. Please process your exisiting subscription in the pipeline.`,
      );
    }

    const subscriptionStatus = await manager.findOne(DataLookup, {
      where: { value: SubscriptionStatus.PENDING },
    });
    if (!subscriptionStatus) {
      throw new NotFoundException(
        `Unable to get default subscription status. Please load fixtures`,
      );
    }

    const objectDefaultState = await this.dataLookupService.getDefaultData(
      ObjectState.TYPE,
    );

    const newSubscription = manager.create(CustomerSubscription, {
      user,
      subscriptionPlan,
      subscriptionStatus,
      objectState: objectDefaultState,
      startDate: new Date(),
      nextBillingDate: new Date(
        Date.now() + subscriptionPlan.billingCycleDays * 24 * 60 * 60 * 1000,
      ),
    });

    manager.save(CustomerSubscription, newSubscription);
    const invoice = await this.billingService.createInvoiceForSubscription(
      newSubscription,
      manager,
    );

    return {
      invoice,
      ...newSubscription,
    } as unknown as CustomerSubscription;
  }

  async getCustomerSubscriptions(
    userId: string,
    manager: EntityManager,
  ): Promise<CustomerSubscription[]> {
    const user = await manager.findOne(User, { where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return manager.find(CustomerSubscription, {
      where: { user },
      relations: ['subscriptionPlan', 'subscriptionStatus'],
    });
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    updateSubscriptionStatusDto: UpdateSubscriptionStatusDto,
    manager: EntityManager,
  ): Promise<CustomerSubscription> {
    const { subscriptionStatusId, endDate } = updateSubscriptionStatusDto;

    const subscription = await manager.findOne(CustomerSubscription, {
      where: { id: subscriptionId },
      relations: ['subscriptionStatus'],
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    const subscriptionStatus = await manager.findOne(DataLookup, {
      where: { id: subscriptionStatusId },
    });
    if (!subscriptionStatus) {
      throw new NotFoundException(
        `Subscription status with ID ${subscriptionStatusId} not found`,
      );
    }

    subscription.subscriptionStatus = subscriptionStatus;
    subscription.endDate = endDate || subscription.endDate;

    return manager.save(CustomerSubscription, subscription);
  }
}
