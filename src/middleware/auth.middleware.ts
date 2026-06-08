import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "./errorHandler";

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("No token provided") as AppError;
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      role: decoded.role as "admin" | "kitchen" | "waiter" | "cashier",
      restaurantId: decoded.restaurantId,
      isFirstLogin: decoded.isFirstLogin,
    };

    next();
  } catch (error) {
    next(error);
  }
};
