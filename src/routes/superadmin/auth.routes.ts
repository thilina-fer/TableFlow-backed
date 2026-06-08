import { Router } from "express";
import { loginSuperAdmin } from "../../controllers/superadmin/auth.controller";
import { validateBody } from "../../middleware/validate.middleware";
import { superAdminLoginSchema } from "../../schemas/superadmin.schema";

const router = Router();

router.post("/login", validateBody(superAdminLoginSchema), loginSuperAdmin);

export default router;
