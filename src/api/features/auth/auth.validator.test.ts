/// <reference types="jest" />

import { validateEmailSchema, registerSchema } from "./auth.validator";

const validRegisterBody = {
  email: "user@example.com",
  phone: "09171234567",
  role: "worker",
  firstName: "John",
  lastName: "Doe",
  birthdate: "2000-01-15",
};

describe("validateEmailSchema (Zod schema)", () => {
  it("should accept a valid email", () => {
    const result = validateEmailSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("should accept emails with subdomains", () => {
    const result = validateEmailSchema.safeParse({ email: "user@sub.example.com" });
    expect(result.success).toBe(true);
  });

  it("should accept emails with plus sign", () => {
    const result = validateEmailSchema.safeParse({ email: "user+tag@example.com" });
    expect(result.success).toBe(true);
  });

  it("should reject a string without @ symbol", () => {
    const result = validateEmailSchema.safeParse({ email: "notanemail" });
    expect(result.success).toBe(false);
  });

  it("should reject an empty string", () => {
    const result = validateEmailSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("should reject missing email field", () => {
    const result = validateEmailSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject null email", () => {
    const result = validateEmailSchema.safeParse({ email: null });
    expect(result.success).toBe(false);
  });

  it("should reject numeric email", () => {
    const result = validateEmailSchema.safeParse({ email: 12345 });
    expect(result.success).toBe(false);
  });

  it("should allow extra fields (Zod strip mode by default)", () => {
    const result = validateEmailSchema.safeParse({ email: "user@example.com", extra: "field" });
    expect(result.success).toBe(true);
  });
});

describe("registerSchema (Zod schema)", () => {
  it("should accept a valid register body", () => {
    const result = registerSchema.safeParse(validRegisterBody);
    expect(result.success).toBe(true);
  });

  it("should accept client role", () => {
    const result = registerSchema.safeParse({
      ...validRegisterBody,
      role: "client",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid role", () => {
    const result = registerSchema.safeParse({
      ...validRegisterBody,
      role: "admin",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing email", () => {
    const { email, ...noEmail } = validRegisterBody;
    const result = registerSchema.safeParse(noEmail);
    expect(result.success).toBe(false);
  });

  it("should reject invalid email format", () => {
    const result = registerSchema.safeParse({
      ...validRegisterBody,
      email: "notanemail",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing phone", () => {
    const { phone, ...noPhone } = validRegisterBody;
    const result = registerSchema.safeParse(noPhone);
    expect(result.success).toBe(false);
  });

  it("should reject empty phone", () => {
    const result = registerSchema.safeParse({
      ...validRegisterBody,
      phone: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing firstName", () => {
    const { firstName, ...noFirst } = validRegisterBody;
    const result = registerSchema.safeParse(noFirst);
    expect(result.success).toBe(false);
  });

  it("should reject missing lastName", () => {
    const { lastName, ...noLast } = validRegisterBody;
    const result = registerSchema.safeParse(noLast);
    expect(result.success).toBe(false);
  });

  it("should reject missing birthdate", () => {
    const { birthdate, ...noBday } = validRegisterBody;
    const result = registerSchema.safeParse(noBday);
    expect(result.success).toBe(false);
  });

  it("should reject invalid birthdate format", () => {
    const result = registerSchema.safeParse({
      ...validRegisterBody,
      birthdate: "15-01-2000",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty string firstName", () => {
    const result = registerSchema.safeParse({
      ...validRegisterBody,
      firstName: "",
    });
    expect(result.success).toBe(false);
  });

  it("should allow extra fields (Zod strip mode by default)", () => {
    const result = registerSchema.safeParse({
      ...validRegisterBody,
      extraField: "something",
    });
    expect(result.success).toBe(true);
  });
});
