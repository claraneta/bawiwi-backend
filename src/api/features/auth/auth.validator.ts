import { z } from "zod";

// --------------- Philippine phone number ---------------

const philippinePhoneRegex = /^(09|\+639)\d{9}$/;
const philippinePhoneError = "Phone must be a valid Philippine mobile number (e.g., 09171234567 or +639171234567)";

// --------------- validate-identifier (email or phone) ---------------

export const validateIdentifierSchema = z.object({
  email: z.email({ message: "Invalid email format" }).optional(),
  phone: z.string().regex(philippinePhoneRegex, philippinePhoneError).optional(),
}).refine(
  (data) => data.email !== undefined || data.phone !== undefined,
  { message: "Either email or phone is required", path: ["email"] },
);

export type ValidateIdentifierBody = z.infer<typeof validateIdentifierSchema>;

// --------------- register ---------------

export const registerSchema = z.object({
  email: z.email({ message: "Invalid email format" }),
  phone: z.string().regex(philippinePhoneRegex, philippinePhoneError),
  role: z.enum(["worker", "client"], {
    message: "Role must be 'worker' or 'client'",
  }),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be YYYY-MM-DD"),
});

export type RegisterBody = z.infer<typeof registerSchema>;

// --------------- verify-code ---------------

export const verifyCodeSchema = z.object({
  email: z.email({ message: "Invalid email format" }).optional(),
  phone: z.string().regex(philippinePhoneRegex, philippinePhoneError).optional(),
  code: z.string().length(6, "Code must be 6 digits"),
}).refine(
  (data) => data.email !== undefined || data.phone !== undefined,
  { message: "Either email or phone is required", path: ["email"] },
);

export type VerifyCodeBody = z.infer<typeof verifyCodeSchema>;