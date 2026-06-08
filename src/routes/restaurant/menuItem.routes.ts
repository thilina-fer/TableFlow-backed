import { Router } from "express";
import {
  getAdminMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getPublicMenu,
  getMenuByCategory,
} from "../../controllers/menuItem.controller";
import { protect } from "../../middleware/auth.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { tenantIsolation } from "../../middleware/tenant.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  availabilitySchema,
} from "../../schemas/menuItem.schema";

const adminRouter = Router();
const publicRouter = Router();

// 1. Admin Routes Configuration
adminRouter.use(protect, checkFirstLogin, requireRole("admin"), tenantIsolation);

adminRouter.get("/", getAdminMenu);
adminRouter.post("/", validateBody(createMenuItemSchema), createMenuItem);
adminRouter.put("/:id", validateBody(updateMenuItemSchema), updateMenuItem);
adminRouter.delete("/:id", deleteMenuItem);
adminRouter.patch("/:id/availability", validateBody(availabilitySchema), toggleAvailability);

// 2. Public Routes Configuration (Unprotected)
publicRouter.get("/menu", getPublicMenu);
publicRouter.get("/menu/category/:categoryId", getMenuByCategory);

export { adminRouter as adminMenuRouter, publicRouter as publicMenuRouter };
