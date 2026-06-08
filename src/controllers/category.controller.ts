import { Request, Response, NextFunction } from "express";
import Category from "../models/Category.model";
import MenuItem from "../models/MenuItem.model";
import { AppError } from "../middleware/errorHandler";

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const categories = await Category.find({ restaurantId }).sort({ displayOrder: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { name, displayOrder } = req.body;

    // Check duplicate
    const existing = await Category.findOne({ restaurantId, name });
    if (existing) {
      const err = new Error("Category with this name already exists") as AppError;
      err.statusCode = 409;
      throw err;
    }

    const category = await Category.create({
      restaurantId,
      name,
      displayOrder,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const updated = await Category.findOneAndUpdate(
      { _id: id, restaurantId },
      req.body,
      { new: true }
    );

    if (!updated) {
      const err = new Error("Category not found") as AppError;
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

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    // Check if category has menu items
    const itemCount = await MenuItem.countDocuments({ categoryId: id, restaurantId });
    if (itemCount > 0) {
      const err = new Error("Cannot delete category with existing menu items. Remove or reassign items first.") as AppError;
      err.statusCode = 400;
      throw err;
    }

    const deleted = await Category.findOneAndDelete({ _id: id, restaurantId });
    if (!deleted) {
      const err = new Error("Category not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const toggleCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const category = await Category.findOne({ _id: id, restaurantId });
    if (!category) {
      const err = new Error("Category not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};
