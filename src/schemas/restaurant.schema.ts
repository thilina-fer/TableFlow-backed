import { z } from "zod";

export const restaurantRegistrationSchema = z.object({
  name: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().min(7).max(15),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(50),
  restaurantType: z.enum(["Fine Dining", "Fast Food", "Café", "Bakery", "Other"]),
  description: z.string().min(10).max(500),
  logoUrl: z.string().url().optional().or(z.literal("")),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
});

export const rejectSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const suspendSchema = z.object({
  reason: z.string().min(5).max(500),
});
