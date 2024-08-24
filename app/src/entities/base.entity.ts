import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  BaseEntity as TypeORMBaseEntity,
  JoinColumn,
} from 'typeorm';
import { DataLookup } from './data-lookup.entity';

export abstract class BaseEntity extends TypeORMBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DataLookup)
  @JoinColumn({ name: "objectStateId" })
  objectState: DataLookup;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn({ nullable: true })
  deletedDate: Date;
}
