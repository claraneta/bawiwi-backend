import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ServiceFeed } from './service-feed.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ServiceFeed, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_feed_id' })
  serviceFeed!: ServiceFeed;

  @Column({ name: 'service_feed_id' })
  serviceFeedId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer!: User;

  @Column({ name: 'reviewer_id' })
  reviewerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewee_id' })
  reviewee!: User;

  @Column({ name: 'reviewee_id' })
  revieweeId!: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
