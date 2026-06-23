import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { badRequest } from "../../response-builder";

export const validateEmailSchema = z.object({
  email: z.email({ message: "Invalid email format" }),
});

export type ValidateEmailBody = z.infer<typeof validateEmailSchema>;

export const validateEmailMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = validateEmailSchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Validation failed";
    badRequest(res, message);
    return;
  }

  req.body = result.data;
  next();
};