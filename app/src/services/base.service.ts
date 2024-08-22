import { DataSource, EntityTarget, FindOptionsWhere } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import { ObjectState } from 'src/utils/enums';

export class GenericService<T extends BaseEntity> {
    constructor(
        private readonly entity: EntityTarget<T>,
        protected readonly dataSource: DataSource,
    ) { }

    async destroy(id: string): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const entityName = typeof this.entity === 'function' ? this.entity.name : 'Entity';

            // Explicitly casting the where clause
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
}
