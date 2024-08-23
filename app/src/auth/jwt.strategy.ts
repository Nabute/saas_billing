import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

/**
 * JwtStrategy is used to validate JWT tokens and retrieve the associated user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    /**
     * Validates the JWT token's payload and retrieves the user associated with it.
     *
     * @param payload - The decoded JWT payload containing user information.
     * @returns The authenticated User entity.
     * @throws UnauthorizedException if the user is not found or the token is invalid.
     */
    async validate(payload: any): Promise<User> {
        const user = await this.usersService.findOne(payload.sub);
        if (!user) {
            throw new UnauthorizedException('Invalid token: user not found');
        }
        return user;
    }
}
