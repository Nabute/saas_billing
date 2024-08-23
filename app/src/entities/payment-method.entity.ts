import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DataLookup } from './data-lookup.entity';

@Entity('payment_methods')
export class PaymentMethod extends BaseEntity {

    @Column({ unique: true, length: 50 })
    code: string;

    @Column({ length: 100 })
    name: string;

    @Column({ nullable: true, length: 100 })
    accountHolderName?: string;

    @Column({ nullable: true, length: 50 })
    accountNumber?: string;

    @Column({ nullable: true })
    logo?: string;

    @ManyToOne(() => DataLookup)
    type: DataLookup;
}
