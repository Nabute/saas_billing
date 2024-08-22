import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerSubscription } from '../entities/customer.entity';
import { User } from '../entities/user.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import { CreateSubscriptionDto, CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto, UpdateSubscriptionStatusDto } from '../dtos/subscription.dto';

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectRepository(CustomerSubscription)
        private readonly customerSubscriptionRepository: Repository<CustomerSubscription>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(SubscriptionPlan)
        private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
        @InjectRepository(DataLookup)
        private readonly dataLookupRepository: Repository<DataLookup>,
    ) { }

    async createCustomerSubscription(createSubscriptionDto: CreateSubscriptionDto): Promise<CustomerSubscription> {
        const { userId, subscriptionPlanId, subscriptionStatusId, startDate } = createSubscriptionDto;

        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        const subscriptionPlan = await this.subscriptionPlanRepository.findOneBy({ id: subscriptionPlanId });
        if (!subscriptionPlan) {
            throw new NotFoundException(`Subscription plan with ID ${subscriptionPlanId} not found`);
        }

        const subscriptionStatus = await this.dataLookupRepository.findOneBy({ id: subscriptionStatusId });
        if (!subscriptionStatus) {
            throw new NotFoundException(`Subscription status with ID ${subscriptionStatusId} not found`);
        }

        const newSubscription = this.customerSubscriptionRepository.create({
            user,
            subscriptionPlan,
            subscriptionStatus,
            startDate,
            endDate: null,
        });

        return this.customerSubscriptionRepository.save(newSubscription);
    }

    async getCustomerSubscriptions(userId: string): Promise<CustomerSubscription[]> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return this.customerSubscriptionRepository.find({
            where: { user },
            relations: ['subscriptionPlan', 'subscriptionStatus'],
        });
    }

    async updateSubscriptionStatus(subscriptionId: string, updateSubscriptionStatusDto: UpdateSubscriptionStatusDto): Promise<CustomerSubscription> {
        const { subscriptionStatusId, endDate } = updateSubscriptionStatusDto;

        const subscription = await this.customerSubscriptionRepository.findOne({
            where: { id: subscriptionId },
            relations: ['subscriptionStatus'],
        });

        if (!subscription) {
            throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
        }

        const subscriptionStatus = await this.dataLookupRepository.findOneBy({ id: subscriptionStatusId });
        if (!subscriptionStatus) {
            throw new NotFoundException(`Subscription status with ID ${subscriptionStatusId} not found`);
        }

        subscription.subscriptionStatus = subscriptionStatus;
        subscription.endDate = endDate || subscription.endDate;

        return this.customerSubscriptionRepository.save(subscription);
    }

    async createSubscriptionPlan(createSubscriptionPlanDto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
        const { name, description, price, billingCycleDays, statusId, prorate } = createSubscriptionPlanDto;

        const status = await this.dataLookupRepository.findOneBy({ id: statusId });
        if (!status) {
            throw new NotFoundException(`Status with ID ${statusId} not found`);
        }

        const newPlan = this.subscriptionPlanRepository.create({
            name,
            description,
            price,
            billingCycleDays,
            status,
            prorate,
        });

        return this.subscriptionPlanRepository.save(newPlan);
    }

    async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
        return this.subscriptionPlanRepository.find({
            relations: ['status'],
        });
    }

    async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan> {
        const plan = await this.subscriptionPlanRepository.findOne({
            where: { id },
            relations: ['status'],
        });

        if (!plan) {
              throw new NotFoundException(`Subscription plan with ID ${id} not found`);
          }

        return plan;
    }

    async updateSubscriptionPlan(id: string, updateSubscriptionPlanDto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
        const plan = await this.getSubscriptionPlanById(id);

        const { name, description, price, billingCycleDays, statusId, prorate } = updateSubscriptionPlanDto;

        if (statusId) {
            const status = await this.dataLookupRepository.findOneBy({ id: statusId });
            if (!status) {
                throw new NotFoundException(`Status with ID ${statusId} not found`);
            }
              plan.status = status;
          }

        plan.name = name ?? plan.name;
        plan.description = description ?? plan.description;
        plan.price = price ?? plan.price;
        plan.billingCycleDays = billingCycleDays ?? plan.billingCycleDays;
        plan.prorate = prorate !== undefined ? prorate : plan.prorate;

        return this.subscriptionPlanRepository.save(plan);
    }

    async deleteSubscriptionPlan(id: string): Promise<void> {
        const plan = await this.getSubscriptionPlanById(id);

        await this.subscriptionPlanRepository.remove(plan);
    }
}
