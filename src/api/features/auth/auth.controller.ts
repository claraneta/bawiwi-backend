import { Request, Response } from "express";
import { AuthValidateEmailRequestBody } from "./auth.interface";
import { findByEmail } from "../../shared/data-services/user.service";
import { badRequest, success, internalError } from "../../response-builder";
import { sendVerificationCode } from "./auth.transaction";
import { VerificationPurpose } from "../../../db/entities/verification-code.entity";

export const validateEmail = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email }: AuthValidateEmailRequestBody = req.body;

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
