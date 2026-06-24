import { IsNull, Repository } from 'typeorm';
import { AppDataSource } from '../../../../db/data-source';
import { VerificationCode, VerificationPurpose, VerificationChannel } from '../../../../db/entities/verification-code.entity';

const repo: Repository<VerificationCode> = AppDataSource.getRepository(VerificationCode);

export interface CreateVerificationCodeParams {
  email: string;
  code: string;
  purpose: VerificationPurpose;
  expiresAt: Date;
  phone?: string | null;
  channel?: VerificationChannel;
}

/**
 * Invalidates all unused verification codes for the given identifier + purpose
 * by setting their `usedAt` timestamp to now. Supports email or phone lookup.
 */
export async function invalidatePreviousCodes(params: {
  email?: string;
  phone?: string;
  purpose: VerificationPurpose;
}): Promise<void> {
  const { email, phone, purpose } = params;

  if (email) {
    await repo.update(
      { email, purpose, usedAt: IsNull() },
      { usedAt: new Date() },
    );
  }

  if (phone) {
    await repo.update(
      { phone, purpose, usedAt: IsNull() },
      { usedAt: new Date() },
    );
  }
}

export async function createVerificationCode(params: CreateVerificationCodeParams): Promise<VerificationCode> {
  const { email, code, purpose, expiresAt, phone, channel } = params;

  const entity = repo.create({
    email,
    code,
    purpose,
    expiresAt,
    phone: phone ?? null,
    channel: channel ?? VerificationChannel.EMAIL,
  });

  return repo.save(entity);
}

export async function findValidCode(params: {
  email?: string;
  phone?: string;
  code: string;
  purpose: VerificationPurpose;
}): Promise<VerificationCode | null> {
  const { email, phone, code, purpose } = params;

  if (email) {
    return repo.findOneBy({
      email,
      code,
      purpose,
      usedAt: IsNull(),
    });
  }

  if (phone) {
    return repo.findOneBy({
      phone,
      code,
      purpose,
      usedAt: IsNull(),
    });
  }

  return null;
}

export async function markCodeAsUsed(id: string): Promise<void> {
  await repo.update({ id }, { usedAt: new Date() });
}
