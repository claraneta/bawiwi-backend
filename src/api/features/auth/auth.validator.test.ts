/// <reference types="jest" />

import { validateIdentifierSchema, registerSchema, verifyCodeSchema } from "./auth.validator";

const validRegisterBody = {
  email: "user@example.com",
  phone: "09171234567",
  role: "worker",
  firstName: "John",
  lastName: "Doe",
  birthdate: "2000-01-15",
};

describe("validateIdentifierSchema (Zod schema)", () => {
  describe("email-based", () => {
    it("should accept a valid email", () => {
      const result = validateIdentifierSchema.safeParse({ email: "user@example.com" });
      expect(result.success).toBe(true);
    });

    it("should accept emails with subdomains", () => {
      const result = validateIdentifierSchema.safeParse({ email: "user@sub.example.com" });
      expect(result.success).toBe(true);
    });

    it("should accept emails with plus sign", () => {
      const result = validateIdentifierSchema.safeParse({ email: "user+tag@example.com" });
      expect(result.success).toBe(true);
    });

    it("should reject a string without @ symbol", () => {
      const result = validateIdentifierSchema.safeParse({ email: "notanemail" });
      expect(result.success).toBe(false);
    });

    it("should reject an empty email string", () => {
      const result = validateIdentifierSchema.safeParse({ email: "" });
      expect(result.success).toBe(false);
    });

    it("should reject null email", () => {
      const result = validateIdentifierSchema.safeParse({ email: null });
      expect(result.success).toBe(false);
    });

    it("should reject numeric email", () => {
      const result = validateIdentifierSchema.safeParse({ email: 12345 });
      expect(result.success).toBe(false);
    });
  });

  describe("phone-based", () => {
    it("should accept a valid 09-prefix phone", () => {
      const result = validateIdentifierSchema.safeParse({ phone: "09171234567" });
      expect(result.success).toBe(true);
    });

    it("should accept a valid +63-prefix phone", () => {
      const result = validateIdentifierSchema.safeParse({ phone: "+639171234567" });
      expect(result.success).toBe(true);
    });

    it("should reject empty phone", () => {
      const result = validateIdentifierSchema.safeParse({ phone: "" });
      expect(result.success).toBe(false);
    });

    it("should reject null phone", () => {
      const result = validateIdentifierSchema.safeParse({ phone: null });
      expect(result.success).toBe(false);
    });

    it("should reject a phone with too few digits", () => {
      const result = validateIdentifierSchema.safeParse({ phone: "0917123456" });
      expect(result.success).toBe(false);
    });

    it("should reject a phone with too many digits", () => {
      const result = validateIdentifierSchema.safeParse({ phone: "091712345678" });
      expect(result.success).toBe(false);
    });

    it("should reject a phone without the 09 or +63 prefix", () => {
      const result = validateIdentifierSchema.safeParse({ phone: "12345678901" });
      expect(result.success).toBe(false);
    });

    it("should reject a landline number", () => {
      const result = validateIdentifierSchema.safeParse({ phone: "0281234567" });
      expect(result.success).toBe(false);
    });
  });

  describe("validation rules", () => {
    it("should reject when neither email nor phone is provided", () => {
      const result = validateIdentifierSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should allow extra fields (Zod strip mode by default)", () => {
      const result = validateIdentifierSchema.safeParse({ email: "user@example.com", extra: "field" });
      expect(result.success).toBe(true);
    });
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

  it("should reject invalid Philippine phone format", () => {
    const result = registerSchema.safeParse({
      ...validRegisterBody,
      phone: "1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("should accept +63-prefix phone in register", () => {
    const result = registerSchema.safeParse({
      ...validRegisterBody,
      phone: "+639171234567",
    });
    expect(result.success).toBe(true);
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

describe("verifyCodeSchema (Zod schema)", () => {
  const validCode = "123456";

  describe("phone validation", () => {
    it("should accept a valid 09-prefix phone with code", () => {
      const result = verifyCodeSchema.safeParse({ phone: "09171234567", code: validCode });
      expect(result.success).toBe(true);
    });

    it("should accept a valid +63-prefix phone with code", () => {
      const result = verifyCodeSchema.safeParse({ phone: "+639171234567", code: validCode });
      expect(result.success).toBe(true);
    });

    it("should reject a phone with too few digits", () => {
      const result = verifyCodeSchema.safeParse({ phone: "0917123456", code: validCode });
      expect(result.success).toBe(false);
    });

    it("should reject a phone with too many digits", () => {
      const result = verifyCodeSchema.safeParse({ phone: "091712345678", code: validCode });
      expect(result.success).toBe(false);
    });

    it("should reject a phone without the 09 or +63 prefix", () => {
      const result = verifyCodeSchema.safeParse({ phone: "12345678901", code: validCode });
      expect(result.success).toBe(false);
    });

    it("should reject empty phone with code", () => {
      const result = verifyCodeSchema.safeParse({ phone: "", code: validCode });
      expect(result.success).toBe(false);
    });
  });

  describe("email validation", () => {
    it("should accept a valid email with code", () => {
      const result = verifyCodeSchema.safeParse({ email: "user@example.com", code: validCode });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = verifyCodeSchema.safeParse({ email: "notanemail", code: validCode });
      expect(result.success).toBe(false);
    });
  });

  describe("code validation", () => {
    it("should reject code that is not 6 digits", () => {
      const result = verifyCodeSchema.safeParse({ email: "user@example.com", code: "123" });
      expect(result.success).toBe(false);
    });
  });

  describe("identifier requirement", () => {
    it("should reject when neither email nor phone is provided", () => {
      const result = verifyCodeSchema.safeParse({ code: validCode });
      expect(result.success).toBe(false);
    });
  });
});
