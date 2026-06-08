import { Request, Response, NextFunction } from "express";
import Table from "../models/Table.model";
import { AppError } from "../middleware/errorHandler";
import { generateQRCodeBase64 } from "../utils/qrcode";

export const getTables = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const tables = await Table.find({ restaurantId }).sort({ tableNumber: 1 });

    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { tableNumber, capacity } = req.body;

    // Check duplicate
    const existing = await Table.findOne({ restaurantId, tableNumber });
    if (existing) {
      const err = new Error("Table number already exists") as AppError;
      err.statusCode = 409;
      throw err;
    }

    // Create table (initially without QR)
    const table = new Table({
      restaurantId,
      tableNumber,
      capacity,
      qrCodeUrl: "",
    });

    await table.save();

    // Generate base64 QR code and save again
    const qrBase64 = await generateQRCodeBase64(table._id.toString(), restaurantId);
    table.qrCodeUrl = qrBase64;
    await table.save();

    res.status(201).json({
      success: true,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const { tableNumber } = req.body;

    // If changing table number, verify compound unique constraint
    if (tableNumber) {
      const existing = await Table.findOne({
        restaurantId,
        tableNumber,
        _id: { $ne: id },
      });
      if (existing) {
        const err = new Error("Table number already exists") as AppError;
        err.statusCode = 409;
        throw err;
      }
    }

    const updated = await Table.findOneAndUpdate(
      { _id: id, restaurantId },
      req.body,
      { new: true }
    );

    if (!updated) {
      const err = new Error("Table not found") as AppError;
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

export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const table = await Table.findOne({ _id: id, restaurantId });
    if (!table) {
      const err = new Error("Table not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (table.status !== "available") {
      const err = new Error("Cannot delete table with an active order") as AppError;
      err.statusCode = 400;
      throw err;
    }

    await Table.deleteOne({ _id: id, restaurantId });

    res.status(200).json({
      success: true,
      message: "Table deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const getTableQR = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tableId } = req.params;

    const table = await Table.findById(tableId);
    if (!table) {
      const err = new Error("Table not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    if (table.qrCodeUrl && table.qrCodeUrl.startsWith("data:image/png;base64,")) {
      const base64Data = table.qrCodeUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", "image/png");
      res.send(buffer);
    } else {
      const err = new Error("QR code not available") as AppError;
      err.statusCode = 500;
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const getTableMenuEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tableId } = req.params;

    const table = await Table.findById(tableId);
    if (!table) {
      const err = new Error("Table not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data: {
        tableId: table._id,
        restaurantId: table.restaurantId,
        tableNumber: table.tableNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
