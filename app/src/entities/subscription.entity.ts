import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DataLookup } from './data-lookup.entity';


@Entity('subscription_plans')
export class SubscriptionPlan extends BaseEntity {

    // The name of the subscription plan, e.g., "Basic", "Pro", "Enterprise".
    @Column()
    name: string;

    // A detailed description of what the plan offers. This can include details on features, limitations, and target customers.
    @Column({ nullable: true })
    description: string;

    // The price of the subscription plan, stored as a decimal value. This represents the cost the customer will be charged for each billing cycle.
    @Column('decimal')
    price: number;

    // The duration of the billing cycle in days. For example, 30 for a monthly plan, 365 for an annual plan.
    @Column('int')
    billingCycleDays: number;

    // The current status of the plan, which can be either 'active', 'inactive'... Inactive plans are not available for new sign-ups but may still be valid for existing customers.
    @ManyToOne(() => DataLookup)
    status: DataLookup;

    // A boolean indicating if the plan supports prorated billing when a customer switches plans mid-cycle. If true, the system will calculate and charge only the amount due for the portion of the cycle.
    @Column({ default: true })
    prorate: boolean;
}
