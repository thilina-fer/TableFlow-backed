import { Router } from "express";
import { createPaymentIntent, stripeWebhook } from "../../controllers/payment.controller";

const router = Router();

router.post("/intent", createPaymentIntent);
router.post("/webhook", stripeWebhook);

export default router;
