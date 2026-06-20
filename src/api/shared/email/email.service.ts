import { DEFAULT_FROM, resend } from './config';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export type SendEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, from } = options;

  const { data, error } = await resend.emails.send({
    from: from ?? DEFAULT_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error || !data) {
    return { success: false, error: error?.message || 'Failed to send email' };
  }

  return { success: true, id: data.id };
}
