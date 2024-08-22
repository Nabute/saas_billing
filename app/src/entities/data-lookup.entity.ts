import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IsUniqueValue } from '../constraints/uniqueValueConstraint';

@Entity()
export class DataLookup {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ length: 256 })
  type: string;

  @Column({ length: 256 })
  name: string;

  @Column({ length: 256, unique: true })
  @IsUniqueValue()
  value: string;

  @Column({ nullable: true })
  description: string;

  @Column({ length: 256, nullable: true })
  category: string;

  @Column({ nullable: true })
  note: string;

  @Column({ default: 0 })
  index: number;

  @Column({ default: false })
  is_default: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  remark: string;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
