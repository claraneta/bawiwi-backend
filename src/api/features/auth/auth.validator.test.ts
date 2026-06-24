/// <reference types="jest" />

import { validateEmailSchema } from "./auth.validator";

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
