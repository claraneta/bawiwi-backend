import { Request, Response } from "express";
import { UserRole } from "../../../db/entities/user.entity";
import { VerificationPurpose } from "../../../db/entities/verification-code.entity";
import { badRequest, conflict, created, internalError, success } from "../../response-builder";
import { findByEmail } from "../../shared/data-services/user.service";
import { createUser, sendVerificationCode } from "./auth.transaction";
import { RegisterBody, ValidateEmailBody } from "./auth.validator";

export const validateEmail = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email }: ValidateEmailBody = req.body;

    const user = await findByEmail(email);

    if (!user) {
      badRequest(res, "Email is not registered");
      return;
    }

    const result = await sendVerificationCode({
      email,
      purpose: VerificationPurpose.EMAIL_VERIFICATION,
      recipientName: user.details?.firstName ?? undefined,
    });

    if (!result.success) {
      internalError(res, result.error);
      return;
    }

    success(res, { valid: true });
    return;
  } catch (error) {
    internalError(res);
    return;
  }
};

export const register = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, phone, role, firstName, lastName, birthdate }: RegisterBody = req.body;

    const existing = await findByEmail(email);

    if (existing) {
      conflict(res, "Email is already registered");
      return;
    }

    const userResult = await createUser({
      email,
      phone,
      role: role as UserRole,
      firstName,
      lastName,
      birthdate: new Date(birthdate),
    });

    if (!userResult.success) {
      internalError(res, userResult.error);
      return;
    }

    const codeResult = await sendVerificationCode({
      email,
      purpose: VerificationPurpose.SIGNUP,
      recipientName: firstName,
    });

    if (!codeResult.success) {
      internalError(res, codeResult.error);
      return;
    }

    created(res, {
      id: userResult.user.id,
      email: userResult.user.email,
      role: userResult.user.role,
    }, "Registration successful. Please check your email for the verification code.");
    return;
  } catch (error) {
    internalError(res);
    return;
  }
};
