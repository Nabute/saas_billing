import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Customer } from './customer.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { BaseEntity } from './base.entity';
import { DataLookup } from './data-lookup.entity';
import { Payment } from './payment.entity';

@Entity('subscriptions')
export class Subscription extends BaseEntity {
    @ManyToOne(() => Customer)
    customer: Customer;

    @ManyToOne(() => SubscriptionPlan)
    plan: SubscriptionPlan;

    @Column({ type: 'timestamp' })
    startDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date;

    @ManyToOne(() => DataLookup)
    status: DataLookup;

    @OneToMany(() => Payment, (payment) => payment.subscription)
    payments: Payment[];
}
