import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CustomerSubscription } from '../entities/customer.entity';
import { User } from '../entities/user.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import {
  CreateSubscriptionDto,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  UpdateSubscriptionStatusDto,
} from '../dtos/subscription.dto';
import {
  ObjectState,
  SubscriptionPlanState,
  SubscriptionStatus,
} from '../utils/enums';
import { GenericService } from './base.service';
import { BillingService } from './billing.service';
import { PaymentService } from './payment.service';

@Injectable()
export class SubscriptionService extends GenericService<SubscriptionPlan> {
  constructor(
    @InjectRepository(CustomerSubscription)
    private readonly customerSubscriptionRepository: Repository<CustomerSubscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(DataLookup)
    private readonly dataLookupRepository: Repository<DataLookup>,
    private readonly billingService: BillingService,
    private readonly paymentService: PaymentService,
    dataSource: DataSource,
  ) {
    super(SubscriptionPlan, dataSource);
  }

  /**
   * Creates a new customer subscription.
   *
   * @param createSubscriptionDto - DTO containing data to create a customer subscription.
   * @returns The newly created CustomerSubscription entity.
   * @throws NotFoundException if the user, subscription plan, or subscription status is not found.
   */
  async createCustomerSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<CustomerSubscription> {
    const { userId, subscriptionPlanId } = createSubscriptionDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(this.userRepository.target, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const subscriptionPlan = await queryRunner.manager.findOne(this.subscriptionPlanRepository.target, {
        where: { id: subscriptionPlanId, status: { value: SubscriptionPlanState.ACTIVE } }
      });
      if (!subscriptionPlan) {
        throw new NotFoundException(`Subscription plan with ID ${subscriptionPlanId} not found.`);
      }

      const subscriptionStatus = await queryRunner.manager.findOne(this.dataLookupRepository.target, {
        where: { value: SubscriptionStatus.PENDING },
      });
      if (!subscriptionStatus) {
        throw new NotFoundException(`Unable to get default subscription status. Please load fixtures`);
      }

      const startDate = new Date();

      const newSubscription = this.customerSubscriptionRepository.create({
        user,
        subscriptionPlan,
        subscriptionStatus,
        endDate: null,
        startDate,
      });

      await queryRunner.manager.save(newSubscription);

      // Create and save invoice within the same transaction
      const invoice = await this.billingService.createInvoiceForSubscription(newSubscription, queryRunner.manager);

      await queryRunner.commitTransaction();
      return { ...newSubscription, invoice } as unknown as CustomerSubscription;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Transaction failed. All operations rolled back.', error.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retrieves all customer subscriptions for a given user.
   *
   * @param userId - The ID of the user whose subscriptions are to be retrieved.
   * @returns An array of CustomerSubscription entities.
   * @throws NotFoundException if the user is not found.
   */
  async getCustomerSubscriptions(
    userId: string,
  ): Promise<CustomerSubscription[]> {
    return this.customerSubscriptionRepository.find({
      where: { user: { id: userId } },
      relations: ['subscriptionPlan', 'subscriptionStatus'],
    });
  }

  /**
   * Updates the status of a customer subscription.
   *
   * @param subscriptionId - The ID of the subscription to update.
   * @param updateSubscriptionStatusDto - DTO containing the new subscription status and optional end date.
   * @returns The updated CustomerSubscription entity.
   * @throws NotFoundException if the subscription or subscription status is not found.
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    updateSubscriptionStatusDto: UpdateSubscriptionStatusDto,
  ): Promise<CustomerSubscription> {
    const { subscriptionStatusId, endDate } = updateSubscriptionStatusDto;

    const subscription = await this.customerSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['subscriptionStatus'],
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    const subscriptionStatus = await this.dataLookupRepository.findOneBy({
      id: subscriptionStatusId,
    });
    if (!subscriptionStatus) {
      throw new NotFoundException(
        `Subscription status with ID ${subscriptionStatusId} not found`,
      );
    }

    subscription.subscriptionStatus = subscriptionStatus;
    subscription.endDate = endDate || subscription.endDate;

    return this.customerSubscriptionRepository.save(subscription);
  }

  /**
   * Creates a new subscription plan.
   *
   * @param createSubscriptionPlanDto - DTO containing data to create a new subscription plan.
   * @returns The newly created SubscriptionPlan entity.
   * @throws NotFoundException if the default subscription plan state is not found.
   */
  async createSubscriptionPlan(
    createSubscriptionPlanDto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    const { name, description, price, billingCycleDays, prorate } =
      createSubscriptionPlanDto;

    const planDefaultState = await this.dataLookupRepository.findOneBy({
      type: SubscriptionPlanState.TYPE,
      is_default: true,
    });
    if (!planDefaultState) {
      throw new NotFoundException(
        `Unable to find subscription plan default state, please seed fixture data.`,
      );
    }

    const newPlan = this.subscriptionPlanRepository.create({
      name,
      description,
      price,
      billingCycleDays,
      status: planDefaultState,
      prorate,
    });

    return this.saveEntityWithDefaultState(newPlan, ObjectState.TYPE);
  }

  /**
   * Retrieves all subscription plans.
   *
   * @returns An array of SubscriptionPlan entities.
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanRepository.find({
      relations: ['status', 'objectState'],
    });
  }

  /**
   * Retrieves a subscription plan by its ID.
   *
   * @param id - The ID of the subscription plan to retrieve.
   * @returns The found SubscriptionPlan entity.
   * @throws NotFoundException if the subscription plan is not found.
   */
  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id },
      relations: ['status', 'objectState'],
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  /**
   * Updates an existing subscription plan.
   *
   * @param id - The ID of the subscription plan to update.
   * @param updateSubscriptionPlanDto - DTO containing the updated data for the subscription plan.
   * @returns The updated SubscriptionPlan entity.
   * @throws NotFoundException if the subscription plan or status is not found.
   */
  async updateSubscriptionPlan(
    id: string,
    updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    const plan = await this.getSubscriptionPlanById(id);

    const { name, description, price, billingCycleDays, statusId, prorate } =
      updateSubscriptionPlanDto;

    if (statusId) {
      const status = await this.dataLookupRepository.findOneBy({
        id: statusId,
      });
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

  /**
   * Deletes a subscription plan by its ID.
   *
   * @param id - The ID of the subscription plan to delete.
   * @returns A promise that resolves when the subscription plan is deleted.
   */
  deleteSubscriptionPlan(id: string): Promise<void> {
    return this.destroy(id);
  }
}
