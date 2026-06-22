import { Router } from "express";
import { getAdminSummary, getRevenue, getTopItems, getPeakHours } from "../../controllers/analytics.controller";
import { protect } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { tenantIsolation } from "../../middleware/tenant.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";

const router = Router();

router.use(protect);
router.use(checkFirstLogin);
router.use(requireRole("admin"));
router.use(tenantIsolation);

router.get("/summary", getAdminSummary);
router.get("/revenue", getRevenue);
router.get("/top-items", getTopItems);
router.get("/peak-hours", getPeakHours);

export default router;
