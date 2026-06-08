import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategory,
} from "../../controllers/category.controller";
import { protect } from "../../middleware/auth.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { tenantIsolation } from "../../middleware/tenant.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { createCategorySchema, updateCategorySchema } from "../../schemas/category.schema";

const router = Router();

// Apply standard admin middlewares
router.use(protect, checkFirstLogin, requireRole("admin"), tenantIsolation);

router.get("/", getCategories);
router.post("/", validateBody(createCategorySchema), createCategory);
router.put("/:id", validateBody(updateCategorySchema), updateCategory);
router.delete("/:id", deleteCategory);
router.patch("/:id/toggle", toggleCategory);

export default router;
