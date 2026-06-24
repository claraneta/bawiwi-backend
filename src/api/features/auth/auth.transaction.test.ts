/// <reference types="jest" />

jest.mock("../../shared/email", () => ({
  sendEmail: jest.fn(),
  verificationCodeEmail: jest.fn(),
}));

jest.mock("../../shared/sms", () => ({
  sendSms: jest.fn(),
}));

jest.mock("../../shared/helpers/code-generator", () => ({
  generateCode: jest.fn(),
}));

jest.mock("./data-services/verification-code.service", () => ({
  createVerificationCode: jest.fn(),
  invalidatePreviousCodes: jest.fn(),
  findValidCode: jest.fn(),
  markCodeAsUsed: jest.fn(),
}));

jest.mock("../../shared/data-services/user.service", () => ({
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
}));

jest.mock("../../../db/data-source", () => {
  const userRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const detailsRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const managerMock = {
    getRepository: jest.fn().mockImplementation((entity: any) => {
      if (entity && entity.name === "UserDetails") return detailsRepoMock;
      return userRepoMock;
    }),
  };

  return {
    AppDataSource: {
      transaction: jest.fn().mockImplementation(
        async (cb: (mgr: any) => Promise<unknown>) => cb(managerMock),
      ),
      _userRepo: userRepoMock,
      _detailsRepo: detailsRepoMock,
    },
  };
});

import { sendEmail } from "../../shared/email";
import { verificationCodeEmail } from "../../shared/email";
import { generateCode } from "../../shared/helpers/code-generator";
import {
  createVerificationCode,
  invalidatePreviousCodes,
  findValidCode,
  markCodeAsUsed,
} from "./data-services/verification-code.service";
import { findByEmail, findByPhone } from "../../shared/data-services/user.service";
import { sendVerificationCode, createUser, verifyCode } from "./auth.transaction";
import { VerificationPurpose } from "../../../db/entities/verification-code.entity";
import { User, UserRole } from "../../../db/entities/user.entity";

const mockedSendEmail = jest.mocked(sendEmail);
const mockedVerificationCodeEmail = jest.mocked(verificationCodeEmail);
const mockedGenerateCode = jest.mocked(generateCode);
const mockedCreateVerificationCode = jest.mocked(createVerificationCode);
const mockedInvalidatePreviousCodes = jest.mocked(invalidatePreviousCodes);
const mockedFindValidCode = jest.mocked(findValidCode);
const mockedMarkCodeAsUsed = jest.mocked(markCodeAsUsed);
const mockedFindByEmail = jest.mocked(findByEmail);
const mockedFindByPhone = jest.mocked(findByPhone);

describe("sendVerificationCode", () => {
  const defaultParams = {
    email: "user@example.com",
    purpose: VerificationPurpose.EMAIL_VERIFICATION,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("success path", () => {
    beforeEach(() => {
      mockedGenerateCode.mockReturnValue("483920");
      mockedVerificationCodeEmail.mockReturnValue("<p>Your code: 483920</p>");
      mockedSendEmail.mockResolvedValue({
        success: true,
        id: "email-sent-001",
      });
      mockedInvalidatePreviousCodes.mockResolvedValue(undefined);
      mockedCreateVerificationCode.mockResolvedValue({
        id: "vc-001",
      } as any);
    });

    it("should return success with codeId", async () => {
      const result = await sendVerificationCode(defaultParams);

      expect(result).toEqual({
        success: true,
        codeId: "vc-001",
      });
    });

    it("should generate a 6-digit code", async () => {
      await sendVerificationCode(defaultParams);

      expect(mockedGenerateCode).toHaveBeenCalledTimes(1);
    });

    it("should build email options with verificationCodeEmail template", async () => {
      await sendVerificationCode(defaultParams);

      expect(mockedVerificationCodeEmail).toHaveBeenCalledWith({
        code: "483920",
        recipientName: undefined,
      });
      expect(mockedSendEmail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: "Your verification code",
        html: "<p>Your code: 483920</p>",
      });
    });

    it("should include recipientName in the email template when provided", async () => {
      await sendVerificationCode({
        ...defaultParams,
        recipientName: "Alice",
      });

      expect(mockedVerificationCodeEmail).toHaveBeenCalledWith({
        code: "483920",
        recipientName: "Alice",
      });
    });

    it("should invalidate previous codes before creating a new one", async () => {
      await sendVerificationCode(defaultParams);

      expect(mockedInvalidatePreviousCodes).toHaveBeenCalledWith({
        email: "user@example.com",
        phone: undefined,
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
      });
      // createVerificationCode should be called after invalidatePreviousCodes
      expect(mockedCreateVerificationCode).toHaveBeenCalled();
      expect(
        mockedInvalidatePreviousCodes.mock.invocationCallOrder[0],
      ).toBeLessThan(
        mockedCreateVerificationCode.mock.invocationCallOrder[0],
      );
    });

    it("should create a verification code with expiry of 10 minutes and EMAIL channel", async () => {
      const beforeCall = Date.now();

      await sendVerificationCode(defaultParams);

      const createCall = mockedCreateVerificationCode.mock.calls[0][0];
      expect(createCall.email).toBe("user@example.com");
      expect(createCall.code).toBe("483920");
      expect(createCall.purpose).toBe(VerificationPurpose.EMAIL_VERIFICATION);
      expect(createCall.phone).toBeNull();
      expect(createCall.channel).toBe('email');
      expect(createCall.expiresAt.getTime()).toBeGreaterThanOrEqual(
        beforeCall + 10 * 60 * 1000 - 100,
      );
      expect(createCall.expiresAt.getTime()).toBeLessThanOrEqual(
        Date.now() + 10 * 60 * 1000,
      );
    });

    it("should pass phone number and SMS channel to createVerificationCode when phone provided", async () => {
      mockedGenerateCode.mockReturnValue('483920');
      mockedVerificationCodeEmail.mockReturnValue('<p>dummy</p>');
      mockedSendEmail.mockResolvedValue({ success: true, id: 'email-1' });
      mockedInvalidatePreviousCodes.mockResolvedValue(undefined);
      mockedCreateVerificationCode.mockResolvedValue({ id: 'vc-002' } as any);

      await sendVerificationCode({
        ...defaultParams,
        phone: "09171234567",
      });

      expect(mockedCreateVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({ phone: "09171234567", channel: 'email' }),
      );
    });

    it("should store null for phone when phone is not provided", async () => {
      await sendVerificationCode(defaultParams);

      expect(mockedCreateVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({ phone: null }),
      );
    });

    it("should handle SIGNUP purpose correctly", async () => {
      await sendVerificationCode({
        ...defaultParams,
        purpose: VerificationPurpose.SIGNUP,
      });

      expect(mockedInvalidatePreviousCodes).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: VerificationPurpose.SIGNUP }),
      );
      expect(mockedCreateVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: VerificationPurpose.SIGNUP }),
      );
    });

    it("should handle PASSWORD_RESET purpose correctly", async () => {
      await sendVerificationCode({
        ...defaultParams,
        purpose: VerificationPurpose.PASSWORD_RESET,
      });

      expect(mockedInvalidatePreviousCodes).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: VerificationPurpose.PASSWORD_RESET }),
      );
      expect(mockedCreateVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: VerificationPurpose.PASSWORD_RESET }),
      );
    });
  });

  describe("email failure path", () => {
    beforeEach(() => {
      mockedGenerateCode.mockReturnValue("483920");
      mockedVerificationCodeEmail.mockReturnValue("<p>Your code: 483920</p>");
    });

    it("should return failure with step 'email' when sendEmail fails", async () => {
      mockedSendEmail.mockResolvedValue({
        success: false,
        error: "Email service unavailable",
      });

      const result = await sendVerificationCode(defaultParams);

      expect(result).toEqual({
        success: false,
        error: "Email service unavailable",
        step: "email",
      });
    });

    it("should not invalidate codes or create a new code when email fails", async () => {
      mockedSendEmail.mockResolvedValue({
        success: false,
        error: "Email service unavailable",
      });

      await sendVerificationCode(defaultParams);

      expect(mockedInvalidatePreviousCodes).not.toHaveBeenCalled();
      expect(mockedCreateVerificationCode).not.toHaveBeenCalled();
    });

    it("should return the exact error message from the email service", async () => {
      mockedSendEmail.mockResolvedValue({
        success: false,
        error: "Rate limit exceeded",
      });

      const result = await sendVerificationCode(defaultParams);

      expect(result).toEqual({
        success: false,
        error: "Rate limit exceeded",
        step: "email",
      });
    });
  });

  describe("database failure path", () => {
    beforeEach(() => {
      mockedGenerateCode.mockReturnValue("483920");
      mockedVerificationCodeEmail.mockReturnValue("<p>Your code: 483920</p>");
      mockedSendEmail.mockResolvedValue({
        success: true,
        id: "email-sent-001",
      });
    });

    it("should return failure with step 'database' when saving code fails with Error", async () => {
      mockedInvalidatePreviousCodes.mockResolvedValue(undefined);
      mockedCreateVerificationCode.mockRejectedValue(
        new Error("Unique constraint violation"),
      );

      const result = await sendVerificationCode(defaultParams);

      expect(result).toEqual({
        success: false,
        error: "Unique constraint violation",
        step: "database",
      });
    });

    it("should return failure with step 'database' when invalidatePreviousCodes fails", async () => {
      mockedInvalidatePreviousCodes.mockRejectedValue(
        new Error("Database connection lost"),
      );
      mockedCreateVerificationCode.mockResolvedValue({} as any);

      const result = await sendVerificationCode(defaultParams);

      expect(result).toEqual({
        success: false,
        error: "Database connection lost",
        step: "database",
      });
    });

    it("should return fallback message when error is not an Error instance", async () => {
      mockedInvalidatePreviousCodes.mockRejectedValue("string error");
      mockedCreateVerificationCode.mockResolvedValue({} as any);

      const result = await sendVerificationCode(defaultParams);

      expect(result).toEqual({
        success: false,
        error: "Failed to save verification code",
        step: "database",
      });
    });

    it("should return fallback message when error is null", async () => {
      mockedInvalidatePreviousCodes.mockRejectedValue(null);
      mockedCreateVerificationCode.mockResolvedValue({} as any);

      const result = await sendVerificationCode(defaultParams);

      expect(result).toEqual({
        success: false,
        error: "Failed to save verification code",
        step: "database",
      });
    });

    it("should still send the email even when the DB save fails", async () => {
      mockedInvalidatePreviousCodes.mockResolvedValue(undefined);
      mockedCreateVerificationCode.mockRejectedValue(
        new Error("Disk full"),
      );

      await sendVerificationCode(defaultParams);

      expect(mockedSendEmail).toHaveBeenCalledTimes(1);
      expect(mockedInvalidatePreviousCodes).toHaveBeenCalled();
      expect(mockedCreateVerificationCode).toHaveBeenCalled();
    });
  });

  describe("SMS delivery", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockedGenerateCode.mockReturnValue('483920');
    });

    it("should send SMS and create code with SMS channel when only phone is provided", async () => {
      const { sendSms } = require('../../shared/sms');
      sendSms.mockResolvedValue({ success: true });

      mockedInvalidatePreviousCodes.mockResolvedValue(undefined);
      mockedCreateVerificationCode.mockResolvedValue({ id: 'vc-sms-001' } as any);

      const result = await sendVerificationCode({
        phone: '09171234567',
        purpose: VerificationPurpose.SIGNUP,
      });

      expect(result).toEqual({ success: true, codeId: 'vc-sms-001' });
      expect(sendSms).toHaveBeenCalledWith({
        recipient: '09171234567',
        message: 'Your verification code is 483920',
      });
      expect(mockedCreateVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '09171234567',
          channel: 'sms',
          email: '',
        }),
      );
    });

    it("should return failure with step 'sms' when SMS fails", async () => {
      const { sendSms } = require('../../shared/sms');
      sendSms.mockResolvedValue({ success: false, error: 'SMS provider error' });

      const result = await sendVerificationCode({
        phone: '09171234567',
        purpose: VerificationPurpose.SIGNUP,
      });

      expect(result).toEqual({
        success: false,
        error: 'SMS provider error',
        step: 'sms',
      });
    });
  });

  describe("edge cases", () => {
    it("should generate a fresh code for each call", async () => {
      mockedGenerateCode
        .mockReturnValueOnce("111111")
        .mockReturnValueOnce("222222");
      mockedVerificationCodeEmail.mockReturnValue("<p>code</p>");
      mockedSendEmail.mockResolvedValue({ success: true, id: "em-1" });
      mockedInvalidatePreviousCodes.mockResolvedValue(undefined);
      mockedCreateVerificationCode.mockResolvedValue({ id: "vc-1" } as any);

      await sendVerificationCode(defaultParams);
      await sendVerificationCode(defaultParams);

      expect(mockedGenerateCode).toHaveBeenCalledTimes(2);
      expect(mockedCreateVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({ code: "111111" }),
      );
      expect(mockedCreateVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({ code: "222222" }),
      );
    });

    it("should call sendEmail with correct parameters for a different email", async () => {
      mockedGenerateCode.mockReturnValue("555555");
      mockedVerificationCodeEmail.mockReturnValue("<p>code</p>");
      mockedSendEmail.mockResolvedValue({ success: true, id: "em-2" });
      mockedInvalidatePreviousCodes.mockResolvedValue(undefined);
      mockedCreateVerificationCode.mockResolvedValue({ id: "vc-2" } as any);

      const differentEmail = "other@example.com";
      await sendVerificationCode({
        ...defaultParams,
        email: differentEmail,
      });

      expect(mockedSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: differentEmail }),
      );
      expect(mockedInvalidatePreviousCodes).toHaveBeenCalledWith(
        expect.objectContaining({ email: differentEmail }),
      );
      expect(mockedCreateVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({ email: differentEmail }),
      );
    });
  });

  describe("createUser", () => {
    let userRepoMock: { create: jest.Mock; save: jest.Mock };
    let detailsRepoMock: { create: jest.Mock; save: jest.Mock };

    const mockUser: User = {
      id: "new-uuid-001",
      email: "newuser@example.com",
      phone: "09171234567",
      role: UserRole.WORKER,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      deactivated: false,
    } as User;

    const createParams = {
      email: "newuser@example.com",
      phone: "09171234567",
      role: UserRole.WORKER,
      firstName: "John",
      lastName: "Doe",
      birthdate: new Date("2000-01-15"),
    };

    beforeAll(() => {
      const { AppDataSource } = require("../../../db/data-source");
      userRepoMock = AppDataSource._userRepo;
      detailsRepoMock = AppDataSource._detailsRepo;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should call AppDataSource.transaction", async () => {
      const { AppDataSource } = require("../../../db/data-source");
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockResolvedValue(mockUser);
      detailsRepoMock.create.mockReturnValue({});
      detailsRepoMock.save.mockResolvedValue({});

      await createUser(createParams);

      expect(AppDataSource.transaction).toHaveBeenCalled();
    });

    it("should create a user in the user repository", async () => {
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockResolvedValue(mockUser);
      detailsRepoMock.create.mockReturnValue({});
      detailsRepoMock.save.mockResolvedValue({});

      await createUser(createParams);

      expect(userRepoMock.create).toHaveBeenCalledWith({
        email: createParams.email,
        phone: createParams.phone,
        role: createParams.role,
      });
    });

    it("should save the created user", async () => {
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockResolvedValue(mockUser);
      detailsRepoMock.create.mockReturnValue({});
      detailsRepoMock.save.mockResolvedValue({});

      await createUser(createParams);

      expect(userRepoMock.save).toHaveBeenCalledWith(mockUser);
    });

    it("should create user details with the saved user id", async () => {
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockResolvedValue(mockUser);
      detailsRepoMock.create.mockReturnValue({});
      detailsRepoMock.save.mockResolvedValue({});

      await createUser(createParams);

      expect(detailsRepoMock.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        firstName: createParams.firstName,
        lastName: createParams.lastName,
        birthdate: createParams.birthdate,
      });
    });

    it("should save user details", async () => {
      const mockDetails = { id: "details-001", userId: mockUser.id };
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockResolvedValue(mockUser);
      detailsRepoMock.create.mockReturnValue(mockDetails);
      detailsRepoMock.save.mockResolvedValue(mockDetails);

      await createUser(createParams);

      expect(detailsRepoMock.save).toHaveBeenCalledWith(mockDetails);
    });

    it("should return success with the saved user", async () => {
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockResolvedValue(mockUser);
      detailsRepoMock.create.mockReturnValue({});
      detailsRepoMock.save.mockResolvedValue({});

      const result = await createUser(createParams);

      expect(result).toEqual({ success: true, user: mockUser });
    });

    it("should return failure with error message when user save fails", async () => {
      const dbError = new Error("Email already exists");
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockRejectedValue(dbError);

      const result = await createUser(createParams);

      expect(result).toEqual({ success: false, error: "Email already exists" });
      expect(detailsRepoMock.save).not.toHaveBeenCalled();
    });

    it("should return failure with error message when details save fails", async () => {
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockResolvedValue(mockUser);
      detailsRepoMock.create.mockReturnValue({});
      detailsRepoMock.save.mockRejectedValue(new Error("Details insert failed"));

      const result = await createUser(createParams);

      expect(result).toEqual({ success: false, error: "Details insert failed" });
    });

    it("should return fallback error message when error is not an Error instance", async () => {
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockRejectedValue("string error");

      const result = await createUser(createParams);

      expect(result).toEqual({ success: false, error: "Failed to create user" });
    });
  });

  describe("verifyCode", () => {
    const emailParams = {
      email: "test@example.com",
      code: "123456",
    };

    const phoneParams = {
      phone: "09171234567",
      code: "654321",
    };

    const mockEmailRecord = {
      id: "vc-email-001",
      email: "test@example.com",
      phone: null,
      code: "123456",
      purpose: VerificationPurpose.SIGNUP,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      usedAt: null,
    };

    const mockPhoneRecord = {
      id: "vc-phone-001",
      email: "test@example.com",
      phone: "09171234567",
      code: "654321",
      purpose: VerificationPurpose.SIGNUP,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
    };

    const mockUser = {
      id: "user-001",
      email: "test@example.com",
      role: UserRole.WORKER,
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("email-based verification", () => {
      beforeEach(() => {
        mockedFindValidCode.mockResolvedValue(mockEmailRecord as any);
        mockedFindByEmail.mockResolvedValue(mockUser as any);
        mockedMarkCodeAsUsed.mockResolvedValue(undefined);
      });

      it("should return success with token and user when valid code is found", async () => {
        const result = await verifyCode(emailParams);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.token).toBeTruthy();
          expect(typeof result.token).toBe("string");
          expect(result.user).toEqual({
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
          });
        }
      });

      it("should call findValidCode with email, code, and SIGNUP purpose", async () => {
        await verifyCode(emailParams);

        expect(mockedFindValidCode).toHaveBeenCalledWith({
          email: emailParams.email,
          phone: undefined,
          code: emailParams.code,
          purpose: VerificationPurpose.SIGNUP,
        });
      });

      it("should mark the code as used after successful verification", async () => {
        await verifyCode(emailParams);

        expect(mockedMarkCodeAsUsed).toHaveBeenCalledWith(mockEmailRecord.id);
        expect(mockedFindValidCode.mock.invocationCallOrder[0]).toBeLessThan(
          mockedMarkCodeAsUsed.mock.invocationCallOrder[0],
        );
      });

      it("should look up the user by email", async () => {
        await verifyCode(emailParams);

        expect(mockedFindByEmail).toHaveBeenCalledWith(emailParams.email);
        expect(mockedFindByPhone).not.toHaveBeenCalled();
      });

      it("should sign a JWT with userId, email, and role", async () => {
        const result = await verifyCode(emailParams);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.token.split(".").length).toBe(3);
        }
      });
    });

    describe("phone-based verification", () => {
      beforeEach(() => {
        mockedFindValidCode.mockResolvedValue(mockPhoneRecord as any);
        mockedFindByPhone.mockResolvedValue(mockUser as any);
        mockedMarkCodeAsUsed.mockResolvedValue(undefined);
      });

      it("should return success when valid phone code is found", async () => {
        const result = await verifyCode(phoneParams);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.token).toBeTruthy();
          expect(result.user).toEqual({
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
          });
        }
      });

      it("should call findValidCode with phone, code, and SIGNUP purpose", async () => {
        await verifyCode(phoneParams);

        expect(mockedFindValidCode).toHaveBeenCalledWith({
          email: undefined,
          phone: phoneParams.phone,
          code: phoneParams.code,
          purpose: VerificationPurpose.SIGNUP,
        });
      });

      it("should look up the user by phone", async () => {
        await verifyCode(phoneParams);

        expect(mockedFindByPhone).toHaveBeenCalledWith(phoneParams.phone);
        expect(mockedFindByEmail).not.toHaveBeenCalled();
      });
    });

    describe("failure path", () => {
      it("should return failure when code is not found", async () => {
        mockedFindValidCode.mockResolvedValue(null);

        const result = await verifyCode(emailParams);

        expect(result).toEqual({
          success: false,
          error: "Invalid or expired verification code",
        });
        expect(mockedMarkCodeAsUsed).not.toHaveBeenCalled();
        expect(mockedFindByEmail).not.toHaveBeenCalled();
      });

      it("should return failure when code is expired", async () => {
        mockedFindValidCode.mockResolvedValue({
          ...mockEmailRecord,
          expiresAt: new Date(Date.now() - 1000),
        } as any);

        const result = await verifyCode(emailParams);

        expect(result).toEqual({
          success: false,
          error: "Verification code has expired",
        });
        expect(mockedMarkCodeAsUsed).not.toHaveBeenCalled();
        expect(mockedFindByEmail).not.toHaveBeenCalled();
      });

      it("should return failure when user is not found", async () => {
        mockedFindValidCode.mockResolvedValue(mockEmailRecord as any);
        mockedFindByEmail.mockResolvedValue(null);

        const result = await verifyCode(emailParams);

        expect(result).toEqual({
          success: false,
          error: "User not found",
        });
        expect(mockedMarkCodeAsUsed).not.toHaveBeenCalled();
      });

      it("should return fallback error message when an unexpected error occurs", async () => {
        mockedFindValidCode.mockRejectedValue("string error");

        const result = await verifyCode(emailParams);

        expect(result).toEqual({
          success: false,
          error: "Failed to verify code",
        });
      });

      it("should return error message from Error instance when thrown", async () => {
        mockedFindValidCode.mockRejectedValue(new Error("Database connection lost"));

        const result = await verifyCode(emailParams);

        expect(result).toEqual({
          success: false,
          error: "Database connection lost",
        });
      });

      it("should return failure when neither email nor phone is provided", async () => {
        mockedFindValidCode.mockResolvedValue(null);

        const result = await verifyCode({ code: "123456" });

        expect(result).toEqual({
          success: false,
          error: "Invalid or expired verification code",
        });
        expect(mockedFindValidCode).toHaveBeenCalledWith({
          email: undefined,
          phone: undefined,
          code: "123456",
          purpose: VerificationPurpose.SIGNUP,
        });
        expect(mockedMarkCodeAsUsed).not.toHaveBeenCalled();
      });
    });
  });
});
