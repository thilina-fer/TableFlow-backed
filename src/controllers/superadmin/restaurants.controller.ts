import { Request, Response, NextFunction } from "express";
import { Restaurant } from "../../models/Restaurant.model";
import { User } from "../../models/User.model";
import { Table } from "../../models/Table.model";
import { Category } from "../../models/Category.model";
import { MenuItem } from "../../models/MenuItem.model";
import { Order } from "../../models/Order.model";
import { Payment } from "../../models/Payment.model";
import { AppError } from "../../middleware/errorHandler";
import { generateTempPassword, hashPassword } from "../../utils/password";
import { createAuditLog } from "../../utils/auditLogger";
import { sendApprovalEmail } from "../../utils/email";

export const getRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, city, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (city) filter.city = city;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Restaurant.countDocuments(filter);
    const data = await Restaurant.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages }
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      const err = new Error("Restaurant not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    const [totalOrders, revenueAgg, staffCount] = await Promise.all([
      Order.countDocuments({ restaurantId: id }),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id, paymentStatus: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
      ]),
      User.countDocuments({ restaurantId: id, isActive: true })
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      data: {
        ...restaurant.toObject(),
        stats: { totalOrders, totalRevenue, staffCount }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const superAdminId = req.superAdmin!.superAdminId;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      const err = new Error("Restaurant not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    await Promise.all([
      Payment.deleteMany({ restaurantId: id }),
      Order.deleteMany({ restaurantId: id }),
      MenuItem.deleteMany({ restaurantId: id }),
      Table.deleteMany({ restaurantId: id }),
      Category.deleteMany({ restaurantId: id }),
      User.deleteMany({ restaurantId: id })
    ]);

    await Restaurant.findByIdAndDelete(id);

    await createAuditLog("DELETED", id as string, restaurant.name, superAdminId as string);

    res.status(200).json({
      success: true,
      message: "Restaurant and all associated data deleted"
    });
  } catch (error) {
    next(error);
  }
};

export const resetRestaurantPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const superAdminId = req.superAdmin!.superAdminId;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      const err = new Error("Restaurant not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (restaurant.status !== "approved") {
      const err = new Error("Restaurant is not approved") as AppError;
      err.statusCode = 400;
      throw err;
    }

    const admin = await User.findOne({ restaurantId: id, role: "admin" });
    if (!admin) {
      const err = new Error("Admin user not found for this restaurant") as AppError;
      err.statusCode = 404;
      throw err;
    }

    const tempPassword = generateTempPassword();
    admin.passwordHash = await hashPassword(tempPassword);
    admin.isFirstLogin = true;
    await admin.save();

    sendApprovalEmail(
      restaurant.ownerEmail,
      restaurant.ownerName,
      restaurant.name,
      tempPassword
    ).catch(console.error);

    await createAuditLog("PASSWORD_RESET", id as string, restaurant.name, superAdminId as string);

    res.status(200).json({
      success: true,
      message: "Password reset successfully. New credentials emailed to owner."
    });
  } catch (error) {
    next(error);
  }
};
