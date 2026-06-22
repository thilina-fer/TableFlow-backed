import { Router } from "express";
import { getOnboardingStatus } from "../../controllers/onboarding.controller";
import { protect } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { tenantIsolation } from "../../middleware/tenant.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";

const router = Router();

router.get("/status", protect, checkFirstLogin, requireRole("admin"), tenantIsolation, getOnboardingStatus);

export default router;
