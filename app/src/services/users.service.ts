import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { GenericService } from './base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ObjectState } from '@app/utils/enums';
import { DataLookupService } from './data-lookup.service';

@Injectable()
export class UsersService extends GenericService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataLookupService: DataLookupService,
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
  async findOneByEmail(
    email: string,
    manager: EntityManager,
  ): Promise<User | undefined> {
    return manager.findOneBy(User, { email });
  }

  /**
   * Finds a user by their ID.
   *
   * @param id - The ID of the user to find.
   * @returns A Promise that resolves to the found User entity or undefined if not found.
   */
  async findOne(
    id: string,
    manager?: EntityManager,
  ): Promise<User | undefined> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;
    return repo.findOne({ where: { id } });
  }

  /**
   * Creates a new user with a hashed password.
   *
   * @param user - The partial User entity containing the user data.
   * @returns A Promise that resolves to the newly created User entity.
   */
  async create(user: Partial<User>, manager: EntityManager): Promise<User> {
    const hashedPassword = await this.hashPassword(user.password);
    const objectState = await this.dataLookupService.getDefaultData(
      ObjectState.TYPE,
    );
    const newUser = manager.create(User, {
      ...user,
      password: hashedPassword,
      objectState,
    });
    return manager.save(User, newUser);
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
