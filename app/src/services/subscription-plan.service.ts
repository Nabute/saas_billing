import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dtos/subscription-plan.dto';
import { DataLookup } from '../entities/data-lookup.entity';
import { ObjectState, SubscriptionPlanState } from 'src/utils/enums';
import { GenericService } from './base.service';

@Injectable()
export class SubscriptionPlanService extends GenericService<SubscriptionPlan> {
    constructor(
        @InjectRepository(SubscriptionPlan)
        private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
        @InjectRepository(DataLookup)
        private readonly dataLookupRepository: Repository<DataLookup>,
        dataSource: DataSource,
    ) {
        super(SubscriptionPlan, dataSource)
    }

    async getDataLookupByValue(lookupId: string): Promise<DataLookup> {
        const lookupData = await this.dataLookupRepository.findOne({
            where: { value: lookupId },
        });
        if (!lookupData) {
            throw new NotFoundException(`Data Lookup with ID ${lookupId} not found`);
        }
        return lookupData;
    }

    async create(createSubscriptionPlanDto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const defaultObjectState = await queryRunner.manager.findOne(DataLookup, { where: { type: ObjectState.TYPE, is_default: true } });
            if (!defaultObjectState) {
                throw new NotFoundException(`Unable to find default object state`);
            }

            const defaultSubscriptionState = await queryRunner.manager.findOne(DataLookup, { where: { type: SubscriptionPlanState.TYPE, is_default: true } });
            if (!defaultSubscriptionState) {
                throw new NotFoundException(`Unable to find default subscription state`);
            }

            const subscriptionPlan = this.subscriptionPlanRepository.create({
                objectState: defaultObjectState,
                status: defaultSubscriptionState,
                ...createSubscriptionPlanDto,
            });

            const savedSubscriptionPlan = await queryRunner.manager.save(subscriptionPlan);

            await queryRunner.commitTransaction();
            return savedSubscriptionPlan;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(): Promise<SubscriptionPlan[]> {
        return this.subscriptionPlanRepository.find({ relations: ['status'] });
    }

    async findOne(id: string): Promise<SubscriptionPlan> {
        const subscriptionPlan = await this.subscriptionPlanRepository.findOne({
            where: { id },
            relations: ['status'],
        });
        if (!subscriptionPlan) {
            throw new NotFoundException(`Subscription Plan with id ${id} not found`);
        }
        return subscriptionPlan;
    }

    async update(id: string, updateDto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const subscriptionPlan = await queryRunner.manager.findOne(SubscriptionPlan, { where: { id } });
            if (!subscriptionPlan) {
                throw new NotFoundException(`Subscription Plan with id ${id} not found`);
            }

            if (updateDto.statusId) {
                const status = await queryRunner.manager.findOne(DataLookup, { where: { id: updateDto.statusId } });
                if (!status) {
                    throw new NotFoundException(`Status with id ${updateDto.statusId} not found`);
                }
                subscriptionPlan.status = status;
            }

            // Update all other properties from DTO
            Object.assign(subscriptionPlan, updateDto);

            const updatedSubscriptionPlan = await queryRunner.manager.save(subscriptionPlan);

            await queryRunner.commitTransaction();
            return updatedSubscriptionPlan;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
