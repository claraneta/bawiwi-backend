import { Request, Response } from "express";
import { UserRole } from "../../../db/entities/user.entity";
import { VerificationPurpose } from "../../../db/entities/verification-code.entity";
import { badRequest, conflict, created, internalError, success } from "../../response-builder";
import { findByEmail, findByPhone } from "../../shared/data-services/user.service";
import { createUser, sendVerificationCode, verifyCode } from "./auth.transaction";
import { RegisterBody, ValidateIdentifierBody, VerifyCodeBody } from "./auth.validator";

export const validateIdentifier = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, phone }: ValidateIdentifierBody = req.body;

    // Look up user by email or phone
    const user = email
      ? await findByEmail(email)
      : phone
        ? await findByPhone(phone)
        : null;

    if (!user) {
      badRequest(res, email ? "Email is not registered" : "Phone is not registered");
      return;
    }

    const result = await sendVerificationCode({
      email,
      phone,
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

export const verifyCodeHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, phone, code }: VerifyCodeBody = req.body;

    const result = await verifyCode({ email, phone, code });

    if (!result.success) {
      badRequest(res, result.error);
      return;
    }

    success(res, {
      token: result.token,
      user: result.user,
    });
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
