import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DataLookup } from './data-lookup.entity';
import { PaymentMethod } from './payment-method.entity';
import { Subscription } from './subscription.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @ManyToOne(() => DataLookup)
  status: DataLookup; // 'pending', 'waiting_for_verification', 'verified', etc.

  @ManyToOne(() => Subscription, (subscription) => subscription.payments)
  subscription: Subscription;

  @ManyToOne(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Column({ length: 100 })
  referenceNumber: string;

  @Column({ length: 100 })
  payerName: string;

  @Column({ type: 'date', nullable: true })
  paymentDate?: string;
}
