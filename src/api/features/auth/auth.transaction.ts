import { sendEmail, SendEmailOptions, SendEmailResult, verificationCodeEmail } from '../../shared/email';
import { generateCode } from '../../shared/helpers/code-generator';
import { VerificationPurpose } from '../../../db/entities/verification-code.entity';
import { User } from '../../../db/entities/user.entity';
import { UserDetails } from '../../../db/entities/user-details.entity';
import { UserRole } from '../../../db/entities/user.entity';
import { AppDataSource } from '../../../db/data-source';
import { createVerificationCode, invalidatePreviousCodes } from './data-services/verification-code.service';

export interface SendAndStoreCodeParams {
  email: string;
  purpose: VerificationPurpose;
  recipientName?: string;
  phone?: string | null;
}

export type SendAndStoreCodeResult = {
  success: true;
  codeId: string;
  emailId: string;
} | {
  success: false;
  error: string;
  step: 'email' | 'database';
};

export interface CreateUserParams {
  email: string;
  phone: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  birthdate: Date;
}

export type CreateUserResult = {
  success: true;
  user: User;
} | {
  success: false;
  error: string;
};

export async function createUser(params: CreateUserParams): Promise<CreateUserResult> {
  try {
    const savedUser = await AppDataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const detailsRepo = manager.getRepository(UserDetails);

      const user = userRepo.create({
        email: params.email,
        phone: params.phone,
        role: params.role,
      });
      const savedUser = await userRepo.save(user);

      const details = detailsRepo.create({
        userId: savedUser.id,
        firstName: params.firstName,
        lastName: params.lastName,
        birthdate: params.birthdate,
      });
      await detailsRepo.save(details);

      return savedUser;
    });

    return { success: true, user: savedUser };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    return { success: false, error: message };
  }
}

const CODE_EXPIRY_MINUTES = 10;

export async function sendVerificationCode(params: SendAndStoreCodeParams): Promise<SendAndStoreCodeResult> {
  const { email, purpose, recipientName, phone } = params;

  const code = generateCode();

  const emailOptions: SendEmailOptions = {
    to: email,
    subject: 'Your verification code',
    html: verificationCodeEmail({ code, recipientName }),
  };

  const emailResult: SendEmailResult = await sendEmail(emailOptions);

  if (!emailResult.success) {
    return { success: false, error: emailResult.error, step: 'email' };
  }

  try {
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any previous unused codes for this email + purpose
    await invalidatePreviousCodes({ email, purpose });

    const saved = await createVerificationCode({
      email,
      code,
      purpose,
      expiresAt,
      phone: phone ?? null,
    });

    return { success: true, codeId: saved.id, emailId: emailResult.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save verification code';
    return { success: false, error: message, step: 'database' };
  }
}
