import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

export const tenantIsolation = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    const err = new Error("Not authenticated") as AppError;
    err.statusCode = 401;
    throw err;
  }

  if (!req.user.restaurantId || typeof req.user.restaurantId !== "string" || req.user.restaurantId.trim() === "") {
    const err = new Error("No restaurant context") as AppError;
    err.statusCode = 403;
    throw err;
  }

  next();
};
