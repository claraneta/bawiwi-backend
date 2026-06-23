import { Router } from "express";
import { validateEmail } from "./auth.controller";
import { validateEmailMiddleware } from "./auth.validator";

const router = Router();

router.post("/validate-email", validateEmailMiddleware, validateEmail);

export default router;
