import { Router } from "express";
import { validateEmail, register } from "./auth.controller";
import { validate } from "../../shared/middleware/validate";
import { validateEmailSchema, registerSchema } from "./auth.validator";

const router = Router();

router.post("/validate-email", validate(validateEmailSchema), validateEmail);
router.post("/register", validate(registerSchema), register);

export default router;
