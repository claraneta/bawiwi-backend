import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { badRequest } from "../../response-builder";

export function validate<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Validation failed";
      badRequest(res, message);
      return;
    }

    req.body = result.data;
    next();
  };
}
