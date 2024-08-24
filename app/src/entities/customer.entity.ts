import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DataLookup } from './data-lookup.entity';
import { SubscriptionPlan } from './subscription.entity';
import { User } from './user.entity';

@Entity('customers')
export class CustomerSubscription extends BaseEntity {
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => SubscriptionPlan)
  subscriptionPlan: SubscriptionPlan;

  @ManyToOne(() => DataLookup)
  subscriptionStatus: DataLookup;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetry: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextBillingDate: Date;
}
