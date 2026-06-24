/// <reference types="jest" />

jest.mock('./config', () => ({
  default: {
    post: jest.fn(),
  },
  __esModule: true,
}));

import smsClient from './config';

// Need to re-mock after the default import resolves
const mockedPost = jest.mocked(smsClient.post);

import { sendSms } from './sms.service';

describe('SmsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSms', () => {
    const defaultOptions = {
      recipient: '09171234567',
      message: 'Your verification code is 123456',
    };

    it('should return success when SMS is sent', async () => {
      mockedPost.mockResolvedValue({ data: { status: 'sent' } });

      const result = await sendSms(defaultOptions);

      expect(result).toEqual({ success: true });
      expect(mockedPost).toHaveBeenCalledWith('/send/sms', {
        recipient: defaultOptions.recipient,
        message: defaultOptions.message,
      });
    });

    it('should return error when the API call fails', async () => {
      mockedPost.mockRejectedValue(new Error('Network error'));

      const result = await sendSms(defaultOptions);

      expect(result).toEqual({ success: false, error: 'Network error' });
    });

    it('should return fallback error message when error is not an Error instance', async () => {
      mockedPost.mockRejectedValue('string error');

      const result = await sendSms(defaultOptions);

      expect(result).toEqual({ success: false, error: 'Failed to send SMS' });
    });
  });
});
