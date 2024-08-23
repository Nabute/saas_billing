import { DataSource, EntityTarget, FindOptionsWhere, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import { ObjectState } from 'src/utils/enums';

export class GenericService<T extends BaseEntity> {
    protected readonly repository: Repository<T>;

    constructor(
        private readonly entity: EntityTarget<T>,
        protected readonly dataSource: DataSource,
    ) {
        this.repository = this.dataSource.getRepository(entity);
    }

    async destroy(id: string): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const entityName = typeof this.entity === 'function' ? this.entity.name : 'Entity';

            const whereClause: FindOptionsWhere<T> = { id } as FindOptionsWhere<T>;
            const entity = await queryRunner.manager.findOne(this.entity, { where: whereClause });
            if (!entity) {
                throw new NotFoundException(`${entityName} with id ${id} not found`);
            }

            const deletedState = await queryRunner.manager.findOne(DataLookup, { where: { value: ObjectState.DELETED } });
            if (!deletedState) {
                throw new NotFoundException(`Deleted state not found in DataLookup`);
            }

            entity.objectState = deletedState;
            entity.deletedDate = new Date();

            await queryRunner.manager.save(entity);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async saveEntityWithDefaultState(
        entity: T,
        defaultStateType: string
    ): Promise<T> {
        const isNew = !entity.id;

        if (isNew) {
            const defaultState = await this.dataSource.getRepository(DataLookup).findOne({
                where: { type: defaultStateType, is_default: true }
            });

            if (!defaultState) {
                throw new NotFoundException(`Unable to find default state for type ${defaultStateType}, please seed fixture data.`);
            }

            entity.objectState = defaultState;
        }

        return this.repository.save(entity);
    }
}
