import { sendEmail, SendEmailOptions, SendEmailResult, verificationCodeEmail } from '../../shared/email';
import { generateCode } from '../../shared/helpers/code-generator';
import { VerificationPurpose } from '../../../db/entities/verification-code.entity';
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
