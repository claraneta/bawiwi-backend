/// <reference types="jest" />

jest.mock("../../../../db/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue({
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    }),
  },
}));

import { VerificationCode, VerificationPurpose } from "../../../../db/entities/verification-code.entity";
import * as verificationCodeService from "./verification-code.service";

describe("VerificationCodeService", () => {
  let mockRepo: {
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const mockVerificationCode: VerificationCode = {
    id: "vc-550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    phone: null,
    channel: "email" as any,
    code: "123456",
    purpose: VerificationPurpose.EMAIL_VERIFICATION,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    usedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as VerificationCode;

  beforeAll(() => {
    const { AppDataSource } = require("../../../../db/data-source");
    mockRepo = AppDataSource.getRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("invalidatePreviousCodes", () => {
    const params = {
      email: "user@example.com",
      purpose: VerificationPurpose.EMAIL_VERIFICATION,
    };

    it("should call repo.update when email is provided", async () => {
      mockRepo.update.mockResolvedValue({ affected: 2 });

      await verificationCodeService.invalidatePreviousCodes(params);

      expect(mockRepo.update).toHaveBeenCalledWith(
        {
          email: params.email,
          purpose: params.purpose,
          usedAt: expect.anything(), // IsNull()
        },
        { usedAt: expect.any(Date) },
      );
    });

    it("should call repo.update when phone is provided", async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });

      await verificationCodeService.invalidatePreviousCodes({
        phone: "09171234567",
        purpose: VerificationPurpose.SIGNUP,
      });

      expect(mockRepo.update).toHaveBeenCalledWith(
        {
          phone: "09171234567",
          purpose: VerificationPurpose.SIGNUP,
          usedAt: expect.anything(),
        },
        { usedAt: expect.any(Date) },
      );
    });

    it("should call repo.update for both email and phone when both provided", async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });

      await verificationCodeService.invalidatePreviousCodes({
        email: "user@example.com",
        phone: "09171234567",
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
      });

      expect(mockRepo.update).toHaveBeenCalledTimes(2);
    });

    it("should set usedAt to a recent Date", async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });
      const beforeCall = Date.now();

      await verificationCodeService.invalidatePreviousCodes(params);

      const usedAtArg = mockRepo.update.mock.calls[0][1].usedAt;
      expect(usedAtArg).toBeInstanceOf(Date);
      expect(usedAtArg.getTime()).toBeGreaterThanOrEqual(beforeCall);
      expect(usedAtArg.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("should handle password_reset purpose correctly", async () => {
      mockRepo.update.mockResolvedValue({ affected: 0 });

      await verificationCodeService.invalidatePreviousCodes({
        email: "admin@example.com",
        purpose: VerificationPurpose.PASSWORD_RESET,
      });

      expect(mockRepo.update).toHaveBeenCalledWith(
        {
          email: "admin@example.com",
          purpose: VerificationPurpose.PASSWORD_RESET,
          usedAt: expect.anything(),
        },
        { usedAt: expect.any(Date) },
      );
    });

    it("should return undefined (void)", async () => {
      mockRepo.update.mockResolvedValue({ affected: 0 });

      const result = await verificationCodeService.invalidatePreviousCodes(params);

      expect(result).toBeUndefined();
    });

    it("should propagate errors from the database", async () => {
      const dbError = new Error("Database connection failed");
      mockRepo.update.mockRejectedValue(dbError);

      await expect(
        verificationCodeService.invalidatePreviousCodes(params),
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("createVerificationCode", () => {
    const createParams = {
      email: "newuser@example.com",
      code: "654321",
      purpose: VerificationPurpose.SIGNUP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      phone: "09171234567",
    };

    const createdEntity = { ...mockVerificationCode, ...createParams, phone: "09171234567" };

    it("should call repo.create with the correct data and default channel", async () => {
      mockRepo.create.mockReturnValue(createdEntity);
      mockRepo.save.mockResolvedValue(createdEntity);

      await verificationCodeService.createVerificationCode(createParams);

      expect(mockRepo.create).toHaveBeenCalledWith({
        email: createParams.email,
        code: createParams.code,
        purpose: createParams.purpose,
        expiresAt: createParams.expiresAt,
        phone: createParams.phone,
        channel: 'email',
      });
    });

    it("should call repo.save with the created entity", async () => {
      mockRepo.create.mockReturnValue(createdEntity);
      mockRepo.save.mockResolvedValue(createdEntity);

      await verificationCodeService.createVerificationCode(createParams);

      expect(mockRepo.save).toHaveBeenCalledWith(createdEntity);
    });

    it("should return the saved verification code", async () => {
      mockRepo.create.mockReturnValue(createdEntity);
      mockRepo.save.mockResolvedValue(createdEntity);

      const result = await verificationCodeService.createVerificationCode(createParams);

      expect(result).toEqual(createdEntity);
      expect(result.id).toBeDefined();
      expect(result.code).toBe("654321");
    });

    it("should accept an explicit channel", async () => {
      mockRepo.create.mockReturnValue(createdEntity);
      mockRepo.save.mockResolvedValue(createdEntity);

      await verificationCodeService.createVerificationCode({
        ...createParams,
        channel: 'sms' as any,
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'sms' }),
      );
    });

    it("should use null for phone when phone is not provided", async () => {
      const paramsWithoutPhone = {
        email: "nophone@example.com",
        code: "111111",
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        expiresAt: new Date(),
      };
      const entityWithoutPhone = { ...mockVerificationCode, ...paramsWithoutPhone, phone: null, channel: "email" };

      mockRepo.create.mockReturnValue(entityWithoutPhone);
      mockRepo.save.mockResolvedValue(entityWithoutPhone);

      await verificationCodeService.createVerificationCode(paramsWithoutPhone);

      expect(mockRepo.create).toHaveBeenCalledWith({
        email: paramsWithoutPhone.email,
        code: paramsWithoutPhone.code,
        purpose: paramsWithoutPhone.purpose,
        expiresAt: paramsWithoutPhone.expiresAt,
        phone: null,
        channel: 'email',
      });
    });

    it("should use null for phone when phone is undefined", async () => {
      const paramsWithUndefinedPhone = {
        email: "undefined-phone@example.com",
        code: "222222",
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        expiresAt: new Date(),
        phone: undefined,
      };
      const entityWithNullPhone = { ...mockVerificationCode, ...paramsWithUndefinedPhone, phone: null, channel: "email" };

      mockRepo.create.mockReturnValue(entityWithNullPhone);
      mockRepo.save.mockResolvedValue(entityWithNullPhone);

      await verificationCodeService.createVerificationCode(paramsWithUndefinedPhone);

      expect(mockRepo.create).toHaveBeenCalledWith({
        email: paramsWithUndefinedPhone.email,
        code: paramsWithUndefinedPhone.code,
        purpose: paramsWithUndefinedPhone.purpose,
        expiresAt: paramsWithUndefinedPhone.expiresAt,
        phone: null,
        channel: 'email',
      });
    });

    it("should propagate save errors", async () => {
      const saveError = new Error("Unique constraint violation");
      mockRepo.create.mockReturnValue(createdEntity);
      mockRepo.save.mockRejectedValue(saveError);

      await expect(
        verificationCodeService.createVerificationCode(createParams),
      ).rejects.toThrow("Unique constraint violation");
    });

    it("should propagate create errors", async () => {
      const createError = new Error("Entity creation failed");
      mockRepo.create.mockImplementation(() => {
        throw createError;
      });

      await expect(
        verificationCodeService.createVerificationCode(createParams),
      ).rejects.toThrow("Entity creation failed");
    });

    it("should handle password_reset purpose correctly", async () => {
      const resetParams = {
        email: "reset@example.com",
        code: "999999",
        purpose: VerificationPurpose.PASSWORD_RESET,
        expiresAt: new Date(),
      };
      const resetEntity = { ...mockVerificationCode, ...resetParams, phone: null };

      mockRepo.create.mockReturnValue(resetEntity);
      mockRepo.save.mockResolvedValue(resetEntity);

      const result = await verificationCodeService.createVerificationCode(resetParams);

      expect(result.purpose).toBe(VerificationPurpose.PASSWORD_RESET);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: VerificationPurpose.PASSWORD_RESET }),
      );
    });
  });
});
