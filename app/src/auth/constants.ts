import { ConfigService } from '@nestjs/config';

/**
 * `jwtConstants` holds the JWT secret key, which is dynamically set by the `jwtConstantsProvider`.
 */
export const jwtConstants = {
  secret: '', // This value will be set by the `jwtConstantsProvider` factory.
};

/**
 * `jwtConstantsProvider` is a factory provider that retrieves the JWT secret from the configuration service.
 * 
 * This provider uses the `ConfigService` to dynamically set the `jwtConstants.secret` value from the environment
 * or configuration files. The provider is registered under the `JWT_CONSTANTS` token.
 * 
 * @example
 * // Usage in a module:
 * providers: [jwtConstantsProvider]
 * 
 * @see ConfigService
 */
export const jwtConstantsProvider = {
  provide: 'JWT_CONSTANTS',
  /**
   * A factory function that retrieves the JWT secret from the `ConfigService`.
   * 
   * @param {ConfigService} configService - The configuration service to retrieve environment variables.
   * @returns {Promise<typeof jwtConstants>} - A promise that resolves to the `jwtConstants` object with the secret set.
   */
  useFactory: async (configService: ConfigService): Promise<typeof jwtConstants> => {
    jwtConstants.secret = configService.get<string>('SECRET');
    return jwtConstants;
  },
  /**
   * The `ConfigService` is injected into the factory to access environment variables.
   */
  inject: [ConfigService],
};
