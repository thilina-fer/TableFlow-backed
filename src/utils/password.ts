import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/env";

export const hashPassword = async (plain: string): Promise<string> => {
  const saltRounds = Number(env.BCRYPT_SALT_ROUNDS) || 12;
  return bcrypt.hash(plain, saltRounds);
};

export const comparePassword = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};

export const generateTempPassword = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 10;
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};
