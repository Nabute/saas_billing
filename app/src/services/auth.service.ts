import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { CreateUserDto, LoginDto } from '../dtos/user.dto';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Validates the user credentials.
   *
   * @param loginDto - An object containing the user's login information (email and password).
   * @returns A Promise that resolves to an object containing the user information (excluding the password) and JWT token credentials if validation is successful; otherwise, returns null.
   */
  async validateUser(
    loginDto: LoginDto,
  ): Promise<{ user: Omit<User, 'password'>; access_token: string } | null> {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (user && (await this.verifyPassword(loginDto.password, user.password))) {
      const { password, ...userWithoutPassword } = user;
      console.log('🚀 ~ AuthService ~ password:', password);
      const access_token = await this.generateJwtToken(user);
      return { user: userWithoutPassword as User, access_token };
    }
    return null;
  }

  /**
   * Logs in a user by generating a JWT token.
   *
   * @param user - The user object.
   * @returns A Promise that resolves to an object containing the JWT access token.
   */
  async login(user: User): Promise<{ access_token: string }> {
    const access_token = await this.generateJwtToken(user);
    return { access_token };
  }

  /**
   * Registers a new user in the system.
   *
   * @param createUserDto - An object containing the new user's registration details.
   * @returns A Promise that resolves to the created User entity.
   */
  async register(createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  /**
   * Verifies the user's password against the stored hashed password.
   *
   * @param password - The plain text password provided by the user.
   * @param hashedPassword - The hashed password stored in the database.
   * @returns A Promise that resolves to true if the passwords match, false otherwise.
   */
  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generates a JWT token for the authenticated user.
   *
   * @param user - An object containing the user's information.
   * @returns A Promise that resolves to the JWT access token.
   */
  private async generateJwtToken(user: User): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
