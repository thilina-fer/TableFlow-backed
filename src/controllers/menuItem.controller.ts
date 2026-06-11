import { Request, Response, NextFunction } from "express";
import MenuItem from "../models/MenuItem.model";
import Category from "../models/Category.model";
import { AppError } from "../middleware/errorHandler";

// Admin Controllers
export const getAdminMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const items = await MenuItem.find({ restaurantId }).populate(
      "categoryId",
      "name displayOrder"
    );

    // Sort by Category displayOrder, then by MenuItem name
    items.sort((a: any, b: any) => {
      const orderA = a.categoryId?.displayOrder ?? 0;
      const orderB = b.categoryId?.displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const {
      name,
      description,
      price,
      categoryId,
      imageUrl,
      isAvailable,
      preparationTimeMinutes,
      tags,
      variants,
    } = req.body;

    // Verify category belongs to this restaurant
    const category = await Category.findOne({ _id: categoryId, restaurantId });
    if (!category) {
      const err = new Error("Category not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    const item = await MenuItem.create({
      restaurantId,
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable,
      preparationTimeMinutes,
      tags,
      variants,
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const { categoryId } = req.body;

    // If changing category, verify new category belongs to this restaurant
    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, restaurantId });
      if (!category) {
        const err = new Error("Category not found") as AppError;
        err.statusCode = 404;
        throw err;
      }
    }

    const updated = await MenuItem.findOneAndUpdate(
      { _id: id, restaurantId },
      req.body,
      { new: true }
    );

    if (!updated) {
      const err = new Error("Menu item not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const deleted = await MenuItem.findOneAndDelete({ _id: id, restaurantId });
    if (!deleted) {
      const err = new Error("Menu item not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      message: "Menu item deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const { isAvailable } = req.body;

    const updated = await MenuItem.findOneAndUpdate(
      { _id: id, restaurantId },
      { isAvailable },
      { new: true }
    );

    if (!updated) {
      const err = new Error("Menu item not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Public Controllers (no auth)
export const getPublicMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId || typeof restaurantId !== "string" || restaurantId.trim() === "") {
      const err = new Error("restaurantId query parameter is required") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // 1. Find all active categories for this restaurant
    const activeCategories = await Category.find({ restaurantId, isActive: true }).select("_id");
    const activeCategoryIds = activeCategories.map((c) => c._id);

    // 2. Find available items belonging to active categories
    const items = await MenuItem.find({
      restaurantId,
      isAvailable: true,
      categoryId: { $in: activeCategoryIds },
    }).populate("categoryId", "name displayOrder isActive");

    // 3. Sort by Category displayOrder, then MenuItem name
    items.sort((a: any, b: any) => {
      const orderA = a.categoryId?.displayOrder ?? 0;
      const orderB = b.categoryId?.displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getMenuByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId } = req.params;

    const items = await MenuItem.find({
      categoryId,
      isAvailable: true,
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};
