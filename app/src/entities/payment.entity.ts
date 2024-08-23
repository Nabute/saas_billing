import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DataLookup } from './data-lookup.entity';
import { PaymentMethod } from './payment-method.entity';
import { Invoice } from './invoice.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ManyToOne(() => DataLookup)
  status: DataLookup;

  @ManyToOne(() => Invoice)
  invoice: Invoice;

  @ManyToOne(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Column({ length: 100 })
  referenceNumber: string;

  @Column({ length: 100 })
  payerName: string;

  @Column({ type: 'date', nullable: true })
  paymentDate?: string;
}
