import { Router } from "express";
import { placeOrder, getOrderById, downloadPublicBill } from "../../controllers/order.controller";
import { validateBody } from "../../middleware/validate.middleware";
import { placeOrderSchema } from "../../schemas/order.schema";

const router = Router();

router.post("/", validateBody(placeOrderSchema), placeOrder);
router.get("/:id", getOrderById);
router.get("/:id/bill", downloadPublicBill);

export default router;
