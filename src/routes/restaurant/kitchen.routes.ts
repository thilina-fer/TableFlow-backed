import { Router } from "express";
import {
  getKitchenOrders,
  getKitchenHistory,
  approveOrder,
  rejectOrder,
  completeOrder,
} from "../../controllers/order.controller";
import { protect } from "../../middleware/auth.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { tenantIsolation } from "../../middleware/tenant.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { rejectOrderSchema } from "../../schemas/order.schema";

const router = Router();

// Apply auth & tenant isolation middleware chain
const kitchenAuthChain = [
  protect,
  checkFirstLogin,
  requireRole("kitchen", "admin"),
  tenantIsolation,
];

router.get("/", kitchenAuthChain, getKitchenOrders);
router.get("/history", kitchenAuthChain, getKitchenHistory);
router.put("/:id/approve", kitchenAuthChain, approveOrder);
router.put("/:id/reject", kitchenAuthChain, validateBody(rejectOrderSchema), rejectOrder);
router.put("/:id/complete", kitchenAuthChain, completeOrder);

export default router;
