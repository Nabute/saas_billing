import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DataLookup } from './data-lookup.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('customers')
export class Customer extends BaseEntity {

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @ManyToOne(() => SubscriptionPlan, { nullable: true })
  subscriptionPlan: SubscriptionPlan;

  @ManyToOne(() => DataLookup)
  subscriptionStatus: DataLookup;

  @Column({ nullable: true })
  billingAddress: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  postalCode: string;
}
