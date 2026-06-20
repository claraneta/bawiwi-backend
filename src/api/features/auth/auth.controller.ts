import { Request, Response } from "express";
import { AuthValidateEmailRequestBody } from "./auth.interface";
import { findByEmail } from "../../shared/data-services/user.service";
import { badRequest, success, internalError } from "../../response-builder";

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

    //send email to user 
    

    success(res, { valid: true });
    return;
  } catch (error) {
    internalError(res);
    return;
  }
};
