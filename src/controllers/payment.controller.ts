import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { env } from "../config/env";
import { Order } from "../models/Order.model";
import { Table } from "../models/Table.model";
import { Payment } from "../models/Payment.model";
import { getIO } from "../sockets/socket";
import { AppError } from "../middleware/errorHandler";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const broadcastOrderUpdate = (restaurantId: string, order: any) => {
  try {
    const io = getIO();
    const orderIdStr = order._id.toString();
    const restaurantIdStr = restaurantId.toString();

    // Notify customer order tracking room
    io.to(`order:${orderIdStr}`).emit("order_status_updated", {
      orderId: orderIdStr,
      status: order.status,
      paymentStatus: order.paymentStatus,
      order,
    });

    // Notify all staff rooms
    const roles = ["kitchen", "waiter", "cashier"];
    roles.forEach((role) => {
      io.to(`restaurant:${restaurantIdStr}:${role}`).emit("order_updated", order);
    });
  } catch (error) {
    console.error("Failed to broadcast socket event:", error);
  }
};

export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      const err = new Error("orderId is required") as AppError;
      err.statusCode = 400;
      throw err;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("Order not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (order.paymentStatus === "paid") {
      const err = new Error("Order is already paid") as AppError;
      err.statusCode = 400;
      throw err;
    }

    if (order.paymentMethod !== "card") {
      const err = new Error("Only card payments are supported for Stripe") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // Amount in cents
    const amountInCents = Math.round(order.totalAmount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        restaurantId: order.restaurantId.toString(),
      },
    });

    // Save intent ID
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        stripePaymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const stripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    res.status(400).send("Webhook Error: Missing stripe-signature header");
    return;
  }

  let event: any;

  try {
    // req.body must be a raw buffer here
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("❌ Webhook Signature Verification Failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    const paymentIntent = event.data.object as any;
    const orderId = paymentIntent.metadata?.orderId;
    const restaurantId = paymentIntent.metadata?.restaurantId;

    if (event.type === "payment_intent.succeeded") {
      console.log(`💰 PaymentIntent Succeeded: ${paymentIntent.id}`);

      if (orderId && restaurantId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = "paid";
          await order.save();

          // Free the table associated with the order
          const table = await Table.findById(order.tableId);
          if (table && table.currentOrderId?.toString() === order._id.toString()) {
            table.status = "available";
            table.currentOrderId = undefined;
            await table.save();
          }

          // Create payment entry
          const payment = new Payment({
            restaurantId,
            orderId: order._id,
            amount: paymentIntent.amount / 100,
            paymentMethod: "card",
            status: "succeeded",
            stripePaymentIntentId: paymentIntent.id,
            stripeEventId: event.id,
            rawStripeData: event,
          });
          await payment.save();

          // Broadcast state changes
          broadcastOrderUpdate(restaurantId, order);
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      console.log(`❌ PaymentIntent Failed: ${paymentIntent.id}`);

      if (orderId && restaurantId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = "failed";
          await order.save();

          // Create payment entry as failed
          const payment = new Payment({
            restaurantId,
            orderId: order._id,
            amount: paymentIntent.amount / 100,
            paymentMethod: "card",
            status: "failed",
            stripePaymentIntentId: paymentIntent.id,
            stripeEventId: event.id,
            rawStripeData: event,
          });
          await payment.save();

          // Broadcast state changes
          broadcastOrderUpdate(restaurantId, order);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook event:", error);
    res.status(500).json({ error: "Internal Server Error during webhook processing" });
  }
};
