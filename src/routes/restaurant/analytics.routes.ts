import { Router } from "express";
import { getAdminSummary, getOnboardingStatus, getRevenueData, getTopItems, getPeakHours } from "../../controllers/restaurant/analytics.controller";
import { protect } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.use(protect, requireRole("admin"));

router.get("/summary", getAdminSummary);
router.get("/onboarding/status", getOnboardingStatus);
router.get("/revenue", getRevenueData);
router.get("/top-items", getTopItems);
router.get("/peak-hours", getPeakHours);

export default router;
