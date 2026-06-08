import { Request, Response, NextFunction } from "express";
import { verifySuperAdminToken } from "../utils/jwt";

export const superAdminProtect = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifySuperAdminToken(token);

    req.superAdmin = {
      superAdminId: decoded.superAdminId,
    };

    next();
  } catch (error) {
    next(error);
  }
};
