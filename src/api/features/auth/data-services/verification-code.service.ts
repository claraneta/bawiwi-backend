import { IsNull, Repository } from 'typeorm';
import { AppDataSource } from '../../../../db/data-source';
import { VerificationCode, VerificationPurpose } from '../../../../db/entities/verification-code.entity';

const repo: Repository<VerificationCode> = AppDataSource.getRepository(VerificationCode);

export interface CreateVerificationCodeParams {
  email: string;
  code: string;
  purpose: VerificationPurpose;
  expiresAt: Date;
  phone?: string | null;
}

/**
 * Invalidates all unused, non-expired verification codes for the given email + purpose
 * by setting their `usedAt` timestamp to now. This ensures only the latest code is valid.
 */
export async function invalidatePreviousCodes(params: {
  email: string;
  purpose: VerificationPurpose;
}): Promise<void> {
  const { email, purpose } = params;

  await repo.update(
    {
      email,
      purpose,
      usedAt: IsNull(),
    },
    { usedAt: new Date() },
  );
}

export async function createVerificationCode(params: CreateVerificationCodeParams): Promise<VerificationCode> {
  const { email, code, purpose, expiresAt, phone } = params;

  const entity = repo.create({
    email,
    code,
    purpose,
    expiresAt,
    phone: phone ?? null,
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
