import { Router } from "express";
import { getSuperAdminSummary, getRegistrationGrowth, getOrdersPerRestaurant } from "../../controllers/superadmin/analytics.controller";
import { superAdminProtect } from "../../middleware/superAdminAuth";

const router = Router();

router.use(superAdminProtect);

router.get("/summary", getSuperAdminSummary);
router.get("/registrations", getRegistrationGrowth);
router.get("/orders", getOrdersPerRestaurant);

export default router;
