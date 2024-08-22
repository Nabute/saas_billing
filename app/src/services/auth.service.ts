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
    ) { }

    async validateUser(loginDto: LoginDto): Promise<any> {
        const user = await this.usersService.findOneByEmail(loginDto.email);
        if (user && await bcrypt.compare(loginDto.password, user.password)) {
            const { password, ...result } = user;
            const credential = await this.login(user)
            return { user: result, ...credential };
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(createUserDto: CreateUserDto): Promise<User> {
        const user = await this.usersService.create(createUserDto);
        return user;
    }
}
