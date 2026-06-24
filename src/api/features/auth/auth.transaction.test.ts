/// <reference types="jest" />

jest.mock("../../shared/email", () => ({
  sendEmail: jest.fn(),
  verificationCodeEmail: jest.fn(),
}));

jest.mock("../../shared/helpers/code-generator", () => ({
  generateCode: jest.fn(),
}));

jest.mock("./data-services/verification-code.service", () => ({
  createVerificationCode: jest.fn(),
  invalidatePreviousCodes: jest.fn(),
}));

import { sendEmail } from "../../shared/email";
import { verificationCodeEmail } from "../../shared/email";
import { generateCode } from "../../shared/helpers/code-generator";
import {
  createVerificationCode,
  invalidatePreviousCodes,
} from "./data-services/verification-code.service";
import { sendVerificationCode } from "./auth.transaction";
import { VerificationPurpose } from "../../../db/entities/verification-code.entity";

const mockedSendEmail = jest.mocked(sendEmail);
const mockedVerificationCodeEmail = jest.mocked(verificationCodeEmail);
const mockedGenerateCode = jest.mocked(generateCode);
const mockedCreateVerificationCode = jest.mocked(createVerificationCode);
const mockedInvalidatePreviousCodes = jest.mocked(invalidatePreviousCodes);

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

    it("should return success with codeId and emailId", async () => {
      const result = await sendVerificationCode(defaultParams);

      expect(result).toEqual({
        success: true,
        codeId: "vc-001",
        emailId: "email-sent-001",
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

    it("should create a verification code with expiry of 10 minutes", async () => {
      const beforeCall = Date.now();

      await sendVerificationCode(defaultParams);

      const createCall = mockedCreateVerificationCode.mock.calls[0][0];
      expect(createCall.email).toBe("user@example.com");
      expect(createCall.code).toBe("483920");
      expect(createCall.purpose).toBe(VerificationPurpose.EMAIL_VERIFICATION);
      expect(createCall.phone).toBeNull();
      expect(createCall.expiresAt.getTime()).toBeGreaterThanOrEqual(
        beforeCall + 10 * 60 * 1000 - 100,
      );
      expect(createCall.expiresAt.getTime()).toBeLessThanOrEqual(
        Date.now() + 10 * 60 * 1000,
      );
    });

    it("should pass phone number to createVerificationCode when provided", async () => {
      await sendVerificationCode({
        ...defaultParams,
        phone: "09171234567",
      });

      expect(mockedCreateVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({ phone: "09171234567" }),
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
});
