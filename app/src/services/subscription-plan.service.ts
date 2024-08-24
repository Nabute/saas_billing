import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, DataSource } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from '../dtos/subscription.dto';
import { GenericService } from './base.service';
import { SubscriptionPlanState } from '../utils/enums';

@Injectable()
export class SubscriptionPlanService extends GenericService<SubscriptionPlan> {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(DataLookup)
    private readonly dataLookupRepository: Repository<DataLookup>,
    dataSource: DataSource,
  ) {
    super(SubscriptionPlan, dataSource);
  }

  async createSubscriptionPlan(
    createSubscriptionPlanDto: CreateSubscriptionPlanDto,
    manager: EntityManager,
  ): Promise<SubscriptionPlan> {
    const { name, description, price, billingCycleDays, prorate } =
      createSubscriptionPlanDto;

    const planDefaultState = await manager.findOne(DataLookup, {
      where: { type: SubscriptionPlanState.TYPE, is_default: true },
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

    return manager.save(SubscriptionPlan, newPlan);
  }

  async getSubscriptionPlans(
    manager: EntityManager,
  ): Promise<SubscriptionPlan[]> {
    return manager.find(SubscriptionPlan, {
      relations: ['status', 'objectState'],
    });
  }

  async getSubscriptionPlanById(
    id: string,
    manager: EntityManager,
  ): Promise<SubscriptionPlan> {
    const plan = await manager.findOne(SubscriptionPlan, {
      where: { id },
      relations: ['status', 'objectState'],
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  async updateSubscriptionPlan(
    id: string,
    updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
    manager: EntityManager,
  ): Promise<SubscriptionPlan> {
    const plan = await this.getSubscriptionPlanById(id, manager);

    const { name, description, price, billingCycleDays, statusId, prorate } =
      updateSubscriptionPlanDto;

    if (statusId) {
      const status = await manager.findOne(DataLookup, {
        where: { id: statusId },
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

    return manager.save(SubscriptionPlan, plan);
  }

  async deleteSubscriptionPlan(
    id: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.destroy(id, manager);
  }
}
