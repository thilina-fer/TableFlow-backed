import { Request, Response, NextFunction } from "express";
import { Category } from "../models/Category.model";
import { MenuItem } from "../models/MenuItem.model";
import { Table } from "../models/Table.model";
import { User } from "../models/User.model";

export const getOnboardingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const [categoryCount, menuItemCount, tableCount, staffCount] = await Promise.all([
      Category.countDocuments({ restaurantId }),
      MenuItem.countDocuments({ restaurantId }),
      Table.countDocuments({ restaurantId }),
      User.countDocuments({ restaurantId, role: { $ne: "admin" }, isActive: true })
    ]);

    const hasCategory = categoryCount > 0;
    const hasMenuItem = menuItemCount > 0;
    const hasTable = tableCount > 0;
    const hasStaff = staffCount > 0;
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
