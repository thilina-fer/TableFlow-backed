import { Request, Response, NextFunction } from "express";
import User from "../models/User.model";
import Restaurant from "../models/Restaurant.model";
import { AppError } from "../middleware/errorHandler";
import { comparePassword, hashPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

export const loginStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("Invalid credentials") as AppError;
      err.statusCode = 401;
      throw err;
    }

    // 2. Check if user is active
    if (user.isActive === false) {
      const err = new Error("Your account has been deactivated. Contact your admin.") as AppError;
      err.statusCode = 403;
      throw err;
    }

    // 3. Find associated restaurant
    const restaurant = await Restaurant.findById(user.restaurantId);
    if (!restaurant) {
      const err = new Error("Restaurant not found") as AppError;
      err.statusCode = 403;
      throw err;
    }

    // 4. Check if restaurant is active
    if (restaurant.isActive === false) {
      const err = new Error("Your restaurant account is suspended. Contact TableFlow support.") as AppError;
      err.statusCode = 403;
      throw err;
    }

    // 5. Compare password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error("Invalid credentials") as AppError;
      err.statusCode = 401;
      throw err;
    }

    // 6. Build token payload & sign tokens
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      restaurantId: user.restaurantId.toString(),
      isFirstLogin: user.isFirstLogin,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(user._id.toString());

    // 7. Respond
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId.toString(),
          isFirstLogin: user.isFirstLogin,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      const err = new Error("User not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const err = new Error("Refresh token required") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // 1. Verify Refresh Token
    const decoded = verifyRefreshToken(refreshToken);

    // 2. Find User
    const user = await User.findById(decoded.userId);
    if (!user) {
      const err = new Error("Invalid token") as AppError;
      err.statusCode = 401;
      throw err;
    }

    // 3. Check if User is active
    if (user.isActive === false) {
      const err = new Error("Account deactivated") as AppError;
      err.statusCode = 403;
      throw err;
    }

    // 4. Sign new Access Token
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      restaurantId: user.restaurantId.toString(),
      isFirstLogin: user.isFirstLogin,
    };

    const accessToken = signAccessToken(payload);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    // 1. Compare current password
    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      const err = new Error("Current password is incorrect") as AppError;
      err.statusCode = 400;
      throw err;
    }

    // 2. Update password hash and isFirstLogin flag
    user.passwordHash = await hashPassword(newPassword);
    user.isFirstLogin = false;
    await user.save();

    // 3. Generate new access token
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      restaurantId: user.restaurantId.toString(),
      isFirstLogin: false,
    };
    const accessToken = signAccessToken(payload);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
