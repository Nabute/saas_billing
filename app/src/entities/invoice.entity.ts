import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DataLookup } from './data-lookup.entity';
import { CustomerSubscription } from './customer.entity';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ unique: true, length: 50 })
  code: string;

  @Column()
  customerId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ManyToOne(() => DataLookup)
  status: DataLookup;

  @Column('date')
  paymentDueDate: Date;

  @Column({ nullable: true })
  paymentDate: Date;

  @ManyToOne(() => CustomerSubscription)
  subscription: CustomerSubscription;
}
