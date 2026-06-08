import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  SUPERADMIN_JWT_SECRET: z.string().min(1),
  SUPERADMIN_JWT_EXPIRY: z.string().default("4h"),
  BCRYPT_SALT_ROUNDS: z.string().default("12"),
  SUPERADMIN_EMAIL: z.string().email().default("superadmin@tableflow.com"),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  TAX_RATE: z.string().default("0.1"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;