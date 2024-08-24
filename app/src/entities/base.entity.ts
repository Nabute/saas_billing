import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  BaseEntity as TypeORMBaseEntity,
  BeforeInsert,
} from 'typeorm';
import { DataLookup } from './data-lookup.entity';
import { DataLookupService } from '../services/data-lookup.service';
import { ObjectState } from '../utils/enums';

export abstract class BaseEntity extends TypeORMBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DataLookup)
  objectState: DataLookup;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn({ nullable: true })
  deletedDate: Date;

  constructor(private readonly dataLookupService: DataLookupService) {
    super();
  }

  @BeforeInsert()
  async setObjectState() {
    if (!this.objectState) {
      this.objectState = await this.dataLookupService.getDefaultData(ObjectState.TYPE);
    }
  }
}
