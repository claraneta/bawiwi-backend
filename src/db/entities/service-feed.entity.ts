import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Service } from './service.entity';

export enum ServiceFeedStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
}

@Entity('service_feeds')
export class ServiceFeed {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service!: Service;

  @Column({ name: 'service_id' })
  serviceId!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({
    type: 'enum',
    enum: ServiceFeedStatus,
    default: ServiceFeedStatus.ACTIVE,
  })
  status!: ServiceFeedStatus;

  @Column()
  location!: string;

  @Column({ type: 'jsonb', nullable: true })
  coordinates?: object;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
