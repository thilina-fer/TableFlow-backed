import { Request, Response, NextFunction } from "express";
import { Order } from "../../models/Order.model";
import { Table } from "../../models/Table.model";
import { MenuItem } from "../../models/MenuItem.model";
import { Category } from "../../models/Category.model";
import { User } from "../../models/User.model";

export const getAdminSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = await Order.find({
      restaurantId,
      createdAt: { $gte: today }
    });

    const totalOrdersToday = ordersToday.length;
    const revenueToday = ordersToday.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0);
    
    const activeTables = await Table.countDocuments({
      restaurantId,
      status: { $in: ["occupied", "awaiting_payment"] }
    });

    const pendingOrders = await Order.countDocuments({
      restaurantId,
      status: { $in: ["placed", "preparing"] }
    });

    res.status(200).json({
      success: true,
      data: {
        totalOrdersToday,
        revenueToday,
        activeTables,
        pendingOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOnboardingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const hasCategory = (await Category.countDocuments({ restaurantId })) > 0;
    const hasMenuItem = (await MenuItem.countDocuments({ restaurantId })) > 0;
    const hasTable = (await Table.countDocuments({ restaurantId })) > 0;
    const hasStaff = (await User.countDocuments({ restaurantId, role: { $in: ["kitchen", "waiter", "cashier"] } })) > 0;

    const isComplete = hasCategory && hasMenuItem && hasTable && hasStaff;

    res.status(200).json({
      success: true,
      data: {
        hasCategory,
        hasMenuItem,
        hasTable,
        hasStaff,
        isComplete
      }
    });
  } catch (error) {
    next(error);
  }
};
