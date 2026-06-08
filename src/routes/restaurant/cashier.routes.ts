import { Router } from "express";
import {
  getCashierOrders,
  markCashPayment,
  downloadBill,
} from "../../controllers/order.controller";
import { protect } from "../../middleware/auth.middleware";
import { checkFirstLogin } from "../../middleware/firstLogin.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { tenantIsolation } from "../../middleware/tenant.middleware";

const router = Router();

const cashierAuthChain = [
  protect,
  checkFirstLogin,
  requireRole("cashier", "admin"),
  tenantIsolation,
];

router.get("/", cashierAuthChain, getCashierOrders);
router.put("/:id/pay", cashierAuthChain, markCashPayment);
router.get("/:id/bill", cashierAuthChain, downloadBill);

export default router;
