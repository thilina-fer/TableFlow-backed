import { Router } from "express";
import {
  getWaiterOrders,
  claimOrder,
  deliverOrder,
} from "../../controllers/order.controller";
import { protect } from "../../middleware/auth.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { tenantIsolation } from "../../middleware/tenant.middleware";

const router = Router();

const waiterAuthChain = [
  protect,
  checkFirstLogin,
  requireRole("waiter", "admin"),
  tenantIsolation,
];

router.get("/", waiterAuthChain, getWaiterOrders);
router.put("/:id/claim", waiterAuthChain, claimOrder);
router.put("/:id/deliver", waiterAuthChain, deliverOrder);

export default router;
