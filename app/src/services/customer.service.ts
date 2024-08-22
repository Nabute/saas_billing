import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
    ) { }

    create(createCustomerDto: any) {
        const customer = this.customerRepository.create(createCustomerDto);
        return this.customerRepository.save(customer);
    }

    findAll() {
        return this.customerRepository.find();
    }

    findOne(id: string) {
        return this.customerRepository.findOne({ where: { id } });
    }
}
