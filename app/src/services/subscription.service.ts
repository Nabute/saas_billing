import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { AssignSubscriptionPlanDto, CreateSubscriptionDto, UpdateSubscriptionDto } from '../dtos/subscription.dto';
import { Customer } from '../entities/customer.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import { GenericService } from './base.service';
import { SubscriptionStatus } from 'src/utils/enums';

@Injectable()
export class SubscriptionService extends GenericService<Subscription> {
    constructor(
        @InjectRepository(Subscription)
        private readonly subscriptionRepository: Repository<Subscription>,
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
        @InjectRepository(SubscriptionPlan)
        private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
        @InjectRepository(DataLookup)
        private readonly dataLookupRepository: Repository<DataLookup>,
        dataSource: DataSource,
    ) {
        super(Subscription, dataSource)
    }

    async assignSubscriptionPlan(
        assignDto: AssignSubscriptionPlanDto,
    ): Promise<Customer> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { customerId, subscriptionPlanId } = assignDto;

            // Fetch customer
            const customer = await queryRunner.manager.findOne(Customer, {
                where: { id: customerId },
            });
            if (!customer) {
                throw new NotFoundException(`Customer with id ${customerId} not found`);
            }

            // Fetch subscription plan
            const subscriptionPlan = await queryRunner.manager.findOne(SubscriptionPlan, {
                where: { id: subscriptionPlanId },
            });
            if (!subscriptionPlan) {
                throw new NotFoundException(`Subscription Plan with id ${subscriptionPlanId} not found`);
            }

            // Fetch subscription status
            const defaultSubscriptionStatus = await queryRunner.manager.findOne(DataLookup, {
                where: { type: SubscriptionStatus.TYPE, is_default: true },
            });
            if (!defaultSubscriptionStatus) {
                throw new NotFoundException(`Unable to find the default subscription status.`);
            }

            // Update customer's subscription plan and status
            customer.subscriptionPlan = subscriptionPlan;
            customer.subscriptionStatus = defaultSubscriptionStatus;

            const updatedCustomer = await queryRunner.manager.save(customer);

            await queryRunner.commitTransaction();
            return updatedCustomer;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { customerId, planId, startDate, endDate, statusId } = createSubscriptionDto;

            const customer = await queryRunner.manager.findOne(Customer, { where: { id: customerId } });
            if (!customer) {
                throw new NotFoundException(`Customer with id ${customerId} not found`);
            }

            const plan = await queryRunner.manager.findOne(SubscriptionPlan, { where: { id: planId } });
            if (!plan) {
                throw new NotFoundException(`Subscription Plan with id ${planId} not found`);
            }

            const status = await queryRunner.manager.findOne(DataLookup, { where: { id: statusId } });
            if (!status) {
                throw new NotFoundException(`Status with id ${statusId} not found`);
            }

            const subscription = this.subscriptionRepository.create({
                customer,
                plan,
                startDate,
                endDate,
                status,
            });

            const savedSubscription = await queryRunner.manager.save(subscription);

            await queryRunner.commitTransaction();

            return savedSubscription;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: string, updateDto: UpdateSubscriptionDto): Promise<Subscription> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const subscription = await queryRunner.manager.findOne(Subscription, {
                where: { id },
                relations: ['customer', 'plan', 'status'],
            });
            if (!subscription) {
                throw new NotFoundException(`Subscription with id ${id} not found`);
            }

            const customer = await queryRunner.manager.findOne(Customer, { where: { id: updateDto.customerId } });
            if (!customer) {
                throw new NotFoundException(`Customer with id ${updateDto.customerId} not found`);
            }

            const plan = await queryRunner.manager.findOne(SubscriptionPlan, { where: { id: updateDto.planId } });
            if (!plan) {
                throw new NotFoundException(`Subscription Plan with id ${updateDto.planId} not found`);
            }

            const status = await queryRunner.manager.findOne(DataLookup, { where: { id: updateDto.statusId } });
            if (!status) {
                throw new NotFoundException(`Status with id ${updateDto.statusId} not found`);
            }

            subscription.customer = customer;
            subscription.plan = plan;
            subscription.startDate = updateDto.startDate;
            subscription.endDate = updateDto.endDate;
            subscription.status = status;

            const updatedSubscription = await queryRunner.manager.save(subscription);

            await queryRunner.commitTransaction();

            return updatedSubscription as Subscription;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(): Promise<Subscription[]> {
        return this.subscriptionRepository.find({ relations: ['customer', 'plan', 'status'] });
    }

    async findOne(id: string): Promise<Subscription> {
        const subscription = await this.subscriptionRepository.findOne({
            where: { id },
            relations: ['customer', 'plan', 'status'],
        });
        if (!subscription) {
            throw new NotFoundException(`Subscription with id ${id} not found`);
        }
        return subscription;
    }
}
