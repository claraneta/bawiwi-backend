/// <reference types="jest" />

jest.mock('./config', () => ({
  DEFAULT_FROM: 'Avoda <noreply@bawiwi.ewi>',
  resend: {
    emails: {
      send: jest.fn(),
    },
  },
}));

import { sendEmail } from './email.service';

describe('EmailService', () => {
  const mockSend = jest.mocked(require('./config').resend.emails.send);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    const defaultOptions = {
      to: 'user@example.com',
      subject: 'Welcome!',
      html: '<p>Hello</p>',
    };

    it('should return success with id when email is sent', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      const result = await sendEmail(defaultOptions);

      expect(result).toEqual({ success: true, id: 'email-123' });
      expect(mockSend).toHaveBeenCalledWith({
        from: 'Avoda <noreply@bawiwi.ewi>',
        to: ['user@example.com'],
        subject: 'Welcome!',
        html: '<p>Hello</p>',
      });
    });

    it('should send to multiple recipients when to is an array', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-456' }, error: null });

      const result = await sendEmail({
        ...defaultOptions,
        to: ['alice@example.com', 'bob@example.com'],
      });

      expect(result).toEqual({ success: true, id: 'email-456' });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['alice@example.com', 'bob@example.com'],
        }),
      );
    });

    it('should use custom from address when provided', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-789' }, error: null });

      await sendEmail({
        ...defaultOptions,
        from: 'Custom <custom@bawiwi.ewi>',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Custom <custom@bawiwi.ewi>',
        }),
      );
    });

    it('should use default from address when not provided', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-101' }, error: null });

      await sendEmail(defaultOptions);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Avoda <noreply@bawiwi.ewi>',
        }),
      );
    });

    it('should return error when the API returns an error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key', statusCode: 401, name: 'unauthorized' },
      });

      const result = await sendEmail(defaultOptions);

      expect(result).toEqual({ success: false, error: 'Invalid API key' });
    });

    it('should pass html content correctly', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-202' }, error: null });

      await sendEmail({
        ...defaultOptions,
        html: '<h1>Title</h1><p>Body content</p>',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<h1>Title</h1><p>Body content</p>',
        }),
      );
    });
  });
});
