import { Router } from "express";
import { validateIdentifier, register, verifyCodeHandler } from "./auth.controller";
import { validate } from "../../shared/middleware/validate";
import { validateIdentifierSchema, registerSchema, verifyCodeSchema } from "./auth.validator";

const router = Router();

router.post("/validate-identifier", validate(validateIdentifierSchema), validateIdentifier);
router.post("/register", validate(registerSchema), register);
router.post("/verify-code", validate(verifyCodeSchema), verifyCodeHandler);

export default router;
