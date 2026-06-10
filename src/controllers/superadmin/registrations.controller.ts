import { Request, Response, NextFunction } from "express";
import Restaurant from "../../models/Restaurant.model";
import User from "../../models/User.model";
import { AppError } from "../../middleware/errorHandler";
import { generateTempPassword, hashPassword } from "../../utils/password";
import { createAuditLog } from "../../utils/auditLogger";
import {
  sendApprovalEmail,
  sendRejectionEmail,
  sendSuspensionEmail,
  sendReactivationEmail,
} from "../../utils/email";

export const getRegistrations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, city, restaurantType, page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status) filter.status = status;
    if (city) filter.city = city;
    if (restaurantType) filter.restaurantType = restaurantType;

    const total = await Restaurant.countDocuments(filter);
    const data = await Restaurant.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRegistrationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      const err = new Error("Registration not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

export const approveRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const superAdminId = req.superAdmin!.superAdminId;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      const err = new Error("Registration not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (restaurant.status === "approved") {
      const err = new Error("Already approved") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // 1. Generate & Hash Temp Password
    const tempPassword = generateTempPassword();
    console.log(`\n==============================================`);
    console.log(`TESTING ALERT: Temp Password for ${restaurant.ownerEmail}: ${tempPassword}`);
    console.log(`==============================================\n`);
    const passwordHash = await hashPassword(tempPassword);

    // 2. Create Admin User
    await User.create({
      restaurantId: restaurant._id,
      name: restaurant.ownerName,
      email: restaurant.ownerEmail,
      passwordHash,
      role: "admin",
      isActive: true,
      isFirstLogin: true,
    });

    // 3. Update Restaurant Status
    restaurant.status = "approved";
    restaurant.isActive = true;
    restaurant.approvedAt = new Date();
    restaurant.approvedBy = superAdminId as any; // Cast as any or Schema.Types.ObjectId
    await restaurant.save();

    // 4. Send Approval Email (fire-and-forget)
    sendApprovalEmail(
      restaurant.ownerEmail,
      restaurant.ownerName,
      restaurant.name,
      tempPassword
    ).catch(console.error);

    // 5. Create Audit Log (fire-and-forget)
    createAuditLog(
      "APPROVED",
      restaurant._id.toString(),
      restaurant.name,
      superAdminId
    ).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Restaurant approved successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const superAdminId = req.superAdmin!.superAdminId;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      const err = new Error("Registration not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (restaurant.status !== "pending") {
      const err = new Error("Can only reject pending registrations") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // Update restaurant status & reason
    restaurant.status = "rejected";
    restaurant.rejectionReason = reason;
    await restaurant.save();

    // Send Rejection Email (fire-and-forget)
    sendRejectionEmail(
      restaurant.ownerEmail,
      restaurant.ownerName,
      restaurant.name,
      reason
    ).catch(console.error);

    // Create Audit Log (fire-and-forget)
    createAuditLog(
      "REJECTED",
      restaurant._id.toString(),
      restaurant.name,
      superAdminId,
      reason
    ).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Registration rejected",
    });
  } catch (error) {
    next(error);
  }
};

export const suspendRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const superAdminId = req.superAdmin!.superAdminId;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      const err = new Error("Registration not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (restaurant.status !== "approved") {
      const err = new Error("Can only suspend approved restaurants") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // Update restaurant active flag and reason
    restaurant.status = "suspended";
    restaurant.isActive = false;
    restaurant.suspensionReason = reason;
    await restaurant.save();

    // Suspend all users of this restaurant
    await User.updateMany({ restaurantId: restaurant._id }, { isActive: false });

    // Send Suspension Email (fire-and-forget)
    sendSuspensionEmail(
      restaurant.ownerEmail,
      restaurant.ownerName,
      restaurant.name,
      reason
    ).catch(console.error);

    // Create Audit Log (fire-and-forget)
    createAuditLog(
      "SUSPENDED",
      restaurant._id.toString(),
      restaurant.name,
      superAdminId,
      reason
    ).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Restaurant suspended",
    });
  } catch (error) {
    next(error);
  }
};

export const reactivateRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const superAdminId = req.superAdmin!.superAdminId;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      const err = new Error("Registration not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (restaurant.status !== "suspended") {
      const err = new Error("Restaurant is not suspended") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // Reactivate restaurant
    restaurant.status = "approved";
    restaurant.isActive = true;
    restaurant.suspensionReason = undefined;
    await restaurant.save();

    // Reactivate all users of this restaurant
    await User.updateMany({ restaurantId: restaurant._id }, { isActive: true });

    // Send Reactivation Email (fire-and-forget)
    sendReactivationEmail(
      restaurant.ownerEmail,
      restaurant.ownerName,
      restaurant.name
    ).catch(console.error);

    // Create Audit Log (fire-and-forget)
    createAuditLog(
      "REACTIVATED",
      restaurant._id.toString(),
      restaurant.name,
      superAdminId
    ).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Restaurant reactivated",
    });
  } catch (error) {
    next(error);
  }
};
