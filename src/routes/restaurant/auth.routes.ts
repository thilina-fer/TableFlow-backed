import { Router } from "express";
import {
  loginStaff,
  logoutStaff,
  getMe,
  refreshToken,
  changePassword,
} from "../../controllers/auth.controller";
import { protect } from "../../middleware/auth.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { loginSchema, changePasswordSchema } from "../../schemas/auth.schema";

const router = Router();

router.post("/login", validateBody(loginSchema), loginStaff);
router.post("/logout", protect, logoutStaff);
router.get("/me", protect, checkFirstLogin, getMe);
router.post("/refresh", refreshToken);
router.post("/change-password", protect, validateBody(changePasswordSchema), changePassword);

export default router;
