import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
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

    // Number of days the plan offers as a trial period. If a customer signs up, they get this many days for free before being charged.
    @Column('int', { nullable: true })
    trialPeriodDays: number;

    // The current status of the plan, which can be either 'active', 'inactive'... Inactive plans are not available for new sign-ups but may still be valid for existing customers.
    @ManyToOne(() => DataLookup)
    status: DataLookup;

    // The maximum number of users allowed under this subscription plan. This is relevant for multi-user plans, such as those offered by team or enterprise plans.
    @Column('int', { nullable: true })
    maxUsers: number;

    // The maximum storage space allowed under this plan, typically measured in GB. This is relevant for SaaS products that include file storage as part of their offering.
    @Column('decimal', { nullable: true })
    maxStorage: number;

    // The charge applied if the customer exceeds the plan's limits (e.g., storage or user limits). This is usually a per-unit charge.
    @Column('decimal', { nullable: true })
    overageCharge: number;

    // Indicates whether the subscription automatically renews at the end of each billing cycle. If true, the customer is automatically billed for the next cycle.
    @Column({ default: true })
    autoRenewal: boolean;

    // A one-time fee charged when the subscription is initially purchased. This is useful for plans that require an initial setup, such as onboarding or installation services.
    @Column('decimal', { nullable: true })
    setupFee: number;

    // The currency in which the plan's price is set, e.g., USD, EUR. This allows the system to support multiple currencies.
    @Column({ default: 'USD' })
    currency: string;

    // Any discounts that apply to this plan, which could be a percentage or a fixed amount. Discounts might be promotional or for long-term commitments.
    @Column('decimal', { nullable: true })
    discount: number;

    // A description of the cancellation policy for the plan. This might include details about refunds, termination of service, and any penalties.
    @Column({ nullable: true })
    cancellationPolicy: string;

    // The number of days after the billing cycle ends before the subscription is considered overdue or cancelled. This provides a grace period for the customer to make a payment.
    @Column('int', { nullable: true })
    gracePeriodDays: number;

    // A reference to another plan that customers can upgrade to. This allows the system to suggest or automate plan upgrades based on customer usage or needs.
    @Column({ nullable: true })
    upgradeToPlanId: string;

    // A reference to another plan that customers can downgrade to. This allows for flexibility in managing customer subscriptions, especially if their needs decrease.
    @Column({ nullable: true })
    downgradeToPlanId: string;

    // A reference to the plan that the user is automatically converted to after the trial period ends. This is useful for ensuring customers transition to a paid plan after a trial.
    @Column({ nullable: true })
    trialConversionPlanId: string;

    // A boolean indicating if the plan supports prorated billing when a customer switches plans mid-cycle. If true, the system will calculate and charge only the amount due for the portion of the cycle.
    @Column({ default: true })
    prorate: boolean;
}
