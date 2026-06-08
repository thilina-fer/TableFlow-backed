import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import SuperAdmin from "../../models/SuperAdmin.model";
import { signSuperAdminToken } from "../../utils/jwt";
import { AppError } from "../../middleware/errorHandler";

export const loginSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      const err = new Error("Invalid credentials") as AppError;
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, superAdmin.passwordHash);
    if (!isMatch) {
      const err = new Error("Invalid credentials") as AppError;
      err.statusCode = 401;
      throw err;
    }

    const token = signSuperAdminToken(superAdmin._id.toString());

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        superAdmin: {
          _id: superAdmin._id.toString(),
          name: superAdmin.name,
          email: superAdmin.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
