import {
  DataSource,
  EntityTarget,
  FindOptionsWhere,
  Repository,
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
   * Uses a database transaction to ensure data integrity.
   *
   * @param id - The ID of the entity to be marked as deleted.
   * @throws NotFoundException if the entity or the 'DELETED' state is not found.
   */
  async destroy(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = await queryRunner.manager.findOne(this.entity, {
        where: { id } as FindOptionsWhere<T>,
      });

      if (!entity) {
        throw new NotFoundException(
          `${this.getEntityName()} with id ${id} not found`,
        );
      }

      const deletedState = await this.getDeletedState(queryRunner);

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

  /**
   * Saves an entity with a default state if it is a new entity.
   *
   * @param entity - The entity to be saved.
   * @param defaultStateType - The type of the default state to be applied to the entity.
   * @returns A Promise that resolves to the saved entity.
   * @throws NotFoundException if the default state for the given type is not found.
   */
  async saveEntityWithDefaultState(
    entity: T,
    defaultStateType: string,
  ): Promise<T> {
    if (!entity.id) {
      const defaultState = await this.getDefaultState(defaultStateType);
      entity.objectState = defaultState;
    }

    return this.repository.save(entity);
  }

  /**
   * Retrieves the 'DELETED' state from the DataLookup table.
   *
   * @param queryRunner - The query runner used for the transaction.
   * @returns A Promise that resolves to the 'DELETED' state.
   * @throws NotFoundException if the 'DELETED' state is not found.
   */
  private async getDeletedState(queryRunner: any): Promise<DataLookup> {
    const deletedState = await queryRunner.manager.findOne(DataLookup, {
      where: { value: ObjectState.DELETED },
    });

    if (!deletedState) {
      throw new NotFoundException(`Deleted state not found in DataLookup`);
    }

    return deletedState;
  }

  /**
   * Retrieves the default state from the DataLookup table.
   *
   * @param defaultStateType - The type of the default state to retrieve.
   * @returns A Promise that resolves to the default state.
   * @throws NotFoundException if the default state for the given type is not found.
   */
  private async getDefaultState(defaultStateType: string): Promise<DataLookup> {
    const defaultState = await this.dataSource
      .getRepository(DataLookup)
      .findOne({
        where: { type: defaultStateType, is_default: true },
      });

    if (!defaultState) {
      throw new NotFoundException(
        `Unable to find default state for type ${defaultStateType}, please seed fixture data.`,
      );
    }

    return defaultState;
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
