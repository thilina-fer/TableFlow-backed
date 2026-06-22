import { Request, Response, NextFunction } from "express";
import { Order } from "../models/Order.model";
import { Table } from "../models/Table.model";
import { AppError } from "../middleware/errorHandler";

export const getAdminSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalOrdersToday, revenueAgg, activeTables, pendingOrders] = await Promise.all([
      Order.countDocuments({ restaurantId, createdAt: { $gte: startOfToday } }),
      Order.aggregate([
        { $match: { restaurantId, paymentStatus: "paid", createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
      ]),
      Table.countDocuments({ restaurantId, status: { $in: ["occupied", "awaiting_payment"] } }),
      Order.countDocuments({ restaurantId, status: { $in: ["placed", "preparing"] } })
    ]);

    const revenueToday = revenueAgg[0]?.totalRevenue || 0;

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

export const getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { period = "daily" } = req.query;

    let dateRange = new Date();
    let groupStage: any;

    if (period === "daily") {
      dateRange.setDate(dateRange.getDate() - 30);
      groupStage = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else if (period === "weekly") {
      dateRange.setDate(dateRange.getDate() - 84); // last 12 weeks
      groupStage = { 
        year: { $year: "$createdAt" }, 
        week: { $isoWeek: "$createdAt" } 
      };
    } else if (period === "monthly") {
      dateRange.setMonth(dateRange.getMonth() - 12);
      groupStage = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else {
      const err = new Error("Invalid period") as AppError;
      err.statusCode = 400;
      throw err;
    }

    const data = await Order.aggregate([
      { 
        $match: { 
          restaurantId, 
          paymentStatus: "paid", 
          createdAt: { $gte: dateRange } 
        } 
      },
      { 
        $group: { 
          _id: groupStage, 
          revenue: { $sum: "$totalAmount" } 
        } 
      },
      { $sort: { _id: 1 } },
      { 
        $project: { 
          label: period === "weekly" ? { $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }] } : "$_id", 
          revenue: 1, 
          _id: 0 
        } 
      }
    ]);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTopItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const data = await Order.aggregate([
      { $match: { restaurantId, status: { $ne: "rejected" } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", count: { $sum: "$items.quantity" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getPeakHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const data = await Order.aggregate([
      { $match: { restaurantId, status: { $ne: "rejected" } } },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { hour: "$_id", count: 1, _id: 0 } }
    ]);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
