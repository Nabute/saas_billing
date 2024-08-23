import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/services/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../src/services/users.service';
import { CreateUserDto, LoginDto } from '../../src/dtos/user.dto';
import { User } from '../../src/entities/user.entity';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user with JWT token when credentials are valid', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };
      const user: User = { id: 1, email: 'test@example.com', password: 'hashedpassword' } as unknown as User;

      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      const result = await authService.validateUser(loginDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id });
      expect(result).toEqual({
        user: { id: user.id, email: user.email },
        access_token: 'token',
      });
    });

    it('should return null when credentials are invalid', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'wrongpassword' };
      const user: User = { id: 1, email: 'test@example.com', password: 'hashedpassword' } as unknown as User;

      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await authService.validateUser(loginDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate and return a JWT token', async () => {
      const user: User = { id: 1, email: 'test@example.com' } as unknown as User;
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      const result = await authService.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id });
      expect(result).toEqual({ access_token: 'token' });
    });
  });

  describe('register', () => {
    it('should create a new user and return it', async () => {
      const createUserDto: CreateUserDto = { email: 'test@example.com', password: 'password', name: "SomeName", username: "User'sName" };
      const user: User = { id: 1, email: 'test@example.com' } as unknown as User;

      jest.spyOn(usersService, 'create').mockResolvedValue(user);

      const result = await authService.register(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(user);
    });
  });
});
