import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["kitchen", "waiter", "cashier"], {
    errorMap: () => ({ message: "Role must be kitchen, waiter, or cashier" }),
  }),
});

export const updateStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters").optional(),
  isActive: z.boolean().optional(),
});
