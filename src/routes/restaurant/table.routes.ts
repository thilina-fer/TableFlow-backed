import { Router } from "express";
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  getTableQR,
  getTableMenuEntry,
} from "../../controllers/table.controller";
import { protect } from "../../middleware/auth.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { tenantIsolation } from "../../middleware/tenant.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { createTableSchema, updateTableSchema } from "../../schemas/table.schema";

const router = Router();

// 1. Public Routes (No authentication required)
router.get("/:tableId/qr", getTableQR);
router.get("/:tableId/menu", getTableMenuEntry);

// 2. Admin Routes (Authentication & Admin Role required)
router.get("/", protect, checkFirstLogin, requireRole("admin"), tenantIsolation, getTables);
router.post("/", protect, checkFirstLogin, requireRole("admin"), tenantIsolation, validateBody(createTableSchema), createTable);
router.put("/:id", protect, checkFirstLogin, requireRole("admin"), tenantIsolation, validateBody(updateTableSchema), updateTable);
router.delete("/:id", protect, checkFirstLogin, requireRole("admin"), tenantIsolation, deleteTable);

export default router;
