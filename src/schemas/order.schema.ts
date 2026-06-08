import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const placeOrderSchema = z.object({
  tableId: z.string().regex(objectIdRegex, "Invalid tableId format"),
  restaurantId: z.string().regex(objectIdRegex, "Invalid restaurantId format"),
  items: z
    .array(
      z.object({
        menuItemId: z.string().regex(objectIdRegex, "Invalid menuItemId format"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "Order must contain at least one item"),
  paymentMethod: z.enum(["cash", "card"], {
    message: "Payment method must be cash or card",
  }),
  specialNote: z.string().max(200, "Special note must be under 200 characters").optional(),
});

export const rejectOrderSchema = z.object({
  rejectionReason: z
    .string()
    .min(5, "Rejection reason must be at least 5 characters long")
    .max(200, "Rejection reason must be under 200 characters"),
});
