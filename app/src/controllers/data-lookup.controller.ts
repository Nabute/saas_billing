import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateDataLookupDto } from '../dtos/core.dto';
import { DataLookupService } from '../services/data-lookup.service';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

/**
 * Controller for managing lookup data.
 */
@ApiTags('Configurations')
@Controller({ path: 'core/lookup-data', version: config.get('API_VERSION') })
export class DataLookupController {
  constructor(private readonly dataLookupService: DataLookupService) {}

  /**
   * Creates a new data lookup entry.
   *
   * @param createDataLookupDto - DTO containing the data to create a new data lookup entry.
   * @param req - The HTTP request object, which contains the transaction manager.
   * @returns The newly created DataLookup entity.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new data lookup entry' })
  async create(
    @Body() createDataLookupDto: CreateDataLookupDto,
    @Req() req: any,
  ) {
    const entityManager = req.transactionManager;
    return this.dataLookupService.create(createDataLookupDto, entityManager);
  }

  /**
   * Creates multiple data lookup entries in bulk.
   *
   * @param createDataLookupDtos - Array of DTOs containing the data to create multiple data lookup entries.
   * @param req - The HTTP request object, which contains the transaction manager.
   * @returns An array of created DataLookup entities.
   */
  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple data lookup entries in bulk' })
  async createBulk(
    @Body() createDataLookupDtos: CreateDataLookupDto[],
    @Req() req: any,
  ) {
    const entityManager = req.transactionManager;
    return this.dataLookupService.createBulk(
      createDataLookupDtos,
      entityManager,
    );
  }

  /**
   * Retrieves all data lookup entries.
   *
   * @param req - The HTTP request object, which contains the transaction manager.
   * @returns An array of DataLookup entities.
   */
  @Get()
  @ApiOperation({ summary: 'Retrieve all data lookup entries' })
  async findAll(@Req() req: any) {
    const entityManager = req.transactionManager;
    return this.dataLookupService.findAll(entityManager);
  }

  /**
   * Retrieves a single data lookup entry by ID.
   *
   * @param id - The ID of the data lookup entry to retrieve.
   * @param req - The HTTP request object, which contains the transaction manager.
   * @returns The found DataLookup entity.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single data lookup entry by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const entityManager = req.transactionManager;
    return this.dataLookupService.findOne(id, entityManager);
  }
}
