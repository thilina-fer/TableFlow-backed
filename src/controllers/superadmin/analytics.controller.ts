import { Request, Response, NextFunction } from "express";
import { Order } from "../../models/Order.model";
import { Restaurant } from "../../models/Restaurant.model";

export const getSuperAdminSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    // Total Revenue (all paid orders)
    const orders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // New Registrations this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newRegistrationsThisMonth = await Restaurant.countDocuments({
      createdAt: { $gte: thisMonth }
    });

    res.status(200).json({
      success: true,
      data: {
        totalRestaurants,
        totalOrders,
        totalRevenue,
        newRegistrationsThisMonth
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRegistrationGrowth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurants = await Restaurant.find();

    const monthCounts = new Map<string, number>();
    
    // Initialize last 6 months (optional)
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthCounts.set(monthStr, 0);
    }

    restaurants.forEach(rest => {
      const monthStr = rest.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthCounts.has(monthStr)) {
        monthCounts.set(monthStr, monthCounts.get(monthStr)! + 1);
      } else {
        // If it's an older month, we can either ignore or add it
        // We'll just add it for now and maybe sort later
        monthCounts.set(monthStr, (monthCounts.get(monthStr) || 0) + 1);
      }
    });

    // Create an array and sort by actual Date objects
    const data = Array.from(monthCounts.entries()).map(([month, count]) => {
      return { month, count, _date: new Date(month) };
    })
    .sort((a, b) => a._date.getTime() - b._date.getTime())
    .map(({ month, count }) => ({ month, count }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getOrdersPerRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // We need to aggregate orders by restaurant
    const orders = await Order.find({ paymentStatus: 'paid' }).populate('restaurantId');
    
    const restMap = new Map<string, { orders: number; revenue: number }>();

    orders.forEach(order => {
      const restName = (order.restaurantId as any)?.name || 'Unknown Restaurant';
      if (!restMap.has(restName)) {
        restMap.set(restName, { orders: 0, revenue: 0 });
      }
      const data = restMap.get(restName)!;
      data.orders += 1;
      data.revenue += order.totalAmount;
    });

    const data = Array.from(restMap.entries()).map(([restaurantName, stats]) => ({
      restaurantName,
      orders: stats.orders,
      revenue: stats.revenue
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
