import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/controllers/auth.controller';
import { AuthService } from '../../src/services/auth.service';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto, LoginDto } from '../../src/dtos/user.dto';
import { User } from '../../src/entities/user.entity';

describe('AuthController', () => {
    let authController: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        validateUser: jest.fn(),
                        register: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'API_VERSION') return '1';
                            return null;
                        }),
                    },
                },
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(authController).toBeDefined();
    });

    describe('login', () => {
        it('should return a user object if login is successful', async () => {
            const loginDto: LoginDto = { email: 'testuser@gmail.com', password: 'testpassword' };
            const user = { id: 1, email: 'testuser@gmail.com' } as unknown as User;

            jest.spyOn(authService, 'validateUser').mockResolvedValue(user as unknown as { user: Omit<User, "password">; access_token: string; });

            const result = await authController.login(loginDto);
            expect(result).toBe(user);
            expect(authService.validateUser).toHaveBeenCalledWith(loginDto);
        });
    });

    describe('register', () => {
        it('should return a user object after successful registration', async () => {
            const createUserDto: CreateUserDto = { email: 'newuser@gmail.com', password: 'newpassword' } as CreateUserDto;
            const user = { id: 1, email: 'newuser@gmail.com' } as unknown as User;

            jest.spyOn(authService, 'register').mockResolvedValue(user);

            const result = await authController.register(createUserDto);
            expect(result).toBe(user);
            expect(authService.register).toHaveBeenCalledWith(createUserDto);
        });
    });

    describe('getProfile', () => {
        it('should return the user profile', () => {
            const req = { user: { id: 1, username: 'testuser' } };

            const result = authController.getProfile(req);
            expect(result).toBe(req.user);
        });
    });
});
