import { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "./errorHandler";

export const requireRole = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const err = new Error("Not authenticated") as AppError;
      err.statusCode = 401;
      throw err;
    }

    if (!roles.includes(req.user.role)) {
      const err = new Error(`Access denied. Required role: ${roles.join(", ")}`) as AppError;
      err.statusCode = 403;
      throw err;
    }

    next();
  };
};
