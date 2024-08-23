import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard is a custom guard that extends the default AuthGuard with the 'jwt' strategy.
 * 
 * This guard protects routes by ensuring that requests include a valid JWT token.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
