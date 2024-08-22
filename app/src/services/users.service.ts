// src/services/users.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { GenericService } from './base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UsersService extends GenericService<User> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        dataSource: DataSource,
    ) {
        super(User, dataSource)
    }

    async findOneByEmail(email: string): Promise<User | undefined> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findOne(id: string): Promise<User | undefined> {
        return this.userRepository.findOne({ where: { id } });
    }

    async create(user: Partial<User>): Promise<User> {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = this.userRepository.create({
            ...user,
            password: hashedPassword,
        });
        return this.userRepository.save(newUser);
    }
}
