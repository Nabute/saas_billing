import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateDataLookupDto } from "src/dtos/core.dto";
import { DataLookup } from "src/entities/data-lookup.entity";
import { Repository } from "typeorm";

@Injectable()
export class DataLookupService {
    constructor(
        @InjectRepository(DataLookup)
        private readonly lookupRepository: Repository<DataLookup>,
    ) { }

    async existsByValue(value: string): Promise<boolean> {
        const count = await this.lookupRepository.count({ where: { value } });
        return count > 0;
    }

    create(createDataLookupDto: CreateDataLookupDto): Promise<DataLookup> {
        const lookupData = this.lookupRepository.create(createDataLookupDto);
        return this.lookupRepository.save(lookupData);
    }

    async createBulk(createDataLookupDtos: CreateDataLookupDto[]): Promise<any> {
        const createdData = [];
        for (const createDataLookupDto of createDataLookupDtos) {
            const created = await this.create(createDataLookupDto);
            createdData.push(created);
        }
        return createdData;
    }

    async findAll(): Promise<DataLookup[]> {
        return this.lookupRepository.find();
    }

    async findOne(id: string): Promise<DataLookup> {
        const lookupData = await this.lookupRepository.findOneBy({ id });
        if (!lookupData) {
            throw new NotFoundException(`Data Lookup with ID ${id} not found`);
        }
        return lookupData;
    }
}