/// <reference types="jest" />

jest.mock("../../shared/data-services/user.service", () => ({
  findByEmail: jest.fn(),
}));

jest.mock("./auth.transaction", () => ({
  sendVerificationCode: jest.fn(),
}));

import request from "supertest";
import express from "express";
import authRoutes from "./auth.route";
import { findByEmail } from "../../shared/data-services/user.service";
import { sendVerificationCode } from "./auth.transaction";
import { VerificationPurpose } from "../../../db/entities/verification-code.entity";

const mockedFindByEmail = jest.mocked(findByEmail);
const mockedSendVerificationCode = jest.mocked(sendVerificationCode);

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

  describe("POST /auth/validate-email", () => {
    const validEmail = "test@example.com";

    it("should return 200 with valid:true when email is registered and code is sent", async () => {
      mockedFindByEmail.mockResolvedValue({ id: "user-1", email: validEmail, details: { firstName: "John" } } as any);
      mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-1", emailId: "email-1" });

      const response = await request(app)
        .post("/auth/validate-email")
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
      mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-2", emailId: "email-2" });

      const response = await request(app)
        .post("/auth/validate-email")
        .send({ email: validEmail });

      expect(response.status).toBe(200);
      expect(mockedSendVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({ recipientName: undefined }),
      );
    });

    it("should return 400 when email is not provided", async () => {
      const response = await request(app)
        .post("/auth/validate-email")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: "Invalid email format",
      });
    });

    it("should return 400 when email format is invalid", async () => {
      const response = await request(app)
        .post("/auth/validate-email")
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
        .post("/auth/validate-email")
        .send({ email: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: "Invalid email format",
      });
    });

    it("should return 400 when email is not registered", async () => {
      mockedFindByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post("/auth/validate-email")
        .send({ email: validEmail });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: "Email is not registered",
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
        .post("/auth/validate-email")
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
        .post("/auth/validate-email")
        .send({ email: validEmail });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: "Internal server error",
      });
    });

    it("should call findByEmail with the correct email", async () => {
      mockedFindByEmail.mockResolvedValue({ id: "user-1", email: validEmail } as any);
      mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-3", emailId: "email-3" });

      await request(app)
        .post("/auth/validate-email")
        .send({ email: validEmail });

      expect(mockedFindByEmail).toHaveBeenCalledWith(validEmail);
    });

    it("should call sendVerificationCode with correct params on success path", async () => {
      mockedFindByEmail.mockResolvedValue({ id: "user-1", email: validEmail, details: { firstName: "Alice" } } as any);
      mockedSendVerificationCode.mockResolvedValue({ success: true, codeId: "code-4", emailId: "email-4" });

      await request(app)
        .post("/auth/validate-email")
        .send({ email: validEmail });

      expect(mockedSendVerificationCode).toHaveBeenCalledWith({
        email: validEmail,
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        recipientName: "Alice",
      });
    });
  });

});
