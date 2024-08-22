import { Controller, Post, Body, Request, UseGuards, Get } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto, LoginDto } from '../dtos/user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

@ApiTags('auth')
@Controller({ path: 'auth', version: config.get('API_VERSION') })
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Successful login', type: User })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.validateUser(loginDto);
  }

  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User successfully registered', type: User })
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile', type: User })
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
