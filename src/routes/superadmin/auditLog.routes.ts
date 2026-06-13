import { Router } from "express";
import { getAuditLogs } from "../../controllers/superadmin/auditLog.controller";
import { superAdminProtect } from "../../middleware/superAdminAuth";

const router = Router();

router.use(superAdminProtect);

router.get("/", getAuditLogs);

export default router;
