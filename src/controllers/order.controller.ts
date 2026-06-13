import { Request, Response, NextFunction } from "express";
import { Order } from "../models/Order.model";
import { Table } from "../models/Table.model";
import { MenuItem } from "../models/MenuItem.model";
import { Restaurant } from "../models/Restaurant.model";
import { Payment } from "../models/Payment.model";
import { getIO } from "../sockets/socket";
import { generateReceiptPDF } from "../utils/pdfBill";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { placeOrderSchema, rejectOrderSchema } from "../schemas/order.schema";

const TAX_RATE = parseFloat(env.TAX_RATE || "0.1");

// Helper to broadcast order updates to all relevant Socket rooms
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

// ==========================================
// CUSTOMER CONTROLLERS
// ==========================================

export const placeOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = placeOrderSchema.parse(req.body);
    const { tableId, restaurantId, items, paymentMethod, specialNote } = validated;

    // 1. Verify table exists and is available
    const table = await Table.findOne({ _id: tableId, restaurantId });
    if (!table) {
      const err = new Error("Table not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (table.status !== "available") {
      const err = new Error("Table is currently occupied") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch and calculate prices server-side
    const dbItems = [];
    let subtotal = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findOne({ _id: item.menuItemId, restaurantId });
      if (!menuItem) {
        const err = new Error(`Menu item not found: ${item.menuItemId}`) as AppError;
        err.statusCode = 400;
        throw err;
      }
      if (!menuItem.isAvailable) {
        const err = new Error(`Menu item is currently unavailable: ${menuItem.name}`) as AppError;
        err.statusCode = 400;
        throw err;
      }

      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;

      dbItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        subtotal: itemSubtotal,
      });
    }

    const taxAmount = subtotal * TAX_RATE;
    const totalAmount = subtotal + taxAmount;

    // 3. Create the order
    const order = new Order({
      restaurantId,
      tableId,
      items: dbItems,
      subtotal,
      taxAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: "pending",
      status: "placed",
      specialNote,
    });

    await order.save();
    await order.populate("tableId");

    // 4. Update table status
    table.status = "occupied";
    table.currentOrderId = order._id as any;
    await table.save();

    // 5. Broadcast new order event
    broadcastOrderUpdate(restaurantId, order);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("tableId").populate("assignedWaiterId");
    if (!order) {
      const err = new Error("Order not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadPublicBill = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      const err = new Error("Order not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (!order.billPdfUrl) {
      const restaurant = await Restaurant.findById(order.restaurantId);
      const table = await Table.findById(order.tableId);
      if (restaurant && table) {
        const pdfBuffer = await generateReceiptPDF(order, restaurant.name, table.tableNumber);
        order.billPdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
        await order.save();
      } else {
        const err = new Error("Bill has not been generated for this order yet") as AppError;
        err.statusCode = 400;
        throw err;
      }
    }

    const base64Data = order.billPdfUrl.split(",")[1];
    const pdfBuffer = Buffer.from(base64Data, "base64");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${order._id.toString().slice(-6)}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// KITCHEN CONTROLLERS
// ==========================================

export const getKitchenOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const orders = await Order.find({
      restaurantId,
      status: { $in: ["placed", "preparing"] },
    }).sort({ createdAt: 1 }).populate("tableId");

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getKitchenHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const orders = await Order.find({
      restaurantId,
      status: { $in: ["completed", "delivered", "rejected"] },
    }).sort({ updatedAt: -1 }).limit(50).populate("tableId"); // limit to 50 for performance

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const approveOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, restaurantId }).populate("tableId");
    if (!order) {
      const err = new Error("Order not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== "placed") {
      const err = new Error("Only placed orders can be approved") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // Retrieve Restaurant and Table names for PDF bill
    const restaurant = await Restaurant.findById(restaurantId);
    const table = await Table.findById(order.tableId);
    if (!restaurant || !table) {
      const err = new Error("Restaurant or Table details missing") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // Approve status
    order.status = "preparing";

    // Generate PDF bill as base64 string
    const pdfBuffer = await generateReceiptPDF(order, restaurant.name, table.tableNumber);
    order.billPdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

    await order.save();

    // Broadcast update
    broadcastOrderUpdate(restaurantId.toString(), order);

    res.status(200).json({
      success: true,
      message: "Order approved, status is preparing",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const validated = rejectOrderSchema.parse(req.body);
    const { rejectionReason } = validated;

    const order = await Order.findOne({ _id: id, restaurantId }).populate("tableId");
    if (!order) {
      const err = new Error("Order not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (["completed", "delivered", "rejected"].includes(order.status)) {
      const err = new Error("Order cannot be rejected at this stage") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // Set order status
    order.status = "rejected";
    order.rejectionReason = rejectionReason;
    await order.save();

    // Free the table
    const table = await Table.findById(order.tableId);
    if (table && table.currentOrderId?.toString() === order._id.toString()) {
      table.status = "available";
      table.currentOrderId = undefined;
      await table.save();
    }

    // Broadcast update
    broadcastOrderUpdate(restaurantId.toString(), order);

    res.status(200).json({
      success: true,
      message: "Order rejected",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const completeOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, restaurantId }).populate("tableId");
    if (!order) {
      const err = new Error("Order not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== "preparing") {
      const err = new Error("Only preparing orders can be marked as completed") as AppError;
      err.statusCode = 400;
      throw err;
    }

    order.status = "completed";
    await order.save();

    // Broadcast update
    broadcastOrderUpdate(restaurantId.toString(), order);

    res.status(200).json({
      success: true,
      message: "Order marked as completed",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// WAITER CONTROLLERS
// ==========================================

export const getWaiterOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const orders = await Order.find({
      restaurantId,
      status: { $in: ["completed", "delivered"] },
    }).sort({ updatedAt: -1 }).populate("tableId");

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getWaiterHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const waiterId = req.user!.userId;
    const orders = await Order.find({
      restaurantId,
      assignedWaiterId: waiterId as any,
      status: "delivered",
    }).sort({ updatedAt: -1 }).limit(50).populate("tableId");

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const claimOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const waiterId = req.user!.userId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, restaurantId }).populate("tableId");
    if (!order) {
      const err = new Error("Order not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== "completed") {
      const err = new Error("Only completed orders can be claimed") as AppError;
      err.statusCode = 400;
      throw err;
    }

    order.assignedWaiterId = waiterId as any;
    await order.save();

    // Broadcast update
    broadcastOrderUpdate(restaurantId.toString(), order);

    res.status(200).json({
      success: true,
      message: "Order claimed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const deliverOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, restaurantId }).populate("tableId");
    if (!order) {
      const err = new Error("Order not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== "completed") {
      const err = new Error("Only completed orders can be delivered") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // Set order status
    order.status = "delivered";
    await order.save();

    // Update table status
    const table = await Table.findById(order.tableId);
    if (table) {
      table.status = "awaiting_payment";
      await table.save();
    }

    // Broadcast update
    broadcastOrderUpdate(restaurantId.toString(), order);

    res.status(200).json({
      success: true,
      message: "Order delivered, table awaiting payment",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CASHIER CONTROLLERS
// ==========================================

export const getCashierOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const orders = await Order.find({
      restaurantId,
      status: "delivered",
      paymentStatus: "pending",
    }).sort({ updatedAt: -1 }).populate("tableId");

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const markCashPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, restaurantId }).populate("tableId");
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

    // Update order payment status and method
    order.paymentStatus = "paid";
    order.paymentMethod = "cash";
    await order.save();

    // Create payment entry
    const payment = new Payment({
      restaurantId,
      orderId: order._id,
      amount: order.totalAmount,
      paymentMethod: "cash",
      status: "succeeded",
    });
    await payment.save();

    // Free the table
    const table = await Table.findById(order.tableId);
    if (table && table.currentOrderId?.toString() === order._id.toString()) {
      table.status = "available";
      table.currentOrderId = undefined;
      await table.save();
    }

    // Broadcast update
    broadcastOrderUpdate(restaurantId.toString(), order);

    res.status(200).json({
      success: true,
      message: "Cash payment recorded, table freed",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadBill = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) {
      const err = new Error("Order not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (!order.billPdfUrl) {
      const restaurant = await Restaurant.findById(order.restaurantId);
      const table = await Table.findById(order.tableId);
      if (restaurant && table) {
        const pdfBuffer = await generateReceiptPDF(order, restaurant.name, table.tableNumber);
        order.billPdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
        await order.save();
      } else {
        const err = new Error("Bill has not been generated for this order yet") as AppError;
        err.statusCode = 400;
        throw err;
      }
    }

    const base64Data = order.billPdfUrl.split(",")[1];
    const pdfBuffer = Buffer.from(base64Data, "base64");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${order._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
