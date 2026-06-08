import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const throwUnauthorized = (): never => {
  const err = new Error("Invalid or expired token") as AppError;
  err.statusCode = 401;
  throw err;
};

export const signSuperAdminToken = (superAdminId: string): string => {
  return jwt.sign({ superAdminId }, env.SUPERADMIN_JWT_SECRET, {
    expiresIn: env.SUPERADMIN_JWT_EXPIRY as jwt.SignOptions["expiresIn"],
  });
};

export const verifySuperAdminToken = (token: string): { superAdminId: string } => {
  try {
    const decoded = jwt.verify(token, env.SUPERADMIN_JWT_SECRET) as jwt.JwtPayload & {
      superAdminId: string;
    };
    if (!decoded || typeof decoded !== "object" || !decoded.superAdminId) {
      return throwUnauthorized();
    }
    return { superAdminId: decoded.superAdminId };
  } catch (error) {
    return throwUnauthorized();
  }
};

export const signAccessToken = (payload: {
  userId: string;
  role: string;
  restaurantId: string;
  isFirstLogin: boolean;
}): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY as jwt.SignOptions["expiresIn"],
  });
};

export const signRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (
  token: string
): { userId: string; role: string; restaurantId: string; isFirstLogin: boolean } => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & {
      userId: string;
      role: string;
      restaurantId: string;
      isFirstLogin: boolean;
    };
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.userId ||
      !decoded.role ||
      !decoded.restaurantId ||
      decoded.isFirstLogin === undefined
    ) {
      return throwUnauthorized();
    }
    return {
      userId: decoded.userId,
      role: decoded.role,
      restaurantId: decoded.restaurantId,
      isFirstLogin: decoded.isFirstLogin,
    };
  } catch (error) {
    return throwUnauthorized();
  }
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & {
      userId: string;
    };
    if (!decoded || typeof decoded !== "object" || !decoded.userId) {
      return throwUnauthorized();
    }
    return { userId: decoded.userId };
  } catch (error) {
    return throwUnauthorized();
  }
};
