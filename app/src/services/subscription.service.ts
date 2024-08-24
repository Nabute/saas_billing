import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, DataSource } from 'typeorm';
import { CustomerSubscription } from '../entities/customer.entity';
import { User } from '../entities/user.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import {
    CreateSubscriptionDto,
  UpdateSubscriptionStatusDto,
} from '../dtos/subscription.dto';
import { GenericService } from './base.service';
import { SubscriptionStatus } from '../utils/enums';

@Injectable()
export class CustomerSubscriptionService extends GenericService<CustomerSubscription> {
  constructor(
    @InjectRepository(CustomerSubscription)
      private readonly customerSubscriptionRepository: Repository<CustomerSubscription>,
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
    });
    if (!subscriptionPlan) {
      throw new NotFoundException(
        `Subscription plan with ID ${subscriptionPlanId} not found`,
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

    const newSubscription = this.customerSubscriptionRepository.create({
      user,
      subscriptionPlan,
      subscriptionStatus,
        startDate: new Date(),
      nextBillingDate: new Date(
        Date.now() + subscriptionPlan.billingCycleDays * 24 * 60 * 60 * 1000,
        ),
    });

      return manager.save(CustomerSubscription, newSubscription);
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
