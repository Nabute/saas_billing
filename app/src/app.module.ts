import { Module } from '@nestjs/common';
import { dataSrouceOptions } from '../db/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlanController } from './controllers/subscription-plan.controller';
import { SubscriptionPlanService } from './services/subscription-plan.service';
import { SubscriptionPlan } from './entities/subscription.entity';
import { CustomerSubscription } from './entities/customer.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataLookup } from './entities/data-lookup.entity';
import { DataSource } from 'typeorm';
import { AuthService } from './services/auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { jwtConstantsProvider } from './auth/constants';
import { JwtStrategy } from './auth/jwt.strategy';
import { UsersService } from './services/users.service';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DataLookupController,
} from './controllers/data-lookup.controller';
import { DataLookupService } from './services/data-lookup.service';
import { SystemSettingService } from './services/setting.service';
import { SystemSetting } from './entities/system-settings.entity';
import { PaymentProcessor } from './processors/payment.processor';
import { PaymentService } from './services/payment.service';
import { BullModule } from '@nestjs/bull';
import { JobQueues } from './utils/enums';
import { PaymentMethod } from './entities/payment-method.entity';
import { StripeService } from './services/stripe.service';
import { BillingService } from './services/billing.service';
import { NotificationsService } from './services/notifications.service';
import { CustomerSubscriptionService } from './services/subscription.service';
import { CustomerSubscriptionController } from './controllers/subscription.controller';
import { SystemSettingController } from './controllers/system-setting.controller';
import { WebhooksController } from './controllers/webhooks.controller';

const config = new ConfigService();
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSrouceOptions),
    TypeOrmModule.forFeature([
      User,
      SubscriptionPlan,
      CustomerSubscription,
      Invoice,
      Payment,
      DataLookup,
      SystemSetting,
      PaymentMethod,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<JwtModuleOptions> => ({
        secret: configService.get<string>('SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
    }),
    BullModule.forRoot({
      redis: {
        host: config.get('REDIS_HOST'),
        port: parseInt(config.get('REDIS_PORT'), 10),
      },
    }),
    BullModule.registerQueue(
      {
        name: JobQueues.PAYMENT_RETRY,
      },
      {
        name: JobQueues.BILLING,
      },
    ),
  ],
  controllers: [
    SubscriptionPlanController,
    CustomerSubscriptionController,
    AuthController,
    SystemSettingController,
    DataLookupController,
    WebhooksController,
  ],
  providers: [
    SubscriptionPlanService,
    CustomerSubscriptionService,
    AuthService,
    StripeService,
    NotificationsService,
    UsersService,
    SystemSettingService,
    DataLookupService,
    BillingService,
    JwtStrategy,
    JwtAuthGuard,
    PaymentProcessor,
    PaymentService,
    jwtConstantsProvider,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) { }
}
