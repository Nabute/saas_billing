import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto, LoginDto } from '../dtos/user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';

/**
 * Authentication controller that handles user registration, login, and profile retrieval.
 */
@ApiTags('Authentication')
@Controller({ path: 'auth', version: new ConfigService().get('API_VERSION') })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Logs in a user with the provided credentials.
   *
   * @param loginDto - Data Transfer Object containing the user's login information.
   * @returns The validated user data along with JWT token if successful.
   */
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Successful login', type: User })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.validateUser(loginDto);
  }

  /**
   * Registers a new user with the provided details.
   *
   * @param createUserDto - Data Transfer Object containing the user's registration information.
   * @returns The newly registered user.
   */
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: User,
  })
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * Retrieves the profile of the authenticated user.
   *
   * @param req - The request object containing the user information.
   * @returns The authenticated user's profile.
   */
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile', type: User })
  @Get('profile')
  getProfile(@Request() req): User {
    return req.user;
  }
}
