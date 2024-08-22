import { Module } from '@nestjs/common';
import { dataSrouceOptions } from '../db/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlanController } from './controllers/subscription-plan.controller';
import { SubscriptionPlanService } from './services/subscription-plan.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Customer } from './entities/customer.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { ConfigModule } from '@nestjs/config';
import { DataLookup } from './entities/data-lookup.entity';
import { SubscriptionController } from './controllers/subscription.controller';
import { SubscriptionService } from './services/subscription.service';
import { Subscription } from './entities/subscription.entity';
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


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSrouceOptions),
    TypeOrmModule.forFeature([User, SubscriptionPlan, Subscription, Customer, Invoice, Payment, DataLookup]),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [SubscriptionPlanController, SubscriptionController, AuthController],
  providers: [SubscriptionPlanService, SubscriptionService, AuthService,
    UsersService,
    JwtStrategy, JwtAuthGuard],
})
export class AppModule {
  constructor(private dataSource: DataSource) { }
}
