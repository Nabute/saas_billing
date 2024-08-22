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


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSrouceOptions),
    TypeOrmModule.forFeature([SubscriptionPlan, Subscription, Customer, Invoice, Payment, DataLookup]),
  ],
  controllers: [SubscriptionPlanController, SubscriptionController],
  providers: [SubscriptionPlanService, SubscriptionService],
})
export class AppModule {
  constructor(private dataSource: DataSource) { }
}
