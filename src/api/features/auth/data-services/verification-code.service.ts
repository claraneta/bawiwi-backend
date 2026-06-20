import { Repository } from 'typeorm';
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
