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

export const getRevenueData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { period } = req.query;

    const endDate = new Date();
    let startDate = new Date();

    if (period === "weekly") {
      startDate.setDate(endDate.getDate() - 7);
    } else if (period === "monthly") {
      startDate.setMonth(endDate.getMonth() - 1);
    } else { // default daily (last 7 days by default for 'daily' view in chart?)
      startDate.setDate(endDate.getDate() - 7); 
    }

    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'paid'
    });

    // Group revenue by date
    const revenueMap = new Map<string, number>();
    
    // Initialize map with dates
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      revenueMap.set(dateStr, 0);
    }

    orders.forEach(order => {
      const dateStr = order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (revenueMap.has(dateStr)) {
        revenueMap.set(dateStr, revenueMap.get(dateStr)! + order.totalAmount);
      }
    });

    const data = Array.from(revenueMap.entries()).map(([label, revenue]) => ({ label, revenue }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTopItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    
    const orders = await Order.find({ restaurantId, paymentStatus: 'paid' }).populate('items.menuItemId');

    const itemCounts = new Map<string, number>();

    orders.forEach(order => {
      order.items.forEach(item => {
        // If populated, item.menuItemId is an object with .name, else it's an ObjectId
        const name = (item.menuItemId as any)?.name || 'Unknown Item';
        itemCounts.set(name, (itemCounts.get(name) || 0) + item.quantity);
      });
    });

    const data = Array.from(itemCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getPeakHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    
    const orders = await Order.find({ restaurantId });

    const hourCounts = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourCounts.set(i, 0);
    }

    orders.forEach(order => {
      const hour = order.createdAt.getHours();
      hourCounts.set(hour, hourCounts.get(hour)! + 1);
    });

    const data = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
