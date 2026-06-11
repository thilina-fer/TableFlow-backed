import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

export const createMenuItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  price: z.number().min(0, "Price must be a positive number").max(99999, "Price must be under 99999"),
  categoryId: objectIdSchema,
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  preparationTimeMinutes: z.number().int().min(1, "Prep time must be at least 1 minute").max(300, "Prep time must be under 300 minutes").optional(),
  tags: z.array(z.string()).default([]).optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1, "Variant name is required"),
        price: z.number().positive("Variant price must be positive"),
      })
    )
    .optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const availabilitySchema = z.object({
  isAvailable: z.boolean(),
});
