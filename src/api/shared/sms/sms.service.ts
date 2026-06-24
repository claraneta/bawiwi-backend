import smsClient from './config';

export interface SendSmsOptions {
  recipient: string;
  message: string;
}

export type SendSmsResult =
  | { success: true }
  | { success: false; error: string };

export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
  try {
    await smsClient.post('/send/sms', {
      recipient: options.recipient,
      message: options.message,
    });

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send SMS';
    return { success: false, error: message };
  }
}
