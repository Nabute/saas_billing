import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class SystemSetting extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  @Index({ unique: true })
  code: string;

  @Column({ type: 'text' })
  defaultValue: string;

  @Column({ type: 'text' })
  currentValue: string;
}
