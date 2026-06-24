import { Router } from "express";
import { validateEmail, register, verifyCodeHandler } from "./auth.controller";
import { validate } from "../../shared/middleware/validate";
import { validateEmailSchema, registerSchema, verifyCodeSchema } from "./auth.validator";

const router = Router();

router.post("/validate-email", validate(validateEmailSchema), validateEmail);
router.post("/register", validate(registerSchema), register);
router.post("/verify-code", validate(verifyCodeSchema), verifyCodeHandler);

export default router;
