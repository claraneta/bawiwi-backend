/// <reference types="jest" />

jest.mock("../../shared/data-services/user.service", () => ({
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
}));

jest.mock("./auth.transaction", () => ({
  sendVerificationCode: jest.fn(),
  createUser: jest.fn(),
  verifyCode: jest.fn(),
}));

import request from "supertest";
import express from "express";
import authRoutes from "./auth.route";
import { findByEmail, findByPhone } from "../../shared/data-services/user.service";
import { createUser, sendVerificationCode, verifyCode } from "./auth.transaction";
import { VerificationPurpose } from "../../../db/entities/verification-code.entity";
import { UserRole } from "../../../db/entities/user.entity";

const mockedFindByEmail = jest.mocked(findByEmail);
const mockedFindByPhone = jest.mocked(findByPhone);
const mockedCreateUser = jest.mocked(createUser);
const mockedSendVerificationCode = jest.mocked(sendVerificationCode);
const mockedVerifyCode = jest.mocked(verifyCode);

describe("Auth Feature", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/auth", authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    const validBody = {
      email: "newuser@example.com",
      phone: "09171234567",
      role: "worker",
      firstName: "John",
      lastName: "Doe",
      birthdate: "2000-01-15",
    };

    const mockCreatedUser = {
      id: "user-new-001",
      email: validBody.email,
      phone: validBody.phone,
      role: "worker",
    };

    it("should return 201 with user summary when registration succeeds", async () => {
      mockedFindByEmail.mockResolvedValue(null);
      mockedCreateUser.mockResolvedValue({ success: true, user: mockCreatedUser } as any);
      mockedSendVerificationCode.mockResolvedValue({
        success: true,
        codeId: "code-001",
      });

      const response = await request(app)
        .post("/auth/register")
        .send(validBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        error: 0,
        data: {
          id: "user-new-001",
          email: "newuser@example.com",
          role: "worker",
        },
        message: "Registration successful. Please check your email for the verification code.",
      });
    });

    it("should return 409 when email is already registered", async () => {
      mockedFindByEmail.mockResolvedValue({ id: "existing-user" } as any);

      const response = await request(app)
        .post("/auth/register")
        .send(validBody);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: "Email is already registered",
      });
    });

    it("should not create user or send code when email is taken", async () => {
      mockedFindByEmail.mockResolvedValue({ id: "existing-user" } as any);

      await request(app)
        .post("/auth/register")
        .send(validBody);

      expect(mockedCreateUser).not.toHaveBeenCalled();
      expect(mockedSendVerificationCode).not.toHaveBeenCalled();
    });

    it("should return 400 when email format is invalid", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ ...validBody, email: "not-an-email" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: "Invalid email format",
      });
    });

    it("should return 400 when firstName is missing", async () => {
      const { firstName, ...noFirst } = validBody;
      const response = await request(app)
        .post("/auth/register")
        .send(noFirst);

      expect(response.status).toBe(400);
    });

    it("should return 400 when role is invalid", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ ...validBody, role: "admin" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: "Role must be 'worker' or 'client'",
      });
    });

    it("should return 400 when birthdate format is invalid", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ ...validBody, birthdate: "15-01-2000" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: "Birthdate must be YYYY-MM-DD",
      });
    });

    it("should return 500 when sendVerificationCode fails", async () => {
      mockedFindByEmail.mockResolvedValue(null);
      mockedCreateUser.mockResolvedValue({ success: true, user: mockCreatedUser } as any);
      mockedSendVerificationCode.mockResolvedValue({
        success: false,
        error: "Email service unavailable",
        step: "email",
      });

      const response = await request(app)
        .post("/auth/register")
        .send(validBody);

      expect(response.status).toBe(500);
    });

    it("should return 500 when createUser fails", async () => {
      mockedFindByEmail.mockResolvedValue(null);
      mockedCreateUser.mockResolvedValue({ success: false, error: "Email already exists" });

      const response = await request(app)
        .post("/auth/register")
        .send(validBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: "Email already exists",
      });
    });

    it("should call createUser with correct params", async () => {
      mockedFindByEmail.mockResolvedValue(null);
      mockedCreateUser.mockResolvedValue({ success: true, user: mockCreatedUser } as any);
      mockedSendVerificationCode.mockResolvedValue({
        success: true,
        codeId: "code-002",
      });

      await request(app)
        .post("/auth/register")
        .send(validBody);

      expect(mockedCreateUser).toHaveBeenCalledWith({
        email: "newuser@example.com",
        phone: "09171234567",
        role: "worker",
        firstName: "John",
        lastName: "Doe",
        birthdate: expect.any(Date),
      });
    });

    it("should send SIGNUP verification code after creating user", async () => {
      mockedFindByEmail.mockResolvedValue(null);
      mockedCreateUser.mockResolvedValue({ success: true, user: mockCreatedUser } as any);
      mockedSendVerificationCode.mockResolvedValue({
        success: true,
        codeId: "code-003",
      });

      await request(app)
        .post("/auth/register")
        .send(validBody);

      expect(mockedSendVerificationCode).toHaveBeenCalledWith({
        email: "newuser@example.com",
        purpose: VerificationPurpose.SIGNUP,
        recipientName: "John",
      });
      const createCallOrder = mockedCreateUser.mock.invocationCallOrder[0];
      const sendCallOrder = mockedSendVerificationCode.mock.invocationCallOrder[0];
      expect(createCallOrder).toBeLessThan(sendCallOrder);
    });

    it("should accept client role", async () => {
      mockedFindByEmail.mockResolvedValue(null);
      mockedCreateUser.mockResolvedValue({ success: true, user: { ...mockCreatedUser, role: "client" } } as any);
      mockedSendVerificationCode.mockResolvedValue({
        success: true,
        codeId: "code-004",
      });

      const response = await request(app)
        .post("/auth/register")
        .send({ ...validBody, role: "client" });

      expect(response.status).toBe(201);
      expect(response.body.data.role).toBe("client");
    });
  });

  describe("POST /auth/validate-identifier", () => {
    const validEmail = "test@example.com";
    const validPhone = "09171234567";

    describe("email-based", () => {
      it("should return 200 with valid:true when email is registered and code is sent", async () => {
        mockedFindByEmail.mockResolvedValue({ id: "user-1", email: validEmail, details: { firstName: "John" } } as any);
        mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-1" });

        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ email: validEmail });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          error: 0,
          data: { valid: true },
          message: "Success",
        });
      });

      it("should return 200 when recipientName is undefined if user has no details", async () => {
        mockedFindByEmail.mockResolvedValue({ id: "user-1", email: validEmail, details: null } as any);
        mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-2" });

        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ email: validEmail });

        expect(response.status).toBe(200);
        expect(mockedSendVerificationCode).toHaveBeenCalledWith(
          expect.objectContaining({ recipientName: undefined }),
        );
      });

      it("should return 400 when email is not registered", async () => {
        mockedFindByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ email: validEmail });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Email is not registered",
        });
      });

      it("should call findByEmail with the correct email", async () => {
        mockedFindByEmail.mockResolvedValue({ id: "user-1", email: validEmail } as any);
        mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-3" });

        await request(app)
          .post("/auth/validate-identifier")
          .send({ email: validEmail });

        expect(mockedFindByEmail).toHaveBeenCalledWith(validEmail);
      });

      it("should call sendVerificationCode with correct params on success path", async () => {
        mockedFindByEmail.mockResolvedValue({ id: "user-1", email: validEmail, details: { firstName: "Alice" } } as any);
        mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-4" });

        await request(app)
          .post("/auth/validate-identifier")
          .send({ email: validEmail });

        expect(mockedSendVerificationCode).toHaveBeenCalledWith({
          email: validEmail,
          phone: undefined,
          purpose: VerificationPurpose.EMAIL_VERIFICATION,
          recipientName: "Alice",
        });
      });
    });

    describe("phone-based", () => {
      it("should return 200 with valid:true when phone is registered and code is sent", async () => {
        mockedFindByPhone.mockResolvedValue({ id: "user-2", phone: validPhone, details: { firstName: "Jane" } } as any);
        mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-5" });

        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ phone: validPhone });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          error: 0,
          data: { valid: true },
          message: "Success",
        });
      });

      it("should return 400 when phone is not registered", async () => {
        mockedFindByPhone.mockResolvedValue(null);

        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ phone: validPhone });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Phone is not registered",
        });
      });

      it("should call findByPhone with the correct phone", async () => {
        mockedFindByPhone.mockResolvedValue({ id: "user-2", phone: validPhone } as any);
        mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-6" });

        await request(app)
          .post("/auth/validate-identifier")
          .send({ phone: validPhone });

        expect(mockedFindByPhone).toHaveBeenCalledWith(validPhone);
      });

      it("should call sendVerificationCode with phone param", async () => {
        mockedFindByPhone.mockResolvedValue({ id: "user-2", phone: validPhone, details: { firstName: "Bob" } } as any);
        mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-7" });

        await request(app)
          .post("/auth/validate-identifier")
          .send({ phone: validPhone });

        expect(mockedSendVerificationCode).toHaveBeenCalledWith({
          email: undefined,
          phone: validPhone,
          purpose: VerificationPurpose.EMAIL_VERIFICATION,
          recipientName: "Bob",
        });
      });
    });

    describe("validation", () => {
      it("should return 400 when neither email nor phone is provided", async () => {
        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Either email or phone is required",
        });
      });

      it("should return 400 when email format is invalid", async () => {
        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ email: "not-an-email" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Invalid email format",
        });
      });

      it("should return 400 when email is empty string", async () => {
        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ email: "" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Invalid email format",
        });
      });

      it("should return 400 when phone is empty string", async () => {
        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ phone: "" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Phone must be a valid Philippine mobile number (e.g., 09171234567 or +639171234567)",
        });
      });

      it("should return 500 when sendVerificationCode fails", async () => {
        mockedFindByEmail.mockResolvedValue({ id: "user-1", email: validEmail } as any);
        mockedSendVerificationCode.mockResolvedValue({
          success: false,
          error: "Email service unavailable",
          step: "email",
        });

        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ email: validEmail });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Email service unavailable",
        });
      });

      it("should return 500 when an unexpected error occurs", async () => {
        mockedFindByEmail.mockRejectedValue(new Error("Database connection lost"));

        const response = await request(app)
          .post("/auth/validate-identifier")
          .send({ email: validEmail });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Internal server error",
        });
      });
    });
  });

  describe("POST /auth/verify-code", () => {
    const emailBody = {
      email: "test@example.com",
      code: "123456",
    };

    const phoneBody = {
      phone: "09171234567",
      code: "654321",
    };

    const mockToken = "jwt-token-abc123";
    const mockUser = { id: "user-1", email: "test@example.com", role: UserRole.WORKER as const };

    describe("email-based", () => {
      it("should return 200 with token and user when code is valid", async () => {
        mockedVerifyCode.mockResolvedValue({
          success: true,
          token: mockToken,
          user: mockUser,
        });

        const response = await request(app)
          .post("/auth/verify-code")
          .send(emailBody);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          error: 0,
          data: { token: mockToken, user: mockUser },
          message: "Success",
        });
      });

      it("should call verifyCode with email, phone undefined, and code", async () => {
        mockedVerifyCode.mockResolvedValue({
          success: true,
          token: mockToken,
          user: mockUser,
        });

        await request(app)
          .post("/auth/verify-code")
          .send(emailBody);

        expect(mockedVerifyCode).toHaveBeenCalledWith({
          email: "test@example.com",
          phone: undefined,
          code: "123456",
        });
      });
    });

    describe("phone-based", () => {
      it("should return 200 with token and user when phone code is valid", async () => {
        mockedVerifyCode.mockResolvedValue({
          success: true,
          token: mockToken,
          user: mockUser,
        });

        const response = await request(app)
          .post("/auth/verify-code")
          .send(phoneBody);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          error: 0,
          data: { token: mockToken, user: mockUser },
          message: "Success",
        });
      });

      it("should call verifyCode with phone, email undefined, and code", async () => {
        mockedVerifyCode.mockResolvedValue({
          success: true,
          token: mockToken,
          user: mockUser,
        });

        await request(app)
          .post("/auth/verify-code")
          .send(phoneBody);

        expect(mockedVerifyCode).toHaveBeenCalledWith({
          email: undefined,
          phone: "09171234567",
          code: "654321",
        });
      });
    });

    describe("validation", () => {
      it("should return 400 when code is invalid or expired", async () => {
        mockedVerifyCode.mockResolvedValue({
          success: false,
          error: "Invalid or expired verification code",
        });

        const response = await request(app)
          .post("/auth/verify-code")
          .send(emailBody);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Invalid or expired verification code",
        });
      });

      it("should return 400 when email format is invalid", async () => {
        const response = await request(app)
          .post("/auth/verify-code")
          .send({ email: "not-an-email", code: "123456" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Invalid email format",
        });
      });

      it("should return 400 when code is not 6 digits", async () => {
        const response = await request(app)
          .post("/auth/verify-code")
          .send({ email: "test@example.com", code: "123" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Code must be 6 digits",
        });
      });

      it("should return 400 when neither email nor phone is provided", async () => {
        const response = await request(app)
          .post("/auth/verify-code")
          .send({ code: "123456" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Either email or phone is required",
        });
      });

      it("should return 500 when an unexpected error occurs", async () => {
        mockedVerifyCode.mockRejectedValue(new Error("Unexpected error"));

        const response = await request(app)
          .post("/auth/verify-code")
          .send(emailBody);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          error: 1,
          data: null,
          message: "Internal server error",
        });
      });
    });
  });

});
