import { Module } from '@nestjs/common';
import { dataSrouceOptions } from '../db/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './controllers/subscription.controller';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionPlan } from './entities/subscription.entity';
import { CustomerSubscription } from './entities/customer.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataLookup } from './entities/data-lookup.entity';
import { DataSource } from 'typeorm';
import { AuthService } from './services/auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth/constants';
import { JwtStrategy } from './auth/jwt.strategy';
import { UsersService } from './services/users.service';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { SystemSettingController, DataLookupController } from './controllers/core.controller';
import { DataLookupService } from './services/core.service';
import { SystemSettingService } from './services/setting.service';
import { SystemSetting } from './entities/system-settings.entity';
import { PaymentProcessor } from './processors/payment.processor';
import { PaymentService } from './services/payment.service';
import { BullModule } from '@nestjs/bull';
import { JobQueues } from './utils/enums';
import { PaymentMethod } from './entities/payment-method.entity';
import { StripeService } from './services/stripe.service';

const config = new ConfigService();
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSrouceOptions),
    TypeOrmModule.forFeature([User, SubscriptionPlan, CustomerSubscription, Invoice, Payment, DataLookup, SystemSetting, PaymentMethod]),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60m' },
    }),
    BullModule.forRoot({
      redis: {
        host: config.get('REDIS_HOST'),
        port: parseInt(config.get('REDIS_PORT'), 10),
      },
    }),
    BullModule.registerQueue({
      name: JobQueues.PAYMENT_RETRY,
    }),
  ],
  controllers: [SubscriptionController, AuthController, SystemSettingController, DataLookupController],
  providers: [SubscriptionService, AuthService, StripeService,
    UsersService, SystemSettingService, DataLookupService,
    JwtStrategy, JwtAuthGuard, PaymentProcessor, PaymentService],
})
export class AppModule {
  constructor(private dataSource: DataSource) { }
}
