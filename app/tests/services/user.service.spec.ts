import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/services/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/entities/user.entity';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

jest.mock('../../src/services/base.service');

const mockUserRepository = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
});

const mockDataSource = () => ({});

describe('UsersService', () => {
    let service: UsersService;
    let repository: Repository<User>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useFactory: mockUserRepository,
                },
                {
                    provide: DataSource,
                    useFactory: mockDataSource,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findOneByEmail', () => {
        it('should return a user if one is found', async () => {
            const email = 'test@example.com';
            const user = { id: '1', email, password: 'hashedPassword' };

            jest.spyOn(repository, 'findOne').mockResolvedValue(user as User);

            const result = await service.findOneByEmail(email);
            expect(result).toEqual(user);
            expect(repository.findOne).toHaveBeenCalledWith({ where: { email } });
        });

        it('should return undefined if no user is found', async () => {
            const email = 'nonexistent@example.com';

            jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);

            const result = await service.findOneByEmail(email);
            expect(result).toBeUndefined();
            expect(repository.findOne).toHaveBeenCalledWith({ where: { email } });
        });
    });

    describe('findOne', () => {
        it('should return a user if one is found', async () => {
            const id = '1';
            const user = { id, email: 'test@example.com', password: 'hashedPassword' };

            jest.spyOn(repository, 'findOne').mockResolvedValue(user as User);

            const result = await service.findOne(id);
            expect(result).toEqual(user);
            expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
        });

        it('should return undefined if no user is found', async () => {
            const id = 'nonexistent-id';

            jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);

            const result = await service.findOne(id);
            expect(result).toBeUndefined();
            expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
        });
    });

    describe('create', () => {
        it('should create and return a new user with hashed password', async () => {
            const userDto = { email: 'test@example.com', password: 'plainPassword' };
            const hashedPassword = 'hashedPassword';
            const savedUser = { id: '1', email: 'test@example.com', password: hashedPassword };

            jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);
            jest.spyOn(repository, 'create').mockReturnValue(savedUser as User);
            jest.spyOn(repository, 'save').mockResolvedValue(savedUser as User);

            const result = await service.create(userDto);
            expect(bcrypt.hash).toHaveBeenCalledWith(userDto.password, 10);
            expect(repository.create).toHaveBeenCalledWith({
                ...userDto,
                password: hashedPassword,
            });
            expect(repository.save).toHaveBeenCalledWith(savedUser);
            expect(result).toEqual(savedUser);
        });

        it('should throw an error if password hashing fails', async () => {
            const userDto = { email: 'test@example.com', password: 'plainPassword' };

            jest.spyOn(bcrypt, 'hash').mockRejectedValue(new Error('Hashing failed'));

            await expect(service.create(userDto)).rejects.toThrow('Hashing failed');
            expect(bcrypt.hash).toHaveBeenCalledWith(userDto.password, 10);
            expect(repository.create).not.toHaveBeenCalled();
            expect(repository.save).not.toHaveBeenCalled();
        });

        it('should throw an error if saving the user fails', async () => {
            const userDto = { email: 'test@example.com', password: 'plainPassword' };
            const hashedPassword = 'hashedPassword';
            const newUser = { email: 'test@example.com', password: hashedPassword };

            jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);
            jest.spyOn(repository, 'create').mockReturnValue(newUser as User);
            jest.spyOn(repository, 'save').mockRejectedValue(new Error('Save failed'));

            await expect(service.create(userDto)).rejects.toThrow('Save failed');
            expect(bcrypt.hash).toHaveBeenCalledWith(userDto.password, 10);
            expect(repository.create).toHaveBeenCalledWith({
                ...userDto,
                password: hashedPassword,
            });
            expect(repository.save).toHaveBeenCalledWith(newUser);
        });
    });
});
