import { Request, Response, NextFunction } from "express";

export const checkFirstLogin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.isFirstLogin === true) {
    res.status(403).json({
      success: false,
      message: "Password change required. Please change your password before continuing.",
      requiresPasswordChange: true,
    });
    return;
  }

  next();
};
