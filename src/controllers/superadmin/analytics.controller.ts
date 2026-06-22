import { Request, Response, NextFunction } from "express";
import { Order } from "../../models/Order.model";
import { Restaurant } from "../../models/Restaurant.model";

export const getSuperAdminSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalRestaurants, totalOrders, revenueAgg, newRegistrationsThisMonth] = await Promise.all([
      Restaurant.countDocuments({ status: "approved" }),
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
      ]),
      Restaurant.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

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
    const data = await Restaurant.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
      { $project: { month: "$_id", count: 1, _id: 0 } }
    ]);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getOrdersPerRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: "$restaurantId", orders: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
      { $lookup: { from: "restaurants", localField: "_id", foreignField: "_id", as: "restaurant" } },
      { $unwind: "$restaurant" },
      { $project: { restaurantName: "$restaurant.name", orders: 1, revenue: 1, _id: 0 } },
      { $sort: { orders: -1 } },
      { $limit: 20 }
    ]);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
