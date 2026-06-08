import { Router } from "express";
import {
  getRegistrations,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  suspendRegistration,
  reactivateRegistration,
} from "../../controllers/superadmin/registrations.controller";
import { superAdminProtect } from "../../middleware/superAdminAuth";
import { validateBody } from "../../middleware/validate.middleware";
import { rejectSchema, suspendSchema } from "../../schemas/restaurant.schema";

const router = Router();

// Apply Super Admin protection middleware to all routes
router.use(superAdminProtect);

router.get("/", getRegistrations);
router.get("/:id", getRegistrationById);
router.patch("/:id/approve", approveRegistration);
router.patch("/:id/reject", validateBody(rejectSchema), rejectRegistration);
router.patch("/:id/suspend", validateBody(suspendSchema), suspendRegistration);
router.patch("/:id/reactivate", reactivateRegistration);

export default router;
