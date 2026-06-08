import { Router } from "express";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
} from "../../controllers/staff.controller";
import { protect } from "../../middleware/auth.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { tenantIsolation } from "../../middleware/tenant.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { createStaffSchema, updateStaffSchema } from "../../schemas/staff.schema";

const router = Router();

// Apply standard admin middlewares
router.use(protect, checkFirstLogin, requireRole("admin"), tenantIsolation);

router.get("/", getStaff);
router.post("/", validateBody(createStaffSchema), createStaff);
router.put("/:id", validateBody(updateStaffSchema), updateStaff);
router.delete("/:id", deleteStaff);
router.post("/:id/reset-password", resetStaffPassword);

export default router;
