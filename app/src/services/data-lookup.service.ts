import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDataLookupDto } from '../dtos/core.dto';
import { DataLookup } from '../entities/data-lookup.entity';
import { Repository } from 'typeorm';

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
   * @returns A Promise that resolves to `true` if the value exists, or `false` otherwise.
   */
  async existsByValue(value: string): Promise<boolean> {
    return (await this.lookupRepository.count({ where: { value } })) > 0;
  }

  /**
   * Creates a new DataLookup entity.
   *
   * @param createDataLookupDto - The data transfer object containing the details for the new DataLookup entity.
   * @returns A Promise that resolves to the created DataLookup entity.
   */
  async create(createDataLookupDto: CreateDataLookupDto): Promise<DataLookup> {
    const lookupData = this.lookupRepository.create(createDataLookupDto);
    return await this.lookupRepository.save(lookupData);
  }

  /**
   * Creates multiple DataLookup entities in bulk.
   *
   * @param createDataLookupDtos - An array of data transfer objects, each containing the details for a new DataLookup entity.
   * @returns A Promise that resolves to an array of the created DataLookup entities.
   */
  async createBulk(
    createDataLookupDtos: CreateDataLookupDto[],
  ): Promise<DataLookup[]> {
    const lookupDataList = createDataLookupDtos.map((dto) =>
      this.lookupRepository.create(dto),
    );
    return await this.lookupRepository.save(lookupDataList);
  }

  /**
   * Retrieves all DataLookup entities.
   *
   * @returns A Promise that resolves to an array of DataLookup entities.
   */
  async findAll(): Promise<DataLookup[]> {
    return await this.lookupRepository.find();
  }

  /**
   * Retrieves a DataLookup entity by its ID.
   *
   * @param id - The ID of the DataLookup entity to retrieve.
   * @returns A Promise that resolves to the found DataLookup entity.
   * @throws NotFoundException if the entity with the specified ID is not found.
   */
  async findOne(id: string): Promise<DataLookup> {
    const lookupData = await this.lookupRepository.findOneBy({ id });
    if (!lookupData) {
      throw new NotFoundException(`Data Lookup with ID ${id} not found`);
    }
    return lookupData;
  }
}
