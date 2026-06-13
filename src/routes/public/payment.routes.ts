import { Router } from "express";
import { createPaymentIntent, stripeWebhook, mockPaymentSuccess } from "../../controllers/payment.controller";

const router = Router();

router.post("/intent", createPaymentIntent);
router.post("/webhook", stripeWebhook);
router.post("/mock-success", mockPaymentSuccess);

export default router;
