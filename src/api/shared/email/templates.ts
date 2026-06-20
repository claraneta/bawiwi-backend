export interface VerificationCodeEmailData {
  code: string;
  recipientName?: string;
}

export function verificationCodeEmail(data: VerificationCodeEmailData): string {
  const { code, recipientName } = data;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 32px 24px 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #18181b; letter-spacing: -0.5px;">Bawiwi</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 24px; color: #18181b; font-weight: 500;">${greeting}</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #52525b;">
                Use the verification code below to complete your action. This code will expire in <strong>10 minutes</strong>.
              </p>
              <!-- Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 24px 16px;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;">
                      ${code.split('').join(' ')}
                    </span>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 18px; color: #71717a;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 0;" />
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 32px 40px 32px;">
              <p style="margin: 0; font-size: 12px; line-height: 16px; color: #a1a1aa;">
                Bawiwi &middot; Your Platform
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; line-height: 16px; color: #a1a1aa;">
                If you have questions, contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
