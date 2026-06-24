import { z } from "zod";

// --------------- validate-email ---------------

export const validateEmailSchema = z.object({
  email: z.email({ message: "Invalid email format" }),
});

export type ValidateEmailBody = z.infer<typeof validateEmailSchema>;

// --------------- register ---------------

export const registerSchema = z.object({
  email: z.email({ message: "Invalid email format" }),
  phone: z.string().min(1, "Phone is required"),
  role: z.enum(["worker", "client"], {
    message: "Role must be 'worker' or 'client'",
  }),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be YYYY-MM-DD"),
});

export type RegisterBody = z.infer<typeof registerSchema>;