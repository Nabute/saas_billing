import {
  DataSource,
  EntityTarget,
  FindOptionsWhere,
  Repository,
  EntityManager,
} from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';
import { DataLookup } from '../entities/data-lookup.entity';
import { ObjectState } from '../utils/enums';

export class GenericService<T extends BaseEntity> {
  protected readonly repository: Repository<T>;

  constructor(
    private readonly entity: EntityTarget<T>,
    protected readonly dataSource: DataSource,
  ) {
    this.repository = this.dataSource.getRepository(entity);
  }

  /**
   * Marks an entity as deleted by setting its state to 'DELETED' and updating the deletion date.
   * Uses the provided EntityManager to ensure it participates in the transaction if one is active.
   *
   * @param id - The ID of the entity to be marked as deleted.
   * @param manager - The EntityManager to be used, typically provided from the controller.
   * @throws NotFoundException if the entity or the 'DELETED' state is not found.
   */
  async destroy(id: string, manager: EntityManager): Promise<void> {
    const entity = await manager.findOne(this.entity, {
      where: { id } as FindOptionsWhere<T>,
    });

    if (!entity) {
      throw new NotFoundException(
        `${this.getEntityName()} with id ${id} not found`,
      );
    }

    const deletedState = await this.getDeletedState(manager);

    entity.objectState = deletedState;
    entity.deletedDate = new Date();

    await manager.save(entity);
  }

  /**
   * Retrieves the 'DELETED' state from the DataLookup table.
   * Uses the provided EntityManager to ensure it participates in the transaction if one is active.
   *
   * @param manager - The EntityManager to be used, typically provided from the controller.
   * @returns A Promise that resolves to the 'DELETED' state.
   * @throws NotFoundException if the 'DELETED' state is not found.
   */
  private async getDeletedState(manager: EntityManager): Promise<DataLookup> {
    const deletedState = await manager.findOne(DataLookup, {
      where: { value: ObjectState.DELETED },
    });

    if (!deletedState) {
      throw new NotFoundException(`Deleted state not found in DataLookup`);
    }

    return deletedState;
  }

  /**
   * Retrieves the entity name from the EntityTarget for error messages.
   *
   * @returns The name of the entity.
   */
  private getEntityName(): string {
    return typeof this.entity === 'function' ? this.entity.name : 'Entity';
  }
}
