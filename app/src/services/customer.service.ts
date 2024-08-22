import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerSubscription } from '../entities/customer.entity';

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(CustomerSubscription)
        private customerRepository: Repository<CustomerSubscription>,
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
