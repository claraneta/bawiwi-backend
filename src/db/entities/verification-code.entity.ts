import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VerificationPurpose {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  SIGNUP = 'signup',
}

export enum VerificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
}

@Entity('verification_codes')
@Index(['email', 'purpose'])
@Index(['phone', 'purpose'])
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({
    type: 'enum',
    enum: VerificationChannel,
    default: VerificationChannel.EMAIL,
  })
  channel!: VerificationChannel;

  @Column()
  code!: string;

  @Column({
    type: 'enum',
    enum: VerificationPurpose,
  })
  purpose!: VerificationPurpose;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
