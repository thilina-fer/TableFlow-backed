import { Request, Response, NextFunction } from "express";
import { Restaurant } from "../../models/Restaurant.model";
import { User } from "../../models/User.model";
import { AuditLog } from "../../models/AuditLog.model";
import { AppError } from "../../middleware/errorHandler";
import { generateTempPassword, hashPassword } from "../../utils/password";
import { createAuditLog } from "../../utils/auditLogger";

export const getRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // By default, only get approved or suspended (actual restaurants)
    const filter: any = { status: { $in: ["approved", "suspended"] } };
    if (status) filter.status = status;

    const total = await Restaurant.countDocuments(filter);
    const data = await Restaurant.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages },
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
    res.status(200).json({ success: true, data: restaurant });
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

    await Restaurant.findByIdAndDelete(id);
    await User.deleteMany({ restaurantId: id });

    createAuditLog("DELETED", id as string, restaurant.name, superAdminId as string).catch(console.error);

    res.status(200).json({ success: true, message: "Restaurant deleted successfully" });
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

    const admin = await User.findOne({ restaurantId: id, role: "admin" });
    if (!admin) {
      const err = new Error("Admin user not found for this restaurant") as AppError;
      err.statusCode = 404;
      throw err;
    }

    const tempPassword = generateTempPassword();
    console.log(`\n==============================================`);
    console.log(`TESTING ALERT: NEW Temp Password for ${admin.email}: ${tempPassword}`);
    console.log(`==============================================\n`);

    admin.passwordHash = await hashPassword(tempPassword);
    await admin.save();

    createAuditLog("PASSWORD_RESET", id as string, restaurant.name, superAdminId as string).catch(console.error);

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
