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
        super(User, dataSource);
    }

    /**
     * Finds a user by their email address.
     * 
     * @param email - The email address of the user to find.
     * @returns A Promise that resolves to the found User entity or undefined if not found.
     */
    async findOneByEmail(email: string): Promise<User | undefined> {
        return this.userRepository.findOne({ where: { email } });
    }

    /**
     * Finds a user by their ID.
     * 
     * @param id - The ID of the user to find.
     * @returns A Promise that resolves to the found User entity or undefined if not found.
     */
    async findOne(id: string): Promise<User | undefined> {
        return this.userRepository.findOne({ where: { id } });
    }

    /**
     * Creates a new user with a hashed password.
     * 
     * @param user - The partial User entity containing the user data.
     * @returns A Promise that resolves to the newly created User entity.
     */
    async create(user: Partial<User>): Promise<User> {
        const hashedPassword = await this.hashPassword(user.password);
        const newUser = this.userRepository.create({
            ...user,
            password: hashedPassword,
        });
        return this.userRepository.save(newUser);
    }

    /**
     * Hashes a plain text password using bcrypt.
     * 
     * @param password - The plain text password to hash.
     * @returns A Promise that resolves to the hashed password.
     */
    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }
}
