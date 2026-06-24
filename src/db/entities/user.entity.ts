import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  Unique,
} from 'typeorm';
import { UserDetails } from './user-details.entity';

export enum UserRole {
  WORKER = 'worker',
  CLIENT = 'client',
  ADMIN = 'admin',
}

@Entity('users')
@Unique(['email'])
@Unique(['phone'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'boolean', default: false })
  deactivated!: boolean;

  @OneToOne(() => UserDetails, (details) => details.user)
  details?: UserDetails;
}
