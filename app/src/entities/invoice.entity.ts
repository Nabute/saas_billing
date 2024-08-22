import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column('decimal')
  amount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column('date')
  paymentDueDate: Date;

  @Column({ nullable: true })
  paymentDate: Date;
}
