import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDataLookupDto } from '../dtos/core.dto';
import { DataLookup } from '../entities/data-lookup.entity';
import { Repository, EntityManager } from 'typeorm';

@Injectable()
export class DataLookupService {
  constructor(
    @InjectRepository(DataLookup)
    private readonly lookupRepository: Repository<DataLookup>,
  ) {}

  /**
   * Checks if a DataLookup entity with the specified value exists.
   *
   * @param value - The value to check for existence in the DataLookup table.
   * @param manager - The EntityManager provided by the transaction.
   * @returns A Promise that resolves to `true` if the value exists, or `false` otherwise.
   */
  async existsByValue(value: string, manager: EntityManager): Promise<boolean> {
    return (await manager.count(DataLookup, { where: { value } })) > 0;
  }

  /**
   * Creates a new DataLookup entity.
   *
   * @param createDataLookupDto - The data transfer object containing the details for the new DataLookup entity.
   * @param manager - The EntityManager provided by the transaction.
   * @returns A Promise that resolves to the created DataLookup entity.
   */
  async create(
    createDataLookupDto: CreateDataLookupDto,
    manager: EntityManager,
  ): Promise<DataLookup> {
    const lookupData = manager.create(DataLookup, createDataLookupDto);
    return await manager.save(DataLookup, lookupData);
  }

  /**
   * Creates multiple DataLookup entities in bulk.
   *
   * @param createDataLookupDtos - An array of data transfer objects, each containing the details for a new DataLookup entity.
   * @param manager - The EntityManager provided by the transaction.
   * @returns A Promise that resolves to an array of the created DataLookup entities.
   */
  async createBulk(
    createDataLookupDtos: CreateDataLookupDto[],
    manager: EntityManager,
  ): Promise<DataLookup[]> {
    const lookupDataList = createDataLookupDtos.map((dto) =>
      manager.create(DataLookup, dto),
    );
    return await manager.save(DataLookup, lookupDataList);
  }

  /**
   * Retrieves all DataLookup entities.
   *
   * @param manager - The EntityManager provided by the transaction.
   * @returns A Promise that resolves to an array of DataLookup entities.
   */
  async findAll(manager: EntityManager): Promise<DataLookup[]> {
    return await manager.find(DataLookup);
  }

  /**
   * Retrieves a DataLookup entity by its ID.
   *
   * @param id - The ID of the DataLookup entity to retrieve.
   * @param manager - The EntityManager provided by the transaction.
   * @returns A Promise that resolves to the found DataLookup entity.
   * @throws NotFoundException if the entity with the specified ID is not found.
   */
  async findOne(id: string, manager: EntityManager): Promise<DataLookup> {
    const lookupData = await manager.findOneBy(DataLookup, { id });
    if (!lookupData) {
      throw new NotFoundException(`Data Lookup with ID ${id} not found`);
    }
    return lookupData;
  }

  /**
   * Retrieves the default state from the DataLookup table.
   *
   * @param defaultStateType - The type of the default state to retrieve.
   * @param manager - The EntityManager provided by the transaction.
   * @returns A Promise that resolves to the default state.
   * @throws NotFoundException if the default state for the given type is not found.
   */
  async getDefaultData(
    defaultStateType: string,
    manager?: EntityManager,
  ): Promise<DataLookup> {
    const repo = manager
      ? manager.getRepository(DataLookup)
      : this.lookupRepository;
    const defaultState = await repo.findOne({
      where: { type: defaultStateType, is_default: true },
    });

    if (!defaultState) {
      throw new NotFoundException(
        `Unable to find default state for type ${defaultStateType}, please seed fixture data.`,
      );
    }

    return defaultState;
  }
}
